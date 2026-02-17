import React from 'react';
import { BRAND } from '../../constants/brand';

const TimeFilter = ({ value, onChange }) => (
  <div className="flex gap-1 text-xs flex-wrap">
    {[
      {key:'all',label:'All'},
      {key:'week',label:'7d'},
      {key:'month',label:'30d'},
      {key:'3months',label:'90d'},
      {key:'6months',label:'6M'},
      {key:'year',label:'1yr'}
    ].map(opt => (
      <button 
        key={opt.key} 
        onClick={() => onChange(opt.key)}
        className="px-2 py-1 rounded transition-colors"
        style={value === opt.key 
          ? { backgroundColor: BRAND.chartreuse, color: BRAND.charcoal } 
          : { color: BRAND.warmGray }
        }
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default TimeFilter;
