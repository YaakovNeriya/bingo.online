import { useState, useEffect, useRef } from "react";

const GOLD_COLORS = [
  "#b8860b", "#c9950c", "#d4a017", "#daa520",
  "#e6b830", "#f0c040", "#f5c842", "#ffd700", "#ffe066", "#fff0a0",
];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

function createParticle(id) {
  const angle = randomBetween(0, Math.PI * 2);
  const speed = randomBetween(60, 180);
  return {
    id,
    x: randomBetween(20, 180), y: randomBetween(10, 50),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - randomBetween(20, 60),
    size: randomBetween(3, 12),
    color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
    opacity: 1, life: 1,
    decay: randomBetween(0.003, 0.008),
    rotation: randomBetween(0, 360),
    rotSpeed: randomBetween(-3, 3),
    shape: Math.random() > 0.5 ? "circle" : "square",
  };
}

export default function AddToCartButton({ onClick, disabled, children, style, className }) {
  const [particles, setParticles] = useState([]);
  const [clicked, setClicked] = useState(false);
  const [ripples, setRipples] = useState([]);
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const idRef = useRef(0);
  const resetTimerRef = useRef(null);

  const spawnParticles = () => {
    const newPs = Array.from({ length: 30 }, () => createParticle(idRef.current++));
    particlesRef.current = [...particlesRef.current, ...newPs];
  };

  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          vy: p.vy + 120 * dt,
          life: p.life - p.decay,
          opacity: Math.max(0, p.life - p.decay),
          rotation: p.rotation + p.rotSpeed,
        }))
        .filter((p) => p.life > 0);
      setParticles([...particlesRef.current]);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleClick = (e) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    setClicked(true);
    spawnParticles();

    const rippleId = Date.now();
    setRipples((r) => [...r, { id: rippleId, x: cx, y: cy }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== rippleId)), 1000);

    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setClicked(false), 2000);
    
    if (onClick) {
      onClick(e);
    }
  };

  const shimmerPos = clicked ? "200%" : "-60%";

  return (
    <div style={{ position: "relative", display: "inline-block", ...style }} className={className}>
      <style>{`@keyframes ripple { to { transform: translate(-50%,-50%) scale(20); opacity: 0; } }`}</style>

      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          position: "relative",
          padding: "12px 30px", // slightly smaller than the massive bitcoin button
          fontSize: "18px", fontWeight: 900, letterSpacing: "1px",
          color: "white",
          border: `3px solid ${clicked ? "#ffd700" : "#daa520"}`,
          borderRadius: "10px", cursor: "pointer", outline: "none", overflow: "hidden",
          textTransform: "uppercase",
          background: disabled ? '#cbd5e1' : clicked
            ? "linear-gradient(135deg, #b8860b 0%, #daa520 20%, #f5c842 40%, #ffd700 55%, #e6b830 70%, #c9950c 85%, #b8860b 100%)"
            : "linear-gradient(30deg, #1e293b 35%, #3b82f6 73%)", // Modern blue gradient for default state
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
        <div style={{ position: "absolute", top: 0, left: shimmerPos, width: "60%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)", transform: "skewX(-20deg)", transition: clicked ? "left 0.8s ease" : "left 0s", pointerEvents: "none" }} />

        {/* diagonal stripes */}
        {clicked && <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,215,0,0.08) 8px, rgba(255,215,0,0.08) 16px)", pointerEvents: "none" }} />}

        {/* ripples */}
        {ripples.map((rp) => (
          <span key={rp.id} style={{ position: "absolute", left: rp.x, top: rp.y, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,215,0,0.5)", transform: "translate(-50%,-50%) scale(0)", animation: "ripple 1s ease-out forwards", pointerEvents: "none" }} />
        ))}

        {children || "הוסף לעגלה"}
      </button>

      {/* particles */}
      {particles.map((p) => (
        <div key={p.id} style={{ position: "absolute", left: p.x, top: p.y, width: p.size, height: p.size, borderRadius: p.shape === "circle" ? "50%" : "2px", background: p.color, opacity: p.opacity, transform: `rotate(${p.rotation}deg)`, pointerEvents: "none", boxShadow: `0 0 ${p.size}px ${p.color}`, zIndex: 10 }} />
      ))}
    </div>
  );
}
