import { useEffect, useRef } from 'react';

/**
 * Custom hook to link modal/drawer/lightbox visibility to the browser & mobile native Back button.
 * 
 * @param {boolean} isOpen - Whether the modal/drawer is open
 * @param {Function} onClose - Function to invoke when back button is pressed or modal closes
 * @param {string} [modalId='modal'] - Optional identifier for debugging or state differentiation
 */
export function useModalBack(isOpen, onClose, modalId = 'modal') {
  const isPushedRef = useRef(false);

  const onCloseRef = useRef(onClose);
  
  // Always keep the ref updated with the latest callback
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const stateKey = `modal_${modalId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    window.history.pushState({ modalId, stateKey }, '');
    isPushedRef.current = true;

    const handlePopState = () => {
      isPushedRef.current = false;
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (isPushedRef.current) {
        isPushedRef.current = false;
        // Delay history back to prevent popping if we are immediately remounted (Strict Mode)
        // or if another state was already pushed over it.
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.history?.state?.stateKey === stateKey) {
            window.history.back();
          }
        }, 50);
      }
    };
  }, [isOpen, modalId]);
}

export default useModalBack;
