import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import client from '../../api/client';
import { AuthContext } from '../auth/AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cartCount, setCartCount] = useState(0);
  const [hasUnsentItems, setHasUnsentItems] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const fetchCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const [cartRes, orderRes] = await Promise.all([
        client.get('/orders/cart').catch(() => ({ data: { items: [] } })),
        client.get('/orders/active').catch(() => ({ data: { items: [] } }))
      ]);
      const cartItemsCount = cartRes.data?.items ? cartRes.data.items.reduce((total, item) => total + item.units, 0) : 0;
      const orderItemsCount = orderRes.data?.items ? orderRes.data.items.reduce((total, item) => total + item.units, 0) : 0;
      
      setCartCount(cartItemsCount + orderItemsCount);
      setHasUnsentItems(cartItemsCount > 0);
      setHasActiveOrder(orderItemsCount > 0 || (orderRes.data && orderRes.data.id));
      setCartItems([...(cartRes.data?.items || []), ...(orderRes.data?.items || [])]);
    } catch (err) {
      console.error("Failed to fetch cart count", err);
    }
  }, [user]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCartCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchCartCount]);

  return (
    <CartContext.Provider value={{ cartCount, fetchCartCount, hasUnsentItems, hasActiveOrder, cartItems }}>
      {children}
    </CartContext.Provider>
  );
};
