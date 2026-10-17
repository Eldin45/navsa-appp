// lib/hooks/use-cart.ts
"use client";

import * as React from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string; // The parent product ID
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  size?: string; // New: Optional size property
  color?: string; // New: Optional color property
}

interface CartContextType {
  addItem: (
    data: {
      id: string;
      name: string;
      image: string;
      category: string;
      price: number;
      selectedVariant?: { size: string; price: number };
      selectedColor?: string;
    },
    quantity?: number,
  ) => void;
  clearCart: () => void;
  getItemQuantity: (id: string, variantSize?: string) => number;
  itemCount: number;
  items: CartItem[];
  removeItem: (id: string, variantSize?: string, variantColor?: string) => void;
  subtotal: number;
  updateQuantity: (
    id: string,
    quantity: number,
    variantSize?: string,
    variantColor?: string,
  ) => void;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: React.PropsWithChildren) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);

  const safeLocalStorage = {
    getItem: (key: string): null | string => {
      try {
        if (typeof window !== "undefined") {
          return localStorage.getItem(key);
        }
        return null;
      } catch (error) {
        console.error("LocalStorage get error:", error);
        return null;
      }
    },
    removeItem: (key: string): void => {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error("LocalStorage remove error:", error);
      }
    },
    setItem: (key: string, value: string): boolean => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(key, value);
          return true;
        }
        return false;
      } catch (error) {
        console.error("LocalStorage set error:", error);
        return false;
      }
    },
  };

  React.useEffect(() => {
    const loadCart = () => {
      try {
        const rawData = safeLocalStorage.getItem("cart");
        if (!rawData) {
          setIsInitialized(true);
          return;
        }

        const parsedData = JSON.parse(rawData);
        if (Array.isArray(parsedData)) {
          const validItems = parsedData.filter(
            (item: any) =>
              item?.id &&
              typeof item.name === "string" &&
              typeof item.price === "number" &&
              typeof item.quantity === "number",
          ) as CartItem[];
          setItems(validItems);
        }
      } catch (error) {
        console.error("Failed to load cart:", error);
        safeLocalStorage.removeItem("cart");
      } finally {
        setIsInitialized(true);
      }
    };
    loadCart();
  }, []);

  React.useEffect(() => {
    if (!isInitialized) return;

    try {
      const serialized = JSON.stringify(items);
      if (!safeLocalStorage.setItem("cart", serialized)) {
        toast.error("Failed to save cart items");
      }
    } catch (error) {
      console.error("Failed to save cart:", error);
      toast.error("Could not save cart items");
    }
  }, [items, isInitialized]);

  const addItem = React.useCallback(
    (
      data: {
        id: string;
        name: string;
        image: string;
        category: string;
        price: number;
        selectedVariant?: { size: string; price: number };
        selectedColor?: string;
      },
      quantity = 1,
    ) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) =>
            i.id === data.id &&
            i.size === data.selectedVariant?.size &&
            i.color === data.selectedColor,
        );

        const itemPrice = data.selectedVariant?.price || data.price;

        const itemToAdd: CartItem = {
          id: data.id,
          name: data.name,
          price: Number(itemPrice),
          image: data.image,
          quantity: quantity,
          category: data.category,
          size: data.selectedVariant?.size,
          color: data.selectedColor,
        };

        if (existing) {
          toast.info("Item quantity updated!");
          return prev.map((i) =>
            i.id === existing.id &&
            i.size === existing.size &&
            i.color === existing.color
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          );
        }
        toast.success("Item added to cart!");
        return [...prev, itemToAdd];
      });
    },
    [],
  );

  const removeItem = React.useCallback(
    (id: string, variantSize?: string, variantColor?: string) => {
      setItems((prev) =>
        prev.filter(
          (i) =>
            !(
              i.id === id &&
              i.size === variantSize &&
              i.color === variantColor
            ),
        ),
      );
      toast.info("Item removed from cart.");
    },
    [],
  );

  const updateQuantity = React.useCallback(
    (
      id: string,
      quantity: number,
      variantSize?: string,
      variantColor?: string,
    ) => {
      setItems((prev) =>
        prev
          .map((i) => {
            if (
              i.id === id &&
              i.size === variantSize &&
              i.color === variantColor
            ) {
              return { ...i, quantity: quantity };
            }
            return i;
          })
          .filter((i) => i.quantity > 0),
      );
    },
    [],
  );

  const clearCart = React.useCallback(() => {
    setItems([]);
    safeLocalStorage.removeItem("cart");
  }, []);

  const getItemQuantity = React.useCallback(
    (id: string, variantSize?: string) => {
      const item = items.find((i) => i.id === id && i.size === variantSize);
      return item ? item.quantity : 0;
    },
    [items],
  );

  const itemCount = React.useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = React.useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const value = React.useMemo(
    () => ({
      addItem,
      clearCart,
      getItemQuantity,
      itemCount,
      items,
      removeItem,
      subtotal,
      updateQuantity,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemQuantity,
      itemCount,
      subtotal,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
