// src/lib/cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItem = {
  id: number;
  title: string;
  price: number;
  img: string;
  quantity: number;
};

type CartStore = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
};


/* =========================
   🔥 AUTO IMAGE FIXER
   ========================= */
const fixImagePath = (img: string) => {
  if (!img) return "/images/placeholder.jpg";

  // already valid (http or https)
  if (img.startsWith("http")) return img;

  // already has leading slash
  if (img.startsWith("/")) return img;

  // auto-fix broken paths like "deal-food-1.jpg"
  return `/images/${img}`;
};


export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],

      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((i) => i.id === item.id);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { cart: [...state.cart, { ...item, quantity: 1 }] };
        }),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "studex-cart",
    }
  )
);

// 🔥 Backward compatibility export
export const useCartStore = useCart;
