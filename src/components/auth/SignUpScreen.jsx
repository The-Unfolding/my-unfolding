import React, { useState } from 'react';
import AuthScreen from './AuthScreen';
import VesselLogo from '../ui/VesselLogo';
import { BRAND } from '../../constants/brand';

const SignUpScreen = ({ onSignUp, onSwitchToSignIn, isLoading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSignUp(email, password);
  };
  
  return (
    <AuthScreen>
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <VesselLogo size={40} color={BRAND.charcoal} />
          <h1 className="text-2xl font-light italic mt-4" style={{ color: BRAND.charcoal }}>My Unfolding</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.charcoal }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-3 border rounded-lg text-base"
              style={{ borderColor: BRAND.lightGray }}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.charcoal }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full p-3 border rounded-lg text-base"
              style={{ borderColor: BRAND.lightGray }}
              required
              minLength={6}
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
            {isLoading ? 'Creating account...' : 'Continue'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm" style={{ color: BRAND.warmGray }}>
          Already have an account?{' '}
          <button onClick={onSwitchToSignIn} className="font-semibold" style={{ color: BRAND.charcoal }}>
            Sign in
          </button>
        </p>
      </div>
    </AuthScreen>
  );
};

export default SignUpScreen;
