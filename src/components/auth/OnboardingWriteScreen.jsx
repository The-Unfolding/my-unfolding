import React from 'react';
import AuthScreen from './AuthScreen';
import { BRAND } from '../../constants/brand';

const OnboardingWriteScreen = ({ onNext }) => (
  <AuthScreen>
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="text-center mb-6">
        <span className="text-5xl">✍️</span>
      </div>
      
      <h1 className="text-xl font-medium text-center mb-4" style={{ color: BRAND.charcoal }}>
        How to write here
      </h1>
      
      <p className="text-sm text-center mb-5 leading-relaxed" style={{ color: BRAND.charcoal }}>
        Write as if you're talking to yourself. Question yourself. Let different parts of you show up on the page.
      </p>
      
      <div className="p-4 rounded-xl mb-5" style={{ backgroundColor: BRAND.chartreuse + '30' }}>
        <p className="text-sm italic" style={{ color: BRAND.charcoal }}>
          "I froze in that meeting. Why did I freeze? I think I was scared I had it wrong..."
        </p>
      </div>
      
      <p className="text-sm text-center leading-relaxed" style={{ color: BRAND.warmGray }}>
        When you write honestly—without editing or performing—patterns emerge that you couldn't see before.
      </p>
      
      <button 
        onClick={onNext}
        className="w-full py-3 rounded-xl font-semibold mt-6"
        style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
        Next
      </button>
    </div>
  </AuthScreen>
);

export default OnboardingWriteScreen;
