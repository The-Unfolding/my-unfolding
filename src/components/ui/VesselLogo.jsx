import React from 'react';
import { BRAND } from '../../constants/brand';

const VesselLogo = ({ size = 40, color = BRAND.charcoal }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 40 48">
    <path
      d="M8 4 L8 28 Q8 40 20 40 Q32 40 32 28 L32 4"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="20" cy="24" r="3" fill={color} />
    <circle cx="20" cy="24" r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
    <circle cx="20" cy="24" r="14" fill="none" stroke={color} strokeWidth="0.75" opacity="0.15" />
  </svg>
);

export default VesselLogo;
