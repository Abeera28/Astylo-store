"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
  maxStock: number;
};

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  total: number;
  addItem: (item: CartItem) => boolean;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "astylo-cart";

function otherSizesQty(items: CartItem[], productId: string, size: string) {
  return items
    .filter((i) => i.productId === productId && i.size !== size)
    .reduce((sum, i) => sum + i.quantity, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // ignore broken saved data
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items, ready]);

  function addItem(item: CartItem): boolean {
    const others = otherSizesQty(items, item.productId, item.size);
    const existing = items.find(
      (i) => i.productId === item.productId && i.size === item.size
    );
    const current = existing?.quantity ?? 0;
    const allowed = Math.max(0, item.maxStock - others - current);
    const add = Math.min(item.quantity, allowed);

    if (add <= 0) return false;

    if (existing) {
      setItems(
        items.map((i) =>
          i === existing
            ? { ...i, quantity: i.quantity + add, maxStock: item.maxStock, price: item.price }
            : i
        )
      );
    } else {
      setItems([...items, { ...item, quantity: add }]);
    }
    return true;
  }

  function setQuantity(productId: string, size: string, quantity: number) {
    setItems((prev) => {
      const target = prev.find(
        (i) => i.productId === productId && i.size === size
      );
      if (!target) return prev;

      const others = otherSizesQty(prev, productId, size);
      const q = Math.min(quantity, target.maxStock - others);

      if (q <= 0) return prev.filter((i) => i !== target);
      return prev.map((i) => (i === target ? { ...i, quantity: q } : i));
    });
  }

  function removeItem(productId: string, size: string) {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.size === size))
    );
  }

  function clear() {
    setItems([]);
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, ready, count, total, addItem, setQuantity, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}