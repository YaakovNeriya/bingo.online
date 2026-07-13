import React from 'react';
import SmartImage from '../../../components/ui/SmartImage';

export const CategoryBubbles = ({ catalog, getCategoryDisplayImage, scrollToCategory }) => {
  if (catalog.length === 0) return null;

  return (
    <div className="category-bubbles-container">
      {catalog.map(type => {
        const catImg = getCategoryDisplayImage(type);
        return (
          <div 
            key={`bubble-${type.id}`} 
            className="category-bubble"
            onClick={() => scrollToCategory(type.id)}
          >
            {catImg ? (
              <SmartImage src={catImg} alt={type.name} className="category-bubble-img" style={{ pointerEvents: 'none' }} />
            ) : (
              <div className="category-bubble-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0' }}>
                <span style={{ color: 'var(--text-light)', fontSize: '1rem', fontWeight: 'bold' }}>{type.name.substring(0, 2)}</span>
              </div>
            )}
            <span className="category-bubble-text">{type.name}</span>
          </div>
        );
      })}
    </div>
  );
};
