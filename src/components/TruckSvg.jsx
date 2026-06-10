/**
 * Clean SVG truck icons for shipment cards and capacity visualization.
 */

// Semi-truck with trailer (for cards)
export function TruckSemiSvg({ width = 72, height = 40 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 72 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trailer body */}
      <rect x="1" y="5" width="40" height="24" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
      {/* Cab */}
      <path d="M41 12h12c3 0 6 2 7 6v11H41V12z" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Cab window */}
      <path d="M46 14h5c2 0 4 2 5 4.5H46V14z" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" strokeLinejoin="round" />
      {/* Wheels */}
      <circle cx="14" cy="33" r="5" fill="#4b5563" />
      <circle cx="14" cy="33" r="2.5" fill="#9ca3af" />
      <circle cx="30" cy="33" r="5" fill="#4b5563" />
      <circle cx="30" cy="33" r="2.5" fill="#9ca3af" />
      <circle cx="54" cy="33" r="5" fill="#4b5563" />
      <circle cx="54" cy="33" r="2.5" fill="#9ca3af" />
      {/* Bumper */}
      <rect x="61" y="24" width="4" height="5" rx="1" fill="#d1d5db" />
      {/* Headlight */}
      <rect x="61" y="20" width="3" height="3" rx="1" fill="#fbbf24" opacity="0.7" />
    </svg>
  );
}

// Box truck (for cards)
export function TruckBoxSvg({ width = 72, height = 40 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 72 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Box body */}
      <rect x="1" y="5" width="44" height="24" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
      {/* Box door line */}
      <line x1="23" y1="7" x2="23" y2="27" stroke="#9ca3af" strokeWidth="0.8" />
      {/* Cab */}
      <path d="M45 12h12c3 0 5 2 6 5.5v11.5H45V12z" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Cab window */}
      <path d="M48 14h6c2 0 4 1.5 5 4H48V14z" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" strokeLinejoin="round" />
      {/* Wheels */}
      <circle cx="16" cy="33" r="5" fill="#4b5563" />
      <circle cx="16" cy="33" r="2.5" fill="#9ca3af" />
      <circle cx="56" cy="33" r="5" fill="#4b5563" />
      <circle cx="56" cy="33" r="2.5" fill="#9ca3af" />
      {/* Bumper */}
      <rect x="63" y="22" width="4" height="5" rx="1" fill="#d1d5db" />
      {/* Headlight */}
      <rect x="63" y="18" width="3" height="3" rx="1" fill="#fbbf24" opacity="0.7" />
    </svg>
  );
}

// Flatbed truck (for cards)
export function TruckFlatbedSvg({ width = 72, height = 40 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 72 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Flatbed platform */}
      <rect x="1" y="22" width="42" height="5" rx="1" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5" />
      {/* Cargo crates */}
      <rect x="4" y="8" width="16" height="14" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      <rect x="22" y="12" width="12" height="10" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
      {/* Cab */}
      <path d="M43 12h12c3 0 5 2 6 5.5v11.5H43V12z" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Cab window */}
      <path d="M46 14h6c2 0 4 1.5 5 4H46V14z" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" strokeLinejoin="round" />
      {/* Wheels */}
      <circle cx="14" cy="33" r="5" fill="#4b5563" />
      <circle cx="14" cy="33" r="2.5" fill="#9ca3af" />
      <circle cx="34" cy="33" r="5" fill="#4b5563" />
      <circle cx="34" cy="33" r="2.5" fill="#9ca3af" />
      <circle cx="54" cy="33" r="5" fill="#4b5563" />
      <circle cx="54" cy="33" r="2.5" fill="#9ca3af" />
    </svg>
  );
}

/**
 * Large capacity visualization — SVG truck with fill overlay
 */
export function CapacityTruck({ percent = 65, accentColor = '#4f46e5' }) {
  const clampPct = Math.max(0, Math.min(100, percent));
  // Trailer spans from x=2 to x=230 (width 228)
  const fillWidth = (clampPct / 100) * 228;

  return (
    <div className="capacity-svg-wrap">
      <svg viewBox="0 0 360 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        {/* Ground line */}
        <line x1="0" y1="105" x2="360" y2="105" stroke="#e5e7eb" strokeWidth="1" />

        {/* Trailer body outline */}
        <rect x="2" y="16" width="228" height="76" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />

        {/* Fill area (clipped to trailer) */}
        <defs>
          <clipPath id="trailerClip">
            <rect x="2" y="16" width="228" height="76" rx="4" />
          </clipPath>
        </defs>
        <rect x="2" y="16" width={fillWidth} height="76" rx="4" fill={accentColor} opacity="0.7" clipPath="url(#trailerClip)" />

        {/* Fill percentage text */}
        {clampPct > 15 && (
          <text x={2 + fillWidth / 2} y="60" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="Inter, sans-serif">
            {clampPct}%
          </text>
        )}
        {clampPct <= 15 && clampPct > 0 && (
          <text x={fillWidth + 10} y="60" textAnchor="start" fill={accentColor} fontSize="18" fontWeight="800" fontFamily="Inter, sans-serif">
            {clampPct}%
          </text>
        )}

        {/* Trailer horizontal lines (detail) */}
        <line x1="2" y1="40" x2="230" y2="40" stroke="#d1d5db" strokeWidth="0.5" opacity="0.5" />
        <line x1="2" y1="68" x2="230" y2="68" stroke="#d1d5db" strokeWidth="0.5" opacity="0.5" />

        {/* Trailer door lines */}
        <line x1="4" y1="18" x2="4" y2="90" stroke="#d1d5db" strokeWidth="0.8" opacity="0.4" />

        {/* Mud flap */}
        <rect x="220" y="92" width="10" height="13" rx="1" fill="#9ca3af" opacity="0.3" />

        {/* Connection bar */}
        <rect x="230" y="76" width="18" height="6" rx="1" fill="#9ca3af" opacity="0.25" />

        {/* Cab body */}
        <path d="M248 30 L248 92 L330 92 L330 52 L310 30 Z" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Windshield */}
        <path d="M310 32 L310 54 L328 54 L310 32z" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" strokeLinejoin="round" />

        {/* Side window */}
        <rect x="252" y="34" width="54" height="18" rx="3" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" />

        {/* Door line */}
        <line x1="280" y1="34" x2="280" y2="92" stroke="#d1d5db" strokeWidth="0.8" />
        {/* Door handle */}
        <rect x="282" y="62" width="8" height="3" rx="1" fill="#9ca3af" opacity="0.5" />

        {/* Fuel tank */}
        <rect x="256" y="72" width="20" height="14" rx="3" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.8" />

        {/* Exhaust pipe */}
        <rect x="332" y="20" width="4" height="34" rx="2" fill="#d1d5db" />
        <rect x="330" y="16" width="8" height="6" rx="2" fill="#d1d5db" />

        {/* Headlight */}
        <rect x="328" y="58" width="4" height="8" rx="1.5" fill="#fbbf24" opacity="0.6" />

        {/* Bumper */}
        <rect x="330" y="82" width="6" height="10" rx="2" fill="#d1d5db" />

        {/* Steps */}
        <rect x="332" y="72" width="8" height="3" rx="1" fill="#d1d5db" opacity="0.5" />
        <rect x="332" y="78" width="8" height="3" rx="1" fill="#d1d5db" opacity="0.5" />

        {/* Wheels — rear trailer (tandem) */}
        <circle cx="200" cy="100" r="12" fill="#374151" />
        <circle cx="200" cy="100" r="8" fill="#6b7280" />
        <circle cx="200" cy="100" r="3" fill="#9ca3af" />
        <circle cx="218" cy="100" r="12" fill="#374151" />
        <circle cx="218" cy="100" r="8" fill="#6b7280" />
        <circle cx="218" cy="100" r="3" fill="#9ca3af" />

        {/* Wheels — front trailer */}
        <circle cx="30" cy="100" r="12" fill="#374151" />
        <circle cx="30" cy="100" r="8" fill="#6b7280" />
        <circle cx="30" cy="100" r="3" fill="#9ca3af" />

        {/* Wheels — cab (rear) */}
        <circle cx="296" cy="100" r="12" fill="#374151" />
        <circle cx="296" cy="100" r="8" fill="#6b7280" />
        <circle cx="296" cy="100" r="3" fill="#9ca3af" />

        {/* Wheels — cab (front) */}
        <circle cx="322" cy="100" r="12" fill="#374151" />
        <circle cx="322" cy="100" r="8" fill="#6b7280" />
        <circle cx="322" cy="100" r="3" fill="#9ca3af" />
      </svg>
    </div>
  );
}
