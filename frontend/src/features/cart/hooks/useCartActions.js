import { useState, useRef, useEffect, useContext } from 'react';
import client from '../../../api/client';
import { CartContext } from '../CartContext';

export const useCartActions = ({
  cart,
  activeOrder,
  fetchCart,
  selectedItems,
  editingItem,
  editUnits,
  editLength,
  minCutLength,
  setEditingItem,
  setError,
  toggleItemSelection,
  setItemSelection,
  syncCartState
}) => {
  const { syncCartContext } = useContext(CartContext);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});
  const deleteTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  // Fetch cart + order once and sync both local state and context (2 requests instead of 4)
  const refreshAll = async () => {
    try {
      const [cartRes, orderRes] = await Promise.all([
        client.get('/orders/cart'),
        client.get('/orders/active').catch(() => ({ data: null }))
      ]);
      syncCartState(cartRes.data, orderRes.data);
      syncCartContext(cartRes.data, orderRes.data);
    } catch (err) {
      console.error('Failed to refresh cart state', err);
    }
  };

  const handleUpdateUnits = async (itemId, newUnits) => {
    if (newUnits < 1) return;
    try {
      const res = await client.patch(`/orders/cart/items/${itemId}`, { units: newUnits });
      syncCartState(res.data, activeOrder);
      syncCartContext(res.data, activeOrder);
    } catch (err) {
      showError(err.response?.data?.detail || 'שגיאה בעדכון כמות');
    }
  };

  const handleSaveEdit = async () => {
    if (editUnits < 1 || editLength < minCutLength) return;
    try {
      const res = await client.patch(`/orders/cart/items/${editingItem.id}`, { 
        units: editUnits,
        length_meters: editLength
      });
      setEditingItem(null);
      syncCartState(res.data, activeOrder);
      syncCartContext(res.data, activeOrder);
    } catch (err) {
      showError(err.response?.data?.detail || 'שגיאה בעדכון פריט');
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      if (item.is_order_item) {
        await client.delete(`/orders/active/items/${item.id}`);
        await refreshAll();
      } else {
        const res = await client.delete(`/orders/cart/items/${item.id}`);
        syncCartState(res.data, activeOrder);
        syncCartContext(res.data, activeOrder);
      }
    } catch (err) {
      showError('שגיאה במחיקת הפריט');
    }
  };

  const onTrashClick = (item) => {
    if (confirmDeleteId === item.id) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setConfirmDeleteId(null);
      handleRemoveItem(item);
    } else {
      setConfirmDeleteId(item.id);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
      }, 10000);
    }
  };

  const handleToggleSendOrder = async () => {
    setIsSendingOrder(true);
    try {
      if (activeOrder) {
        // Revert to cart
        await client.post(`/orders/${activeOrder.id}/revert_to_cart`);
        alert("ההזמנה בוטלה, המלאי שוחרר והפריטים חזרו לעגלה.");
      } else {
        // Checkout
        if (!cart?.items || cart.items.length === 0) {
          alert("העגלה ריקה");
          return;
        }
        
        const selectedIds = Object.entries(selectedItems)
          .filter(([id, isSelected]) => isSelected && id.startsWith('cart_'))
          .map(([id]) => parseInt(id.replace('cart_', ''), 10));

        if (selectedIds.length === 0) {
          alert("אנא בחר לפחות פריט אחד להזמנה");
          return;
        }

        await client.post('/orders/checkout', { selected_item_ids: selectedIds });
        alert("ההזמנה נוצרה, והמלאי נשמר עבורך בהצלחה!");
      }
      await refreshAll();
    } catch (err) {
      showError(err.response?.data?.detail || "שגיאה בביצוע הפעולה");
    } finally {
      setIsSendingOrder(false);
    }
  };

  const handleToggleItem = async (item) => {
    const originalValue = !!selectedItems[item.unique_id];
    toggleItemSelection(item.unique_id);
    
    if (activeOrder) {
      setUpdatingItems(prev => ({ ...prev, [item.unique_id]: true }));
      try {
        if (item.is_order_item) {
          const res = await client.post(`/orders/active/items/${item.id}/remove`);
          if (res.data?.new_cart_item_id) {
            setItemSelection(`cart_${res.data.new_cart_item_id}`, false);
          }
          syncCartState(res.data.cart, res.data.active_order);
          syncCartContext(res.data.cart, res.data.active_order);
        } else {
          const res = await client.post(`/orders/active/items/${item.id}/add`);
          syncCartState(res.data.cart, res.data.active_order);
          syncCartContext(res.data.cart, res.data.active_order);
        }
      } catch (err) {
        showError("שגיאה בעדכון הפריט: " + (err.response?.data?.detail || err.message));
        setItemSelection(item.unique_id, originalValue);
      } finally {
        setUpdatingItems(prev => ({ ...prev, [item.unique_id]: false }));
      }
    }
  };

  return {
    confirmDeleteId,
    isSendingOrder,
    handleUpdateUnits,
    handleSaveEdit,
    onTrashClick,
    handleToggleSendOrder,
    handleToggleItem,
    updatingItems
  };
};
