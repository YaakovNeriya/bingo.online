import React from 'react';
import { Link2 } from "lucide-react";

function SocialIcon({ social }) {
  if (social.isLucide) {
    return <Link2 color="#fff" size={20} strokeWidth={2.5} />;
  }
  return (
    <svg viewBox={social.viewBox} style={{ width: social.iconWidth, height: "auto" }}>
      <path d={social.path} fill="#fff" />
    </svg>
  );
}

export default function SocialShareCard({ url, title }) {
  const [copied, setCopied] = React.useState(false);
  const encodedUrl = encodeURIComponent(url || window.location.href);
  const encodedTitle = encodeURIComponent(title || "תראו את הבד המדהים הזה מבינגו!");
  
  const socials = [
    {
      name: "העתק קישור",
      href: "#",
      color: "#334155", // Slate for link
      isLucide: true,
      onClick: (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(url || window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    },
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%0A${encodedUrl}`,
      color: "#25D366",
      iconWidth: 24,
      viewBox: "0 0 16 16",
      path: "M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "#1877F2",
      iconWidth: 14,
      viewBox: "0 0 320 512",
      path: "M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z",
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: "#229ED9",
      iconWidth: 22,
      viewBox: "0 0 448 512",
      path: "M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L118.5 285.9l-102.4-32c-22.3-6.9-22.7-22.3 4.6-33l400-154.2c18.5-6.9 34.7 4.1 28.7 33z",
    }
  ];

  return (
    <div className="social-card-wrapper">
      <div className="social-card">
        <div className="bg-container">
          <div className="bg" aria-hidden="true"></div>
        </div>
        
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.href}
            onClick={social.onClick}
            target={social.onClick ? undefined : "_blank"}
            rel="noopener noreferrer"
            aria-label={social.name}
            title={social.name}
            className="social-icon"
            style={{ backgroundColor: social.color }}
          >
            <SocialIcon social={social} />
            {social.name === "העתק קישור" && (
              <span className={`copy-tooltip ${copied ? 'visible' : ''}`}>הועתק!</span>
            )}
          </a>
        ))}
      </div>

      <style>{`
        .social-card-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          animation: expand-down 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          opacity: 0;
          transform-origin: top;
          margin-top: 1rem;
        }

        .social-card {
          position: relative;
          width: 100%;
          height: fit-content;
          background-color: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: nowrap;
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
          padding: 10px;
          gap: 15px;
          border-radius: 16px;
          border: 1px solid rgba(187, 183, 183, 0.5);
          box-shadow: 0 4px 15px rgba(8, 6, 6, 0.05);
          box-sizing: border-box;
        }

        .bg-container {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }

        .bg {
          width: 800px;
          height: 800px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: rotateBg 40s linear infinite;
          z-index: 0;
          pointer-events: none;
        }
        .bg::before {
          content: "";
          width: 100%;
          height: 100%;
          display: block;
          background: repeating-conic-gradient(
            from 0deg at 53% 53%,
            rgba(246, 194, 92, 0.75) 0deg,
            rgba(246, 194, 92, 0.75) 15deg,
            transparent 20deg,
            transparent 35deg
          );
          opacity: 0.7;
          animation: rotateBgBefore 40s linear infinite;
        }

        .social-icon {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          min-width: 48px;
          width: 48px;
          min-height: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 0.3s ease, box-shadow 0.2s ease;
        }
        .social-icon:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .social-icon:active {
          transform: scale(0.9);
          transition-duration: 0.1s;
        }

        .copy-tooltip {
          position: absolute;
          bottom: 130%;
          background-color: #1e293b;
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform: translateY(10px) scale(0.9);
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10;
        }
        .copy-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #1e293b transparent transparent transparent;
        }
        .copy-tooltip.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);        }

        @keyframes rotateBg {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes rotateBgBefore {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes expand-down {
          from {
            opacity: 0;
            transform: translateY(-15px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
