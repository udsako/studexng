import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: number;
  title: string;
  price: number;
  img: string;
}

interface WishlistStore {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number) => void;
  isInWishlist: (id: number) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlist: [],

      addToWishlist: (item) =>
        set((state) => {
          // ✅ Only add if it's not already in the wishlist
          if (state.wishlist.some((w) => w.id === item.id)) return state;
          return { wishlist: [...state.wishlist, item] };
        }),

      removeFromWishlist: (id) =>
        set((state) => ({
          wishlist: state.wishlist.filter((w) => w.id !== id),
        })),

      isInWishlist: (id) => get().wishlist.some((w) => w.id === id),
    }),
    {
      name: 'studex-wishlist',
    }
  )
);
