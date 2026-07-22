import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast({ type = 'success', message }) {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`toast-banner ${isSuccess ? 'toast-success' : 'toast-error'}`}>
      {isSuccess ? (
        <CheckCircle2 size={24} className="toast-banner-icon" />
      ) : (
        <AlertCircle size={24} className="toast-banner-icon" />
      )}
      <span className="toast-banner-text">{message}</span>
    </div>
  );
}
