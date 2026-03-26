import { create } from 'zustand';

export interface UserData {
  uid: string;
  email: string | null;
  role: 'admin' | 'staff' | null;
  name?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unitType: 'kg' | 'ml' | 'qty';
}

interface AppState {
  user: UserData | null;
  products: Product[];
  setUser: (user: UserData | null) => void;
  setProducts: (products: Product[]) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  products: [],
  isLoading: true,
  setUser: (user) => set({ user }),
  setProducts: (products) => set({ products }),
  setLoading: (isLoading) => set({ isLoading }),
}));
