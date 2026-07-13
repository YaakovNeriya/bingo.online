import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import client from '../api/client';
import { useDebounce } from '../hooks/useDebounce';

const NavbarSearch = ({ isMobile, isSearchActive, setIsSearchActive }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && e.target !== inputRef.current) {
        setShowDropdown(false);
        if (isMobile && !query) {
          setIsSearchActive(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, query, setIsSearchActive]);

  // Auto-focus on mobile when active
  useEffect(() => {
    if (isMobile && isSearchActive) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isMobile, isSearchActive]);

  // Fetch results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await client.get(`/products/search?q=${encodeURIComponent(debouncedQuery)}`);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedQuery]);

  const handleResultClick = (id) => {
    setShowDropdown(false);
    setQuery('');
    if (isMobile) setIsSearchActive(false);
    navigate(`/product/${id}`);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
    if (isMobile) {
      setIsSearchActive(false);
      setShowDropdown(false);
    }
  };

  // ---------------- DESKTOP VIEW ---------------- //
  if (!isMobile) {
    return (
      <div style={{ position: 'relative', width: '250px', marginLeft: 'auto', marginRight: '2rem' }} ref={dropdownRef}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-color)',
          border: '1px solid var(--border-color, rgba(128,128,128,0.2))',
          borderRadius: '999px',
          padding: '0.5rem 1.2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
        }}>
          <Search size={18} style={{ color: 'var(--text-light)', marginLeft: '0.5rem' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="חיפוש בדים או מחירים..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results.length > 0) {
                handleResultClick(results[0].id);
              }
            }}
            onFocus={() => setShowDropdown(true)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              color: 'var(--text-color)',
              fontFamily: '"Assistant", sans-serif',
              fontSize: '0.95rem'
            }}
          />
          {query && (
            <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <X size={16} style={{ color: 'var(--text-light)' }} />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && query.length >= 2 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {isSearching ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)' }}>
                <Loader2 size={24} className="spin" style={{ margin: '0 auto' }} />
              </div>
            ) : results.length > 0 ? (
              results.map(res => (
                <div
                  key={res.id}
                  onClick={() => handleResultClick(res.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    textDecoration: 'none',
                    color: 'var(--text-color)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {res.image_url ? (
                    <img src={res.image_url} alt={res.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginLeft: '1rem' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', marginLeft: '1rem' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{res.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{res.type_name}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                    ₪{res.price}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)' }}>
                לא נמצאו תוצאות ל"{query}"
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------------- MOBILE VIEW ---------------- //
  if (!isSearchActive) {
    return null; // The floating pill in Navbar acts as the trigger
  }

  // Mobile Active Search (Full width overlay)
  return createPortal(
    <div 
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--bg-color)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-color)',
        borderBottom: '1px solid var(--border-color, rgba(128,128,128,0.2))',
        padding: '0.8rem 1.2rem',
        width: '100%',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <Search size={20} style={{ color: 'var(--text-light)', marginLeft: '0.5rem' }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="חיפוש בדים או מחירים..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length > 0) {
              handleResultClick(results[0].id);
            }
          }}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            width: '100%',
            color: 'var(--text-color)',
            fontFamily: '"Assistant", sans-serif',
            fontSize: '1.1rem'
          }}
        />
        <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
          <X size={24} style={{ color: 'var(--text-light)' }} />
        </button>
      </div>

      {/* Mobile Dropdown Results */}
      {showDropdown && query.length >= 2 && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-color)'
        }}>
          {isSearching ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto' }} />
            </div>
          ) : results.length > 0 ? (
            results.map(res => (
              <div
                key={res.id}
                onClick={() => handleResultClick(res.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-color, rgba(128,128,128,0.1))',
                  color: 'var(--text-color)'
                }}
              >
                {res.image_url ? (
                  <img src={res.image_url} alt={res.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginLeft: '1rem' }} />
                ) : (
                  <div style={{ width: '50px', height: '50px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', marginLeft: '1rem' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '1rem' }}>{res.name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{res.type_name}</div>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary-color)' }}>
                  ₪{res.price}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '1.1rem' }}>
              לא נמצאו תוצאות ל"{query}"
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
};

export default NavbarSearch;
