import { useState, useCallback, useEffect } from 'react';
import client from '../../../api/client';

export const useCartState = () => {
  const [cart, setCart] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [error, setError] = useState(null);
  const [minCutLength, setMinCutLength] = useState(1.0);
  const [selectedItems, setSelectedItems] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editLength, setEditLength] = useState(0);
  const [editUnits, setEditUnits] = useState(0);

  const toggleItemSelection = (id) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchMinCutLength = useCallback(async () => {
    try {
      const res = await client.get('/products/public/settings');
      if (res.data && res.data['minimum_order_length']) {
        setMinCutLength(parseFloat(res.data['minimum_order_length']) || 1.0);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const res = await client.get('/orders/cart');
      const cartData = res.data;
      
      let activeOrderData = null;
      try {
        const activeRes = await client.get('/orders/active');
        activeOrderData = activeRes.data;
      } catch (activeErr) {
        if (activeErr.response && activeErr.response.status === 404) {
          activeOrderData = null;
        } else {
          console.error('Failed to load active order:', activeErr);
          activeOrderData = null;
        }
      }
      
      setCart(cartData);
      setActiveOrder(activeOrderData);
      
      setSelectedItems(prev => {
        const merged = {};
        cartData.items.forEach(item => {
          const defaultVal = true; // Always check new items by default
          merged[`cart_${item.id}`] = prev.hasOwnProperty(`cart_${item.id}`) ? prev[`cart_${item.id}`] : defaultVal;
        });
        
        if (activeOrderData) {
          activeOrderData.items.forEach(item => {
            merged[`order_${item.id}`] = prev.hasOwnProperty(`order_${item.id}`) ? prev[`order_${item.id}`] : true;
          });
        }
        return merged;
      });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('אנא התחבר כדי לצפות בעגלה שלך.');
      } else {
        setError('שגיאה בטעינת העגלה.');
      }
    }
  }, []);

  useEffect(() => {
    fetchCart();
    fetchMinCutLength();
  }, [fetchCart, fetchMinCutLength]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCart();
        fetchMinCutLength();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchCart, fetchMinCutLength]);

  return {
    cart,
    activeOrder,
    error,
    setError,
    minCutLength,
    selectedItems,
    toggleItemSelection,
    fetchCart,
    editingItem,
    setEditingItem,
    editLength,
    setEditLength,
    editUnits,
    setEditUnits
  };
};
