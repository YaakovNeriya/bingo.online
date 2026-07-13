import React from 'react';

const SkeletonCard = () => {
  return (
    <div 
      className="product-card-glass mobile-edge-card" 
      style={{ display: 'flex', flexDirection: 'column', position: 'relative', height: '100%' }}
    >
      <div className="mobile-edge-image skeleton-pulse" style={{ height: '280px', background: '#e2e8f0' }}></div>
      
      <div className="mobile-edge-content" style={{ padding: '0.9rem', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
        <div className="skeleton-pulse" style={{ height: '24px', width: '70%', background: '#cbd5e1', borderRadius: '4px' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton-pulse" style={{ height: '20px', width: '30%', background: '#cbd5e1', borderRadius: '4px' }}></div>
          <div className="skeleton-pulse" style={{ height: '16px', width: '20%', background: '#cbd5e1', borderRadius: '4px' }}></div>
        </div>

        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.5rem' }}>
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className="skeleton-pulse"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#cbd5e1'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
