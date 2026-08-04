/**
 * OrgChartSVG.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Clean, responsive Hierarchy / Org Chart with SVG connector lines.
 *
 * Requirements met:
 *  ✅ Multi-level recursive JSON data (id, name, role, avatar, children[])
 *  ✅ Parent always horizontally centered over its children group (CSS flex)
 *  ✅ SVG lines: stem → horizontal branch (ONLY first→last child cx) → drops
 *  ✅ Zero dangling stubs — hbar uses measured child positions, not fixed offsets
 *  ✅ Cards: circular avatar, title, subtitle, phone badge, edit/delete buttons
 *  ✅ Cream / gold aesthetic matching classical temple theme
 *  ✅ Responsive: horizontal scroll when tree is wider than viewport
 *  ✅ Smooth transitions on card hover
 *
 * Usage:
 *   import OrgChart from './OrgChartSVG';
 *
 *   <OrgChart
 *     data={myTreeData}
 *     onEdit={(node) => console.log('edit', node)}
 *     onDelete={(node) => console.log('delete', node)}
 *   />
 *
 * Data shape:
 *   {
 *     id: string,
 *     name: string,
 *     role: string,
 *     roleEn?: string,
 *     avatar?: string,          // image URL
 *     phone?: string,
 *     carrier?: string,         // 'CELLCARD' | 'METFONE' | 'SMART'
 *     fb?: string,              // Facebook URL
 *     tg?: string,              // Telegram URL
 *     children: Node[],         // empty array or omit for leaf nodes
 *   }
 *
 * Dependencies: React 18+, Tailwind CSS (optional — inline styles used for core)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */

/** Horizontal padding on each side of a node column — controls sibling gap */
const H_PAD = 12;

/**
 * Vertical gap (px) between the bottom of a parent card and the top of its
 * children cards. The SVG connector lines are drawn inside this space.
 */
const V_GAP = 84;

/** Card configuration per depth level (0 = root, 1 = mid, 2+ = leaf) */
const DEPTH_CFG = [
  { cardW: 190, avatarSz: 108, nameFs: '0.93rem', roleFs: '0.80rem' },
  { cardW: 170, avatarSz:  90, nameFs: '0.84rem', roleFs: '0.74rem' },
  { cardW: 152, avatarSz:  76, nameFs: '0.76rem', roleFs: '0.68rem' },
];
const getCfg = (depth) => DEPTH_CFG[Math.min(depth, DEPTH_CFG.length - 1)];

/** Carrier badge colours */
const CARRIER_COLORS = {
  CELLCARD: { bg: '#dc2626', fg: '#fff' },
  METFONE:  { bg: '#2563eb', fg: '#fff' },
  SMART:    { bg: '#16a34a', fg: '#fff' },
};
const getCarrierStyle = (c) =>
  CARRIER_COLORS[(c || '').toUpperCase()] ?? { bg: '#6b7280', fg: '#fff' };

/* ═══════════════════════════════════════════════════════════════════════════
   NODE CARD
═══════════════════════════════════════════════════════════════════════════ */

/**
 * OrgNodeCard — presentational card for a single org chart node.
 *
 * @param {{ node, depth, onEdit, onDelete }} props
 */
export function OrgNodeCard({ node, depth = 0, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const { cardW, avatarSz, nameFs, roleFs } = getCfg(depth);
  const isEmpty  = !node.avatar && !node.phone;
  const cs       = node.carrier ? getCarrierStyle(node.carrier) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: cardW,
        background: '#ffffff',
        borderRadius: 18,
        border: isEmpty
          ? '2px dashed rgba(212,168,67,0.28)'
          : '2px solid rgba(212,168,67,0.35)',
        padding: '16px 11px 13px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 7,
        opacity: isEmpty ? 0.62 : 1,
        boxShadow: hovered
          ? '0 16px 40px rgba(0,0,0,0.1), 0 0 0 2px rgba(212,168,67,0.45)'
          : '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(212,168,67,0.08)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s ease',
        cursor: 'default',
      }}
    >
      {/* ── Avatar ── */}
      <div
        style={{
          width: avatarSz, height: avatarSz,
          borderRadius: '50%',
          border: hovered ? '3px solid #c49530' : '3px solid #d4a843',
          outline: '2.5px solid rgba(212,168,67,0.28)',
          outlineOffset: 3,
          overflow: 'hidden',
          background: '#f1f5f9',
          boxShadow: hovered
            ? '0 6px 20px rgba(212,168,67,0.35)'
            : '0 4px 14px rgba(0,0,0,0.10)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.25s, box-shadow 0.25s',
        }}
      >
        {node.avatar ? (
          <img
            src={node.avatar}
            alt={node.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span style={{ fontSize: avatarSz * 0.38, color: '#94a3b8' }}>☸</span>
        )}
      </div>

      {/* ── Name ── */}
      <p style={{
        margin: 0,
        fontWeight: 800,
        color: '#2c1810',
        fontSize: nameFs,
        textAlign: 'center',
        lineHeight: 1.3,
        wordBreak: 'break-word',
      }}>
        {node.name || 'មិនទាន់មានទិន្នន័យ'}
      </p>

      {/* ── Role Badge ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a5c 0%, #2c5282 100%)',
        border: '1.5px solid #d4a843',
        borderRadius: 10,
        padding: '5px 9px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: roleFs, fontWeight: 700, color: '#f0d48a', lineHeight: 1.3 }}>
          {node.role}
        </div>
        {node.roleEn && (
          <div style={{ fontSize: '0.62rem', color: '#d4a843', marginTop: 2, fontWeight: 500 }}>
            {node.roleEn}
          </div>
        )}
      </div>

      {/* ── Phone Badge ── */}
      {node.phone && (
        <div style={{
          background: '#fff',
          border: '1.5px solid rgba(212,168,67,0.48)',
          borderRadius: 20,
          padding: '3px 9px',
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.70rem', fontWeight: 600, color: '#1a3a5c',
          width: '100%', justifyContent: 'center', flexWrap: 'wrap',
        }}>
          <span>📞</span>
          <a
            href={`tel:${node.phone.replace(/\s/g, '')}`}
            style={{ color: '#1a3a5c', fontWeight: 700, textDecoration: 'none' }}
          >
            {node.phone}
          </a>
          {cs && (
            <span style={{
              background: cs.bg, color: cs.fg,
              fontSize: '0.57rem', fontWeight: 700,
              padding: '1px 5px', borderRadius: 5, flexShrink: 0,
            }}>
              {node.carrier}
            </span>
          )}
        </div>
      )}

      {/* ── Social Links ── */}
      {(node.fb || node.tg) && (
        <div style={{ display: 'flex', gap: 6 }}>
          {node.fb && (
            <a
              href={node.fb} target="_blank" rel="noopener noreferrer"
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: '#1877f2', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, textDecoration: 'none', fontWeight: 700,
                boxShadow: '0 2px 6px rgba(24,119,242,0.35)',
              }}
            >f</a>
          )}
          {node.tg && (
            <a
              href={node.tg} target="_blank" rel="noopener noreferrer"
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: '#0088cc', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0,136,204,0.35)',
              }}
            >✈</a>
          )}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', gap: 7, marginTop: 2 }}>
        <button
          onClick={() => onEdit?.(node)}
          title="Edit"
          style={{
            width: 28, height: 28, border: 'none', borderRadius: '50%', cursor: 'pointer',
            background: 'linear-gradient(135deg, #d4a843, #b88429)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            boxShadow: '0 3px 8px rgba(212,168,67,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.18s, filter 0.18s',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseOut={e  => e.currentTarget.style.transform = 'scale(1)'}
        >✏</button>
        <button
          onClick={() => onDelete?.(node)}
          title="Delete"
          style={{
            width: 28, height: 28, border: 'none', borderRadius: '50%', cursor: 'pointer',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            boxShadow: '0 3px 8px rgba(239,68,68,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.18s',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseOut={e  => e.currentTarget.style.transform = 'scale(1)'}
        >✕</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ORG CHART  — main export
═══════════════════════════════════════════════════════════════════════════ */

/**
 * OrgChart — renders a hierarchical tree with SVG connector lines.
 *
 * Line drawing algorithm (no dangling stubs):
 *
 *   For parent P with children C0…Cn (measured via getBoundingClientRect):
 *
 *     midY = P.bottom + (C0.top − P.bottom) / 2
 *
 *     1. STEM  : (P.cx,  P.bottom) → (P.cx,  midY)           vertical
 *     2. HBAR  : (C0.cx, midY)     → (Cn.cx, midY)           horizontal ← KEY FIX
 *     3. DROPS : (Ci.cx, midY)     → (Ci.cx, Ci.top)         per child
 *
 *   The HBAR uses the actual measured centre of the first and last child,
 *   so it NEVER overhangs or creates orphan stubs.
 *
 * @param {{
 *   data: object,
 *   onEdit?: (node: object) => void,
 *   onDelete?: (node: object) => void,
 *   className?: string,
 *   style?: React.CSSProperties,
 *   CardComponent?: React.ComponentType,
 * }} props
 */
export default function OrgChart({
  data,
  onEdit,
  onDelete,
  className = '',
  style = {},
  CardComponent = OrgNodeCard,
}) {
  const containerRef = useRef(null);
  const [svgState, setSvgState] = useState({ lines: [], joints: [], w: 0, h: 0 });

  /* ── Measure DOM positions and derive SVG paths ── */
  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();

    /**
     * Convert a DOM element's bounding rect to SVG-space coordinates
     * (relative to the container's top-left corner).
     */
    const measure = (el) => {
      const r = el.getBoundingClientRect();
      return {
        cx: r.left - cRect.left + r.width  / 2,   // horizontal centre
        ty: r.top  - cRect.top,                    // top edge
        by: r.bottom - cRect.top,                  // bottom edge
      };
    };

    const lines  = [];
    const joints = [];

    const visit = (node) => {
      if (!node.children?.length) return;

      /* The card div is marked with data-nid for fast lookup */
      const parentEl = container.querySelector(`[data-nid="${node.id}"]`);
      if (!parentEl) return;

      const p = measure(parentEl);

      /* Measure each child card */
      const childPos = node.children
        .map((c) => {
          const el = container.querySelector(`[data-nid="${c.id}"]`);
          return el ? { ...measure(el), id: c.id } : null;
        })
        .filter(Boolean);

      if (!childPos.length) return;

      /* Midpoint Y — halfway between parent bottom and children top */
      const midY = p.by + (childPos[0].ty - p.by) / 2;

      /* 1. Vertical STEM from parent card bottom → midY */
      lines.push({ x1: p.cx, y1: p.by, x2: p.cx, y2: midY, t: 'stem' });
      joints.push({ cx: p.cx, cy: midY });

      /* 2. Horizontal BRANCH — spans ONLY first child cx → last child cx
            This is the critical fix: no dangling stubs, no overhanging arms. */
      if (childPos.length > 1) {
        lines.push({
          x1: childPos[0].cx,
          y1: midY,
          x2: childPos[childPos.length - 1].cx,
          y2: midY,
          t: 'hbar',
        });
      }

      /* 3. Vertical DROP into each child's top-centre */
      childPos.forEach(({ cx, ty }) => {
        lines.push({ x1: cx, y1: midY, x2: cx, y2: ty, t: 'drop' });
        joints.push({ cx, cy: midY });
      });

      /* Recurse into each child */
      node.children.forEach(visit);
    };

    visit(data);

    setSvgState({
      lines,
      joints,
      w: container.scrollWidth,
      h: container.scrollHeight,
    });
  }, [data]);

  /* Run once after first paint, and again on data change */
  useEffect(() => {
    const t = setTimeout(recalculate, 80);
    return () => clearTimeout(t);
  }, [recalculate, data]);

  /* Re-run whenever the container resizes */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => setTimeout(recalculate, 20));
    ro.observe(container);
    return () => ro.disconnect();
  }, [recalculate]);

  /* ── Recursive tree renderer ── */
  const renderNode = (node, depth = 0) => (
    <div
      key={node.id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        /*
         * align-items: center is the CSS mechanism that keeps the parent card
         * naturally centred above its children — no manual coordinate math needed.
         */
        alignItems: 'center',
        padding: `0 ${H_PAD}px`,
      }}
    >
      {/* Card wrapper — data-nid lets querySelector find this element */}
      <div data-nid={node.id} style={{ position: 'relative', zIndex: 2 }}>
        <CardComponent
          node={node}
          depth={depth}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* Spacer + children row */}
      {node.children?.length > 0 && (
        <>
          {/* V_GAP pixels of vertical space — connector lines are drawn here */}
          <div style={{ height: V_GAP, flexShrink: 0 }} />

          {/* Horizontal row of child sub-trees */}
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {node.children.map((c) => renderNode(c, depth + 1))}
          </div>
        </>
      )}
    </div>
  );

  /* Unique IDs for SVG defs to avoid conflicts when multiple charts on one page */
  const uid = useRef(`oc-${Math.random().toString(36).slice(2, 7)}`);
  const GRAD_ID = `${uid.current}-grad`;
  const GLOW_ID = `${uid.current}-glow`;

  return (
    /* Scrollable outer wrapper — tree expands horizontally as needed */
    <div
      className={className}
      style={{
        overflowX: 'auto',
        overflowY: 'visible',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {/* Inner container — measured for SVG positioning */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          padding: '28px 28px 44px',
          minWidth: 'max-content',  /* expand to full tree width */
        }}
      >
        {/* ── SVG Connector Overlay ── */}
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width:  svgState.w || '100%',
            height: svgState.h || '100%',
            pointerEvents: 'none',
            zIndex: 1,
            overflow: 'visible',
          }}
        >
          <defs>
            {/* Gold gradient for connector lines */}
            <linearGradient id={GRAD_ID} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#d4a843" />
              <stop offset="100%" stopColor="#c49530" />
            </linearGradient>

            {/* Subtle glow for junction dots */}
            <filter id={GLOW_ID} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connector lines */}
          {svgState.lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1} y1={l.y1}
              x2={l.x2} y2={l.y2}
              stroke={`url(#${GRAD_ID})`}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.88}
            />
          ))}

          {/* Junction dots at T-intersections */}
          {svgState.joints.map((j, i) => (
            <g key={i}>
              {/* Ambient glow ring */}
              <circle cx={j.cx} cy={j.cy} r={8} fill="rgba(212,168,67,0.12)" />
              {/* Solid dot */}
              <circle
                cx={j.cx} cy={j.cy} r={4.5}
                fill="#d4a843"
                stroke="white"
                strokeWidth={2.5}
                filter={`url(#${GLOW_ID})`}
              />
            </g>
          ))}
        </svg>

        {/* ── Tree Content ── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {renderNode(data)}
        </div>
      </div>
    </div>
  );
}
