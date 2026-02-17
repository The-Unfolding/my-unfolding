import React from 'react';
import AuthScreen from './AuthScreen';
import VesselLogo from '../ui/VesselLogo';
import { BRAND } from '../../constants/brand';

const AccessEndedScreen = ({ onSubscribe }) => (
  <AuthScreen>
    <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
      <VesselLogo size={48} color={BRAND.charcoal} />
      
      <h1 className="text-xl font-medium mt-6 mb-3" style={{ color: BRAND.charcoal }}>
        Your coaching access has ended
      </h1>
      
      <p className="text-sm mb-6 leading-relaxed" style={{ color: BRAND.warmGray }}>
        Your journal entries are safe. Subscribe to continue using My Unfolding.
      </p>
      
      {/* Plan options */}
      <div className="border-2 rounded-2xl p-4 mb-3 relative" style={{ borderColor: BRAND.chartreuse }}>
        <div className="absolute -top-2 right-4 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
          BEST VALUE
        </div>
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="font-semibold" style={{ color: BRAND.charcoal }}>Annual</p>
            <p className="text-xs" style={{ color: BRAND.warmGray }}>$6.58/month</p>
          </div>
          <p className="text-xl font-semibold" style={{ color: BRAND.charcoal }}>$79<span className="text-sm font-normal">/yr</span></p>
        </div>
      </div>
      
      <div className="border rounded-2xl p-4 mb-6" style={{ borderColor: BRAND.lightGray }}>
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="font-semibold" style={{ color: BRAND.charcoal }}>Monthly</p>
            <p className="text-xs" style={{ color: BRAND.warmGray }}>Cancel anytime</p>
          </div>
          <p className="text-xl font-semibold" style={{ color: BRAND.charcoal }}>$9.99<span className="text-sm font-normal">/mo</span></p>
        </div>
      </div>
      
      <button 
        onClick={onSubscribe}
        className="w-full py-3 rounded-xl font-semibold"
        style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
        Subscribe to Continue
      </button>
      
      <p className="text-sm mt-4" style={{ color: BRAND.warmGray }}>
        Questions? <span className="font-medium" style={{ color: BRAND.charcoal }}>Contact your coach</span>
      </p>
    </div>
  </AuthScreen>
);

export default AccessEndedScreen;
