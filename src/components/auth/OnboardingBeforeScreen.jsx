import React from 'react';
import AuthScreen from './AuthScreen';
import { BRAND } from '../../constants/brand';

const OnboardingBeforeScreen = ({ onComplete }) => (
  <AuthScreen>
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <h1 className="text-xl font-medium text-center mb-6" style={{ color: BRAND.charcoal }}>
        Before you begin
      </h1>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <span className="text-xl">🔒</span>
          <div>
            <p className="text-sm font-medium" style={{ color: BRAND.charcoal }}>Your entries stay on your device</p>
            <p className="text-xs" style={{ color: BRAND.warmGray }}>Nothing is stored on our servers. Use Print in History to back up.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="text-xl">🔍</span>
          <div>
            <p className="text-sm font-medium" style={{ color: BRAND.charcoal }}>Pattern analysis uses AI</p>
            <p className="text-xs" style={{ color: BRAND.warmGray }}>When you use it, entries are sent to Claude for processing, then discarded.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="text-xl">📱</span>
          <div>
            <p className="text-sm font-medium" style={{ color: BRAND.charcoal }}>One device at a time</p>
            <p className="text-xs" style={{ color: BRAND.warmGray }}>Your entries live in this browser only.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="text-xl">💙</span>
          <div>
            <p className="text-sm font-medium" style={{ color: BRAND.charcoal }}>This is for reflection, not advice</p>
            <p className="text-xs" style={{ color: BRAND.warmGray }}>Not therapy, medical, financial, or legal counsel. Trust your own judgment.</p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onComplete}
        className="w-full py-3 rounded-xl font-semibold mt-6"
        style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
        I understand — let's go
      </button>
      
      <p className="text-xs text-center mt-3 leading-relaxed" style={{ color: BRAND.warmGray }}>
        By continuing, you confirm you understand your data is stored locally and this is not professional advice.
      </p>
    </div>
  </AuthScreen>
);

export default OnboardingBeforeScreen;
