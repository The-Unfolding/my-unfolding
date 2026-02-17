import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// Import constants
import { BRAND } from './constants/brand';
import { CORE_PROMPTS } from './constants/prompts';
import { AFFIRMATIONS, CELEBRATION_MESSAGES } from './constants/messages';

// Import hooks
import { useJournal } from './hooks/useJournal';

// Import utilities
import { formatDate, formatFullDate, filterEntriesByTime, printEntries } from './utils/dateUtils';
import { renderMarkdown } from './utils/markdownUtils';
import { loadJournalData, saveJournalData } from './utils/storageUtils';

// Import UI components
import { Confetti, VesselLogo, TimeFilter, NavButton, InstallAppPrompt } from './components/ui';

// Import auth components
import {
  SignUpScreen,
  SignInScreen,
  ChoosePlanScreen,
  WelcomeScreen,
  OnboardingWriteScreen,
  OnboardingBeforeScreen,
  AccessEndedScreen
} from './components/auth';

// Import journal view components
import {
  WriteView,
  HistoryView,
  PatternsView,
  ChatView,
  IntentionsView,
  SettingsView
} from './components/journal';

export default function MyUnfolding() {
  // Auth state
  const [authView, setAuthView] = useState('loading'); // loading, signin, signup, choosePlan, payment, welcome, onboarding1, onboarding2, app, accessEnded
  const [user, setUser] = useState(null);
  const [accessType, setAccessType] = useState(null); // 'coaching', 'paid', 'none'
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [pendingSignup, setPendingSignup] = useState(null); // Store signup data while validating code
  
  // App-level UI state
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [view, setView] = useState('write');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Journal state (managed by useJournal hook)
  const journal = useJournal();

  // Check auth on load
  useEffect(() => {
    const savedAuth = localStorage.getItem('myUnfoldingAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      if (authData.user && authData.accessType && authData.accessType !== 'none') {
        setUser(authData.user);
        setAccessType(authData.accessType);
        setAuthView('app');
      } else if (authData.user && authData.accessType === 'none') {
        // User exists but no access - show choose plan
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
    // Just store credentials and go to choose plan
    // Account is created when they enter invite code or pay
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
    // For now, just show a message - Stripe integration comes later
    alert(`Stripe payment for ${plan} plan coming soon! For now, use an invite code.`);
  };
  
  const handleOnboardingComplete = () => {
    journal.setHasConsented(true);
    setAuthView('app');
  };

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
        onSwitchToSignUp={() => { setAuthView('signup'); setAuthError(''); }}
        isLoading={isAuthLoading}
        error={authError}
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

  // Rest of the original app code follows...
  const selectPhase = (phase) => {
    if (journal.selectedPhase === phase) {
      journal.setSelectedPhase(null);
      journal.setCurrentPrompt(null);
      journal.setReflectOnIntentions(false);
    } else {
      journal.setSelectedPhase(phase);
      journal.setReflectOnIntentions(false);
      const prompts = CORE_PROMPTS[phase].prompts;
      journal.setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    }
  };

  const selectIntentionReflection = () => {
    if (journal.reflectOnIntentions) {
      journal.setReflectOnIntentions(false);
      journal.setCurrentPrompt(null);
    } else {
      journal.setSelectedPhase(null);
      journal.setReflectOnIntentions(true);
      journal.setCurrentPrompt("How am I showing up for my intentions? What's supporting me? What's getting in the way?");
    }
  };

  const shufflePrompt = () => {
    if (!journal.selectedPhase) return;
    const prompts = CORE_PROMPTS[journal.selectedPhase].prompts;
    let newPrompt;
    do {
      newPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    } while (newPrompt === journal.currentPrompt && prompts.length > 1);
    journal.setCurrentPrompt(newPrompt);
  };

  const saveEntry = () => {
    if (!journal.currentEntry.trim()) return;
    const newEntry = {
      id: Date.now(),
      text: journal.currentEntry,
      date: new Date().toISOString(),
      prompt: journal.currentPrompt,
      phase: journal.selectedPhase,
      isIntentionReflection: journal.reflectOnIntentions
    };
    
    const newEntries = [newEntry, ...journal.entries];
    journal.setEntries(newEntries);
    journal.setCurrentEntry('');
    journal.setSelectedPhase(null);
    journal.setCurrentPrompt(null);
    journal.setReflectOnIntentions(false);
    
    const milestones = [10, 25, 50, 100];
    if (milestones.includes(newEntries.length)) {
      journal.setShowConfetti(true);
      journal.setCelebrationMessage(`${newEntries.length} entries! You're building something real.`);
      journal.setShowCelebration(true);
      setTimeout(() => journal.setShowConfetti(false), 3000);
      setTimeout(() => journal.setShowCelebration(false), 4000);
    } else {
      journal.setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
      journal.setShowAffirmation(true);
      setTimeout(() => journal.setShowAffirmation(false), 2500);
    }
  };

  // Guided Reflection (chat) functions
  const startGuidedReflection = () => {
    journal.setIsGuidedReflection(true);
    journal.setIsWrappingUp(false);
    
    // Brief expectation-setting + context-aware prompt
    let openingMessage = "This is prompted journaling — I'll help you dig into what's happening and what's underneath. Your words become a journal entry.\n\nWhat's present for you right now?";
    
    if (journal.currentPrompt) {
      openingMessage = `This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nLet's explore: "${journal.currentPrompt}"`;
    } else if (journal.reflectOnIntentions) {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nLet's reflect on your intentions. Pick one that's been on your mind and tell me how it's going.";
    } else if (journal.selectedPhase === 'C') {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nYou're in Confront mode — what's something you've been avoiding looking at?";
    } else if (journal.selectedPhase === 'O') {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nYou're in Own mode — where do you feel things in your body right now?";
    } else if (journal.selectedPhase === 'R') {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nYou're in Rewire mode — what's a belief or pattern you're ready to let go of?";
    } else if (journal.selectedPhase === 'E') {
      openingMessage = "This is prompted journaling — I'll help you dig deeper. Your words become a journal entry.\n\nYou're in Embed mode — what's working that you want to protect?";
    }
    
    journal.setGuidedMessages([
      { role: 'assistant', content: openingMessage }
    ]);
    journal.setGuidedInput('');
  };

  const sendGuidedMessage = async () => {
   if (!journal.guidedInput.trim() || journal.isGuidedLoading) return;
    
    const userMessage = { role: 'user', content: journal.guidedInput.trim() };
    const newMessages = [...journal.guidedMessages, userMessage];
    journal.setGuidedMessages(newMessages);
    journal.setGuidedInput('');
    journal.setIsGuidedLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: 'guided_reflection',
          phase: journal.selectedPhase,
          isIntentions: journal.reflectOnIntentions,
          prompt: journal.currentPrompt
        })
      });
      
      const data = await response.json();
      if (data.response) {
        journal.setGuidedMessages([...newMessages, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error('Guided reflection error:', error);
    }
    
    journal.setIsGuidedLoading(false);
    setTimeout(() => journal.guidedMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const saveGuidedReflection = () => {
    const userMessages = journal.guidedMessages
      .filter(m => m.role === 'user')
      .map(m => m.content);
    
    if (userMessages.length === 0) return;
    
    const entryText = userMessages.join('\n\n');
    
    const newEntry = {
      id: Date.now(),
      text: entryText,
      date: new Date().toISOString(),
      type: 'chat',
      phase: journal.selectedPhase,
      isIntentionReflection: journal.reflectOnIntentions
    };
    
    const newEntries = [newEntry, ...journal.entries];
    journal.setEntries(newEntries);
    
    // Store the text and show reflection offer
    journal.setSavedReflectionText(entryText);
    journal.setShowReflectionOffer(true);
    journal.setReflectionInsight('');
    
    // Reset guided reflection state but keep phase for context
    journal.setIsGuidedReflection(false);
    journal.setIsWrappingUp(false);
    journal.setGuidedMessages([]);
    journal.setGuidedInput('');
  };

  const getReflectionInsight = async () => {
    journal.setIsLoadingInsight(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'post_reflection',
          entryText: journal.savedReflectionText,
          phase: journal.selectedPhase
        })
      });
      
      const data = await response.json();
      if (data.insight) {
        journal.setReflectionInsight(data.insight);
      }
    } catch (error) {
      console.error('Insight error:', error);
      journal.setReflectionInsight("I couldn't generate an insight right now. Your entry has been saved.");
    }
    journal.setIsLoadingInsight(false);
  };

  const dismissReflectionOffer = () => {
    journal.setShowReflectionOffer(false);
    journal.setSavedReflectionText('');
    journal.setReflectionInsight('');
    journal.setSelectedPhase(null);
    journal.setCurrentPrompt(null);
    journal.setReflectOnIntentions(false);
    
    // Show affirmation
    journal.setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
    journal.setShowAffirmation(true);
    setTimeout(() => journal.setShowAffirmation(false), 2500);
  };

  const wrapUpReflection = () => {
    journal.setIsWrappingUp(true);
    const closingMessage = { 
      role: 'assistant', 
      content: "Thanks for sitting with this. Take a moment to read back what you wrote — sometimes that's where the insight lands." 
    };
    journal.setGuidedMessages([...journal.guidedMessages, closingMessage]);
  };

  const cancelGuidedReflection = () => {
    if (journal.guidedMessages.filter(m => m.role === 'user').length > 0) {
      if (!confirm('Discard this reflection?')) return;
    }
    journal.setIsGuidedReflection(false);
    journal.setIsWrappingUp(false);
    journal.setGuidedMessages([]);
    journal.setGuidedInput('');
  };

  const deleteEntry = (id) => {
    if (confirm('Delete this entry?')) {
      journal.setEntries(prev => prev.filter(e => e.id !== id));
      journal.setExpandedEntry(null);
    }
  };

  const addIntention = () => {
    if (!journal.newIntention.trim()) return;
    const intention = {
      id: Date.now(),
      text: journal.newIntention,
      timeframe: journal.intentionTimeframe,
      createdAt: new Date().toISOString(),
    };
    journal.setIntentions(prev => [intention, ...prev]);
    journal.setNewIntention('');
  };

  const completeIntention = (id) => {
    const intention = journal.intentions.find(i => i.id === id);
    if (intention) {
      journal.setCompletedIntentions(prev => [{
        ...intention,
        completedAt: new Date().toISOString()
      }, ...prev]);
      journal.setIntentions(prev => prev.filter(i => i.id !== id));
      
      journal.setShowConfetti(true);
      journal.setCelebrationMessage(CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]);
      journal.setShowCelebration(true);
      
      setTimeout(() => journal.setShowConfetti(false), 3000);
      setTimeout(() => journal.setShowCelebration(false), 4000);
    }
  };

  const uncompleteIntention = (id) => {
    const intention = journal.completedIntentions.find(i => i.id === id);
    if (intention) {
      const { completedAt, ...rest } = intention;
      journal.setIntentions(prev => [rest, ...prev]);
      journal.setCompletedIntentions(prev => prev.filter(i => i.id !== id));
    }
  };
  
  // Transcribe handwritten journal from image - server handles HEIC conversion
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    journal.setIsTranscribing(true);
    
    try {
      // Get file type
      let mediaType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      // Detect HEIC even if browser doesn't report correct type
      if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
        mediaType = 'image/heic';
      }
      
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
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
        journal.setCurrentEntry(prev => prev ? prev + "\n\n" + data.transcription : data.transcription);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Could not transcribe the image. Try a different photo or take a screenshot of your journal page.');
    }
    
    journal.setIsTranscribing(false);
    if (journal.fileInputRef.current) journal.fileInputRef.current.value = '';
  };

  // Voice recording - FIXED: Uses Web Speech API (works in browser, no API needed)
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
      // Update entry with final + interim (interim shows what's being said)
      journal.setCurrentEntry(prev => {
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
      journal.setIsRecording(false);
    };

    recognition.onend = () => {
      // Clean up interim text when done
      journal.setCurrentEntry(prev => prev.replace(/\[listening...\].*$/, '').trim());
      journal.setIsRecording(false);
    };

    journal.recognitionRef.current = recognition;
    recognition.start();
    journal.setIsRecording(true);
  };

  const stopRecording = () => {
    if (journal.recognitionRef.current) {
      journal.recognitionRef.current.stop();
      journal.recognitionRef.current = null;
    }
    journal.setIsRecording(false);
  };

  // Chat with your journal - FIXED: Uses API route
  const sendChatMessage = async () => {
    if (!journal.chatInput.trim() || journal.entries.length === 0) return;
    
    const userMessage = journal.chatInput.trim();
    journal.setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    journal.setChatInput('');
    journal.setIsChatLoading(true);
    journal.setChatChart(null);
    
    const wantsChart = /chart|graph|trend|visual|show me|over time|by month|by week|breakdown/i.test(userMessage);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          entries: journal.entries.slice(0, 30),
          wantsChart
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.chart) {
        journal.setChatChart(data.chart);
      }
      
      journal.setChatMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error('Chat error:', error);
      journal.setChatMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Try again." }]);
    }
    journal.setIsChatLoading(false);
  };

  const deleteIntention = (id, fromCompleted = false) => {
    if (fromCompleted) {
      journal.setCompletedIntentions(prev => prev.filter(i => i.id !== id));
    } else {
      journal.setIntentions(prev => prev.filter(i => i.id !== id));
    }
  };

  // Analyze patterns - FIXED: Uses API route
  const analyzePatterns = async () => {
    const filteredEntries = filterEntriesByTime(journal.entries, journal.patternTimeFilter);
    if (filteredEntries.length < 3) {
      alert(`Need at least 3 entries. Currently have ${filteredEntries.length}.`);
      return;
    }
    journal.setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: filteredEntries.slice(0, 30),
          intentions: journal.intentions,
          timeFilter: journal.patternTimeFilter
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      journal.setPatterns(data);
    } catch (error) {
      console.error('Analysis error:', error);
      journal.setPatterns({
        data: null,
        text: "Couldn't analyze right now. Try again.",
        generatedAt: new Date().toISOString(),
        entryCount: 0,
        timeFilter: journal.patternTimeFilter
      });
    }
    journal.setIsAnalyzing(false);
  };

  // Submit feedback - FIXED: Uses Resend API route
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.cream }}>
      <Confetti active={journal.showConfetti} />
      
      {journal.showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
          <div 
            className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4"
            style={{ border: `3px solid ${BRAND.chartreuse}` }}
          >
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-xl font-medium mb-2" style={{ color: BRAND.charcoal }}>{journal.celebrationMessage}</p>
            <p className="text-sm mb-4" style={{ color: BRAND.warmGray }}>You completed an intention!</p>
            <button 
              onClick={() => journal.setShowCelebration(false)} 
              className="px-6 py-2 rounded-lg text-sm"
              style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}
            >
              Keep going
            </button>
          </div>
        </div>
      )}
      
      {journal.showAboutCore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full my-8">
            <h3 className="text-xl font-light italic mb-4" style={{ color: BRAND.charcoal }}>
              About the CORE Framework
            </h3>
            <p className="text-sm mb-4" style={{ color: BRAND.warmGray }}>
              CORE is The Unfolding's methodology for leadership transformation. It's designed specifically for women leaders who want to lead without losing themselves.
            </p>
            <div className="space-y-4 mb-6">
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <p className="font-medium" style={{ color: BRAND.charcoal }}>C — CONFRONT</p>
                <p className="text-sm" style={{ color: BRAND.warmGray }}>What's running you? Before you can lead differently, you have to see clearly what's driving your current patterns.</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <p className="font-medium" style={{ color: BRAND.charcoal }}>O — OWN</p>
                <p className="text-sm" style={{ color: BRAND.warmGray }}>What are you feeling? Leadership lives in the body. Owning your emotional truth creates space for real change.</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <p className="font-medium" style={{ color: BRAND.charcoal }}>R — REWIRE</p>
                <p className="text-sm" style={{ color: BRAND.warmGray }}>How will you lead? This is where you actively build new patterns—new beliefs, new behaviors, new ways of showing up.</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
                <p className="font-medium" style={{ color: BRAND.charcoal }}>E — EMBED</p>
                <p className="text-sm" style={{ color: BRAND.warmGray }}>What will you sustain? Real change requires building rituals that protect and reinforce your growth.</p>
              </div>
            </div>
            <p className="text-sm italic mb-4" style={{ color: BRAND.warmGray }}>
              This isn't generic AI. The prompts, the analysis, the questions—they're all designed through The Unfolding's approach to help you lead and live. Both are possible.
            </p>
            <button 
              onClick={() => journal.setShowAboutCore(false)} 
              className="w-full py-2 rounded-lg"
              style={{ backgroundColor: BRAND.charcoal, color: 'white' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {journal.showAffirmation && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 text-sm"
          style={{ backgroundColor: BRAND.charcoal, color: 'white' }}>
          {journal.affirmation}
        </div>
      )}

      {journal.showReflectionOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            {!journal.reflectionInsight && !journal.isLoadingInsight ? (
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
            ) : journal.isLoadingInsight ? (
              <div className="text-center py-8">
                <p className="text-sm animate-pulse" style={{ color: BRAND.warmGray }}>Reading your reflection...</p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-medium mb-3" style={{ color: BRAND.warmGray }}>What I noticed:</h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: BRAND.charcoal }}>
                  {journal.reflectionInsight}
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
          <WriteView
            currentEntry={journal.currentEntry}
            setCurrentEntry={journal.setCurrentEntry}
            selectedPhase={journal.selectedPhase}
            setSelectedPhase={journal.setSelectedPhase}
            currentPrompt={journal.currentPrompt}
            setCurrentPrompt={journal.setCurrentPrompt}
            reflectOnIntentions={journal.reflectOnIntentions}
            setReflectOnIntentions={journal.setReflectOnIntentions}
            intentions={journal.intentions}
            isTranscribing={journal.isTranscribing}
            isRecording={journal.isRecording}
            voiceSupported={journal.voiceSupported}
            isGuidedReflection={journal.isGuidedReflection}
            setIsGuidedReflection={journal.setIsGuidedReflection}
            guidedMessages={journal.guidedMessages}
            setGuidedMessages={journal.setGuidedMessages}
            guidedInput={journal.guidedInput}
            setGuidedInput={journal.setGuidedInput}
            isGuidedLoading={journal.isGuidedLoading}
            setIsGuidedLoading={journal.setIsGuidedLoading}
            isWrappingUp={journal.isWrappingUp}
            setIsWrappingUp={journal.setIsWrappingUp}
            fileInputRef={journal.fileInputRef}
            guidedMessagesEndRef={journal.guidedMessagesEndRef}
            selectPhase={selectPhase}
            selectIntentionReflection={selectIntentionReflection}
            shufflePrompt={shufflePrompt}
            saveEntry={saveEntry}
            startGuidedReflection={startGuidedReflection}
            sendGuidedMessage={sendGuidedMessage}
            wrapUpReflection={wrapUpReflection}
            saveGuidedReflection={saveGuidedReflection}
            cancelGuidedReflection={cancelGuidedReflection}
            handleImageUpload={handleImageUpload}
            startRecording={startRecording}
            stopRecording={stopRecording}
            setShowAboutCore={journal.setShowAboutCore}
          />
        )}

        {view === 'history' && (
          <HistoryView
            entries={journal.entries}
            historyTimeFilter={journal.historyTimeFilter}
            setHistoryTimeFilter={journal.setHistoryTimeFilter}
            expandedEntry={journal.expandedEntry}
            setExpandedEntry={journal.setExpandedEntry}
            deleteEntry={deleteEntry}
          />
        )}

        {view === 'patterns' && (
          <PatternsView
            entries={journal.entries}
            patterns={journal.patterns}
            isAnalyzing={journal.isAnalyzing}
            patternTimeFilter={journal.patternTimeFilter}
            setPatternTimeFilter={journal.setPatternTimeFilter}
            activePatternPhase={journal.activePatternPhase}
            setActivePatternPhase={journal.setActivePatternPhase}
            showGraph={journal.showGraph}
            setShowGraph={journal.setShowGraph}
            analyzePatterns={analyzePatterns}
            intentions={journal.intentions}
            setShowAboutCore={journal.setShowAboutCore}
          />
        )}

        {view === 'chat' && (
          <ChatView
            entries={journal.entries}
            chatMessages={journal.chatMessages}
            setChatMessages={journal.setChatMessages}
            chatInput={journal.chatInput}
            setChatInput={journal.setChatInput}
            isChatLoading={journal.isChatLoading}
            chatChart={journal.chatChart}
            setChatChart={journal.setChatChart}
            sendChatMessage={sendChatMessage}
          />
        )}

        {view === 'intentions' && (
          <IntentionsView
            intentions={journal.intentions}
            completedIntentions={journal.completedIntentions}
            newIntention={journal.newIntention}
            setNewIntention={journal.setNewIntention}
            intentionTimeframe={journal.intentionTimeframe}
            setIntentionTimeframe={journal.setIntentionTimeframe}
            addIntention={addIntention}
            completeIntention={completeIntention}
            uncompleteIntention={uncompleteIntention}
            deleteIntention={deleteIntention}
          />
        )}

        {view === 'settings' && (
          <SettingsView
            entries={journal.entries}
            intentions={journal.intentions}
            completedIntentions={journal.completedIntentions}
            setEntries={journal.setEntries}
            setIntentions={journal.setIntentions}
            setCompletedIntentions={journal.setCompletedIntentions}
            setPatterns={journal.setPatterns}
            setView={setView}
          />
        )}
      <InstallAppPrompt />
      </main>

      <footer className="mx-auto py-8 text-center" style={{ maxWidth: "100%", padding: "32px 8px", boxSizing: "border-box" }}>
        <p className="text-xs" style={{ color: BRAND.lightGray }}>The Unfolding © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
