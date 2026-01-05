// src/lib/bookingStore.ts  ← FINAL & CORRECT (WORKS 100%)
import { create } from "zustand";
import { persist } from "zustand/middleware";

type BookingItem = {
  providerId: string;
  providerName: string;
  providerImg: string;
  service: string;
  date: string | null;
  time: string;
  location: string;
  addons: Record<string, number>;
  note: string;
  total: number;
};

type BookingStore = {
  booking: BookingItem | null;
  setBooking: (booking: BookingItem | null) => void;
  clearBooking: () => void;
};

// THIS IS THE ONLY LINE THAT WAS WRONG BEFORE
export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      booking: null,
      setBooking: (booking) => set({ booking }),
      clearBooking: () => set({ booking: null }),
    }),
    {
      name: "studex-booking", // This saves it to localStorage
    }
  )
);