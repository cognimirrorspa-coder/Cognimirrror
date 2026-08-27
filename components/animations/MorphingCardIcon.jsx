'use client';

import { useState, useEffect, useRef } from 'react';
import { MorphIcon } from 'morphicons/react';

// Formas iniciales y finales para los 3 íconos de la sección
export const MORPH_ICONS = {
  clipboardX: {
    from: [["circle", { cx: "12", cy: "12", r: "3" }]],
    to: [
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
      ["path", { d: "M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" }],
      ["path", { d: "m15 11-6 6" }],
      ["path", { d: "m9 11 6 6" }]
    ]
  },
  smartphone: {
    from: [["circle", { cx: "12", cy: "12", r: "3" }]],
    to: [
      ["rect", { x: "5", y: "2", width: "14", height: "20", rx: "2", ry: "2" }],
      ["path", { d: "M12 18h.01" }]
    ]
  },
  eyeOff: {
    from: [["circle", { cx: "12", cy: "12", r: "3" }]],
    to: [
      ["path", { d: "M9.88 9.88a3 3 0 1 0 4.24 4.24" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" }],
      ["path", { d: "M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" }]
    ]
  }
};

export const MorphingCardIcon = ({ iconType, color, size = 24, delay = 0 }) => {
  const containerRef = useRef(null);
  const iconData = MORPH_ICONS[iconType] || MORPH_ICONS.clipboardX;
  const [activeIcon, setActiveIcon] = useState(iconData.from);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timeoutId;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timeoutId = setTimeout(() => {
              setActiveIcon(iconData.to);
            }, delay);
          } else {
            clearTimeout(timeoutId);
            setActiveIcon(iconData.from);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [iconData, delay]);

  return (
    <div ref={containerRef} className="inline-flex items-center justify-center">
      <MorphIcon
        icon={activeIcon}
        size={size}
        color={color}
        strokeWidth={2}
        spring="bouncy"
      />
    </div>
  );
};
