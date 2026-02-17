import React from 'react';
import AuthScreen from './AuthScreen';
import { BRAND } from '../../constants/brand';

const WelcomeScreen = ({ accessType, onContinue }) => (
  <AuthScreen>
    <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: BRAND.chartreuse }}>
        <span className="text-4xl">✓</span>
      </div>
      
      <h1 className="text-2xl font-light mb-3" style={{ color: BRAND.charcoal }}>
        Welcome to My Unfolding
      </h1>
      
      <p className="font-medium" style={{ color: BRAND.charcoal }}>
        {accessType === 'coaching' ? 'Access activated ✓' : 'Your subscription is active'}
      </p>
      
      {accessType !== 'coaching' && (
        <p className="text-sm mt-2" style={{ color: BRAND.warmGray }}>
          A receipt has been sent to your email
        </p>
      )}
      
      <button 
        onClick={onContinue}
        className="w-full py-3 rounded-xl font-semibold mt-8"
        style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
        Continue →
      </button>
    </div>
  </AuthScreen>
);

export default WelcomeScreen;
