import { useState, useEffect } from 'react';
import client from '../../../api/client';

export const useCartForm = (modelId, selectedSku, minCutLength, syncCartContext) => {
  const [lengthMeters, setLengthMeters] = useState(1.0);
  const [units, setUnits] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState('');
  const [cartSuccess, setCartSuccess] = useState('');

  const showError = (msg) => {
    setCartError(msg);
    setTimeout(() => setCartError(''), 5000);
  };

  const showSuccess = (msg) => {
    setCartSuccess(msg);
    setTimeout(() => setCartSuccess(''), 5000);
  };

  // Reset form when modelId changes
  useEffect(() => {
    setLengthMeters(minCutLength);
    setUnits(1);
    setCartError('');
    setCartSuccess('');
  }, [modelId, minCutLength]);

  // Sync length with minCutLength if minCutLength changes to be larger
  useEffect(() => {
    setLengthMeters(prev => Math.max(prev, minCutLength));
  }, [minCutLength]);

  const handleAddToCart = async () => {
    if (lengthMeters < 0.1) {
      showError('אורך מינימלי הוא 0.1 מטר.');
      return;
    }
    if (units < 1) {
      showError('מספר יחידות מינימלי הוא 1.');
      return;
    }
    if (Math.abs(lengthMeters - Math.round(lengthMeters * 10) / 10) > 0.0001) {
      showError('אורך חייב להיות בקפיצות של 0.1 מטר.');
      return;
    }
    if (lengthMeters < minCutLength) {
      showError(`אורך מינימלי לחתיכה הוא ${minCutLength} מטרים.`);
      return;
    }
    // Convert to integers (decimeters) to avoid JavaScript floating point errors
    const lengthDecimeters = Math.round(lengthMeters * 10);
    const totalRequestedDecimeters = lengthDecimeters * units;
    
    if (selectedSku) {
      const stockDecimeters = Math.round(parseFloat(selectedSku.stock_meters) * 10);
      if (totalRequestedDecimeters > stockDecimeters) {
        showError(`לא ניתן להוסיף. סך הכל מבוקש: ${totalRequestedDecimeters / 10} מטרים. המלאי הזמין הוא ${(stockDecimeters / 10).toFixed(2)} מטרים בלבד.`);
        return;
      }
    }
    setCartError('');

    try {
      setAddingToCart(true);
      const res = await client.post('/orders/cart', {
        color_sku_id: selectedSku.id,
        length_meters: parseFloat(Number(lengthMeters).toFixed(1)),
        units: units
      });
      if (syncCartContext) {
        syncCartContext(res.data.cart, res.data.active_order);
      }
      setAddingToCart(false);
      const formattedLength = parseFloat(Number(lengthMeters).toFixed(1));
      showSuccess(`התווסף לעגלה:\n${units} ${units === 1 ? 'יחידה' : 'יחידות'} של ${formattedLength} מטרים בצבע ${selectedSku.color_name}.`);
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      showError(
        Array.isArray(errDetail) 
          ? errDetail.map(d => d.msg).join(', ') 
          : (errDetail || 'שגיאה בהוספה או שאינך מחובר.')
      );
      setAddingToCart(false);
    }
  };

  return {
    lengthMeters,
    setLengthMeters,
    units,
    setUnits,
    addingToCart,
    cartError,
    cartSuccess,
    handleAddToCart
  };
};
