import React from 'react';
import { BRAND } from '../../constants/brand';

const NavButton = ({ active, onClick, children }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 text-sm transition-colors ${active ? 'text-stone-800' : 'text-stone-400'}`}
    style={active ? { borderBottom: `2px solid ${BRAND.chartreuse}` } : {}}
  >
    {children}
  </button>
);

export default NavButton;
