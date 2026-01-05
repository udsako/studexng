# StudEx Testing Guide

## Start the Servers

### Terminal 1 - Backend
```bash
cd studex-backend
venv\Scripts\activate           # Windows CMD
python manage.py runserver
```

### Terminal 2 - Frontend
```bash
cd studex-frontend
npm run dev
```

## Testing Checklist

### 1. Backend Admin (http://127.0.0.1:8000/admin/)
- Login with superuser
- Create 2-3 Categories (Food, Nails, Laundry)
- Create 5-10 Listings with images
- Verify they appear in admin

### 2. Category Pages (http://localhost:3000/category/food)
- Shows real listings from database
- Search works
- Add to cart works
- No mock data

### 3. Checkout Flow
1. Add items to cart
2. Go to checkout
3. Complete payment
4. Check Django admin - order should appear

### 4. Wallet (http://localhost:3000/wallet/fund)
- Shows real balance
- Can fund wallet
- Paystack integration works

### 5. Seller Dashboard (http://localhost:3000/seller)
- Shows real orders
- Shows real statistics
- User must be verified vendor

### 6. Chat
- Can send messages
- Messages save to backend
- Conversation created

## Common Errors & Solutions

### Django not found
```bash
cd studex-backend
source venv/Scripts/activate
pip install -r requirements.txt
```

### CORS Error
Check backend .env:
```
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 401 Unauthorized
- Check localStorage has access_token
- Login again if expired

### Paystack Not Loading
Add real test key to frontend .env.local:
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_real_key
```

Get keys from: https://dashboard.paystack.com/

## Environment Files

### Backend .env (Already Created)
```
SECRET_KEY=...
DEBUG=True
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

### Frontend .env.local (Already Created)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

## Success Criteria

Everything works when:
- Can see real listings on category pages
- Orders created in database after checkout
- Wallet shows real balance
- Seller dashboard shows real stats
- Chat sends messages to backend
- No console errors
