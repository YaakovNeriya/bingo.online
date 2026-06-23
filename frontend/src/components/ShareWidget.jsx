import React, { useState } from 'react';
import { Share2, X, MessageCircle, Facebook, Send, Link } from 'lucide-react';

const ShareWidget = ({ url, title }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleShare = async () => {
    // If native share is supported, try it first
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'בינגו בדים',
          url: url
        });
        return; // Success
      } catch (err) {
        // Fallback to modal if user cancels or it fails
        if (err.name !== 'AbortError') {
          setModalOpen(true);
        }
      }
    } else {
      // No native share, use modal
      setModalOpen(true);
    }
  };

  const getUrlWithUtm = (source) => {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}utm_source=${source}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getUrlWithUtm('copy_link'));
    alert('הקישור הועתק בהצלחה!');
    setModalOpen(false);
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <button 
        onClick={handleShare}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--primary-color)',
          boxShadow: isHovered ? '5px 5px 12px rgba(59, 130, 246, 0.15), -3px -3px 8px #ffffff' : '3px 3px 8px rgba(0,0,0,0.06), -3px -3px 8px #ffffff',
          transform: isHovered ? 'scale(1.05) translateY(-2px)' : 'scale(1) translateY(0)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0
        }}
        title="שתף"
      >
        <Share2 size={22} />
      </button>

      {modalOpen && (
        <div 
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel" 
            style={{ 
              padding: '2.5rem 1.5rem', 
              width: '100%', 
              maxWidth: '380px', 
              position: 'relative',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <button 
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>שתף דרך:</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + getUrlWithUtm('whatsapp'))}`} 
                target="_blank" 
                rel="noreferrer"
                className="share-btn-elegant share-whatsapp"
                onClick={() => setModalOpen(false)}
              >
                <MessageCircle size={20} /> שתף ב-WhatsApp
              </a>
              
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrlWithUtm('facebook'))}`} 
                target="_blank" 
                rel="noreferrer"
                className="share-btn-elegant share-facebook"
                onClick={() => setModalOpen(false)}
              >
                <Facebook size={20} /> שתף ב-Facebook
              </a>
              
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(getUrlWithUtm('telegram'))}&text=${encodeURIComponent(title)}`} 
                target="_blank" 
                rel="noreferrer"
                className="share-btn-elegant share-telegram"
                onClick={() => setModalOpen(false)}
              >
                <Send size={20} /> שתף ב-Telegram
              </a>

              <button 
                onClick={handleCopy}
                className="share-btn-elegant share-copy"
              >
                <Link size={20} /> העתק קישור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareWidget;
