// src/lib/deals.ts
export interface Deal {
  id: number;
  title: string;
  old: number;
  new: number;
  img: string;
  time: string;
}

export const allDeals: Deal[] = [
  { id: 1, title: "Jollof Rice + Chicken", old: 1800, new: 1200, img: "deal-1.jpg", time: "15 mins" },
  { id: 2, title: "Shawarma Wrap", old: 1500, new: 1000, img: "deal-2.jpg", time: "12 mins" },
  { id: 3, title: "Indomie + Egg", old: 800, new: 500, img: "deal-3.jpg", time: "10 mins" },
  { id: 4, title: "Suya + Bread", old: 2200, new: 1600, img: "deal-4.jpg", time: "18 mins" },
  { id: 5, title: "Burger + Coke", old: 2500, new: 1800, img: "deal-5.jpg", time: "20 mins" },
  { id: 6, title: "Pounded Yam + Egusi", old: 3000, new: 2200, img: "deal-6.jpg", time: "25 mins" },
  { id: 7, title: "Fried Rice + Salad", old: 1900, new: 1300, img: "deal-7.jpg", time: "15 mins" },
];