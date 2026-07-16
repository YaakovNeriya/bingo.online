import { useState, useCallback, useEffect, useMemo } from 'react';
import client from '../../../api/client';

export const useCartState = () => {
  const [cart, setCart] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [error, setError] = useState(null);
  const [minCutLength, setMinCutLength] = useState(1.0);
  const [selectedItems, setSelectedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart_selected_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load selected items', e);
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('cart_selected_items', JSON.stringify(selectedItems));
  }, [selectedItems]);
  const [editingItem, setEditingItem] = useState(null);
  const [editLength, setEditLength] = useState(0);
  const [editUnits, setEditUnits] = useState(0);

  const toggleItemSelection = (id) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setItemSelection = (id, value) => {
    setSelectedItems(prev => ({ ...prev, [id]: value }));
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

  const displayItems = useMemo(() => {
    const items = [];
    if (activeOrder?.items) {
      items.push(...activeOrder.items.map(i => ({ ...i, is_order_item: true, unique_id: `order_${i.id}` })));
    }
    if (cart?.items) {
      items.push(...cart.items.map(i => ({ ...i, is_order_item: false, unique_id: `cart_${i.id}` })));
    }
    return items;
  }, [activeOrder, cart]);

  const cartTotalPrice = useMemo(() => {
    return (displayItems
      .filter(item => selectedItems[item.unique_id])
      .reduce((sumCents, item) => {
        const price = item.price_at_purchase 
          ? parseFloat(item.price_at_purchase) 
          : parseFloat(item.color_sku.specific_price ?? item.color_sku.product_model.base_price);
        
        const lengthCm = Math.round(parseFloat(item.length_meters) * 100);
        const priceAgorot = Math.round(price * 100);
        const itemTotalAgorot = Math.round((lengthCm * item.units * priceAgorot) / 100);
        return sumCents + itemTotalAgorot;
      }, 0) / 100).toFixed(2);
  }, [displayItems, selectedItems]);

  return {
    cart,
    activeOrder,
    error,
    setError,
    minCutLength,
    selectedItems,
    toggleItemSelection,
    setItemSelection,
    fetchCart,
    editingItem,
    setEditingItem,
    editLength,
    setEditLength,
    editUnits,
    setEditUnits,
    displayItems,
    cartTotalPrice
  };
};
