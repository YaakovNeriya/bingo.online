import { useState, useRef } from "react";

export default function AddToCartButton({ onClick, disabled, children, style, className }) {
  const [clicked, setClicked] = useState(false);
  const resetTimerRef = useRef(null);

  const handleClick = (e) => {
    if (disabled) return;
    
    setClicked(true);

    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setClicked(false), 2000);
    
    if (onClick) {
      onClick(e);
    }
  };

  const shimmerPos = clicked ? "200%" : "-60%";

  return (
    <div style={{ position: "relative", display: "inline-block", ...style }} className={className}>
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          position: "relative",
          padding: "12px 30px",
          fontSize: "18px", 
          fontWeight: 900, 
          letterSpacing: "1px",
          color: "white",
          border: `3px solid ${clicked ? "#ffd700" : "#daa520"}`,
          borderRadius: "10px", 
          cursor: disabled ? "not-allowed" : "pointer", 
          outline: "none", 
          overflow: "hidden",
          textTransform: "uppercase",
          background: disabled ? '#cbd5e1' : clicked
            ? "linear-gradient(135deg, #b8860b 0%, #daa520 20%, #f5c842 40%, #ffd700 55%, #e6b830 70%, #c9950c 85%, #b8860b 100%)"
            : "linear-gradient(30deg, #1e293b 35%, #3b82f6 73%)", 
          boxShadow: disabled ? 'none' : clicked
            ? "0 0 30px #ffd700, 0 0 60px #daa52088, inset 0 0 20px rgba(255,215,0,0.2)"
            : "0 4px 14px rgba(59, 130, 246, 0.4)",
          transition: "all 0.3s ease",
          textShadow: (!disabled && clicked) ? "0 0 10px #fff, 0 1px 3px rgba(0,0,0,0.5)" : "none",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          opacity: disabled ? 0.7 : 1
        }}
      >
        {/* shimmer */}
        <div style={{ 
          position: "absolute", 
          top: 0, 
          left: shimmerPos, 
          width: "60%", 
          height: "100%", 
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)", 
          transform: "skewX(-20deg)", 
          transition: clicked ? "left 0.8s ease" : "left 0s", 
          pointerEvents: "none" 
        }} />

        {/* diagonal stripes */}
        {clicked && <div style={{ 
          position: "absolute", 
          inset: 0, 
          background: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,215,0,0.08) 8px, rgba(255,215,0,0.08) 16px)", 
          pointerEvents: "none" 
        }} />}

        {children || "הוסף לעגלה"}
      </button>
    </div>
  );
}
