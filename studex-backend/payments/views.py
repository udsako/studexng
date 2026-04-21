# payments/views.py
import hashlib
import hmac
import requests
import logging
import json
from decimal import Decimal
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from orders.models import Order
from .models import SellerBankAccount, PaymentTransaction

logger = logging.getLogger(__name__)

PSK_SECRET  = (getattr(settings, "PAYSTACK_SECRET_KEY", "") or "").strip()
PSK_BASE    = "https://api.paystack.co"
PSK_HEADERS = {
    "Authorization": f"Bearer {PSK_SECRET}",
    "Content-Type":  "application/json",
}

# ─────────────────────────────────────────────────────────────
# PRICING CONSTANTS
#
# buyer pays  : listing_price + SERVICE_FEE - discount
# vendor gets : listing_price  → via Paystack subaccount split
# platform    : SERVICE_FEE - discount
#
# Paystack split config per transaction:
#   subaccount          = vendor's ACCT_xxx code
#   transaction_charge  = listing_price_in_kobo   (goes to vendor)
#   bearer              = "subaccount"             (vendor absorbs Paystack fees)
#
# Loyalty reward of ₦200 after 10 orders comes from the SERVICE_FEE.
# 5% profile-completion discount also comes from the SERVICE_FEE.
# Vendor is NEVER affected by either of those.
# ─────────────────────────────────────────────────────────────
SERVICE_FEE = Decimal("200")


def _to_kobo(naira: Decimal) -> int:
    """Convert Naira (Decimal) → kobo (int) for Paystack."""
    return int(naira * 100)


def _split_amounts(amount_paid: Decimal, listing_price: Decimal):
    """
    Returns (vendor_amount, platform_amount).
    amount_paid = listing_price + SERVICE_FEE - discount
    vendor_amount is always listing_price (the full price set by the vendor).
    platform_amount = amount_paid - vendor_amount  (= SERVICE_FEE - discount, min 0)
    """
    platform_amount = amount_paid - listing_price
    if platform_amount < Decimal("0"):
        platform_amount = Decimal("0")
    return listing_price, platform_amount


def _normalize_order_type(raw_type: str) -> str:
    t = (raw_type or "service").lower()
    if "booking" in t or "service" in t:
        return "service"
    if "food" in t or "product" in t:
        return t
    return "service"


# ─────────────────────────────────────────
# GET BANKS
# ─────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def get_banks(request):
    try:
        res = requests.get(
            f"{PSK_BASE}/bank?country=nigeria&use_cursor=false&perPage=100",
            headers=PSK_HEADERS,
            timeout=10,
        )
        if res.status_code == 200:
            return Response(res.json(), status=200)
        return Response({"data": []}, status=200)
    except Exception as e:
        logger.error(f"get_banks error: {e}")
        return Response({"data": []}, status=200)


# ─────────────────────────────────────────
# VERIFY BANK ACCOUNT
# ─────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_bank_account(request):
    account_number = str(request.data.get("account_number", "")).strip()
    bank_code      = str(request.data.get("bank_code", "")).strip()

    if not account_number or not bank_code:
        return Response({"error": "account_number and bank_code are required."}, status=400)

    try:
        res = requests.get(
            f"{PSK_BASE}/bank/resolve",
            headers=PSK_HEADERS,
            params={"account_number": account_number, "bank_code": bank_code},
            timeout=15,
        )
        data = res.json()
        if res.status_code == 200 and data.get("status"):
            return Response({"account_name": data["data"]["account_name"]})
        return Response(
            {"error": data.get("message", "Could not verify account.")},
            status=400,
        )
    except Exception:
        return Response(
            {"error": "Verification unavailable. Enter account name manually."},
            status=400,
        )


# ─────────────────────────────────────────
# SELLER BANK ACCOUNT
# ─────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def seller_bank_account(request):
    if request.method == "GET":
        try:
            acct = SellerBankAccount.objects.get(user=request.user)
            return Response({
                "bank_code":               acct.bank_code,
                "bank_name":               acct.bank_name,
                "account_number":          acct.account_number,
                "account_name":            acct.account_name,
                "paystack_subaccount_code": acct.paystack_subaccount_code,
                "subaccount_ready":        bool(acct.paystack_subaccount_code),
            })
        except SellerBankAccount.DoesNotExist:
            return Response({"subaccount_ready": False}, status=200)

    # POST — save / update bank details
    bank_code      = str(request.data.get("bank_code", "")).strip()
    account_number = str(request.data.get("account_number", "")).strip()
    account_name   = str(request.data.get("account_name", "")).strip()
    bank_name      = str(request.data.get("bank_name", "")).strip() or _get_bank_name(bank_code)

    if len(account_number) != 10:
        return Response({"error": "Account number must be exactly 10 digits."}, status=400)
    if not all([bank_code, account_number, account_name]):
        return Response({"error": "bank_code, account_number, and account_name are required."}, status=400)

    subaccount_code, error_detail = _create_or_update_paystack_subaccount(
        user=request.user,
        bank_code=bank_code,
        account_number=account_number,
        account_name=account_name,
    )

    if not subaccount_code:
        # Save bank details even if subaccount creation failed
        SellerBankAccount.objects.update_or_create(
            user=request.user,
            defaults={
                "bank_code":               bank_code,
                "bank_name":               bank_name,
                "account_number":          account_number,
                "account_name":            account_name,
                "paystack_subaccount_code": "",
            },
        )
        return Response({
            "error": f"Bank details saved but Paystack subaccount setup failed: {error_detail}",
            "subaccount_ready": False,
        }, status=400)

    SellerBankAccount.objects.update_or_create(
        user=request.user,
        defaults={
            "bank_code":               bank_code,
            "bank_name":               bank_name,
            "account_number":          account_number,
            "account_name":            account_name,
            "paystack_subaccount_code": subaccount_code,
        },
    )
    logger.info(f"Paystack subaccount saved for {request.user.username}: {subaccount_code}")
    return Response({
        "message":                 "Bank account saved and payout subaccount created successfully.",
        "account_name":            account_name,
        "bank_name":               bank_name,
        "paystack_subaccount_code": subaccount_code,
        "subaccount_ready":        True,
    }, status=201)


# ─────────────────────────────────────────
# VERIFY PAYMENT  (called by frontend after Paystack popup closes)
# ─────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    reference    = request.data.get("reference", "").strip()
    order_type   = request.data.get("order_type", "service")
    listing_id   = request.data.get("listing_id")
    items        = request.data.get("items", [])
    use_credits  = request.data.get("use_credits", False)

    if not reference:
        return Response({"error": "Payment reference is required."}, status=400)

    # Idempotency — already processed?
    existing = PaymentTransaction.objects.filter(reference=reference, status="success").first()
    if existing and existing.order_id:
        return Response({"order_id": existing.order_id, "message": "Already processed."})

    # Verify with Paystack
    try:
        verify_res = requests.get(
            f"{PSK_BASE}/transaction/verify/{reference}",
            headers=PSK_HEADERS,
            timeout=15,
        )
    except Exception as e:
        logger.error(f"Paystack verify request failed: {e}")
        return Response({"error": "Payment verification failed. Contact support."}, status=400)

    if verify_res.status_code != 200:
        return Response({"error": "Payment verification failed."}, status=400)

    verify_data = verify_res.json()
    if not verify_data.get("status") or verify_data["data"].get("status") != "success":
        return Response({"error": "Payment was not completed successfully."}, status=400)

    psk_data = verify_data["data"]
    actual_listing_id = listing_id or (items[0]["listing_id"] if items else None)

    order_id, error = _create_order_from_paystack_data(
        psk_data=psk_data,
        buyer=request.user,
        listing_id=actual_listing_id,
        order_type=_normalize_order_type(order_type),
        use_credits=use_credits,
    )

    if error:
        return Response(
            {"error": f"Payment received but order failed: {error}", "reference": reference},
            status=500,
        )

    return Response({"order_id": order_id, "message": "Payment verified. Order created."})


# ─────────────────────────────────────────
# CHECK PAYMENT STATUS  (polled by frontend)
# ─────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_payment_status(request):
    tx_ref = request.query_params.get("tx_ref", "").strip()
    if not tx_ref:
        return Response({"status": "not_found"}, status=400)

    txn = PaymentTransaction.objects.filter(reference=tx_ref, status="success").first()
    if txn and txn.order_id:
        return Response({"status": "paid", "order_id": txn.order_id})
    return Response({"status": "pending"})


# ─────────────────────────────────────────
# SELLER TRANSACTIONS
# ─────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def seller_transactions(request):
    txns = PaymentTransaction.objects.filter(
        seller=request.user, status="success"
    ).order_by("-created_at")[:50]

    return Response([{
        "id":              t.id,
        "reference":       t.reference,
        "amount":          float(t.amount),
        "seller_amount":   float(t.seller_amount),
        "platform_amount": float(t.platform_amount),
        "order_type":      t.order_type,
        "buyer_name":      t.buyer_name,
        "buyer_email":     t.buyer_email,
        "order_id":        t.order_id,
        "created_at":      t.created_at.isoformat(),
    } for t in txns])


# ─────────────────────────────────────────
# SELLER EARNINGS
# ─────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def seller_earnings(request):
    from django.db.models import Sum
    total_orders = Order.objects.filter(listing__vendor=request.user).count()
    txns         = PaymentTransaction.objects.filter(seller=request.user, status="success")
    total_earned = txns.aggregate(Sum("seller_amount"))["seller_amount__sum"] or 0
    return Response({
        "total_earned": float(total_earned),
        "total_orders": total_orders,
        "service_fee":  float(SERVICE_FEE),
    })


# ─────────────────────────────────────────
# PRICE PREVIEW
# ─────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def preview_price(request):
    amount_raw = request.data.get("amount")
    if not amount_raw:
        return Response({"error": "amount is required."}, status=400)

    original       = Decimal(str(amount_raw))
    discount_amount = Decimal("0")
    has_discount   = False

    try:
        profile = request.user.profile
        if profile.profile_bonus_eligible and not profile.profile_bonus_used:
            has_discount    = True
            discount_amount = (original * Decimal("0.05")).quantize(Decimal("0.01"))
            # Discount is capped at SERVICE_FEE so vendor is never affected
            discount_amount = min(discount_amount, SERVICE_FEE)
    except Exception:
        pass

    final_amount   = original - discount_amount
    checkout_total = final_amount + SERVICE_FEE

    return Response({
        "original_amount":  str(original),
        "discount_eligible": has_discount,
        "discount_percent": 5 if has_discount else 0,
        "discount_amount":  str(discount_amount),
        "final_amount":     str(final_amount),
        "service_fee":      str(SERVICE_FEE),
        "checkout_total":   str(checkout_total),
        "discount_message": (
            f"🎉 5% discount applied — you save ₦{discount_amount:,.2f}!"
            if has_discount else None
        ),
    })


# ─────────────────────────────────────────
# REFUND
# ─────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def refund_payment(request):
    reference = request.data.get("reference", "").strip()
    reason    = request.data.get("reason", "Customer requested refund")

    if not reference:
        return Response({"error": "reference is required."}, status=400)

    try:
        txn = PaymentTransaction.objects.get(reference=reference)
    except PaymentTransaction.DoesNotExist:
        return Response({"error": "Transaction not found."}, status=404)

    if txn.buyer != request.user and not request.user.is_staff:
        return Response({"error": "Not authorized."}, status=403)
    if txn.status == "refunded":
        return Response({"error": "Already refunded."}, status=400)

    # Paystack refund uses the transaction ID
    refund_id = txn.paystack_transaction_id or reference
    try:
        refund_res = requests.post(
            f"{PSK_BASE}/refund",
            headers=PSK_HEADERS,
            json={
                "transaction": str(refund_id),
                "amount":      _to_kobo(txn.amount),  # Paystack refund amount is in kobo
                "merchant_note": reason,
            },
            timeout=15,
        )
        data = refund_res.json()
        if refund_res.status_code in [200, 201] and data.get("status"):
            txn.status = "refunded"
            txn.save()
            return Response({
                "message": "Refund initiated. Returns within 3-5 business days.",
                "amount":  float(txn.amount),
            })
        return Response(
            {"error": data.get("message", "Refund failed.")},
            status=400,
        )
    except Exception:
        return Response({"error": "Refund request failed. Contact support."}, status=400)


# ─────────────────────────────────────────
# PAYSTACK WEBHOOK
# Register URL in Paystack Dashboard → Settings → API Keys & Webhooks
# Full URL: https://studex-backend-v2.onrender.com/api/payments/webhook/
# ─────────────────────────────────────────

@csrf_exempt
def paystack_webhook(request):
    if request.method != "POST":
        return HttpResponse(status=405)

    # Validate Paystack signature
    paystack_signature = request.headers.get("X-Paystack-Signature", "")
    expected_signature = hmac.new(
        PSK_SECRET.encode("utf-8"),
        request.body,
        hashlib.sha512,
    ).hexdigest()

    if not hmac.compare_digest(paystack_signature, expected_signature):
        logger.warning("Paystack webhook: invalid signature")
        return HttpResponse(status=401)

    try:
        payload = json.loads(request.body)
    except Exception:
        return HttpResponse(status=400)

    event = payload.get("event")
    data  = payload.get("data", {})
    logger.info(f"Paystack webhook: {event}")

    if event == "charge.success":
        reference = data.get("reference", "")

        # Idempotency
        if PaymentTransaction.objects.filter(reference=reference, status="success").exists():
            existing = PaymentTransaction.objects.get(reference=reference, status="success")
            if existing.order_id:
                return HttpResponse(status=200)

        customer_email = data.get("customer", {}).get("email", "")
        meta           = data.get("metadata", {}) or {}
        listing_id     = meta.get("listing_id")
        raw_type       = meta.get("type", "service")
        order_type     = _normalize_order_type(raw_type)

        try:
            from django.contrib.auth import get_user_model
            User  = get_user_model()
            buyer = User.objects.filter(email=customer_email).first()
        except Exception:
            buyer = None

        if buyer and listing_id:
            order_id, error = _create_order_from_paystack_data(
                psk_data=data,
                buyer=buyer,
                listing_id=listing_id,
                order_type=order_type,
            )
            if error:
                logger.error(f"Webhook order creation failed for {reference}: {error}")
            else:
                logger.info(f"Webhook created order {order_id} for {reference}")
        else:
            # Log the payment even if we can't create an order yet
            amount_naira  = Decimal(str(data.get("amount", 0))) / 100  # Paystack sends kobo
            listing_price = _get_listing_price(listing_id)
            vendor_amount = listing_price if listing_price else (amount_naira - SERVICE_FEE)
            platform_amount = amount_naira - vendor_amount
            seller = _get_seller_from_listing(listing_id)

            PaymentTransaction.objects.get_or_create(
                reference=reference,
                defaults={
                    "buyer":                   buyer,
                    "seller":                  seller,
                    "amount":                  amount_naira,
                    "seller_amount":           vendor_amount,
                    "platform_amount":         platform_amount,
                    "status":                  "success",
                    "order_type":              order_type,
                    "buyer_email":             customer_email,
                    "paystack_response":       data,
                },
            )

    return HttpResponse(status=200)


# ─────────────────────────────────────────
# INTERNAL: create order from Paystack data
# ─────────────────────────────────────────

def _create_order_from_paystack_data(psk_data, buyer, listing_id, order_type, use_credits=False):
    from services.models import Listing

    # Paystack amounts are in KOBO — convert to Naira
    amount_kobo  = int(psk_data.get("amount", 0))
    amount_naira = Decimal(amount_kobo) / 100
    reference    = psk_data.get("reference", "")
    psk_txn_id   = psk_data.get("id")
    buyer_email  = psk_data.get("customer", {}).get("email", buyer.email if buyer else "")

    # Determine vendor amount = listing price, platform amount = remainder
    listing_price = _get_listing_price(listing_id)
    if listing_price:
        vendor_amount, platform_amount = _split_amounts(amount_naira, listing_price)
    else:
        # Fallback: assume SERVICE_FEE is the platform portion
        vendor_amount   = max(amount_naira - SERVICE_FEE, Decimal("0"))
        platform_amount = amount_naira - vendor_amount

    seller = _get_seller_from_listing(listing_id)

    txn, created = PaymentTransaction.objects.get_or_create(
        reference=reference,
        defaults={
            "buyer":                buyer,
            "seller":               seller,
            "paystack_transaction_id": psk_txn_id,
            "amount":               amount_naira,
            "seller_amount":        vendor_amount,
            "platform_amount":      platform_amount,
            "status":               "success",
            "order_type":           order_type,
            "buyer_email":          buyer_email,
            "buyer_name":           buyer.get_full_name() or buyer.username if buyer else "",
            "paystack_response":    psk_data,
        },
    )

    if not created and txn.order_id:
        return txn.order_id, None

    order_id = None

    try:
        if listing_id:
            listing = Listing.objects.get(id=listing_id)
            order = Order.objects.create(
                buyer=buyer,
                listing=listing,
                amount=amount_naira,
                reference=reference,
                status="paid",   # No escrow — vendor credited immediately by Paystack
            )
            order_id = order.id

            # Mark confirmed booking as paid
            try:
                from orders.models import Booking
                Booking.objects.filter(
                    buyer=buyer, listing=listing, status="confirmed"
                ).update(status="paid")
            except Exception as e:
                logger.warning(f"Booking status update failed: {e}")

            # Reduce stock if applicable
            try:
                listing.reduce_stock(1)
            except Exception as e:
                logger.warning(f"reduce_stock failed: {e}")

            # Notify vendor
            try:
                from accounts.utils import send_notification
                send_notification(
                    recipient=listing.vendor,
                    notification_type="new_order",
                    title=f"💰 Payment Received — {listing.title}",
                    message=(
                        f"{buyer.username} just paid ₦{amount_naira:,.0f} for "
                        f'"{listing.title}". Your full ₦{vendor_amount:,.0f} has been '
                        f"credited to your bank account by Paystack."
                    ),
                    action_url="/vendor/dashboard",
                )
            except Exception as ne:
                logger.warning(f"Vendor notification failed: {ne}")

    except Exception as e:
        logger.error(f"Order creation failed: {e}", exc_info=True)
        return None, str(e)

    txn.order_id = order_id
    txn.status   = "success"
    txn.save()

    # Deduct loyalty credits if used
    if use_credits and buyer:
        try:
            from loyalty.models import LoyaltyAccount, LoyaltyTransaction
            loyalty_account = LoyaltyAccount.objects.filter(user=buyer).first()
            if loyalty_account and loyalty_account.credit_balance > 0:
                credits_used = min(loyalty_account.credit_balance, amount_naira)
                loyalty_account.credit_balance -= credits_used
                loyalty_account.save()
                LoyaltyTransaction.objects.create(
                    account=loyalty_account,
                    transaction_type="redeemed",
                    amount=credits_used,
                    description=f"Credits used on order #{order_id}",
                )
        except Exception as e:
            logger.warning(f"Loyalty deduction failed: {e}")

    return order_id, None


# ─────────────────────────────────────────
# INTERNAL: Paystack subaccount create / update
# ─────────────────────────────────────────

def _create_or_update_paystack_subaccount(user, bank_code, account_number, account_name):
    """
    Creates or updates a Paystack subaccount for the vendor.

    Paystack split config:
      percentage_charge = 0          ← vendor gets 100% of listing price
      settlement_bank   = bank_code
      account_number    = account_number

    The actual split (vendor gets listing_price, platform gets ₦200) is specified
    PER TRANSACTION when initialising the charge — not on the subaccount itself.

    Returns (subaccount_code, error_message).
    """
    if not PSK_SECRET:
        msg = "PAYSTACK_SECRET_KEY is not configured."
        logger.error(msg)
        return None, msg

    try:
        existing = SellerBankAccount.objects.filter(user=user).first()
        payload  = {
            "business_name":     getattr(user, "business_name", None) or user.username,
            "settlement_bank":   str(bank_code),
            "account_number":    str(account_number),
            "percentage_charge": 0,   # StudEx takes ₦200 flat per-transaction, not a %
            "description":       f"StudEx vendor: {user.username}",
            "primary_contact_email": user.email or f"{user.username}@studex.ng",
        }

        if existing and existing.paystack_subaccount_code:
            # Update existing subaccount
            code = existing.paystack_subaccount_code
            res  = requests.put(
                f"{PSK_BASE}/subaccount/{code}",
                headers=PSK_HEADERS,
                json=payload,
                timeout=15,
            )
            action = "update"
        else:
            # Create new subaccount
            res    = requests.post(
                f"{PSK_BASE}/subaccount",
                headers=PSK_HEADERS,
                json=payload,
                timeout=15,
            )
            action = "create"

        logger.info(f"Paystack subaccount {action} → {res.status_code}: {res.text[:300]}")

        data = res.json()
        if res.status_code in [200, 201] and data.get("status"):
            code = data["data"].get("subaccount_code", "")
            if code:
                logger.info(f"Subaccount {action}d: {code} for {user.username}")
                return code, None
            else:
                msg = f"Paystack returned success but no subaccount_code: {data}"
                logger.error(msg)
                return None, msg
        else:
            msg = f"Paystack {action} failed ({res.status_code}): {data.get('message', res.text[:200])}"
            logger.error(msg)
            return None, msg

    except requests.exceptions.Timeout:
        return None, "Paystack API timed out."
    except Exception as e:
        logger.error(f"Subaccount exception: {e}", exc_info=True)
        return None, str(e)


# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def _get_seller_from_listing(listing_id):
    if not listing_id:
        return None
    try:
        from services.models import Listing
        return Listing.objects.get(id=listing_id).vendor
    except Exception:
        return None


def _get_listing_price(listing_id) -> Decimal | None:
    if not listing_id:
        return None
    try:
        from services.models import Listing
        return Decimal(str(Listing.objects.get(id=listing_id).price))
    except Exception:
        return None


def _get_bank_name(bank_code: str) -> str:
    BANKS = {
        "044": "Access Bank",         "050": "Ecobank Nigeria",
        "070": "Fidelity Bank",       "011": "First Bank of Nigeria",
        "214": "FCMB",                "058": "Guaranty Trust Bank",
        "030": "Heritage Bank",       "082": "Keystone Bank",
        "526": "OPay",                "999991": "PalmPay",
        "076": "Polaris Bank",        "101": "Providus Bank",
        "221": "Stanbic IBTC",        "232": "Sterling Bank",
        "032": "Union Bank",          "033": "UBA",
        "215": "Unity Bank",          "035": "Wema Bank",
        "057": "Zenith Bank",         "090405": "Moniepoint MFB",
        "999992": "Kuda Bank",
    }
    return BANKS.get(str(bank_code), "Unknown Bank")