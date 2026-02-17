import React from 'react';
import { BRAND } from '../../constants/brand';

const AuthScreen = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: BRAND.cream }}>
    <div className="w-full max-w-sm">
      {children}
    </div>
  </div>
);

export default AuthScreen;
