# payments/models.py
from django.db import models
from django.conf import settings


class SellerBankAccount(models.Model):
    """Stores seller's bank account for Paystack split payments."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bank_account"
    )
    bank_code = models.CharField(max_length=20)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=20)
    account_name = models.CharField(max_length=200)
    # Paystack subaccount code — e.g. ACCT_xxxxxxxxxxxxxxx
    paystack_subaccount_code = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.bank_name} {self.account_number}"


class PaymentTransaction(models.Model):
    """
    Logs every payment for audit and refund tracking.

    Pricing model:
    ──────────────────────────────────────────────────────
    buyer pays   : listing_price + ₦200 service_charge - discount_amount
    vendor gets  : listing_price  ← credited IMMEDIATELY by Paystack at checkout
    platform gets: ₦200 service_charge - discount_amount (min ₦0)

    discount_amount: profile-completion 5% discount, capped at ₦200.
                     Comes from platform fee only — vendor is never affected.

    Paystack split mechanism:
      bearer        = "subaccount"   ← vendor pays Paystack fees from their share
      transaction_charge = listing_price (in kobo) → goes to vendor subaccount
      remainder     = service_charge → stays in StudEx main account
    ──────────────────────────────────────────────────────
    """
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]
    ORDER_TYPE_CHOICES = [
        ("product", "Product"),
        ("service", "Service"),
    ]

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="payments"
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="received_payments"
    )
    reference = models.CharField(max_length=200, unique=True)

    # Paystack's numeric transaction ID — used for refunds
    paystack_transaction_id = models.BigIntegerField(null=True, blank=True)

    # Total amount buyer paid (listing_price + ₦200 - discount)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    # Vendor's full listing price — credited to vendor immediately by Paystack
    seller_amount = models.DecimalField(max_digits=12, decimal_places=2)

    # ₦200 flat service charge
    service_charge = models.DecimalField(max_digits=10, decimal_places=2, default=200)

    # 5% profile-completion discount, capped at ₦200, sourced from platform fee only
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Net platform revenue = service_charge - discount_amount
    platform_amount = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES, default="product")

    buyer_email = models.EmailField()
    buyer_name = models.CharField(max_length=200, blank=True)
    order_id = models.IntegerField(null=True, blank=True)

    paystack_response = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.reference} - ₦{self.amount} ({self.status})"