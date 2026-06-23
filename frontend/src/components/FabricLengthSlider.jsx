import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus, Scissors } from 'lucide-react';

const FabricLengthSlider = ({ value, onChange, min = 1.0, max = 50.0, step = 0.1 }) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startValue, setStartValue] = useState(value);
  const [inputValue, setInputValue] = useState(value.toFixed(1));

  useEffect(() => {
    if (!isDragging) {
      setInputValue(value.toFixed(1));
    }
  }, [value, isDragging]);

  // Pixels per unit (meter). 
  // Let's say we want 0.5 meters to take up about 150px.
  // So 1 meter = 300px.
  const pixelsPerMeter = 300;

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setStartValue(value);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    
    // In RTL, moving finger right (diffX > 0) means we are pulling the ruler right.
    // If ruler goes right, the center (scissors) points to a smaller number.
    // So diffX > 0 means value decreases.
    // Therefore, valueChange = -diffX / pixelsPerMeter
    // But since Hebrew is RTL, the whole component might be flipped. 
    // Let's assume standard behavior: moving thumb right increases value.
    // If the ruler is moving, dragging finger right -> ruler moves right -> smaller values move into the center.
    // So diffX > 0 -> value decreases.
    let valueChange = -diffX / pixelsPerMeter;
    
    // But wait! If we want to simulate dragging the scissors, dragging scissors right (diffX > 0) -> value increases!
    valueChange = diffX / pixelsPerMeter;

    // Apply step rounding
    let newValue = startValue + valueChange;
    newValue = Math.round(newValue / step) * step;
    
    if (newValue >= min && newValue <= max) {
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMinus = () => {
    const newValue = Math.round((value - step) * 10) / 10;
    if (newValue >= min) {
      onChange(newValue);
      setInputValue(newValue.toFixed(1));
    }
  };

  const handlePlus = () => {
    const newValue = Math.round((value + step) * 10) / 10;
    if (newValue <= max) {
      onChange(newValue);
      setInputValue(newValue.toFixed(1));
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let val = parseFloat(inputValue);
    if (isNaN(val)) val = min;
    val = Math.max(min, Math.min(max, val));
    val = Math.round(val * 10) / 10;
    setInputValue(val.toFixed(1));
    onChange(val);
  };

  // Generate ticks to display around the current value
  const windowSize = 0.5; // display +/- 0.5 meters around the value
  const ticks = [];
  const startTick = Math.floor((value - windowSize) / step) * step;
  const endTick = Math.ceil((value + windowSize) / step) * step;

  for (let t = startTick; t <= endTick + 0.01; t += step) {
    const tickValue = Math.round(t * 10) / 10;
    if (tickValue >= min && tickValue <= max) {
      ticks.push(tickValue);
    }
  }

  return (
    <div style={{ width: '100%', marginBottom: 0, userSelect: 'none' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-color)' }}>
        אורך הבד (מטרים):
      </h3>
      
      <div style={{ position: 'relative', width: '100%', height: '80px', display: 'flex', alignItems: 'center' }}>
        
        {/* The Track Container */}
        <div 
          ref={containerRef}
          style={{
            position: 'absolute',
            left: '22px',
            right: '22px',
            top: '10px',
            height: '60px',
            overflow: 'hidden',
            borderRadius: '30px',
            background: '#f8fafc',
            boxShadow: 'inset 0 6px 12px rgba(0,0,0,0.25), inset 0 2px 4px rgba(0,0,0,0.15)',
            border: '1px solid #cbd5e1',
            zIndex: 8
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* The moving fabric background */}
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: '25px',
            width: '20000px',
            left: '50%',
            transform: `translateX(calc(-50% + ${value * pixelsPerMeter}px))`,
            backgroundImage: 'url(/denim_fabric.png)',
            backgroundSize: '250px 250px',
            backgroundRepeat: 'repeat-x',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }} />

          {/* The moving ruler ticks */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            height: '25px',
            width: '20000px',
            left: '50%',
            transform: `translateX(calc(-50% + ${value * pixelsPerMeter}px))`,
            background: '#f8fafc',
            borderTop: '2px solid #e2e8f0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}>
            {ticks.map(tick => {
              const xPos = tick * pixelsPerMeter;
              // Every 0.5 is a major tick, others are minor
              const isMajor = Math.abs(tick % 0.5) < 0.01;
              const isCenter = Math.abs(tick - value) < 0.01;
              
              return (
                <div 
                  key={tick} 
                  style={{
                    position: 'absolute',
                    left: `calc(50% - ${xPos}px)`,
                    top: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div style={{
                    width: isMajor ? '2px' : '1px',
                    height: isMajor ? '8px' : '5px',
                    background: isMajor ? '#64748b' : '#cbd5e1',
                  }} />
                  {isMajor && (
                    <span style={{ 
                      fontSize: '0.8rem', 
                      color: isCenter ? 'var(--primary-color)' : '#64748b', 
                      fontWeight: 'bold',
                      marginTop: '2px',
                      lineHeight: 1
                    }}>
                      {tick.toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Indicator (Fixed over fabric, starting from outside) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '2px', // Starts 8px above the track (which is at top 10px)
          height: '45px',
          width: '2px',
          background: '#ef4444',
          transform: 'translateX(-50%)',
          zIndex: 12,
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #ef4444',
          }} />
        </div>

        {/* Floating Plus Button (Left) */}
        <button
          onClick={handlePlus}
          disabled={value >= max}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 11,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--primary-color)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            opacity: value >= max ? 0.5 : 1,
            cursor: value >= max ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Plus size={24} />
        </button>

        {/* Floating Minus Button (Right) */}
        <button
          onClick={handleMinus}
          disabled={value <= min}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 11,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--primary-color)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            opacity: value <= min ? 0.5 : 1,
            cursor: value <= min ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Minus size={24} />
        </button>
      </div>
      
      {/* Editable value text */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--glass-bg)', padding: '0.75rem 1.5rem', borderRadius: '16px', border: '2px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' }}>
          <input 
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            style={{ width: '80px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', border: 'none', background: 'transparent', outline: 'none', color: 'var(--primary-color)' }}
          />
          <span style={{ fontSize: '1.2rem', color: 'var(--text-color)', fontWeight: 'bold', marginRight: '0.5rem' }}>מטרים</span>
        </div>
      </div>
    </div>
  );
};

export default FabricLengthSlider;
