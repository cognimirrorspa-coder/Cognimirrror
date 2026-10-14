'use client';

import { useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import './FoldText.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const HINGE_CONFIG = {
  top: { origin: '50% 0%', rotateX: -92, rotateY: 0 },
  bottom: { origin: '50% 100%', rotateX: 92, rotateY: 0 },
  left: { origin: '0% 50%', rotateX: 0, rotateY: 92 },
  right: { origin: '100% 50%', rotateX: 0, rotateY: -92 }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const renderWhitespace = (value, key) =>
  value.split(/(\n)/).map((part, index) => {
    if (part === '\n') return <br key={`${key}-br-${index}`} />;
    if (!part) return null;

    return (
      <span className="fold-text-whitespace" key={`${key}-space-${index}`}>
        {part.replace(/ /g, '\u00A0')}
      </span>
    );
  });

const FoldText = ({
  text = 'Design unfolds',
  splitBy = 'char',
  hinge = 'top',
  duration = 0.65,
  stagger = 0.045,
  ease = 'power3.out',
  perspective = 700,
  creaseShading = 0.55,
  trigger = 'mount',
  fontSize = 'inherit',
  fontWeight = 'inherit',
  color = 'inherit',
  className = '',
  style = {}
}) => {
  const rootRef = useRef(null);
  const hingeConfig = HINGE_CONFIG[hinge] || HINGE_CONFIG.top;
  const safeCrease = clamp(creaseShading, 0, 1);
  const safePerspective = Math.max(120, perspective);

  const segments = useMemo(() => {
    let segmentIndex = 0;

    const renderSegment = (content, key, split = splitBy) => {
      segmentIndex += 1;
      return (
        <span
          className="fold-text-segment"
          data-fold-split={split}
          key={key}
          style={{ '--fold-perspective': `${safePerspective}px` }}
        >
          <span
            className="fold-text-piece"
            data-fold-hinge={hinge}
            style={{ transformOrigin: hingeConfig.origin, '--fold-crease': 0 }}
          >
            {content || '\u00A0'}
          </span>
        </span>
      );
    };

    if (splitBy === 'line') {
      return text.split('\n').map((line, index) => (
        <span className="fold-text-line" key={`line-${index}`}>
          {renderSegment(line || '\u00A0', `segment-line-${index}`, 'line')}
        </span>
      ));
    }

    if (splitBy === 'word') {
      return text.split(/(\s+)/).flatMap((part, index) => {
        if (!part) return [];
        if (/^\s+$/.test(part)) return renderWhitespace(part, `ws-${index}`);
        return renderSegment(part, `segment-word-${segmentIndex}`);
      });
    }

    // Default: 'char' (Character mode matching React Bits demo)
    return text.split('\n').map((line, lineIdx) => (
      <span className="fold-text-line block" key={`line-${lineIdx}`}>
        {line.split(/(\s+)/).map((part, partIdx) => {
          if (/^\s+$/.test(part)) {
            return (
              <span className="fold-text-whitespace inline-block" key={`space-${lineIdx}-${partIdx}`}>
                {'\u00A0'}
              </span>
            );
          }
          return (
            <span className="inline-block whitespace-nowrap" key={`word-${lineIdx}-${partIdx}`}>
              {Array.from(part).map((char, charIdx) =>
                renderSegment(char, `char-${lineIdx}-${partIdx}-${charIdx}`, 'char')
              )}
            </span>
          );
        })}
      </span>
    ));
  }, [text, splitBy, hinge, hingeConfig.origin, safePerspective]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const pieces = root.querySelectorAll('.fold-text-piece');
      if (!pieces.length) return;

      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const activeDuration = reduceMotion ? Math.min(duration, 0.22) : duration;
      const activeStagger = reduceMotion ? Math.min(stagger, 0.02) : stagger;

      const fromVars = {
        opacity: 0,
        rotateX: reduceMotion ? 0 : hingeConfig.rotateX,
        rotateY: reduceMotion ? 0 : hingeConfig.rotateY,
        '--fold-crease': reduceMotion ? 0 : safeCrease,
        transformOrigin: hingeConfig.origin,
        force3D: true
      };

      const toVars = {
        opacity: 1,
        rotateX: 0,
        rotateY: 0,
        '--fold-crease': 0,
        duration: activeDuration,
        ease: reduceMotion ? 'power1.out' : ease,
        stagger: activeStagger,
        clearProps: 'willChange'
      };

      const tl = gsap.timeline({ repeat: trigger === 'loop' ? -1 : 0, repeatDelay: 0.75 });

      if (trigger === 'hover') {
        gsap.set(pieces, { opacity: 1, rotateX: 0, rotateY: 0, '--fold-crease': 0, transformOrigin: hingeConfig.origin });
        const onEnter = () => {
          tl.restart();
          tl.fromTo(pieces, fromVars, toVars);
        };
        root.addEventListener('mouseenter', onEnter);
        return () => root.removeEventListener('mouseenter', onEnter);
      } else if (trigger === 'scroll') {
        gsap.set(pieces, fromVars);
        ScrollTrigger.create({
          trigger: root,
          start: 'top 82%',
          once: true,
          onEnter: () => tl.fromTo(pieces, fromVars, toVars)
        });
      } else {
        // 'mount' or 'loop'
        tl.fromTo(pieces, fromVars, toVars);
      }
    },
    {
      scope: rootRef,
      dependencies: [
        text,
        splitBy,
        hinge,
        duration,
        stagger,
        ease,
        perspective,
        safeCrease,
        trigger,
        hingeConfig.origin,
        hingeConfig.rotateX,
        hingeConfig.rotateY
      ]
    }
  );

  const rootStyle = {
    '--fold-text-font-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    '--fold-text-font-weight': fontWeight,
    '--fold-text-color': color,
    ...style
  };

  return (
    <span ref={rootRef} className={`fold-text ${className}`.trim()} style={rootStyle}>
      <span className="fold-text-sr-only">{text}</span>
      <span className="fold-text-visual" aria-hidden="true">
        {segments}
      </span>
    </span>
  );
};

export default FoldText;
