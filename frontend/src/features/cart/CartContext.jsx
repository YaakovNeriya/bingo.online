import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../../api/client';
import { AuthContext } from '../auth/AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const res = await client.get('/orders/cart');
      const count = res.data.items ? res.data.items.reduce((total, item) => total + item.units, 0) : 0;
      setCartCount(count);
    } catch (err) {
      console.error("Failed to fetch cart count", err);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [user]);

  return (
    <CartContext.Provider value={{ cartCount, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};
