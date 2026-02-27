import React, { useState, useEffect, useRef } from 'react';

// Brand colors
const BRAND = {
  cream: '#f5f2eb',
  charcoal: '#2a2a28',
  warmGray: '#6b6863',
  lightGray: '#d4d0c8',
  chartreuse: '#e2ff4d'
};

// ============================================
// API HELPERS — talk to Supabase via our endpoints
// ============================================
const api = {
  async loadEntries(userId) {
    try {
      const res = await fetch(`/api/entries?userId=${userId}`);
      const data = await res.json();
      return data.entries || [];
    } catch { return []; }
  },
  async saveEntry(userId, entry) {
    try { await fetch('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, entry }) }); } catch {}
  },
  async deleteEntry(userId, entryId) {
    try { await fetch('/api/entries', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, entryId }) }); } catch {}
  },
  async loadIntentions(userId) {
    try {
      const res = await fetch(`/api/intentions?userId=${userId}`);
      const data = await res.json();
      return { intentions: data.intentions || [], completedIntentions: data.completedIntentions || [] };
    } catch { return { intentions: [], completedIntentions: [] }; }
  },
  async saveIntention(userId, intention) {
    try { await fetch('/api/intentions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, intention }) }); } catch {}
  },
  async updateIntention(userId, intentionId, isCompleted, completedAt) {
    try { await fetch('/api/intentions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, intentionId, is_completed: isCompleted, completed_at: completedAt }) }); } catch {}
  },
  async deleteIntention(userId, intentionId) {
    try { await fetch('/api/intentions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, intentionId }) }); } catch {}
  },
  async loadSettings(userId) {
    try {
      const res = await fetch(`/api/user-settings?userId=${userId}`);
      const data = await res.json();
      return data.settings || {};
    } catch { return {}; }
  },
  async saveSettings(userId, settings) {
    try { await fetch('/api/user-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...settings }) }); } catch {}
  }
};

// ============================================
// MIGRATE localStorage → Supabase (one-time)
// ============================================
async function migrateLocalData(userId) {
  const saved = localStorage.getItem('myUnfoldingJournal');
  if (!saved) return null;

  const data = JSON.parse(saved);
  const migrated = { entries: [], intentions: [], completedIntentions: [] };

  // Upload entries
  if (data.entries?.length) {
    for (const entry of data.entries) {
      await api.saveEntry(userId, entry);
    }
    migrated.entries = data.entries;
  }

  // Upload active intentions
  if (data.intentions?.length) {
    for (const i of data.intentions) {
      await api.saveIntention(userId, i);
    }
    migrated.intentions = data.intentions;
  }

  // Upload completed intentions
  if (data.completedIntentions?.length) {
    for (const i of data.completedIntentions) {
      await api.saveIntention(userId, { ...i, id: i.id });
      await api.updateIntention(userId, i.id, true, i.completedAt);
    }
    migrated.completedIntentions = data.completedIntentions;
  }

  // Upload settings
  await api.saveSettings(userId, {
    hasConsented: data.hasConsented || false,
    patterns: data.patterns || null
  });

  // Clear localStorage journal data (keep auth)
  localStorage.removeItem('myUnfoldingJournal');
  console.log('Migration complete — localStorage data moved to cloud');

  return { ...data, ...migrated };
}

// CORE Framework prompts
const CORE_PROMPTS = {
  C: {
    name: 'CURIOSITY',
    desc: "Notice what's there",
    audio: null,
    prompts: [
      "What keeps showing up in your mind lately — the thing you keep stepping over or pushing aside?",
      "We all carry many versions of ourselves — the achiever, the caretaker, the critic, the dreamer. Which one has been in charge lately? What does it want?",
      "There's a voice that keeps showing up. What does it say — and how long has it been saying it?",
      "What are you doing, thinking, or telling yourself on repeat that isn't actually working?",
      "If you got quiet enough to hear what's underneath the noise — what is your body telling you? Where do you feel it?",
      "What's going well right now that you haven't stopped to appreciate? What made that possible?",
      "What do you already know but keep pretending you don't?",
      "When do you feel most like yourself — most alive, most free? What's present in those moments that's missing right now?",
      "What skill or strength of yours deserves more attention? What would happen if you actually leaned into it?",
      "If the busiest, most controlled version of you could sit down and be honest — what's it been running from?",
    ]
  },
  O: {
    name: 'OWN',
    desc: "Claim all of you",
    audio: null,
    prompts: [
      "Where does what you're carrying right now live in your body? What happens when you stay with it instead of moving away?",
      "What emotion have you been managing instead of actually feeling?",
      "There's a side of you that you don't let people see. What is it afraid people will say?",
      "If your feelings today had a voice, what would they say? How old is this voice?",
      "Something in you is carrying weight that may not be yours. What would you put down if you could?",
      "What is your body asking for that you keep overriding?",
      "If you didn't have to be strong right now — if no one was watching and nothing depended on you — what would come out?",
      "What compliment do you have the hardest time accepting? What makes it so hard to let in?",
      "What are you proud of that you rarely say out loud? Why do you keep it quiet?",
      "When something good happens, do you let yourself fully feel it — or do you brace for what's next? What would it look like to just take it in?",
    ]
  },
  R: {
    name: 'REWIRE',
    desc: "Choose new patterns",
    audio: null,
    prompts: [
      "If you could change one thing you say to yourself on a hard day, what would the new version sound like?",
      "What's a small experiment you could try this week — a new response, a new habit, a new way of showing up?",
      "What permission have you been waiting for that you could give yourself — right now?",
      "What would you do differently tomorrow if you trusted yourself more?",
      "Think about a moment you handled something well recently. What can you learn from how you showed up?",
      "What's one belief about yourself you're ready to trade in? What do you want to believe instead?",
      "Who are you when you're at your best? What does that version of you do, say, and prioritize?",
      "What's something kind you could start saying to yourself that you'd easily say to a friend?",
      "What new habit — even a tiny one — would make you feel more like the person you want to be?",
      "When have you already shown up as the person you're becoming — even for a moment? What made it possible?",
      "What rule have you been living by that you never actually agreed to? What would you replace it with?",
      "What assumption about how life, leadership, or success works are you ready to question? What would the opposite look like?",
      "What would change if you stopped measuring yourself by someone else's definition of enough?",
      "What's a completely different way to look at the thing that's been frustrating you?",
      "What story about how the world works did you inherit — from family, culture, work — that you want to rewrite?",
    ]
  },
  E: {
    name: 'EMBODY',
    desc: "Build the life",
    audio: null,
    prompts: [
      "Write about your ideal ordinary day — not a vacation, just a Tuesday that feels right. Use all your senses. What do you see, hear, taste, feel? How does your body move through it?",
      "What are you done with? What behaviors, habits, or ways of treating yourself are you no longer willing to accept?",
      "What's one thing you'd change about your day, your space, or your routine to support the new version of you?",
      "What's one boundary that would be an act of self-respect this week?",
      "Who genuinely supports the version of you that's emerging — and do they know it?",
      "Imagine the conversation you want to be having six months from now — with yourself, a partner, a colleague. Where are you? What does your voice sound like? What do you feel in your chest?",
      "Picture yourself a year from now, living in alignment. You're walking into a room where you feel completely at home. What does it look like? What do you hear? How does your body feel standing there?",
      "What ritual, practice, or moment in your day keeps you connected to your center — are you actually doing it?",
      "What's the first sign you're slipping back into the old pattern? What will you do the moment you notice?",
      "If this new way of living became your default — what changes first?",
      "Imagine the moment you realize the old pattern is gone. Where are you when it hits you? What does freedom feel like in your body?",
      "What new habit — even a tiny one — would make your daily life feel more like yours?",
      "What does your life need to look like to protect who you really are? What needs to go — and what needs more space?",
    ]
  }
};

const AFFIRMATIONS = [
  "You're doing the work most people avoid.",
  "Noticing is the first act of transformation.",
  "This is how real change happens—one honest moment at a time.",
  "Your willingness to look is a form of leadership.",
  "Trust what's emerging.",
  "The clarity you're seeking is already inside you.",
  "You're closer than you think.",
  "Keep going.",
];

const CELEBRATION_MESSAGES = [
  "Look at you go! 🎉",
  "This is real progress.",
  "You're moving forward.",
  "Celebrating this with you!",
  "Growth in action.",
  "You did the thing!",
];

// Confetti component
const Confetti = ({ active }) => {
  if (!active) return null;
  
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1,
    color: ['#e2ff4d', '#2a2a28', '#6b6863', '#f5f2eb'][Math.floor(Math.random() * 4)]
  }));
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html { overflow-x: hidden; width: 100%; }
        body { overflow-x: hidden; width: 100%; max-width: 100vw; }
        p, span, div, h1, h2, h3, h4, li, td, th, label, input, textarea, button {
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          max-width: 100%;
        }
  
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// Vessel Logo Component — thin U in outlined circle
const VesselLogo = ({ size = 40, color = BRAND.charcoal }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18.5" fill="none" stroke={color} strokeWidth="1.5" />
    <path d="M13 11 L13 23 Q13 30, 20 30 Q27 30, 27 23 L27 11" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


// Auth Screen Components
const AuthScreen = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: BRAND.cream }}>
    <div className="w-full max-w-sm">
      {children}
    </div>
  </div>
);

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
        
        <p className="text-center mt-4 text-xs leading-relaxed" style={{ color: BRAND.warmGray }}>
          By signing up you agree to our{' '}
          <a href="https://my-unfolding.vercel.app/terms" target="_blank" rel="noopener" className="underline">Terms of Service</a>
          {' '}and{' '}
          <a href="https://my-unfolding.vercel.app/privacy" target="_blank" rel="noopener" className="underline">Privacy Policy</a>
        </p>

        <p className="text-center mt-4 text-sm" style={{ color: BRAND.warmGray }}>
          Already have an account?{' '}
          <button onClick={onSwitchToSignIn} className="font-semibold" style={{ color: BRAND.charcoal }}>
            Sign in
          </button>
        </p>
      </div>
    </AuthScreen>
  );
};

const SignInScreen = ({ onSignIn, onSwitchToSignUp, onForgotPassword, isLoading, error, resetSent }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSignIn(email, password);
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
          
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.charcoal }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full p-3 border rounded-lg text-base"
              style={{ borderColor: BRAND.lightGray }}
              required
            />
          </div>
          
          <div className="mb-6 text-right">
            <button type="button" onClick={() => onForgotPassword(email)} className="text-xs" style={{ color: BRAND.warmGray }}>
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          {resetSent && (
            <p className="text-green-600 text-sm mb-4">Reset link sent! Check your email.</p>
          )}
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm" style={{ color: BRAND.warmGray }}>
          Don't have an account?{' '}
          <button onClick={onSwitchToSignUp} className="font-semibold" style={{ color: BRAND.charcoal }}>
            Sign up
          </button>
        </p>
      </div>
    </AuthScreen>
  );
};

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
            <p className="text-sm font-medium" style={{ color: BRAND.charcoal }}>Your entries are securely stored</p>
            <p className="text-xs" style={{ color: BRAND.warmGray }}>Synced to your account so you can access them on any device.</p>
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
            <p className="text-sm font-medium" style={{ color: BRAND.charcoal }}>Works on all your devices</p>
            <p className="text-xs" style={{ color: BRAND.warmGray }}>Sign in on your phone, tablet, or computer — your journal is always there.</p>
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
        By continuing, you confirm you understand this is not professional advice.
      </p>
    </div>
  </AuthScreen>
);

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

const ResetPasswordScreen = ({ onReset, onBackToSignIn, isLoading, error, success }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    onReset(password);
  };

  if (success) {
    return (
      <AuthScreen>
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: BRAND.chartreuse }}>
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-medium mb-3" style={{ color: BRAND.charcoal }}>Password updated</h1>
          <p className="text-sm mb-6" style={{ color: BRAND.warmGray }}>You can now sign in with your new password.</p>
          <button onClick={onBackToSignIn}
            className="w-full py-3 rounded-xl font-semibold"
            style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
            Sign In
          </button>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <VesselLogo size={40} color={BRAND.charcoal} />
          <h1 className="text-xl font-medium mt-4" style={{ color: BRAND.charcoal }}>Set new password</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.charcoal }}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full p-3 border rounded-lg text-base"
              style={{ borderColor: BRAND.lightGray }}
              required
              minLength={6}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" style={{ color: BRAND.charcoal }}>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              className="w-full p-3 border rounded-lg text-base"
              style={{ borderColor: BRAND.lightGray }}
              required
              minLength={6}
            />
          </div>

          {(localError || error) && (
            <p className="text-red-500 text-sm mb-4">{localError || error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: BRAND.warmGray }}>
          <button onClick={onBackToSignIn} className="font-semibold" style={{ color: BRAND.charcoal }}>
            ← Back to sign in
          </button>
        </p>
      </div>
    </AuthScreen>
  );
};



// ============================================
// PWA INSTALL PROMPT
// ============================================
const InstallAppPrompt = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  React.useEffect(() => {
    if (isStandalone) { setIsInstalled(true); return; }
    const wasDismissed = localStorage.getItem('installPromptDismissed');
    if (wasDismissed) {
      const daysSince = (Date.now() - new Date(wasDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) setDismissed(true);
    }
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setIsInstalled(true); setShowModal(false); }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowModal(false);
    localStorage.setItem('installPromptDismissed', new Date().toISOString());
  };

  if (isInstalled || isStandalone) return null;

  const stepBox = { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid rgba(107,104,99,0.1)' };
  const stepNum = { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: BRAND.charcoal, color: BRAND.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', flexShrink: 0 };
  const stepTxt = { fontSize: '14px', color: BRAND.charcoal, margin: '0 0 2px', lineHeight: '1.4' };
  const stepHint = { fontSize: '12px', color: BRAND.warmGray, margin: 0, lineHeight: '1.4' };

  return (
    <>
      {!dismissed && !showModal && (
        <div onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '80px', right: '16px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 9998, cursor: 'pointer' }}>
          <div style={{ backgroundColor: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', whiteSpace: 'nowrap', color: BRAND.charcoal }}>Install as app</div>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: BRAND.charcoal, color: BRAND.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </div>
        </div>
      )}
      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(42,42,40,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: BRAND.cream, borderRadius: '20px 20px 12px 12px', width: '100%', maxWidth: '400px', padding: '28px 24px 20px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <svg width="36" height="44" viewBox="0 0 60 75" fill="none" style={{ marginBottom: '12px' }}><path d="M6 6 L6 48 Q6 69, 30 69 Q54 69, 54 48 L54 6" stroke={BRAND.charcoal} strokeWidth="5" strokeLinecap="round" fill="none"/><circle cx="30" cy="52" r="5" fill={BRAND.charcoal}/></svg>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', fontWeight: '400', color: BRAND.charcoal, margin: '0 0 6px' }}>Add My Unfolding to your home screen</h3>
              <p style={{ fontSize: '14px', color: BRAND.warmGray, margin: 0, lineHeight: '1.5' }}>Access your journal instantly - no browser needed</p>
            </div>
            {deferredPrompt && (<button onClick={handleNativeInstall} style={{ width: '100%', padding: '14px', backgroundColor: BRAND.charcoal, color: BRAND.cream, border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', marginBottom: '16px' }}>Install App</button>)}
            {isIOS && !deferredPrompt && (
              <div style={{ marginBottom: '16px' }}>
                <div style={stepBox}><div style={stepNum}>1</div><div><p style={stepTxt}>Tap the <strong>Share</strong> button</p><p style={stepHint}>The square icon with an arrow at the bottom of Safari</p></div></div>
                <div style={stepBox}><div style={stepNum}>2</div><div><p style={stepTxt}>Scroll down and tap <strong>"Add to Home Screen"</strong></p><p style={stepHint}>It has a + icon next to it</p></div></div>
                <div style={stepBox}><div style={stepNum}>3</div><div><p style={stepTxt}>Tap <strong>"Add"</strong> in the top right</p><p style={stepHint}>My Unfolding will appear on your home screen!</p></div></div>
              </div>
            )}
            {isAndroid && !deferredPrompt && (
              <div style={{ marginBottom: '16px' }}>
                <div style={stepBox}><div style={stepNum}>1</div><div><p style={stepTxt}>Tap the <strong>menu</strong> button</p><p style={stepHint}>Three dots in the top right of Chrome</p></div></div>
                <div style={stepBox}><div style={stepNum}>2</div><div><p style={stepTxt}>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></p></div></div>
                <div style={stepBox}><div style={stepNum}>3</div><div><p style={stepTxt}>Tap <strong>"Install"</strong></p><p style={stepHint}>My Unfolding will appear on your home screen!</p></div></div>
              </div>
            )}
            {!isIOS && !isAndroid && !deferredPrompt && (
              <div style={{ marginBottom: '16px' }}>
                <div style={stepBox}><div style={stepNum}>1</div><div><p style={stepTxt}>Look for the <strong>install icon</strong> in your address bar</p><p style={stepHint}>It looks like a monitor with a down arrow in Chrome</p></div></div>
                <div style={stepBox}><div style={stepNum}>2</div><div><p style={stepTxt}>Click <strong>"Install"</strong></p><p style={stepHint}>My Unfolding will open as its own app window!</p></div></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDismiss} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', color: BRAND.warmGray, border: '1px solid rgba(107,104,99,0.25)', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>Maybe later</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: BRAND.charcoal, color: BRAND.cream, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function MyUnfolding() {
  // Auth state
  const [authView, setAuthView] = useState('loading');
  const [user, setUser] = useState(null);
  const [accessType, setAccessType] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [pendingSignup, setPendingSignup] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Original app state
  const [hasConsented, setHasConsented] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [view, setView] = useState('write');
  const [entries, setEntries] = useState([]);
  const [intentions, setIntentions] = useState([]);
  const [completedIntentions, setCompletedIntentions] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [affirmation, setAffirmation] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [patterns, setPatterns] = useState(null);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [patternTimeFilter, setPatternTimeFilter] = useState('week');
  const [historyTimeFilter, setHistoryTimeFilter] = useState('all');
  const [newIntention, setNewIntention] = useState('');
  const [intentionTimeframe, setIntentionTimeframe] = useState('week');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [reflectOnIntentions, setReflectOnIntentions] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showAboutCore, setShowAboutCore] = useState(false);
  const [activePatternPhase, setActivePatternPhase] = useState('all');
  const [showGraph, setShowGraph] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatChart, setChatChart] = useState(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isGuidedReflection, setIsGuidedReflection] = useState(false);
  const [guidedMessages, setGuidedMessages] = useState([]);
  const [guidedInput, setGuidedInput] = useState('');
  const [isGuidedLoading, setIsGuidedLoading] = useState(false);
  const [isWrappingUp, setIsWrappingUp] = useState(false);
  const [showReflectionOffer, setShowReflectionOffer] = useState(false);
  const [savedReflectionText, setSavedReflectionText] = useState('');
  const [reflectionInsight, setReflectionInsight] = useState('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const guidedMessagesEndRef = useRef(null);

  // ============================================
  // LOAD JOURNAL DATA FROM SUPABASE
  // ============================================
  const loadJournalData = async (userId) => {
    setIsLoadingData(true);
    try {
      // Check for localStorage data to migrate first
      const localData = localStorage.getItem('myUnfoldingJournal');
      if (localData) {
        console.log('Found local data — migrating to cloud...');
        const migrated = await migrateLocalData(userId);
        if (migrated) {
          setEntries(migrated.entries || []);
          setIntentions(migrated.intentions || []);
          setCompletedIntentions(migrated.completedIntentions || []);
          setPatterns(migrated.patterns || null);
          setHasConsented(migrated.hasConsented || false);
          setIsLoadingData(false);
          return;
        }
      }

      // Load from Supabase
      const [entriesData, intentionsData, settings] = await Promise.all([
        api.loadEntries(userId),
        api.loadIntentions(userId),
        api.loadSettings(userId)
      ]);

      // Map entries from DB format to app format
      setEntries(entriesData.map(e => ({
        id: e.id,
        text: e.text,
        date: e.date,
        prompt: e.prompt,
        phase: e.phase,
        isIntentionReflection: e.is_intention_reflection,
        type: e.type
      })));
      setIntentions(intentionsData.intentions || []);
      setCompletedIntentions(intentionsData.completedIntentions || []);
      setHasConsented(settings.has_consented || false);
      setPatterns(settings.patterns || null);
    } catch (err) {
      console.error('Failed to load journal data:', err);
    }
    setIsLoadingData(false);
  };

  // Check auth on load + detect password reset tokens
  useEffect(() => {
    // Check for password reset token in URL
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setResetToken(accessToken);
        setAuthView('resetPassword');
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }
    }

    const savedAuth = localStorage.getItem('myUnfoldingAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      if (authData.user && authData.accessType && authData.accessType !== 'none') {
        setUser(authData.user);
        setAccessType(authData.accessType);
        setAuthView('app');
        loadJournalData(authData.user.id);
      } else if (authData.user && authData.accessType === 'none') {
        setUser(authData.user);
        setAuthView('choosePlan');
      } else {
        setAuthView('signin');
      }
    } else {
      setAuthView('signin');
    }
  }, []);

  // Auth handlers
  const handleSignUp = async (email, password) => {
    if (!email || !password) {
      setAuthError('Email and password required');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    setPendingSignup({ email, password });
    setAuthView('choosePlan');
  };
  
  const handleSignIn = async (email, password) => {
    setIsAuthLoading(true);
    setAuthError('');
    
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'access_ended') {
          setUser(data.user);
          setAuthView('accessEnded');
        } else {
          setAuthError(data.error || 'Invalid email or password');
        }
        setIsAuthLoading(false);
        return;
      }
      
      setUser(data.user);
      setAccessType(data.accessType);
      localStorage.setItem('myUnfoldingAuth', JSON.stringify({ user: data.user, accessType: data.accessType }));
      
      if (data.accessType === 'coaching' || data.accessType === 'paid') {
        setAuthView('app');
        loadJournalData(data.user.id);
      } else {
        setAuthView('choosePlan');
      }
    } catch (err) {
      setAuthError('Network error. Please try again.');
    }
    
    setIsAuthLoading(false);
  };
  
  const handleInviteCode = async (code) => {
    setIsValidatingCode(true);
    setCodeError('');
    
    try {
      const res = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.valid) {
        setCodeError(data.error || 'Invalid or already used code');
        setIsValidatingCode(false);
        return;
      }
      
      // Code is valid - create account with coaching access
      if (pendingSignup) {
        const signupRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: pendingSignup.email, 
            password: pendingSignup.password,
            inviteCode: code 
          })
        });
        
        const signupData = await signupRes.json();
        
        if (signupRes.ok) {
          setUser(signupData.user);
          setAccessType('coaching');
          localStorage.setItem('myUnfoldingAuth', JSON.stringify({ user: signupData.user, accessType: 'coaching' }));
          setAuthView('welcome');
        } else {
          setCodeError(signupData.error || 'Failed to apply code');
        }
      }
    } catch (err) {
      setCodeError('Network error. Please try again.');
    }
    
    setIsValidatingCode(false);
  };
  
  const handleSelectPlan = (plan) => {
    alert(`Stripe payment for ${plan} plan coming soon! For now, use an invite code.`);
  };

  const handleForgotPassword = async (email) => {
    if (!email) {
      setAuthError('Enter your email first, then click Forgot password');
      return;
    }
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setResetSent(true);
        setAuthError('');
        setTimeout(() => setResetSent(false), 5000);
      } else {
        setAuthError('Could not send reset email. Try again.');
      }
    } catch {
      setAuthError('Network error. Please try again.');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('myUnfoldingAuth');
    setUser(null);
    setAccessType(null);
    setEntries([]);
    setIntentions([]);
    setCompletedIntentions([]);
    setPatterns(null);
    setHasConsented(false);
    setAuthView('signin');
  };

  const handleResetPassword = async (newPassword) => {
    setIsAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: resetToken, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Could not update password. Try again.');
      } else {
        setResetSuccess(true);
      }
    } catch {
      setAuthError('Network error. Please try again.');
    }
    setIsAuthLoading(false);
  };
  
  const handleOnboardingComplete = () => {
    setHasConsented(true);
    if (user?.id) {
      api.saveSettings(user.id, { hasConsented: true });
    }
    setAuthView('app');
  };

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  // Auth screens rendering
  if (authView === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.cream }}>
        <VesselLogo size={48} color={BRAND.charcoal} />
      </div>
    );
  }
  
  if (authView === 'signin') {
    return (
      <SignInScreen 
        onSignIn={handleSignIn}
        onSwitchToSignUp={() => { setAuthView('signup'); setAuthError(''); setResetSent(false); }}
        onForgotPassword={handleForgotPassword}
        isLoading={isAuthLoading}
        error={authError}
        resetSent={resetSent}
      />
    );
  }
  
  if (authView === 'signup') {
    return (
      <SignUpScreen 
        onSignUp={handleSignUp}
        onSwitchToSignIn={() => { setAuthView('signin'); setAuthError(''); }}
        isLoading={isAuthLoading}
        error={authError}
      />
    );
  }
  
  if (authView === 'choosePlan') {
    return (
      <ChoosePlanScreen 
        onSelectPlan={handleSelectPlan}
        onBack={() => setAuthView('signup')}
        onInviteCode={handleInviteCode}
        isValidatingCode={isValidatingCode}
        codeError={codeError}
      />
    );
  }
  
  if (authView === 'welcome') {
    return (
      <WelcomeScreen 
        accessType={accessType}
        onContinue={() => setAuthView('onboarding1')}
      />
    );
  }
  
  if (authView === 'onboarding1') {
    return (
      <OnboardingWriteScreen onNext={() => setAuthView('onboarding2')} />
    );
  }
  
  if (authView === 'onboarding2') {
    return (
      <OnboardingBeforeScreen onComplete={handleOnboardingComplete} />
    );
  }
  
  if (authView === 'accessEnded') {
    return (
      <AccessEndedScreen onSubscribe={() => setAuthView('choosePlan')} />
    );
  }

  if (authView === 'resetPassword') {
    return (
      <ResetPasswordScreen
        onReset={handleResetPassword}
        onBackToSignIn={() => { setAuthView('signin'); setAuthError(''); setResetToken(null); setResetSuccess(false); }}
        isLoading={isAuthLoading}
        error={authError}
        success={resetSuccess}
      />
    );
  }

  // Show loading while fetching journal data
  if (isLoadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: BRAND.cream }}>
        <VesselLogo size={48} color={BRAND.charcoal} />
        <p className="text-sm animate-pulse" style={{ color: BRAND.warmGray }}>Loading your journal...</p>
      </div>
    );
  }

  // Rest of the original app code follows...
  const selectPhase = (phase) => {
    if (selectedPhase === phase) {
      setSelectedPhase(null);
      setCurrentPrompt(null);
      setReflectOnIntentions(false);
    } else {
      setSelectedPhase(phase);
      setReflectOnIntentions(false);
      const prompts = CORE_PROMPTS[phase].prompts;
      setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    }
  };

  const selectIntentionReflection = () => {
    if (reflectOnIntentions) {
      setReflectOnIntentions(false);
      setCurrentPrompt(null);
    } else {
      setSelectedPhase(null);
      setReflectOnIntentions(true);
      setCurrentPrompt("How am I showing up for my intentions? What's supporting me? What's getting in the way?");
    }
  };

  const shufflePrompt = () => {
    if (!selectedPhase) return;
    const prompts = CORE_PROMPTS[selectedPhase].prompts;
    let newPrompt;
    do {
      newPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    } while (newPrompt === currentPrompt && prompts.length > 1);
    setCurrentPrompt(newPrompt);
  };

  const saveEntry = async () => {
    if (!currentEntry.trim()) return;
    setIsSaving(true);
    const newEntry = {
      id: Date.now(),
      text: currentEntry,
      date: new Date().toISOString(),
      prompt: currentPrompt,
      phase: selectedPhase,
      isIntentionReflection: reflectOnIntentions
    };
    
    const newEntries = [newEntry, ...entries];
    setEntries(newEntries);
    setCurrentEntry('');
    setSelectedPhase(null);
    setCurrentPrompt(null);
    setReflectOnIntentions(false);

    // Save to Supabase
    if (user?.id) {
      try {
        await api.saveEntry(user.id, newEntry);
      } catch (err) {
        console.error('Save failed, entry kept locally:', err);
      }
    }
    setIsSaving(false);
    
    const milestones = [10, 25, 50, 100];
    if (milestones.includes(newEntries.length)) {
      setShowConfetti(true);
      setCelebrationMessage(`${newEntries.length} entries! You're building something real.`);
      setShowCelebration(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setTimeout(() => setShowCelebration(false), 4000);
    } else {
      setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
      setShowAffirmation(true);
      setTimeout(() => setShowAffirmation(false), 2500);
    }
  };

  // Guided Reflection (chat) functions
  const startGuidedReflection = () => {
    setIsGuidedReflection(true);
    setIsWrappingUp(false);
    
    let openingMessage = "This is prompted journaling — I'll help you dig into what's happening and what's underneath. Your words become a journal entry.\n\nWhat's present for you right now?";
    
    if (currentPrompt) {
      openingMessage = `This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nLet's explore: "${currentPrompt}"`;
    } else if (reflectOnIntentions) {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nLet's reflect on your intentions. Pick one that's been on your mind and tell me how it's going.";
    } else if (selectedPhase === 'C') {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nYou're in Curiosity mode — what's something you've been stepping over or pushing aside?";
    } else if (selectedPhase === 'O') {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nYou're in Own mode — what are you carrying right now? Where do you feel it in your body?";
    } else if (selectedPhase === 'R') {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nYou're in Rewire mode — what's a pattern or belief you're ready to trade in for something new?";
    } else if (selectedPhase === 'E') {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nYou're in Embody mode — what would your life look like if you were fully living in alignment with the new version of you?";
    }
    
    setGuidedMessages([
      { role: 'assistant', content: openingMessage }
    ]);
    setGuidedInput('');
  };

  const sendGuidedMessage = async () => {
    if (!guidedInput.trim() || isGuidedLoading) return;
    
    const userMessage = { role: 'user', content: guidedInput.trim() };
    const newMessages = [...guidedMessages, userMessage];
    setGuidedMessages(newMessages);
    setGuidedInput('');
    setIsGuidedLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: 'guided_reflection',
          phase: selectedPhase,
          isIntentions: reflectOnIntentions,
          prompt: currentPrompt
        })
      });
      
      const data = await response.json();
      if (data.response) {
        setGuidedMessages([...newMessages, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error('Guided reflection error:', error);
    }
    
    setIsGuidedLoading(false);
    setTimeout(() => guidedMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const saveGuidedReflection = () => {
    const userMessages = guidedMessages
      .filter(m => m.role === 'user')
      .map(m => m.content);
    
    if (userMessages.length === 0) return;
    
    const entryText = userMessages.join('\n\n');
    
    const newEntry = {
      id: Date.now(),
      text: entryText,
      date: new Date().toISOString(),
      type: 'chat',
      phase: selectedPhase,
      isIntentionReflection: reflectOnIntentions
    };
    
    const newEntries = [newEntry, ...entries];
    setEntries(newEntries);

    // Save to Supabase
    if (user?.id) api.saveEntry(user.id, newEntry);
    
    setSavedReflectionText(entryText);
    setShowReflectionOffer(true);
    setReflectionInsight('');
    
    setIsGuidedReflection(false);
    setIsWrappingUp(false);
    setGuidedMessages([]);
    setGuidedInput('');
  };

  const getReflectionInsight = async () => {
    setIsLoadingInsight(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'post_reflection',
          entryText: savedReflectionText,
          phase: selectedPhase
        })
      });
      
      const data = await response.json();
      if (data.insight) {
        setReflectionInsight(data.insight);
      }
    } catch (error) {
      console.error('Insight error:', error);
      setReflectionInsight("I couldn't generate an insight right now. Your entry has been saved.");
    }
    setIsLoadingInsight(false);
  };

  const dismissReflectionOffer = () => {
    setShowReflectionOffer(false);
    setSavedReflectionText('');
    setReflectionInsight('');
    setSelectedPhase(null);
    setCurrentPrompt(null);
    setReflectOnIntentions(false);
    
    setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
    setShowAffirmation(true);
    setTimeout(() => setShowAffirmation(false), 2500);
  };

  const wrapUpReflection = () => {
    setIsWrappingUp(true);
    const closingMessage = { 
      role: 'assistant', 
      content: "Thanks for sitting with this. Take a moment to read back what you wrote — sometimes that's where the insight lands." 
    };
    setGuidedMessages([...guidedMessages, closingMessage]);
  };

  const cancelGuidedReflection = () => {
    if (guidedMessages.filter(m => m.role === 'user').length > 0) {
      if (!confirm('Discard this reflection?')) return;
    }
    setIsGuidedReflection(false);
    setIsWrappingUp(false);
    setGuidedMessages([]);
    setGuidedInput('');
  };

  const deleteEntry = (id) => {
    if (confirm('Delete this entry?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
      setExpandedEntry(null);
      // Delete from Supabase
      if (user?.id) api.deleteEntry(user.id, id);
    }
  };

  const updateEntry = async (id, newText) => {
    if (!newText.trim()) return;
    setIsSaving(true);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, text: newText } : e));
    setEditingEntry(null);
    setEditText('');
    // Update in Supabase
    if (user?.id) {
      try {
        await fetch('/api/entries', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, entryId: id, text: newText })
        });
      } catch (err) {
        console.error('Failed to update entry:', err);
      }
    }
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and ALL your journal entries. This cannot be undone.')) return;
    if (!confirm('Really delete everything? Type carefully — there is no going back.')) return;
    try {
      const res = await fetch('/api/user-settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        localStorage.removeItem('myUnfoldingAuth');
        setUser(null);
        setAccessType(null);
        setEntries([]);
        setIntentions([]);
        setCompletedIntentions([]);
        setPatterns(null);
        setHasConsented(false);
        setAuthView('signin');
      } else {
        alert('Could not delete account. Please try again or contact support.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  };

  const addIntention = () => {
    if (!newIntention.trim()) return;
    const intention = {
      id: Date.now(),
      text: newIntention,
      timeframe: intentionTimeframe,
      createdAt: new Date().toISOString(),
    };
    setIntentions(prev => [intention, ...prev]);
    setNewIntention('');
    // Save to Supabase
    if (user?.id) api.saveIntention(user.id, intention);
  };

  const completeIntention = (id) => {
    const intention = intentions.find(i => i.id === id);
    if (intention) {
      const completedAt = new Date().toISOString();
      setCompletedIntentions(prev => [{
        ...intention,
        completedAt
      }, ...prev]);
      setIntentions(prev => prev.filter(i => i.id !== id));
      
      // Update in Supabase
      if (user?.id) api.updateIntention(user.id, id, true, completedAt);
      
      setShowConfetti(true);
      setCelebrationMessage(CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]);
      setShowCelebration(true);
      
      setTimeout(() => setShowConfetti(false), 3000);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  };

  const uncompleteIntention = (id) => {
    const intention = completedIntentions.find(i => i.id === id);
    if (intention) {
      const { completedAt, ...rest } = intention;
      setIntentions(prev => [rest, ...prev]);
      setCompletedIntentions(prev => prev.filter(i => i.id !== id));
      // Update in Supabase
      if (user?.id) api.updateIntention(user.id, id, false, null);
    }
  };
  
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsTranscribing(true);
    
    try {
      let mediaType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
        mediaType = 'image/heic';
      }
      
      const isHeic = file.name?.toLowerCase().endsWith('.heic') || file.name?.toLowerCase().endsWith('.heif') || mediaType === 'image/heic';
      
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (isHeic) {
            // Browser can't render HEIC — send raw, server will convert
            resolve(reader.result.split(',')[1]);
            return;
          }
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 2500;
            let w = img.width, h = img.height;
            if (w > maxSize || h > maxSize) {
              if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
              else { w = Math.round(w * maxSize / h); h = maxSize; }
            }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.95).split(',')[1]);
          };
          img.onerror = () => {
            // Fallback: send raw if Image can't load it
            resolve(reader.result.split(',')[1]);
          };
          img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const response = await fetch("/api/transcribe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mediaType: mediaType || 'image/jpeg'
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.transcription) {
        setCurrentEntry(prev => prev ? prev + "\n\n" + data.transcription : data.transcription);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Could not transcribe the image. Try a different photo or take a screenshot of your journal page.');
    }
    
    setIsTranscribing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recording is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      setCurrentEntry(prev => {
        const base = prev.replace(/\[listening...\].*$/, '').trim();
        const newText = finalTranscript + (interimTranscript ? `[listening...] ${interimTranscript}` : '');
        return base ? base + '\n\n' + newText : newText;
      });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setCurrentEntry(prev => prev.replace(/\[listening...\].*$/, '').trim());
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        currentList.push(trimmed.substring(2));
      } else {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${i}`} className="list-disc list-inside my-2 space-y-1">
              {currentList.map((item, j) => (
                <li key={j} dangerouslySetInnerHTML={{ 
                  __html: item.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') 
                }} />
              ))}
            </ul>
          );
          currentList = [];
        }
        
        if (trimmed) {
          elements.push(
            <p key={i} className="mb-2" dangerouslySetInnerHTML={{ 
              __html: trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') 
            }} />
          );
        }
      }
    });
    
    if (currentList.length > 0) {
      elements.push(
        <ul key="list-final" className="list-disc list-inside my-2 space-y-1">
          {currentList.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ 
              __html: item.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') 
            }} />
          ))}
        </ul>
      );
    }
    
    return elements;
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || entries.length === 0) return;
    
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);
    setChatChart(null);
    
    const wantsChart = /chart|graph|trend|visual|show me|over time|by month|by week|breakdown/i.test(userMessage);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          entries: entries.slice(0, 30),
          wantsChart
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.chart) {
        setChatChart(data.chart);
      }
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Try again." }]);
    }
    setIsChatLoading(false);
  };

  const deleteIntention = (id, fromCompleted = false) => {
    if (fromCompleted) {
      setCompletedIntentions(prev => prev.filter(i => i.id !== id));
    } else {
      setIntentions(prev => prev.filter(i => i.id !== id));
    }
    // Delete from Supabase
    if (user?.id) api.deleteIntention(user.id, id);
  };

  const filterEntriesByTime = (entries, filter) => {
    if (filter === 'all') return entries;
    const now = new Date();
    const cutoff = new Date();
    if (filter === 'week') cutoff.setDate(now.getDate() - 7);
    else if (filter === 'month') cutoff.setMonth(now.getMonth() - 1);
    else if (filter === '3months') cutoff.setMonth(now.getMonth() - 3);
    else if (filter === '6months') cutoff.setMonth(now.getMonth() - 6);
    else if (filter === 'year') cutoff.setFullYear(now.getFullYear() - 1);
    return entries.filter(e => new Date(e.date) >= cutoff);
  };

  const analyzePatterns = async () => {
    const filteredEntries = filterEntriesByTime(entries, patternTimeFilter);
    if (filteredEntries.length < 3) {
      alert(`Need at least 3 entries. Currently have ${filteredEntries.length}.`);
      return;
    }
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: filteredEntries.slice(0, 30),
          intentions: intentions,
          timeFilter: patternTimeFilter
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPatterns(data);
      // Save patterns to Supabase
      if (user?.id) api.saveSettings(user.id, { patterns: data });
    } catch (error) {
      console.error('Analysis error:', error);
      setPatterns({
        data: null,
        text: "Couldn't analyze right now. Try again.",
        generatedAt: new Date().toISOString(),
        entryCount: 0,
        timeFilter: patternTimeFilter
      });
    }
    setIsAnalyzing(false);
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: feedbackText })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackText('');
        setFeedbackSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Feedback error:', error);
      alert('Could not send feedback. Please try again.');
    }
  };

  const printEntries = () => {
    const filtered = filterEntriesByTime(entries, historyTimeFilter);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>My Unfolding</title>
      <style>
        body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#2a2a28}
        h1{font-style:italic;font-weight:normal;border-bottom:2px solid #e2ff4d;padding-bottom:10px}
        .entry{margin-bottom:30px;page-break-inside:avoid}
        .date{font-size:14px;font-weight:bold;margin-bottom:5px}
        .prompt{font-style:italic;color:#6b6863;font-size:14px;margin:8px 0}
        .text{line-height:1.7}
      </style></head><body>
      <h1>My Unfolding</h1>
      <p style="color:#6b6863">${filtered.length} entries</p>
      ${filtered.map(e => `
        <div class="entry">
          <div class="date">${new Date(e.date).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
          ${e.prompt ? `<div class="prompt">"${e.prompt}"</div>` : ''}
          <div class="text">${e.text}</div>
        </div>
      `).join('')}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatFullDate = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const TimeFilter = ({ value, onChange }) => (
    <div className="flex gap-1 text-xs flex-wrap">
      {[{key:'all',label:'All'},{key:'week',label:'7d'},{key:'month',label:'30d'},{key:'3months',label:'90d'},{key:'6months',label:'6M'},{key:'year',label:'1yr'}].map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          className="px-2 py-1 rounded transition-colors"
          style={value === opt.key ? { backgroundColor: BRAND.chartreuse, color: BRAND.charcoal } : { color: BRAND.warmGray }}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  const NavButton = ({ active, onClick, children }) => (
    <button onClick={onClick}
      className={`px-4 py-2 text-sm transition-colors ${active ? 'text-stone-800' : 'text-stone-400'}`}
      style={active ? { borderBottom: `2px solid ${BRAND.chartreuse}` } : {}}>
      {children}
    </button>
  );


  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.cream }}>
      <Confetti active={showConfetti} />
      
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
          <div 
            className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4"
            style={{ border: `3px solid ${BRAND.chartreuse}` }}
          >
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-xl font-medium mb-2" style={{ color: BRAND.charcoal }}>{celebrationMessage}</p>
            <p className="text-sm mb-4" style={{ color: BRAND.warmGray }}>You completed an intention!</p>
            <button 
              onClick={() => setShowCelebration(false)} 
              className="px-6 py-2 rounded-lg text-sm"
              style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}
            >
              Keep going
            </button>
          </div>
        </div>
      )}
      
      {showAboutCore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full my-8">
            <h3 className="text-xl font-light italic mb-4" style={{ color: BRAND.charcoal }}>
              About the CORE Framework
            </h3>
            <p className="text-sm mb-4" style={{ color: BRAND.warmGray }}>
              CORE is My Unfolding's guided reflection framework. It's designed to meet you where you are and help you build the life that's in alignment with the new version of you.
            </p>
            <div className="space-y-4 mb-6">
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <p className="font-medium" style={{ color: BRAND.charcoal }}>C — CURIOSITY</p>
                <p className="text-sm" style={{ color: BRAND.warmGray }}>Notice what's there. Get curious about what's running in the background — the patterns, the voices, the things you keep stepping over.</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <p className="font-medium" style={{ color: BRAND.charcoal }}>O — OWN</p>
                <p className="text-sm" style={{ color: BRAND.warmGray }}>Claim all of you. Stop managing your feelings and start feeling them. Own the full picture — the hard stuff and the good stuff.</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <p className="font-medium" style={{ color: BRAND.charcoal }}>R — REWIRE</p>
                <p className="text-sm" style={{ color: BRAND.warmGray }}>Choose new patterns. This is where you actively write new scripts — new self-talk, new beliefs, new ways of showing up.</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <p className="font-medium" style={{ color: BRAND.charcoal }}>E — EMBODY</p>
                <p className="text-sm" style={{ color: BRAND.warmGray }}>Build the life that's in alignment with the new version of you. Design the routines, boundaries, and environment that make the change stick.</p>
              </div>
            </div>
            <p className="text-sm italic mb-4" style={{ color: BRAND.warmGray }}>
              You don't have to go in order. Pick the phase that matches where you are today, or work through them as a journey. Each prompt stands on its own.
            </p>
            <button 
              onClick={() => setShowAboutCore(false)} 
              className="w-full py-2 rounded-lg"
              style={{ backgroundColor: BRAND.charcoal, color: 'white' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showAffirmation && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 text-sm"
          style={{ backgroundColor: BRAND.charcoal, color: 'white' }}>
          {affirmation}
        </div>
      )}

      {showReflectionOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            {!reflectionInsight && !isLoadingInsight ? (
              <>
                <div className="text-center mb-4">
                  <span className="text-2xl">✓</span>
                </div>
                <h3 className="text-lg font-medium mb-2 text-center" style={{ color: BRAND.charcoal }}>Entry saved</h3>
                <p className="text-sm mb-6 text-center" style={{ color: BRAND.warmGray }}>
                  Want me to reflect back what I noticed?
                </p>
                <div className="flex gap-3">
                  <button onClick={dismissReflectionOffer} className="flex-1 py-3 rounded-lg text-sm"
                    style={{ backgroundColor: BRAND.cream, color: BRAND.charcoal }}>
                    No thanks
                  </button>
                  <button onClick={getReflectionInsight}
                    className="flex-1 py-3 rounded-lg text-sm"
                    style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
                    Yes, show me
                  </button>
                </div>
              </>
            ) : isLoadingInsight ? (
              <div className="text-center py-8">
                <p className="text-sm animate-pulse" style={{ color: BRAND.warmGray }}>Reading your reflection...</p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-medium mb-3" style={{ color: BRAND.warmGray }}>What I noticed:</h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: BRAND.charcoal }}>
                  {reflectionInsight}
                </p>
                <button onClick={dismissReflectionOffer} className="w-full py-3 rounded-lg text-sm"
                  style={{ backgroundColor: BRAND.charcoal, color: 'white' }}>
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-2" style={{ color: BRAND.charcoal }}>Share Feedback</h3>
            <p className="text-xs mb-4" style={{ color: BRAND.warmGray }}>
              Your feedback goes directly to The Unfolding team and helps us improve.
            </p>
            {feedbackSubmitted ? (
              <p className="text-center py-8" style={{ color: BRAND.warmGray }}>Thank you! Your feedback has been sent. ✓</p>
            ) : (
              <>
                <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What's working? What could be better? What features would help you?"
                  className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none mb-4"
                  style={{ borderColor: BRAND.lightGray }} />
                <div className="flex gap-3">
                  <button onClick={() => setShowFeedback(false)} className="flex-1 py-2 rounded-lg"
                    style={{ backgroundColor: BRAND.cream, color: BRAND.charcoal }}>Cancel</button>
                  <button onClick={submitFeedback} disabled={!feedbackText.trim()}
                    className="flex-1 py-2 rounded-lg text-white disabled:opacity-40"
                    style={{ backgroundColor: BRAND.charcoal }}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-40" style={{ maxWidth: "100vw", overflowX: "hidden", borderColor: BRAND.lightGray }}>
        <div className="mx-auto py-4" style={{ maxWidth: "100%", padding: "16px 8px", boxSizing: "border-box" }}>
          <div className="flex items-center justify-between mb-4" style={{ maxWidth: "100%", overflow: "hidden" }}>
            <div className="flex items-center" style={{ gap: "4px" }}>
              <VesselLogo size={28} color={BRAND.charcoal} />
              <h1 className="font-light italic" style={{ fontSize: "1rem", color: BRAND.charcoal }}>My Unfolding</h1>
            </div>
            <div className="flex items-center" style={{ gap: "8px" }}>
              <button onClick={() => setShowFeedback(true)} className="text-xs py-1 rounded-full" style={{ padding: "4px 6px", fontSize: "0.65rem", backgroundColor: BRAND.cream, color: BRAND.warmGray }}>Feedback</button>
              <button onClick={() => setView('settings')} className="text-xl" style={{ color: BRAND.warmGray }}>⚙</button>
            </div>
          </div>
          <nav className="flex" style={{ flexWrap: "wrap", gap: "4px", maxWidth: "100%" }}>
            <NavButton active={view === 'write'} onClick={() => setView('write')}>Write</NavButton>
            <NavButton active={view === 'history'} onClick={() => setView('history')}>History</NavButton>
            <NavButton active={view === 'patterns'} onClick={() => setView('patterns')}>Patterns</NavButton>
            <NavButton active={view === 'intentions'} onClick={() => setView('intentions')}>Intentions</NavButton>
            <NavButton active={view === 'chat'} onClick={() => setView('chat')}>Ask my journal</NavButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto py-8" style={{ maxWidth: "100%", padding: "32px 8px", boxSizing: "border-box", overflowX: "hidden" }}>
        
        {view === 'write' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <div className="mb-6 p-5 bg-white rounded-xl border" style={{ borderColor: BRAND.lightGray }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs" style={{ color: BRAND.warmGray }}>
                  Write freely, choose a lens and do one each day in sequence, or choose a prompt where you're focused.
                </p>
                <button 
                  onClick={() => setShowAboutCore(true)}
                  className="text-xs underline shrink-0 ml-2"
                  style={{ color: BRAND.warmGray }}
                >
                  What's CORE?
                </button>
              </div>
              <div className="flex gap-2 mb-4">
                {['C', 'O', 'R', 'E'].map(phase => (
                  <button key={phase} onClick={() => selectPhase(phase)}
                    className="flex-1 px-2 py-3 rounded-lg text-sm transition-all"
                    style={{ backgroundColor: selectedPhase === phase ? BRAND.chartreuse : BRAND.cream }}>
                    <span className="text-xl font-light block" style={{ color: selectedPhase === phase ? BRAND.charcoal : BRAND.lightGray }}>{phase}</span>
                    <span className="text-xs">{CORE_PROMPTS[phase].name}</span>
                  </button>
                ))}
                <button onClick={selectIntentionReflection}
                  className="px-3 py-3 rounded-lg text-sm transition-all"
                  style={{ backgroundColor: reflectOnIntentions ? BRAND.chartreuse : BRAND.cream, border: `1px dashed ${BRAND.lightGray}` }}>
                  <span className="text-xl block">✦</span>
                  <span className="text-xs">Intentions</span>
                </button>
              </div>
              
              {(selectedPhase || reflectOnIntentions) && currentPrompt && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm italic" style={{ color: BRAND.charcoal }}>{currentPrompt}</p>
                    {selectedPhase && (
                      <button onClick={shufflePrompt} className="text-xs shrink-0" style={{ color: BRAND.warmGray }}>↻</button>
                    )}
                  </div>
                  {reflectOnIntentions && intentions.length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: BRAND.lightGray }}>
                      <p className="text-xs mb-2" style={{ color: BRAND.warmGray }}>Your intentions:</p>
                      {intentions.slice(0, 3).map(i => (
                        <p key={i.id} className="text-xs mb-1" style={{ color: BRAND.charcoal }}>• {i.text}</p>
                      ))}
                    </div>
                  )}
                  {selectedPhase && <p className="text-xs mt-3 opacity-50" style={{ color: BRAND.warmGray }}>🎧 Audio coming soon</p>}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: BRAND.lightGray }}>
              {!isGuidedReflection ? (
                <>
                  <textarea value={currentEntry} onChange={(e) => setCurrentEntry(e.target.value)}
                    placeholder="What's true right now?"
                    className="w-full h-72 p-6 resize-none focus:outline-none text-lg leading-relaxed"
                    style={{ color: BRAND.charcoal }} />
                  <div className="flex items-center justify-between px-6 py-4 border-t"
                    style={{ backgroundColor: BRAND.cream, borderColor: BRAND.lightGray }}>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isTranscribing || isRecording}
                        className="text-xs px-3 py-1 rounded hover:opacity-70 disabled:opacity-50"
                        style={{ backgroundColor: BRAND.lightGray, color: BRAND.charcoal }}
                      >
                        {isTranscribing ? 'Processing...' : 'Upload'}
                      </button>
                      {voiceSupported && (
                        <button 
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isTranscribing}
                          className="text-xs px-3 py-1 rounded hover:opacity-70 disabled:opacity-50 flex items-center gap-1"
                          style={{ 
                            backgroundColor: isRecording ? '#ef4444' : BRAND.lightGray, 
                            color: isRecording ? 'white' : BRAND.charcoal 
                          }}
                        >
                          {isRecording && (
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          )}
                          {isRecording ? 'Stop' : '🎤 Voice'}
                        </button>
                      )}
                      <button 
                        onClick={startGuidedReflection}
                        disabled={isTranscribing || isRecording}
                        className="text-xs px-3 py-1 rounded hover:opacity-70 disabled:opacity-50"
                        style={{ backgroundColor: BRAND.cream, color: BRAND.charcoal, border: `1px solid ${BRAND.lightGray}` }}
                      >
                        💬 Guided reflection
                      </button>
                      <span className="text-xs" style={{ color: BRAND.warmGray }}>
                        {currentEntry.trim() ? `${currentEntry.split(/\s+/).filter(Boolean).length} words` : ''}
                      </span>
                    </div>
                    <button onClick={saveEntry} disabled={!currentEntry.trim() || isSaving}
                      className="px-5 py-2 rounded-lg text-sm disabled:opacity-30"
                      style={{ backgroundColor: currentEntry.trim() && !isSaving ? BRAND.charcoal : BRAND.lightGray, color: 'white' }}>
                      {isSaving ? 'Saving...' : 'Save entry'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col" style={{ minHeight: '400px' }}>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: '350px' }}>
                    {guidedMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                          style={{ 
                            backgroundColor: msg.role === 'user' ? BRAND.chartreuse : BRAND.cream,
                            color: BRAND.charcoal,
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                            borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px'
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isGuidedLoading && (
                      <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: BRAND.cream }}>
                          <span className="animate-pulse">...</span>
                        </div>
                      </div>
                    )}
                    <div ref={guidedMessagesEndRef} />
                  </div>
                  <div className="border-t p-4" style={{ borderColor: BRAND.lightGray }}>
                    {!isWrappingUp ? (
                      <>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={guidedInput}
                            onChange={(e) => setGuidedInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendGuidedMessage()}
                            placeholder="Keep reflecting..."
                            className="flex-1 px-4 py-3 rounded-full border focus:outline-none text-sm"
                            style={{ borderColor: BRAND.lightGray }}
                          />
                          <button
                            onClick={sendGuidedMessage}
                            disabled={!guidedInput.trim() || isGuidedLoading}
                            className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30"
                            style={{ backgroundColor: BRAND.chartreuse }}
                          >
                            ↑
                          </button>
                        </div>
                        {guidedMessages.filter(m => m.role === 'user').length >= 3 && (
                          <button
                            onClick={wrapUpReflection}
                            className="w-full text-center text-xs py-2 mb-3 rounded-lg"
                            style={{ backgroundColor: BRAND.cream, color: BRAND.warmGray }}
                          >
                            ✓ Click when you're ready to wrap up
                          </button>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={cancelGuidedReflection}
                            className="px-4 py-2 rounded-lg text-xs"
                            style={{ backgroundColor: 'white', border: `1px solid ${BRAND.lightGray}`, color: BRAND.warmGray }}
                          >
                            ← Back to write
                          </button>
                          <button
                            onClick={saveGuidedReflection}
                            disabled={guidedMessages.filter(m => m.role === 'user').length === 0}
                            className="px-4 py-2 rounded-lg text-xs disabled:opacity-30"
                            style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}
                          >
                            💾 Save to journal
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={saveGuidedReflection}
                        className="w-full py-3 rounded-lg text-sm"
                        style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}
                      >
                        💾 Save to journal
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <TimeFilter value={historyTimeFilter} onChange={setHistoryTimeFilter} />
              <button onClick={printEntries} className="text-xs px-3 py-1 rounded"
                style={{ backgroundColor: BRAND.lightGray }}>🖨 Print</button>
            </div>
            {filterEntriesByTime(entries, historyTimeFilter).length === 0 ? (
              <div className="text-center py-16">
                <p className="italic" style={{ color: BRAND.warmGray }}>No entries for this period.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filterEntriesByTime(entries, historyTimeFilter).map(entry => (
                  <div key={entry.id} className="bg-white rounded-xl border"
                    style={{ borderColor: expandedEntry === entry.id ? BRAND.chartreuse : BRAND.lightGray }}>
                    <div onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                      className="p-5 cursor-pointer">
                      <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                        <span className="text-sm font-medium" style={{ color: BRAND.charcoal }}>{formatFullDate(entry.date)}</span>
                        <div className="flex gap-1 flex-wrap">
                          {entry.type === 'chat' && <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.cream }}>💬 Chat</span>}
                          {entry.phase && <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.cream }}>{entry.phase}</span>}
                          {entry.isIntentionReflection && <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.cream }}>Intentions</span>}
                        </div>
                      </div>
                      {entry.prompt && <p className="text-sm italic mb-2" style={{ color: BRAND.warmGray }}>"{entry.prompt}"</p>}
                      {entry.type === 'chat' ? (
                        <div 
                          className={`rounded-lg p-3 overflow-y-auto ${expandedEntry === entry.id ? '' : 'max-h-24'}`}
                          style={{ backgroundColor: '#fafaf8', border: `1px solid ${BRAND.lightGray}` }}
                        >
                          {entry.text.split('\n\n').map((paragraph, i) => (
                            <p key={i} className="text-sm leading-relaxed mb-2 last:mb-0" style={{ color: BRAND.charcoal }}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className={`leading-relaxed ${expandedEntry === entry.id ? '' : 'line-clamp-3'}`} style={{ color: BRAND.charcoal }}>{entry.text}</p>
                      )}
                    </div>
                    {expandedEntry === entry.id && editingEntry === entry.id ? (
                      <div className="px-5 pb-4">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-3 border rounded-lg text-sm leading-relaxed resize-none"
                          style={{ borderColor: BRAND.lightGray, color: BRAND.charcoal, minHeight: '150px' }}
                        />
                        <div className="flex justify-between mt-2">
                          <button onClick={() => { setEditingEntry(null); setEditText(''); }}
                            className="text-xs px-3 py-1 rounded" style={{ color: BRAND.warmGray }}>
                            Cancel
                          </button>
                          <button onClick={() => updateEntry(entry.id, editText)}
                            disabled={isSaving}
                            className="text-xs px-3 py-1 rounded font-medium"
                            style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}>
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : expandedEntry === entry.id && (
                      <div className="px-5 pb-4 flex justify-between">
                        <div className="flex gap-4">
                          <button onClick={() => {
                            const subject = encodeURIComponent(`My Unfolding — ${formatFullDate(entry.date)}`);
                            const body = encodeURIComponent(`${entry.prompt ? `"${entry.prompt}"\n\n` : ''}${entry.text}\n\n— Written ${formatFullDate(entry.date)}`);
                            window.open(`mailto:?subject=${subject}&body=${body}`);
                          }} className="text-xs" style={{ color: BRAND.warmGray }}>✉ Email</button>
                          <button onClick={() => { setEditingEntry(entry.id); setEditText(entry.text); }}
                            className="text-xs" style={{ color: BRAND.warmGray }}>✏️ Edit</button>
                        </div>
                        <button onClick={() => deleteEntry(entry.id)} className="text-xs text-red-500">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'patterns' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-1 mx-auto mb-6" style={{ backgroundColor: BRAND.chartreuse }} />
              <h2 className="text-xl font-light italic mb-2" style={{ color: BRAND.charcoal }}>Pausing to see</h2>
              <p className="text-sm" style={{ color: BRAND.warmGray }}>Your patterns through the CORE lens</p>
            </div>
            
            {entries.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowGraph(!showGraph)}
                  className="text-xs mb-3 flex items-center gap-1"
                  style={{ color: BRAND.warmGray }}
                >
                  {showGraph ? '▼' : '▶'} Your writing activity
                </button>
                {showGraph && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: BRAND.lightGray }}>
                    <div className="flex items-end gap-1 h-20 mb-2">
                      {(() => {
                        const weeks = [];
                        for (let i = 7; i >= 0; i--) {
                          const weekStart = new Date();
                          weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
                          weekStart.setHours(0, 0, 0, 0);
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekEnd.getDate() + 7);
                          const count = entries.filter(e => {
                            const d = new Date(e.date);
                            return d >= weekStart && d < weekEnd;
                          }).length;
                          weeks.push(count);
                        }
                        const maxCount = Math.max(...weeks, 1);
                        return weeks.map((count, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            <div
                              className="w-full rounded-t transition-all"
                              style={{
                                height: `${(count / maxCount) * 100}%`,
                                minHeight: count > 0 ? '4px' : '0',
                                backgroundColor: count > 0 ? BRAND.chartreuse : BRAND.lightGray
                              }}
                            />
                          </div>
                        ));
                      })()}
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: BRAND.warmGray }}>
                      <span>8 weeks ago</span>
                      <span>This week</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <TimeFilter value={patternTimeFilter} onChange={setPatternTimeFilter} />
              <div className="flex gap-2">
                {patterns?.data && patterns.timeFilter === patternTimeFilter && (
                  <>
                  <button
                    onClick={() => {
                      const o = patterns.data.overview || {};
                      const subject = encodeURIComponent('My Unfolding — Pattern Analysis');
                      const body = encodeURIComponent(
                        `Pattern Analysis — ${patterns.entryCount} entries\n\n` +
                        `WHAT I KEEP SAYING I WANT:\n${o.wanting || ''}\n\n` +
                        `WHERE I'M WINNING:\n${o.winning || ''}\n\n` +
                        `WHAT'S GETTING IN THE WAY:\n${o.blocking || ''}\n\n` +
                        `WHAT I MIGHT BE READY FOR:\n${o.ready || ''}\n\n` +
                        (o.question ? `A QUESTION TO SIT WITH:\n${o.question}\n\n` : '') +
                        `— Generated ${formatDate(patterns.generatedAt)}`
                      );
                      window.open(`mailto:?subject=${subject}&body=${body}`);
                    }}
                    className="px-4 py-2 rounded-lg text-sm border"
                    style={{ borderColor: BRAND.lightGray, color: BRAND.charcoal }}
                  >
                    ✉️ Email
                  </button>
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      const content = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>My Patterns - ${new Date().toLocaleDateString()}</title>
                          <style>
                            body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #2a2a28; line-height: 1.6; }
                            h1 { font-size: 24px; margin-bottom: 5px; }
                            h2 { font-size: 18px; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #d4d0c8; padding-bottom: 5px; }
                            h3 { font-size: 14px; font-weight: 600; margin-bottom: 5px; margin-top: 15px; }
                            p { margin: 0 0 10px 0; font-size: 14px; }
                            .meta { color: #6b6863; font-size: 12px; margin-bottom: 30px; }
                            .question { font-style: italic; font-size: 16px; margin-top: 20px; padding: 15px; background: #f5f2eb; border-radius: 8px; }
                            .section { margin-bottom: 25px; }
                            .phase { background: #f5f2eb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                            .phase-title { font-size: 16px; font-weight: 500; margin-bottom: 15px; }
                            .underneath { font-style: italic; color: #6b6863; margin-top: 10px; padding-top: 10px; border-top: 1px solid #d4d0c8; }
                          </style>
                        </head>
                        <body>
                          <h1>My Unfolding - Pattern Analysis</h1>
                          <p class="meta">${patterns.entryCount} entries analyzed • Generated ${new Date(patterns.generatedAt).toLocaleDateString()}</p>
                          
                          <h2>Overview</h2>
                          <div class="section">
                            <h3>What you keep saying you want</h3>
                            <p>${patterns.data.overview?.wanting || ''}</p>
                            
                            <h3>Where you're winning</h3>
                            <p>${patterns.data.overview?.winning || ''}</p>
                            
                            <h3>What's getting in the way</h3>
                            <p>${patterns.data.overview?.blocking || ''}</p>
                            
                            <h3>What you might be ready for</h3>
                            <p>${patterns.data.overview?.ready || ''}</p>
                            
                            ${patterns.data.overview?.question ? `<div class="question">${patterns.data.overview.question}</div>` : ''}
                          </div>
                          
                          ${['C', 'O', 'R', 'E'].map(phase => patterns.data[phase] ? `
                            <div class="phase">
                              <div class="phase-title">${phase} - ${phase === 'C' ? 'Curiosity' : phase === 'O' ? 'Own' : phase === 'R' ? 'Rewire' : 'Embody'}</div>
                              <p><strong>${patterns.data[phase].headline || ''}</strong></p>
                              <p>${patterns.data[phase].insight || ''}</p>
                              ${patterns.data[phase].underneath ? `<p class="underneath">${patterns.data[phase].underneath}</p>` : ''}
                            </div>
                          ` : '').join('')}
                          
                          ${patterns.data.intentions ? `
                            <h2>Intentions</h2>
                            <p>${patterns.data.intentions}</p>
                          ` : ''}
                        </body>
                        </html>
                      `;
                      printWindow.document.write(content);
                      printWindow.document.close();
                      printWindow.print();
                    }}
                    className="px-4 py-2 rounded-lg text-sm border"
                    style={{ borderColor: BRAND.lightGray, color: BRAND.charcoal }}
                  >
                    🖨️ Print
                  </button>
                  </>
                )}
                <button
                  onClick={analyzePatterns}
                  disabled={isAnalyzing || filterEntriesByTime(entries, patternTimeFilter).length < 3}
                  className="px-4 py-2 rounded-lg text-sm disabled:opacity-30"
                  style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}
                >
                  {isAnalyzing ? '⏳ Analyzing...' : patterns?.data ? '↻ Analyze my entries' : '✨ Analyze my entries'}
                </button>
              </div>
            </div>

            {isAnalyzing ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                  style={{ borderColor: BRAND.chartreuse, borderTopColor: 'transparent' }} />
                <p className="italic" style={{ color: BRAND.warmGray }}>Reading your entries...</p>
              </div>
            ) : patterns?.data && patterns.timeFilter === patternTimeFilter ? (
              <div>
                <p className="text-xs mb-4 text-center" style={{ color: BRAND.warmGray }}>
                  {patterns.entryCount} entries • {formatDate(patterns.generatedAt)}
                </p>
                
                <div className="flex gap-2 mb-2 justify-center">
                  <button
                    onClick={() => setActivePatternPhase('all')}
                    className="px-4 py-2 rounded-lg text-sm transition-all"
                    style={{ 
                      backgroundColor: activePatternPhase === 'all' ? BRAND.charcoal : 'white',
                      color: activePatternPhase === 'all' ? 'white' : BRAND.charcoal,
                      border: `1px solid ${BRAND.lightGray}`
                    }}
                  >
                    Overview
                  </button>
                  {['C', 'O', 'R', 'E'].map(phase => (
                    <button
                      key={phase}
                      onClick={() => setActivePatternPhase(phase)}
                      className="w-10 h-10 rounded-lg text-lg font-light transition-all"
                      style={{ 
                        backgroundColor: activePatternPhase === phase ? BRAND.chartreuse : 'white',
                        color: BRAND.charcoal,
                        border: `1px solid ${activePatternPhase === phase ? BRAND.chartreuse : BRAND.lightGray}`
                      }}
                    >
                      {phase}
                    </button>
                  ))}
                </div>
                <div className="text-center mb-6">
                  <button 
                    onClick={() => setShowAboutCore(true)}
                    className="text-xs underline"
                    style={{ color: BRAND.warmGray }}
                  >
                    What's CORE?
                  </button>
                </div>
                
                {activePatternPhase === 'all' && patterns.data.overview && (
                  <div className="bg-white rounded-xl border p-6 mb-4" style={{ borderColor: BRAND.lightGray }}>
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-semibold mb-2" style={{ color: BRAND.charcoal }}>What you keep saying you want</h3>
                        <p className="text-sm leading-relaxed" style={{ color: BRAND.charcoal }}>{patterns.data.overview.wanting}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2" style={{ color: BRAND.charcoal }}>Where I see you winning</h3>
                        <p className="text-sm leading-relaxed" style={{ color: BRAND.charcoal }}>{patterns.data.overview.winning}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2" style={{ color: BRAND.charcoal }}>What I notice getting in your way</h3>
                        <p className="text-sm leading-relaxed" style={{ color: BRAND.charcoal }}>{patterns.data.overview.blocking}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2" style={{ color: BRAND.charcoal }}>What you might be ready for</h3>
                        <p className="text-sm leading-relaxed" style={{ color: BRAND.charcoal }}>{patterns.data.overview.ready}</p>
                      </div>
                    </div>
                    
                    {patterns.data.overview.question && (
                      <div className="mt-6 pt-5 border-t" style={{ borderColor: BRAND.lightGray }}>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: BRAND.warmGray }}>A question to sit with</p>
                        <p className="text-lg italic" style={{ color: BRAND.charcoal }}>{patterns.data.overview.question}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activePatternPhase !== 'all' && (
                  <div className="bg-white rounded-xl border p-5 mb-4" style={{ borderColor: BRAND.lightGray }}>
                    <p className="text-lg font-medium mb-4 leading-snug" style={{ color: BRAND.charcoal }}>
                      {patterns.data[activePatternPhase]?.headline}
                    </p>
                    
                    <div className="mb-4">
                      <span className="text-xs font-medium uppercase tracking-wide px-2 py-1 rounded inline-block mb-2" 
                         style={{ backgroundColor: BRAND.cream, color: BRAND.charcoal }}>
                        Here's what I notice
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: BRAND.charcoal }}>
                        {patterns.data[activePatternPhase]?.insight}
                      </p>
                    </div>
                    
                    {patterns.data[activePatternPhase]?.underneath && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: BRAND.charcoal }}>
                          What might be underneath
                        </p>
                        <p className="text-sm italic leading-relaxed" style={{ color: BRAND.charcoal }}>
                          {patterns.data[activePatternPhase].underneath}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {activePatternPhase !== 'all' && patterns.data.overview?.question && (
                  <div className="p-5 rounded-xl text-center mb-4" style={{ backgroundColor: BRAND.charcoal }}>
                    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#a8a5a0' }}>
                      A question to sit with
                    </p>
                    <p className="text-lg italic" style={{ color: 'white' }}>
                      {patterns.data.overview.question}
                    </p>
                  </div>
                )}
                
                {patterns.data.intentions && intentions.length > 0 && (
                  <div className="p-5 rounded-xl mb-4 border-2" style={{ backgroundColor: 'white', borderColor: BRAND.chartreuse }}>
                    <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: BRAND.charcoal }}>
                      Your intentions
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: BRAND.charcoal }}>
                      {patterns.data.intentions}
                    </p>
                  </div>
                )}
                
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                  <p className="text-xs" style={{ color: BRAND.warmGray }}>
                    These patterns are AI-generated to help you reflect. Not therapy or medical advice.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="mb-6" style={{ color: BRAND.warmGray }}>
                  {filterEntriesByTime(entries, patternTimeFilter).length < 3
                    ? `Need 3+ entries (${filterEntriesByTime(entries, patternTimeFilter).length}/3)`
                    : 'Ready to see what\'s emerging?'}
                </p>
                <button onClick={analyzePatterns} disabled={filterEntriesByTime(entries, patternTimeFilter).length < 3}
                  className="px-6 py-3 rounded-lg text-white disabled:opacity-30"
                  style={{ backgroundColor: BRAND.charcoal }}>Analyze</button>
              </div>
            )}
          </div>
        )}

        {view === 'chat' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-1 mx-auto mb-6" style={{ backgroundColor: BRAND.chartreuse }} />
              <h2 className="text-xl font-light italic mb-2" style={{ color: BRAND.charcoal }}>Ask my journal</h2>
              <p className="text-sm" style={{ color: BRAND.warmGray }}>Search your entries, find patterns, see trends</p>
            </div>
            
            {entries.length < 3 ? (
              <div className="text-center py-12">
                <p style={{ color: BRAND.warmGray }}>Write a few more entries first.</p>
                <p className="text-sm mt-2" style={{ color: BRAND.lightGray }}>This works best with 3+ entries.</p>
              </div>
            ) : (
              <>
                {chatMessages.length === 0 && !chatChart && (
                  <div className="mb-6">
                    <p className="text-xs mb-3" style={{ color: BRAND.warmGray }}>Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "When have I felt most confident?",
                        "Remind me of a win",
                        "What am I avoiding?",
                        "Show me entries by month",
                        "Chart my CORE phases"
                      ].map(q => (
                        <button
                          key={q}
                          onClick={() => { setChatInput(q); }}
                          className="text-xs px-3 py-2 rounded-lg border hover:border-current transition-colors"
                          style={{ borderColor: BRAND.lightGray, color: BRAND.charcoal }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {chatChart && (
                  <div className="bg-white rounded-xl border p-5 mb-4" style={{ borderColor: BRAND.lightGray }}>
                    <h3 className="font-medium mb-1" style={{ color: BRAND.charcoal }}>{chatChart.title}</h3>
                    <p className="text-sm mb-4" style={{ color: BRAND.warmGray }}>{chatChart.description}</p>
                    <div className="flex items-end gap-2 h-32 mb-2">
                      {chatChart.data?.map((item, i) => {
                        const maxVal = Math.max(...chatChart.data.map(d => d.value), 1);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-xs mb-1" style={{ color: BRAND.charcoal }}>{item.value}</span>
                            <div
                              className="w-full rounded-t transition-all"
                              style={{
                                height: `${(item.value / maxVal) * 100}%`,
                                minHeight: item.value > 0 ? '4px' : '2px',
                                backgroundColor: item.value > 0 ? BRAND.chartreuse : BRAND.lightGray
                              }}
                            />
                            <span className="text-xs mt-2 text-center" style={{ color: BRAND.warmGray, fontSize: '10px' }}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 mb-4" style={{ minHeight: chatMessages.length > 0 ? '100px' : '0' }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`p-4 rounded-xl ${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}
                      style={{ 
                        backgroundColor: msg.role === 'user' ? BRAND.cream : 'white',
                        border: msg.role === 'assistant' ? `1px solid ${BRAND.lightGray}` : 'none'
                      }}>
                      {msg.role === 'user' ? (
                        <p className="text-sm leading-relaxed" style={{ color: BRAND.charcoal }}>{msg.content}</p>
                      ) : (
                        <div className="text-sm leading-relaxed" style={{ color: BRAND.charcoal }}>
                          {renderMarkdown(msg.content)}
                          <button onClick={() => {
                            const subject = encodeURIComponent('My Unfolding — Journal Insight');
                            const body = encodeURIComponent(msg.content);
                            window.open(`mailto:?subject=${subject}&body=${body}`);
                          }} className="text-xs mt-2 block" style={{ color: BRAND.warmGray }}>✉ Email this</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="mr-8 p-4 rounded-xl border" style={{ borderColor: BRAND.lightGray }}>
                      <p className="text-sm italic" style={{ color: BRAND.warmGray }}>Searching your entries...</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask anything about your journal..."
                    className="flex-1 px-4 py-3 rounded-lg border focus:outline-none"
                    style={{ borderColor: BRAND.lightGray, color: BRAND.charcoal }}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="px-5 py-3 rounded-lg text-white disabled:opacity-30"
                    style={{ backgroundColor: BRAND.charcoal }}
                  >
                    Ask
                  </button>
                </div>
                
                {(chatMessages.length > 0 || chatChart) && (
                  <button
                    onClick={() => { setChatMessages([]); setChatChart(null); }}
                    className="text-xs mt-4"
                    style={{ color: BRAND.warmGray }}
                  >
                    Clear chat
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {view === 'intentions' && (
          <div>
            <div className="flex items-start justify-between mb-8">
              <div className="text-center flex-1">
                <div className="w-16 h-1 mx-auto mb-6" style={{ backgroundColor: BRAND.chartreuse }} />
                <h2 className="text-xl font-light italic mb-2" style={{ color: BRAND.charcoal }}>Intentions</h2>
                <p className="text-sm" style={{ color: BRAND.warmGray }}>What you're moving toward</p>
              </div>
              <button 
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html><head><title>My Intentions</title>
                    <style>
                      body{font-family:Georgia,serif;max-width:600px;margin:40px auto;padding:20px;color:#2a2a28}
                      h1{font-style:italic;font-weight:normal;border-bottom:2px solid #e2ff4d;padding-bottom:10px}
                      .intention{margin-bottom:20px;padding:15px;background:#f5f2eb;border-radius:8px}
                      .timeframe{font-size:12px;color:#6b6863;margin-top:5px}
                      .completed{opacity:0.6;text-decoration:line-through}
                    </style></head><body>
                    <h1>My Intentions</h1>
                    <h3>Active</h3>
                    ${intentions.length > 0 ? intentions.map(i => `
                      <div class="intention">
                        <p>${i.text}</p>
                        <p class="timeframe">${i.timeframe} • Set ${formatDate(i.createdAt)}</p>
                      </div>
                    `).join('') : '<p style="color:#6b6863">No active intentions</p>'}
                    <h3 style="margin-top:30px">Completed</h3>
                    ${completedIntentions.length > 0 ? completedIntentions.map(i => `
                      <div class="intention completed">
                        <p>${i.text}</p>
                        <p class="timeframe">Completed ${formatDate(i.completedAt)}</p>
                      </div>
                    `).join('') : '<p style="color:#6b6863">No completed intentions yet</p>'}
                    </body></html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }}
                className="text-xs px-3 py-1 rounded"
                style={{ backgroundColor: BRAND.lightGray }}
              >
                🖨 Print
              </button>
            </div>

            <div className="p-4 rounded-lg mb-6 bg-white border" style={{ borderColor: BRAND.lightGray }}>
              <p className="text-xs font-medium mb-2" style={{ color: BRAND.charcoal }}>Writing effective intentions</p>
              <p className="text-xs mb-3" style={{ color: BRAND.warmGray }}>
                Research shows intentions work best when they're specific and include <em>when</em>, <em>what</em>, and <em>why</em>.
              </p>
              <div className="text-xs" style={{ color: BRAND.warmGray }}>
                <p><strong>Instead of:</strong> "Be more present"</p>
                <p><strong>Try:</strong> "When I sit down for dinner, I will put my phone in another room because being fully present with my family matters to me."</p>
              </div>
              <p className="text-xs mt-3 italic" style={{ color: BRAND.lightGray }}>
                Format: "When [situation], I will [action] because [value/reason]."
              </p>
            </div>

            <div className="bg-white rounded-xl border p-5 mb-6" style={{ borderColor: BRAND.lightGray }}>
              <textarea value={newIntention} onChange={(e) => setNewIntention(e.target.value)}
                placeholder="When [situation], I will [action] because [value/reason]..."
                className="w-full h-24 resize-none focus:outline-none mb-3" style={{ color: BRAND.charcoal }} />
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2">
                  {['week', 'month', 'quarter'].map(tf => (
                    <button key={tf} onClick={() => setIntentionTimeframe(tf)}
                      className="text-xs px-3 py-1 rounded"
                      style={{ backgroundColor: intentionTimeframe === tf ? BRAND.chartreuse : BRAND.cream }}>{tf}</button>
                  ))}
                </div>
                <button onClick={addIntention} disabled={!newIntention.trim()}
                  className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-30"
                  style={{ backgroundColor: BRAND.charcoal }}>Add</button>
              </div>
            </div>

            {intentions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3" style={{ color: BRAND.charcoal }}>Active</h3>
                <div className="space-y-3">
                  {intentions.map(i => (
                    <div key={i.id} className="bg-white rounded-xl border p-4 flex items-start gap-3"
                      style={{ borderColor: BRAND.lightGray }}>
                      <button onClick={() => completeIntention(i.id)}
                        className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5"
                        style={{ borderColor: BRAND.lightGray }} />
                      <div className="flex-1">
                        <p style={{ color: BRAND.charcoal }}>{i.text}</p>
                        <p className="text-xs mt-1" style={{ color: BRAND.warmGray }}>{i.timeframe} • Set {formatDate(i.createdAt)}</p>
                      </div>
                      <button onClick={() => deleteIntention(i.id)} className="text-xs" style={{ color: BRAND.warmGray }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedIntentions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: BRAND.warmGray }}>Completed</h3>
                <div className="space-y-2">
                  {completedIntentions.map(i => (
                    <div key={i.id} className="bg-white rounded-lg border p-3 flex items-start gap-3 opacity-60"
                      style={{ borderColor: BRAND.lightGray }}>
                      <button 
                        onClick={() => uncompleteIntention(i.id)}
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
                        style={{ backgroundColor: BRAND.chartreuse }}
                      >✓</button>
                      <div className="flex-1">
                        <p className="line-through text-sm" style={{ color: BRAND.charcoal }}>{i.text}</p>
                        <p className="text-xs mt-1" style={{ color: BRAND.warmGray }}>Completed {formatDate(i.completedAt)}</p>
                      </div>
                      <button onClick={() => deleteIntention(i.id, true)} className="text-xs" style={{ color: BRAND.warmGray }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {intentions.length === 0 && completedIntentions.length === 0 && (
              <p className="text-center py-8 italic" style={{ color: BRAND.warmGray }}>No intentions yet.</p>
            )}
          </div>
        )}

        {view === 'settings' && (
          <div>
            <button onClick={() => setView('write')} className="text-sm mb-6" style={{ color: BRAND.warmGray }}>← Back</button>
            <h2 className="text-xl font-light italic mb-6" style={{ color: BRAND.charcoal }}>Settings</h2>
            
            <div className="bg-white rounded-xl border p-5 mb-6" style={{ borderColor: BRAND.lightGray }}>
              <h3 className="font-medium mb-3" style={{ color: BRAND.charcoal }}>Account</h3>
              <p className="text-sm mb-4" style={{ color: BRAND.warmGray }}>
                Signed in as {user?.email}
              </p>
              <div className="flex gap-3">
                <button onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: BRAND.cream, color: BRAND.charcoal, border: `1px solid ${BRAND.lightGray}` }}>
                  Sign out
                </button>
                <button onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-lg text-sm text-red-500"
                  style={{ border: '1px solid #fecaca' }}>
                  Delete account
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5 mb-6" style={{ borderColor: BRAND.lightGray }}>
              <h3 className="font-medium mb-3" style={{ color: BRAND.charcoal }}>📅 Schedule Your Reflection</h3>
              <p className="text-sm mb-4" style={{ color: BRAND.warmGray }}>
                Transformation happens when you show up consistently. Block time on your calendar for daily reflection.
              </p>
              <button 
                onClick={() => {
                  const title = encodeURIComponent("My Unfolding - Daily Reflection");
                  const details = encodeURIComponent("Time to reflect. Open My Unfolding and write what's true.");
                  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&recur=RRULE:FREQ=DAILY`;
                  window.open(url, '_blank');
                }}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}
              >
                Add daily reminder to Google Calendar
              </button>
            </div>
            
            <div className="bg-white rounded-xl border p-5 mb-6" style={{ borderColor: BRAND.lightGray }}>
              <h3 className="font-medium mb-3" style={{ color: BRAND.charcoal }}>🔒 Your Privacy</h3>
              <ul className="text-sm space-y-2" style={{ color: BRAND.warmGray }}>
                <li>• <strong>Synced to your account:</strong> Entries stored securely in the cloud</li>
                <li>• <strong>Works everywhere:</strong> Sign in on any device to access your journal</li>
                <li>• <strong>No time limit:</strong> Data stays until you delete it—journal for years</li>
                <li>• <strong>Pattern analysis:</strong> Uses Anthropic's Claude AI—entries sent temporarily, not stored</li>
                <li>• <strong>Not therapy:</strong> This is for reflection only—use your judgment about AI insights</li>
                <li>• <strong>Backups:</strong> Use Print to save copies</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border p-5 mb-6" style={{ borderColor: BRAND.lightGray }}>
              <h3 className="font-medium mb-3" style={{ color: BRAND.charcoal }}>Your Data</h3>
              <p className="text-sm mb-4" style={{ color: BRAND.warmGray }}>
                {entries.length} entries • {intentions.length} active • {completedIntentions.length} completed
              </p>
              <button onClick={printEntries} className="text-sm px-4 py-2 rounded-lg"
                style={{ backgroundColor: BRAND.cream }}>🖨 Print backup</button>
            </div>

            <div className="bg-white rounded-xl border p-5" style={{ borderColor: BRAND.lightGray }}>
              <h3 className="font-medium mb-3 text-red-600">Danger Zone</h3>
              <button onClick={() => {
                if (confirm('Delete ALL data? This cannot be undone.')) {
                  if (confirm('Really delete everything?')) {
                    setEntries([]);
                    setIntentions([]);
                    setCompletedIntentions([]);
                    setPatterns(null);
                    // TODO: Add API call to delete all data from Supabase
                  }
                }
              }} className="text-sm text-red-500">Delete all data</button>
            </div>
          </div>
        )}
      <InstallAppPrompt />
      </main>

      <footer className="mx-auto py-8 text-center" style={{ maxWidth: "100%", padding: "32px 8px", boxSizing: "border-box" }}>
        <p className="text-xs" style={{ color: BRAND.lightGray }}>The Unfolding © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
