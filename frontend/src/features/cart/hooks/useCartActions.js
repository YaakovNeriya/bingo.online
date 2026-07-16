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
  setItemSelection
}) => {
  const { fetchCartCount } = useContext(CartContext);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
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

  const handleUpdateUnits = async (itemId, newUnits) => {
    if (newUnits < 1) return;
    try {
      await client.patch(`/orders/cart/items/${itemId}`, { units: newUnits });
      fetchCart();
      fetchCartCount();
    } catch (err) {
      showError(err.response?.data?.detail || 'שגיאה בעדכון כמות');
    }
  };

  const handleSaveEdit = async () => {
    if (editUnits < 1 || editLength < minCutLength) return;
    try {
      await client.patch(`/orders/cart/items/${editingItem.id}`, { 
        units: editUnits,
        length_meters: editLength
      });
      setEditingItem(null);
      fetchCart();
      fetchCartCount();
    } catch (err) {
      showError(err.response?.data?.detail || 'שגיאה בעדכון פריט');
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      if (item.is_order_item) {
        await client.delete(`/orders/active/items/${item.id}`);
      } else {
        await client.delete(`/orders/cart/items/${item.id}`);
      }
      fetchCart();
      fetchCartCount();
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
      fetchCart();
      fetchCartCount();
    } catch (err) {
      showError(err.response?.data?.detail || "שגיאה בביצוע הפעולה");
    } finally {
      setIsSendingOrder(false);
    }
  };

  const handleToggleItem = async (item) => {
    toggleItemSelection(item.unique_id);
    if (activeOrder) {
      try {
        if (item.is_order_item) {
          const res = await client.post(`/orders/active/items/${item.id}/remove`);
          if (res.data?.new_cart_item_id) {
            setItemSelection(`cart_${res.data.new_cart_item_id}`, false);
          }
        } else {
          await client.post(`/orders/active/items/${item.id}/add`);
        }
        fetchCart();
        fetchCartCount();
      } catch (err) {
        showError("שגיאה בעדכון הפריט: " + (err.response?.data?.detail || err.message));
        toggleItemSelection(item.unique_id);
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
    handleToggleItem
  };
};
