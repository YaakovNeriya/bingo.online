import { useState, useRef, useEffect, useCallback } from 'react';

export const useCatalogScroll = ({ isFetching, flattenedItems }) => {
  const [visibleCount, setVisibleCount] = useState(12);
  const loaderRef = useRef(null);

  // Restore scroll and visibleCount from session storage
  useEffect(() => {
    if (!isFetching) {
      const savedScroll = sessionStorage.getItem('catalogScrollPos');
      const savedCount = sessionStorage.getItem('catalogVisibleCount');
      if (savedCount) setVisibleCount(parseInt(savedCount, 10));
      if (savedScroll) {
        setTimeout(() => window.scrollTo(0, parseInt(savedScroll, 10)), 100);
      }
    }
  }, [isFetching]);

  // Save scroll position
  useEffect(() => {
    let timeout;
    const handleScroll = () => {
      if (timeout) return;
      timeout = setTimeout(() => {
        sessionStorage.setItem('catalogScrollPos', window.scrollY);
        timeout = null;
      }, 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Save visible count
  useEffect(() => {
    sessionStorage.setItem('catalogVisibleCount', visibleCount);
  }, [visibleCount]);

  const scrollToCategory = useCallback((typeId) => {
    const index = flattenedItems.findIndex(i => i.type === 'header' && i.data.id === typeId);
    if (index >= visibleCount) {
      setVisibleCount(index + 20);
    }
    setTimeout(() => {
      const el = document.getElementById(`category-section-${typeId}`);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100; // Offset for sticky navbar
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  }, [flattenedItems, visibleCount]);

  // Infinite Scroll logic
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting) {
      setVisibleCount(prev => prev + 12);
    }
  }, []);

  useEffect(() => {
    const option = { root: null, rootMargin: "100px", threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver, isFetching]);

  return {
    visibleCount,
    loaderRef,
    scrollToCategory
  };
};
