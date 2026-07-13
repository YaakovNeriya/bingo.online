export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('he-IL', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const getStatusStyle = (status) => {
  if (status === 'cart') return { background: '#fef3c7', color: '#92400e' };
  if (status === 'order_unpaid') return { background: '#dbeafe', color: '#1e40af' };
  if (status === 'order_paid') return { background: '#dcfce7', color: '#166534' };
  if (status === 'cutting_unpaid') return { background: '#fef08a', color: '#854d0e' };
  if (status === 'cutting_paid') return { background: '#fef08a', color: '#854d0e' };
  if (status === 'archived') return { background: '#e2e8f0', color: '#475569' };
  return { background: '#f8fafc', color: '#334155' };
};

export const getStatusLabel = (status) => {
  if (status === 'cart') return '🛒 עגלה';
  if (status === 'order_unpaid') return '📦 הזמנה (לא שולם)';
  if (status === 'order_paid') return '💲 📦 הזמנה (שולם)';
  if (status === 'cutting_unpaid') return '✂️ חיתוך';
  if (status === 'cutting_paid') return '✂️ חיתוך 💲';
  if (status === 'archived') return '🗄️ ארכיון';
  return status;
};

export const ORDER_STATUSES = {
  cart: { label: '🛒 עגלה' },
  order_unpaid: { label: '📦 הזמנה (לא שולם)' },
  order_paid: { label: '💲 📦 הזמנה (שולם)' },
  cutting_unpaid: { label: '✂️ חיתוך' },
  cutting_paid: { label: '✂️ חיתוך 💲' },
  archived: { label: '🗄️ ארכיון' }
};
