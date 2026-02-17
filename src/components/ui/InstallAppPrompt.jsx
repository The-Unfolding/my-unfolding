import React from 'react';
import { BRAND } from '../../constants/brand';

const InstallAppPrompt = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  React.useEffect(() => {
    if (isStandalone) { 
      setIsInstalled(true); 
      return; 
    }
    
    const wasDismissed = localStorage.getItem('installPromptDismissed');
    if (wasDismissed) {
      const daysSince = (Date.now() - new Date(wasDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) setDismissed(true);
    }
    
    const handler = (e) => { 
      e.preventDefault(); 
      setDeferredPrompt(e); 
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { 
        setIsInstalled(true); 
        setShowModal(false); 
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowModal(false);
    localStorage.setItem('installPromptDismissed', new Date().toISOString());
  };

  if (isInstalled || isStandalone) return null;

  const stepBox = { 
    display: 'flex', 
    gap: '12px', 
    alignItems: 'flex-start', 
    padding: '12px 0', 
    borderBottom: '1px solid rgba(107,104,99,0.1)' 
  };
  
  const stepNum = { 
    width: '28px', 
    height: '28px', 
    borderRadius: '50%', 
    backgroundColor: BRAND.charcoal, 
    color: BRAND.cream, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '13px', 
    fontWeight: '600', 
    flexShrink: 0 
  };
  
  const stepTxt = { 
    fontSize: '14px', 
    color: BRAND.charcoal, 
    margin: '0 0 2px', 
    lineHeight: '1.4' 
  };
  
  const stepHint = { 
    fontSize: '12px', 
    color: BRAND.warmGray, 
    margin: 0, 
    lineHeight: '1.4' 
  };

  return (
    <>
      {!dismissed && !showModal && (
        <div 
          onClick={() => setShowModal(true)} 
          style={{ 
            position: 'fixed', 
            bottom: '80px', 
            right: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            zIndex: 9998, 
            cursor: 'pointer' 
          }}
        >
          <div style={{ 
            backgroundColor: 'white', 
            padding: '6px 12px', 
            borderRadius: '8px', 
            fontSize: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
            whiteSpace: 'nowrap', 
            color: BRAND.charcoal 
          }}>
            Install as app
          </div>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%', 
            backgroundColor: BRAND.charcoal, 
            color: BRAND.cream, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)' 
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </div>
        </div>
      )}
      
      {showModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(42,42,40,0.5)', 
            backdropFilter: 'blur(4px)', 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'center', 
            zIndex: 9999, 
            padding: '16px' 
          }}
        >
          <div style={{ 
            backgroundColor: BRAND.cream, 
            borderRadius: '20px 20px 12px 12px', 
            width: '100%', 
            maxWidth: '400px', 
            padding: '28px 24px 20px', 
            maxHeight: '85vh', 
            overflowY: 'auto' 
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <svg width="36" height="44" viewBox="0 0 60 75" fill="none" style={{ marginBottom: '12px' }}>
                <path d="M6 6 L6 48 Q6 69, 30 69 Q54 69, 54 48 L54 6" stroke={BRAND.charcoal} strokeWidth="5" strokeLinecap="round" fill="none"/>
                <circle cx="30" cy="52" r="5" fill={BRAND.charcoal}/>
              </svg>
              <h3 style={{ 
                fontFamily: "'Cormorant Garamond', Georgia, serif", 
                fontSize: '22px', 
                fontWeight: '400', 
                color: BRAND.charcoal, 
                margin: '0 0 6px' 
              }}>
                Add My Unfolding to your home screen
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: BRAND.warmGray, 
                margin: 0, 
                lineHeight: '1.5' 
              }}>
                Access your journal instantly - no browser needed
              </p>
            </div>
            
            {deferredPrompt && (
              <button 
                onClick={handleNativeInstall} 
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  backgroundColor: BRAND.charcoal, 
                  color: BRAND.cream, 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  cursor: 'pointer', 
                  marginBottom: '16px' 
                }}
              >
                Install App
              </button>
            )}
            
            {isIOS && !deferredPrompt && (
              <div style={{ marginBottom: '16px' }}>
                <div style={stepBox}>
                  <div style={stepNum}>1</div>
                  <div>
                    <p style={stepTxt}>Tap the <strong>Share</strong> button</p>
                    <p style={stepHint}>The square icon with an arrow at the bottom of Safari</p>
                  </div>
                </div>
                <div style={stepBox}>
                  <div style={stepNum}>2</div>
                  <div>
                    <p style={stepTxt}>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                    <p style={stepHint}>It has a + icon next to it</p>
                  </div>
                </div>
                <div style={stepBox}>
                  <div style={stepNum}>3</div>
                  <div>
                    <p style={stepTxt}>Tap <strong>"Add"</strong> in the top right</p>
                    <p style={stepHint}>My Unfolding will appear on your home screen!</p>
                  </div>
                </div>
              </div>
            )}
            
            {isAndroid && !deferredPrompt && (
              <div style={{ marginBottom: '16px' }}>
                <div style={stepBox}>
                  <div style={stepNum}>1</div>
                  <div>
                    <p style={stepTxt}>Tap the <strong>menu</strong> button</p>
                    <p style={stepHint}>Three dots in the top right of Chrome</p>
                  </div>
                </div>
                <div style={stepBox}>
                  <div style={stepNum}>2</div>
                  <div>
                    <p style={stepTxt}>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></p>
                  </div>
                </div>
                <div style={stepBox}>
                  <div style={stepNum}>3</div>
                  <div>
                    <p style={stepTxt}>Tap <strong>"Install"</strong></p>
                    <p style={stepHint}>My Unfolding will appear on your home screen!</p>
                  </div>
                </div>
              </div>
            )}
            
            {!isIOS && !isAndroid && !deferredPrompt && (
              <div style={{ marginBottom: '16px' }}>
                <div style={stepBox}>
                  <div style={stepNum}>1</div>
                  <div>
                    <p style={stepTxt}>Look for the <strong>install icon</strong> in your address bar</p>
                    <p style={stepHint}>It looks like a monitor with a down arrow in Chrome</p>
                  </div>
                </div>
                <div style={stepBox}>
                  <div style={stepNum}>2</div>
                  <div>
                    <p style={stepTxt}>Click <strong>"Install"</strong></p>
                    <p style={stepHint}>My Unfolding will open as its own app window!</p>
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleDismiss} 
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  backgroundColor: 'transparent', 
                  color: BRAND.warmGray, 
                  border: '1px solid rgba(107,104,99,0.25)', 
                  borderRadius: '10px', 
                  fontSize: '14px', 
                  cursor: 'pointer' 
                }}
              >
                Maybe later
              </button>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  backgroundColor: BRAND.charcoal, 
                  color: BRAND.cream, 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  cursor: 'pointer' 
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppPrompt;
