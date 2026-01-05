# StudEx Frontend-Backend Integration Guide

## ✅ COMPLETED TODAY

### 1. Security Fixes
- ✅ Made SECRET_KEY required (no default value)
- ✅ Changed DEBUG default to False
- ✅ Created `.env` and `.env.example` files
- ✅ CORS already properly configured

### 2. Environment Setup
- ✅ Backend `.env` file created with required variables
- ✅ `.env.example` documented for team reference

---

## 🚀 CRITICAL INTEGRATIONS TO IMPLEMENT

### Task 1: Connect Checkout to Orders API (2 hours)

**Current Problem:** Checkout saves orders to localStorage instead of backend

**Backend Endpoint Already Available:**
```
POST /api/orders/orders/
Body: { listing_id: number, amount: number }
Response: { id, reference, listing, amount, status, created_at }
```

**Files to Modify:**

**1. `frontend/src/app/checkout/page.tsx`**

Replace the `createOrder` function (lines 75-125) with:

```typescript
const createOrder = async (paymentRef: string) => {
  try {
    const token = localStorage.getItem('access_token');

    // For each cart item, create an order
    const orderPromises = cart.map(item =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listing_id: item.id,
          amount: item.price * item.quantity,
          payment_reference: paymentRef
        })
      })
    );

    const responses = await Promise.all(orderPromises);
    const orders = await Promise.all(
      responses.map(r => r.json())
    );

    return orders[0].id; // Return first order ID for redirect
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
};
```

Update `handleCardPayment` to use async/await:

```typescript
const handleCardPayment = useCallback(async () => {
  if (!isPaystackReady || !initializePaymentRef.current) {
    alert("Paystack loading...");
    return;
  }

  setIsProcessing(true);

  initializePaymentRef.current({
    onSuccess: async (ref: any) => {
      try {
        // Create order via API
        const orderId = await createOrder(ref.reference);

        // Clear cart
        if (isFoodOrder) clearCart();
        if (isServiceBooking) clearBooking();

        // Redirect to order confirmation
        router.push(`/order-confirmation/${orderId}`);
      } catch (error) {
        alert('Failed to create order. Please contact support.');
        setIsProcessing(false);
      }
    },
    onClose: () => {
      setIsProcessing(false);
    },
  });
}, [/* dependencies */]);
```

---

### Task 2: Fix Category Pages (1.5 hours)

**Current Problem:** Pages like `/food`, `/nails`, etc. use hardcoded data

**Solution:** Create a dynamic category page

**1. Create `frontend/src/app/category/[slug]/page.tsx`**

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'

interface Listing {
  id: number
  title: string
  description: string
  price: number
  image: string
  vendor: string
  is_available: boolean
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/services/listings/?category=${slug}`
        )

        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()
        setListings(data.results || data)
      } catch (err) {
        console.error('Failed to fetch listings:', err)
        setError('Failed to load listings')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
      <h1 className="text-3xl font-black capitalize mb-6">{slug.replace('-', ' ')}</h1>

      {listings.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No listings found in this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <motion.div
              key={listing.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg"
            >
              <h3 className="font-bold text-lg">{listing.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{listing.description}</p>
              <p className="text-purple-600 font-black text-xl mt-3">₦{listing.price.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-2">by {listing.vendor}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**2. Update existing category pages to redirect:**

Replace `/food/page.tsx`, `/nails/page.tsx`, etc. with:

```typescript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FoodPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/category/food')
  }, [router])

  return null
}
```

---

### Task 3: Wire Wallet Pages (1.5 hours)

**Backend Endpoints Available:**
```
GET  /api/wallet/balance/         - Get wallet balance
POST /api/wallet/fund/            - Initiate funding
POST /api/wallet/withdraw/        - Withdraw to bank
GET  /api/wallet/transactions/    - Transaction history
```

**1. Update `frontend/src/app/wallet/page.tsx`**

```typescript
const [balance, setBalance] = useState(0)
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wallet/balance/`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (!res.ok) throw new Error('Failed to fetch balance')

      const data = await res.json()
      setBalance(data.balance || 0)
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error)
    } finally {
      setLoading(false)
    }
  }

  fetchBalance()
}, [])
```

**2. Update `frontend/src/app/wallet/fund/page.tsx`**

Add fund wallet function:

```typescript
const handleFundWallet = async (amount: number) => {
  try {
    const token = localStorage.getItem('access_token')

    // Step 1: Create transaction
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/wallet/fund/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      }
    )

    if (!res.ok) throw new Error('Failed to initiate payment')

    const { reference, authorization_url } = await res.json()

    // Step 2: Redirect to Paystack
    window.location.href = authorization_url

  } catch (error) {
    alert('Failed to fund wallet. Please try again.')
  }
}
```

---

### Task 4: Fix Seller Dashboard (1 hour)

**1. Update `frontend/src/app/seller/page.tsx` or `/seller/dashboard/page.tsx`**

```typescript
const [listings, setListings] = useState([])
const [orders, setOrders] = useState([])

useEffect(() => {
  const fetchSellerData = async () => {
    const token = localStorage.getItem('access_token')

    // Fetch seller's listings
    const listingsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/listings/`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    const listingsData = await listingsRes.json()
    setListings(listingsData.results || listingsData)

    // Fetch seller's orders (pending orders)
    const ordersRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/orders/orders/pending/`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    const ordersData = await ordersRes.json()
    setOrders(ordersData.results || ordersData)
  }

  fetchSellerData()
}, [])
```

---

### Task 5: Wire Chat (1 hour)

**1. Update `frontend/src/components/ChatWindow.tsx`**

```typescript
// Fetch conversations
const fetchConversations = async () => {
  const token = localStorage.getItem('access_token')
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations/`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  return res.json()
}

// Send message
const sendMessage = async (conversationId: number, content: string) => {
  const token = localStorage.getItem('access_token')
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/chat/messages/send/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
        message_type: 'text'
      })
    }
  )
  return res.json()
}
```

---

## 🧪 TESTING CHECKLIST

After implementing each task:

### Checkout Testing:
```bash
# 1. Add items to cart on frontend
# 2. Go to checkout
# 3. Complete payment
# 4. Check backend admin panel
curl http://localhost:8000/api/orders/orders/ -H "Authorization: Bearer YOUR_TOKEN"
# Should see new order
```

### Category Testing:
```bash
# Test category API
curl http://localhost:8000/api/services/listings/?category=food

# Visit frontend
http://localhost:3000/category/food
# Should show real listings
```

### Wallet Testing:
```bash
# Get balance
curl http://localhost:8000/api/wallet/balance/ -H "Authorization: Bearer YOUR_TOKEN"

# Visit wallet page
http://localhost:3000/wallet
# Should show real balance from API
```

---

## 📋 IMPLEMENTATION PRIORITY

1. **CRITICAL (Do First):**
   - ✅ Security fixes (DONE)
   - ⏳ Checkout → Orders API
   - ⏳ Category pages

2. **IMPORTANT (Do Next):**
   - ⏳ Wallet integration
   - ⏳ Seller dashboard

3. **NICE TO HAVE:**
   - Chat integration
   - Admin dispute management

---

## 🚀 HOW TO START TESTING

### Backend:
```bash
cd studex-backend
venv\Scripts\activate  # Windows
python manage.py runserver
```

### Frontend:
```bash
cd studex-frontend
npm run dev
```

### Create Test Data:
```bash
# Create superuser
python manage.py createsuperuser

# Create categories via Django admin
http://localhost:8000/admin/

# Add some listings for testing
```

---

## ⚠️ COMMON ISSUES

**Issue: 401 Unauthorized**
- Check that token is being sent: `Authorization: Bearer ${token}`
- Verify token is stored in localStorage as 'access_token'

**Issue: CORS errors**
- Backend .env has: `CORS_ALLOWED_ORIGINS=http://localhost:3000`
- Frontend API calls use: `http://127.0.0.1:8000` or `http://localhost:8000`

**Issue: Orders not showing**
- Check order was created: Django admin → Orders
- Verify API endpoint returns data: `curl http://localhost:8000/api/orders/orders/`

---

## 📝 NEXT STEPS

After implementing these integrations:

1. Test complete user flow: Browse → Cart → Checkout → Pay → Order
2. Test seller flow: Create listing → Receive order → Mark complete
3. Test admin flow: View analytics → Manage users → Resolve disputes
4. Deploy to staging environment
5. Invite beta testers

---

## 🎯 SUCCESS METRICS

You'll know you're done when:

- ✅ Can create real orders via checkout
- ✅ Orders appear in backend database
- ✅ Category pages show real listings from API
- ✅ Wallet shows real balance
- ✅ Seller dashboard shows real data
- ✅ No 500 errors or console warnings
- ✅ Ready for user testing

**Current Progress: 70% → Target: 95% by end of day**
