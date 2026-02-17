import React, { useState } from 'react';
import AuthScreen from './AuthScreen';
import VesselLogo from '../ui/VesselLogo';
import { BRAND } from '../../constants/brand';

const ChoosePlanScreen = ({ onSelectPlan, onBack, onInviteCode, isValidatingCode, codeError }) => {
  const [selected, setSelected] = useState('annual');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  
  const handleApplyCode = () => {
    if (inviteCode.trim()) {
      onInviteCode(inviteCode.trim());
    }
  };
  
  return (
    <AuthScreen>
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <button 
          onClick={onBack}
          className="text-sm mb-4"
          style={{ color: BRAND.warmGray }}>
          ← Back
        </button>
        
        <div className="text-center mb-6">
          <VesselLogo size={32} color={BRAND.charcoal} />
          <h1 className="text-xl font-medium mt-3" style={{ color: BRAND.charcoal }}>Choose your plan</h1>
          <p className="text-sm mt-1" style={{ color: BRAND.warmGray }}>Full access to everything. Cancel anytime.</p>
        </div>
        
        {/* Invite Code Section */}
        <div className="border rounded-xl p-4 mb-5" style={{ borderColor: BRAND.lightGray }}>
          {!showInviteCode ? (
            <button 
              onClick={() => setShowInviteCode(true)}
              className="w-full flex items-center gap-2 text-sm"
              style={{ color: BRAND.charcoal }}>
              <span>🎟️</span>
              <span>Have an invite code?</span>
              <span className="ml-auto" style={{ color: BRAND.warmGray }}>→</span>
            </button>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span>🎟️</span>
                <span className="text-sm font-medium" style={{ color: BRAND.charcoal }}>Enter your invite code</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. SARAH2024"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="flex-1 p-3 border rounded-lg text-sm uppercase"
                  style={{ borderColor: codeError ? '#e74c3c' : BRAND.lightGray, backgroundColor: BRAND.cream }}
                />
                <button 
                  onClick={handleApplyCode}
                  disabled={isValidatingCode}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: BRAND.charcoal }}>
                  {isValidatingCode ? '...' : 'Apply'}
                </button>
              </div>
              {codeError && (
                <p className="text-xs text-red-500 mt-2">{codeError}</p>
              )}
              <button 
                onClick={() => { setShowInviteCode(false); setInviteCode(''); }}
                className="text-xs mt-2"
                style={{ color: BRAND.warmGray }}>
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {/* Annual Plan */}
        <div 
          onClick={() => setSelected('annual')}
          className="border-2 rounded-2xl p-5 mb-3 cursor-pointer relative"
          style={{ 
            backgroundColor: selected === 'annual' ? 'white' : BRAND.cream,
            borderColor: selected === 'annual' ? BRAND.chartreuse : BRAND.lightGray 
          }}>
          {selected === 'annual' && (
            <div className="absolute -top-2 right-4 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
              BEST VALUE
            </div>
          )}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold" style={{ color: BRAND.charcoal }}>Annual</p>
              <p className="text-sm" style={{ color: BRAND.warmGray }}>$6.58/month, billed yearly</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold" style={{ color: BRAND.charcoal }}>$79</p>
              <p className="text-xs" style={{ color: BRAND.warmGray }}>/year</p>
            </div>
          </div>
        </div>
        
        {/* Monthly Plan */}
        <div 
          onClick={() => setSelected('monthly')}
          className="border-2 rounded-2xl p-5 mb-6 cursor-pointer"
          style={{ 
            backgroundColor: selected === 'monthly' ? 'white' : BRAND.cream,
            borderColor: selected === 'monthly' ? BRAND.chartreuse : BRAND.lightGray 
          }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold" style={{ color: BRAND.charcoal }}>Monthly</p>
              <p className="text-sm" style={{ color: BRAND.warmGray }}>Flexible, cancel anytime</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold" style={{ color: BRAND.charcoal }}>$9.99</p>
              <p className="text-xs" style={{ color: BRAND.warmGray }}>/month</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => onSelectPlan(selected)}
          className="w-full py-3 rounded-xl font-semibold"
          style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
          Continue to Payment
        </button>
        
        <div className="mt-5">
          <p className="text-xs font-medium mb-2" style={{ color: BRAND.charcoal }}>What's included:</p>
          {['Unlimited journaling with CORE prompts', 'Guided reflection with AI', 'Pattern recognition', 'Ask your journal questions', 'Voice & image input'].map((item, i) => (
            <p key={i} className="text-xs mb-1" style={{ color: BRAND.warmGray }}>✓ {item}</p>
          ))}
        </div>
      </div>
    </AuthScreen>
  );
};

export default ChoosePlanScreen;
