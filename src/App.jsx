import React, { useState, useEffect, useRef } from 'react';

// Brand colors
const BRAND = {
  cream: '#f5f2eb',
  charcoal: '#2a2a28',
  warmGray: '#6b6863',
  lightGray: '#d4d0c8',
  chartreuse: '#e2ff4d'
};

// CORE Framework prompts
const CORE_PROMPTS = {
  C: {
    name: 'CONFRONT',
    desc: "What's running you",
    audio: null,
    prompts: [
      "What do I actually want from my leadership—not what I was taught to want?",
      "What keeps showing up that I keep ignoring?",
      "When do I feel most like myself as a leader?",
      "Whose definition of 'good leader' am I still trying to meet?",
      "What would I have to face if I stopped being so busy?",
      "What have I already decided but won't admit?",
      "If I trusted what I already know, what would I do differently?",
    ]
  },
  O: {
    name: 'OWN',
    desc: "What you're feeling",
    audio: null,
    prompts: [
      "Where does leadership live in my body right now?",
      "What emotion have I been managing instead of feeling?",
      "What am I holding that isn't mine to carry?",
      "Where in my body do I feel my own power?",
      "What would I grieve if I admitted the truth?",
      "What is my body asking for that I keep refusing?",
      "What would it feel like to lead without bracing for impact?",
    ]
  },
  R: {
    name: 'REWIRE',
    desc: "How you lead",
    audio: null,
    prompts: [
      "What does the leader I'm becoming believe about power?",
      "What permission have I been waiting for that I could give myself?",
      "When have I already led this way—even for a moment?",
      "What would I have to believe about myself to lead differently?",
      "What's one thing I keep saying I can't do—that I want to try?",
      "How will the leader I'm becoming respond to what I'm avoiding?",
      "What small action this week would prove the new story is true?",
    ]
  },
  E: {
    name: 'EMBED',
    desc: "What works",
    audio: null,
    prompts: [
      "What does my life need to look like to sustain the leader I'm becoming?",
      "What boundaries would protect my energy this week?",
      "What routine keeps me grounded—and am I actually doing it?",
      "Who genuinely supports this version of me?",
      "What's the first sign I'm slipping back?",
      "Where am I still saying yes when I mean no?",
      "What one thing would I protect at all costs?",
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
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// Vessel Logo Component
const VesselLogo = ({ size = 40, color = BRAND.charcoal }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 40 48">
    <path
      d="M8 4 L8 28 Q8 40 20 40 Q32 40 32 28 L32 4"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="20" cy="24" r="3" fill={color} />
    <circle cx="20" cy="24" r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
    <circle cx="20" cy="24" r="14" fill="none" stroke={color} strokeWidth="0.75" opacity="0.15" />
  </svg>
);

export default function MyUnfolding() {
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
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('myUnfoldingJournal');
    if (saved) {
      const data = JSON.parse(saved);
      setEntries(data.entries || []);
      setPatterns(data.patterns || null);
      setIntentions(data.intentions || []);
      setCompletedIntentions(data.completedIntentions || []);
      setHasConsented(data.hasConsented || false);
      setShowWelcome(!data.hasConsented);
    }
  }, []);

  useEffect(() => {
    if (hasConsented) {
      localStorage.setItem('myUnfoldingJournal', JSON.stringify({
        entries, patterns, intentions, completedIntentions, hasConsented
      }));
    }
  }, [entries, patterns, intentions, completedIntentions, hasConsented]);

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

  const saveEntry = () => {
    if (!currentEntry.trim()) return;
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

  const deleteEntry = (id) => {
    if (confirm('Delete this entry?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
      setExpandedEntry(null);
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
  };

  const completeIntention = (id) => {
    const intention = intentions.find(i => i.id === id);
    if (intention) {
      setCompletedIntentions(prev => [{
        ...intention,
        completedAt: new Date().toISOString()
      }, ...prev]);
      setIntentions(prev => prev.filter(i => i.id !== id));
      
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
    }
  };
  
  // Transcribe handwritten journal from image - FIXED: Uses API route
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsTranscribing(true);
    
    try {
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
          mediaType: file.type
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
      alert('Could not transcribe the image. Please try again.');
    }
    
    setIsTranscribing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      // Clean up interim text when done
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

  // Simple markdown renderer for chat
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

  // Chat with your journal - FIXED: Uses API route
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

  // Analyze patterns - FIXED: Uses API route
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

  // WELCOME SCREEN
  if (showWelcome || !hasConsented) {
    const welcomeSteps = [
      {
        content: (
          <div className="text-center">
            <VesselLogo size={56} color={BRAND.charcoal} />
            <h1 className="text-3xl font-light italic mt-6 mb-3" style={{ color: BRAND.charcoal }}>My Unfolding</h1>
            <p className="text-lg mb-2" style={{ color: BRAND.warmGray }}>A private space for reflection</p>
            <p className="text-sm mt-6 leading-relaxed" style={{ color: BRAND.charcoal }}>
              This is your space to reflect on your personal leadership journey. Capture your thoughts, notice how you're winning, how you're growing, and see patterns emerge over time.
            </p>
          </div>
        ),
        button: "Let's begin"
      },
      {
        content: (
          <div className="text-center">
            <div className="text-4xl mb-4">✍️</div>
            <h2 className="text-xl font-medium mb-4" style={{ color: BRAND.charcoal }}>How to write here</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: BRAND.charcoal }}>
              Write as if you're talking to yourself. Question yourself. Let different parts of you show up on the page.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: BRAND.charcoal }}>
              When you write honestly—without editing or performing—patterns emerge that you couldn't see before.
            </p>
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: BRAND.chartreuse + '30' }}>
              <p className="text-sm italic" style={{ color: BRAND.charcoal }}>
                e.g. "I froze. Why did you freeze? I froze because I was scared I had it wrong."
              </p>
            </div>
          </div>
        ),
        button: "Got it"
      },
      {
        content: (
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-medium mb-4" style={{ color: BRAND.charcoal }}>Your data stays yours</h2>
            <p className="text-sm mb-4" style={{ color: BRAND.warmGray }}>We want to be transparent about your data:</p>
            <div className="text-left space-y-3">
              <p className="text-sm" style={{ color: BRAND.charcoal }}>
                <strong>Stored on your device</strong> — entries live in your browser only, not on any server.
              </p>
              <p className="text-sm" style={{ color: BRAND.charcoal }}>
                <strong>One device at a time</strong> — if you use a different device or browser, your entries won't be there.
              </p>
              <p className="text-sm" style={{ color: BRAND.charcoal }}>
                <strong>Pattern analysis</strong> — when you use it, entries are sent to Claude AI for processing, then discarded.
              </p>
              <p className="text-sm" style={{ color: BRAND.charcoal }}>
                <strong>No time limit</strong> — journal for years. Data stays until you delete it.
              </p>
              <p className="text-sm" style={{ color: BRAND.warmGray }}>
                💡 Use Print in History to back up your entries.
              </p>
            </div>
          </div>
        ),
        button: "I understand"
      },
      {
        content: (
          <div className="text-center">
            <div className="text-4xl mb-4">💙</div>
            <h2 className="text-xl font-medium mb-4" style={{ color: BRAND.charcoal }}>A note on what this is</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: BRAND.charcoal }}>
              This is a tool for personal reflection—not therapy, medical advice, financial advice, or legal counsel.
            </p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: BRAND.charcoal }}>
              The AI-generated patterns are meant to surface themes for <em>your</em> consideration. Trust your own judgment about what resonates.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: BRAND.warmGray }}>
              If you're in crisis, please reach out to a licensed professional.
            </p>
          </div>
        ),
        button: "I understand"
      },
      {
        content: (
          <div className="text-center">
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-xl font-medium mb-4" style={{ color: BRAND.charcoal }}>You're ready</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: BRAND.charcoal }}>
              Your journal is waiting. Write when you need to think. Come back to see what emerges.
            </p>
            <div className="p-4 rounded-lg" style={{ backgroundColor: BRAND.cream }}>
              <p className="text-xs" style={{ color: BRAND.warmGray }}>
                By continuing, you confirm you understand your data is stored locally, pattern analysis uses AI, and this is not professional advice.
              </p>
            </div>
          </div>
        ),
        button: "Begin my journal"
      }
    ];

    const currentWelcomeStep = welcomeSteps[welcomeStep];
    const isLastStep = welcomeStep === welcomeSteps.length - 1;

    const handleWelcomeNext = () => {
      if (isLastStep) {
        setHasConsented(true);
        setShowWelcome(false);
      } else {
        setWelcomeStep(welcomeStep + 1);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: BRAND.cream }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            {currentWelcomeStep.content}
            
            <button 
              onClick={handleWelcomeNext}
              className="w-full py-3 rounded-lg mt-8 transition-all"
              style={{ 
                backgroundColor: isLastStep ? BRAND.chartreuse : BRAND.charcoal, 
                color: isLastStep ? BRAND.charcoal : 'white' 
              }}
            >
              {currentWelcomeStep.button}
            </button>
            
            <div className="flex justify-center gap-2 mt-6">
              {welcomeSteps.map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ 
                    backgroundColor: i === welcomeStep ? BRAND.charcoal : BRAND.lightGray,
                    transform: i === welcomeStep ? 'scale(1.2)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: BRAND.lightGray }}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <VesselLogo size={28} color={BRAND.charcoal} />
              <h1 className="text-xl font-light italic" style={{ color: BRAND.charcoal }}>My Unfolding</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFeedback(true)} className="text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: BRAND.cream, color: BRAND.warmGray }}>Feedback</button>
              <button onClick={() => setView('settings')} className="text-sm" style={{ color: BRAND.warmGray }}>⚙</button>
            </div>
          </div>
          <nav className="flex gap-1">
            <NavButton active={view === 'write'} onClick={() => setView('write')}>Write</NavButton>
            <NavButton active={view === 'history'} onClick={() => setView('history')}>History</NavButton>
            <NavButton active={view === 'patterns'} onClick={() => setView('patterns')}>Patterns</NavButton>
            <NavButton active={view === 'intentions'} onClick={() => setView('intentions')}>Intentions</NavButton>
            <NavButton active={view === 'chat'} onClick={() => setView('chat')}>Chat</NavButton>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        
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
                  <span className="text-xs" style={{ color: BRAND.warmGray }}>
                    {currentEntry.trim() ? `${currentEntry.split(/\s+/).filter(Boolean).length} words` : ''}
                  </span>
                </div>
                <button onClick={saveEntry} disabled={!currentEntry.trim()}
                  className="px-5 py-2 rounded-lg text-sm disabled:opacity-30"
                  style={{ backgroundColor: currentEntry.trim() ? BRAND.charcoal : BRAND.lightGray, color: 'white' }}>
                  Save entry
                </button>
              </div>
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
                          {entry.phase && <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.cream }}>{entry.phase}</span>}
                          {entry.isIntentionReflection && <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.cream }}>Intentions</span>}
                        </div>
                      </div>
                      {entry.prompt && <p className="text-sm italic mb-2" style={{ color: BRAND.warmGray }}>"{entry.prompt}"</p>}
                      <p className={`leading-relaxed ${expandedEntry === entry.id ? '' : 'line-clamp-3'}`} style={{ color: BRAND.charcoal }}>{entry.text}</p>
                    </div>
                    {expandedEntry === entry.id && (
                      <div className="px-5 pb-4 flex justify-end">
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
              <button
                onClick={analyzePatterns}
                disabled={isAnalyzing || filterEntriesByTime(entries, patternTimeFilter).length < 3}
                className="px-4 py-2 rounded-lg text-sm disabled:opacity-30"
                style={{ backgroundColor: BRAND.chartreuse, color: BRAND.charcoal }}
              >
                {isAnalyzing ? '⏳ Analyzing...' : patterns?.data ? '↻ Analyze my entries' : '✨ Analyze my entries'}
              </button>
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
              <h2 className="text-xl font-light italic mb-2" style={{ color: BRAND.charcoal }}>Ask your journal</h2>
              <p className="text-sm" style={{ color: BRAND.warmGray }}>Search your entries, find patterns, see trends</p>
            </div>
            
            {entries.length < 3 ? (
              <div className="text-center py-12">
                <p style={{ color: BRAND.warmGray }}>Write a few more entries first.</p>
                <p className="text-sm mt-2" style={{ color: BRAND.lightGray }}>Chat works best with 3+ entries.</p>
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
                <li>• <strong>Stored on your device:</strong> Entries saved in browser local storage only</li>
                <li>• <strong>Different device or browser?</strong> Your data won't appear—it only exists where you created it</li>
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
                  }
                }
              }} className="text-sm text-red-500">Delete all data</button>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-6 py-8 text-center">
        <p className="text-xs" style={{ color: BRAND.lightGray }}>The Unfolding © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
