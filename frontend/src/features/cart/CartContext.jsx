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

  const syncCartContext = useCallback((cartData, orderData) => {
    const cartItemsCount = cartData?.items ? cartData.items.reduce((total, item) => total + item.units, 0) : 0;
    const orderItemsCount = orderData?.items ? orderData.items.reduce((total, item) => total + item.units, 0) : 0;
    
    setCartCount(cartItemsCount + orderItemsCount);
    setHasUnsentItems(cartItemsCount > 0);
    setHasActiveOrder(orderItemsCount > 0 || (orderData && orderData.id));
    setCartItems([...(cartData?.items || []), ...(orderData?.items || [])]);
  }, []);

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
      syncCartContext(cartRes.data, orderRes.data);
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
    <CartContext.Provider value={{ cartCount, fetchCartCount, hasUnsentItems, hasActiveOrder, cartItems, syncCartContext }}>
      {children}
    </CartContext.Provider>
  );
};
