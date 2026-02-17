import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { loadJournalData, saveJournalData } from '../utils/storageUtils';
import { AFFIRMATIONS, CELEBRATION_MESSAGES } from '../constants/messages';
import { CORE_PROMPTS } from '../constants/prompts';

/**
 * Custom hook to manage journal state and operations
 */
export const useJournal = () => {
  // Journal state
  const [entries, setEntries] = useState([]);
  const [intentions, setIntentions] = useState([]);
  const [completedIntentions, setCompletedIntentions] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [hasConsented, setHasConsented] = useState(false);
  
  // UI state - Write view
  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [reflectOnIntentions, setReflectOnIntentions] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [affirmation, setAffirmation] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  
  // UI state - Guided reflection
  const [isGuidedReflection, setIsGuidedReflection] = useState(false);
  const [guidedMessages, setGuidedMessages] = useState([]);
  const [guidedInput, setGuidedInput] = useState('');
  const [showReflectionOffer, setShowReflectionOffer] = useState(false);
  const [savedReflectionText, setSavedReflectionText] = useState('');
  const [reflectionInsight, setReflectionInsight] = useState('');
  
  // UI state - General
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [showAboutCore, setShowAboutCore] = useState(false);
  
  // UI state - Patterns view
  const [showGraph, setShowGraph] = useState(false);
  
  // UI state - Intentions view
  const [newIntention, setNewIntention] = useState('');
  const [intentionTimeframe, setIntentionTimeframe] = useState('week');
  
  // UI state - Chat view
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatChart, setChatChart] = useState(null);
  
  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGuidedLoading, setIsGuidedLoading] = useState(false);
  const [isWrappingUp, setIsWrappingUp] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  
  // Filters
  const [patternTimeFilter, setPatternTimeFilter] = useState('week');
  const [historyTimeFilter, setHistoryTimeFilter] = useState('all');
  const [activePatternPhase, setActivePatternPhase] = useState('all');
  
  // Refs
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const guidedMessagesEndRef = useRef(null);
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadJournalData();
    if (saved) {
      setEntries(saved.entries || []);
      setPatterns(saved.patterns || null);
      setIntentions(saved.intentions || []);
      setCompletedIntentions(saved.completedIntentions || []);
      setHasConsented(saved.hasConsented || false);
    }
  }, []);
  
  // Save to localStorage when data changes
  useEffect(() => {
    if (hasConsented) {
      saveJournalData({
        entries,
        patterns,
        intentions,
        completedIntentions,
        hasConsented
      });
    }
  }, [entries, patterns, intentions, completedIntentions, hasConsented]);
  
  // Check for Web Speech API support
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setVoiceSupported(supported);
  }, []);
  
  return {
    // Core data
    entries,
    setEntries,
    intentions,
    setIntentions,
    completedIntentions,
    setCompletedIntentions,
    patterns,
    setPatterns,
    hasConsented,
    setHasConsented,
    
    // Write view state
    currentEntry,
    setCurrentEntry,
    selectedPhase,
    setSelectedPhase,
    currentPrompt,
    setCurrentPrompt,
    reflectOnIntentions,
    setReflectOnIntentions,
    showAffirmation,
    setShowAffirmation,
    affirmation,
    setAffirmation,
    voiceSupported,
    setVoiceSupported,
    
    // Guided reflection
    isGuidedReflection,
    setIsGuidedReflection,
    guidedMessages,
    setGuidedMessages,
    guidedInput,
    setGuidedInput,
    showReflectionOffer,
    setShowReflectionOffer,
    savedReflectionText,
    setSavedReflectionText,
    reflectionInsight,
    setReflectionInsight,
    
    // General UI
    showConfetti,
    setShowConfetti,
    celebrationMessage,
    setCelebrationMessage,
    showCelebration,
    setShowCelebration,
    expandedEntry,
    setExpandedEntry,
    showAboutCore,
    setShowAboutCore,
    
    // Patterns view
    showGraph,
    setShowGraph,
    
    // Intentions view
    newIntention,
    setNewIntention,
    intentionTimeframe,
    setIntentionTimeframe,
    
    // Chat view
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatChart,
    setChatChart,
    
    // Loading states
    isAnalyzing,
    setIsAnalyzing,
    isTranscribing,
    setIsTranscribing,
    isRecording,
    setIsRecording,
    isChatLoading,
    setIsChatLoading,
    isGuidedLoading,
    setIsGuidedLoading,
    isWrappingUp,
    setIsWrappingUp,
    isLoadingInsight,
    setIsLoadingInsight,
    
    // Filters
    patternTimeFilter,
    setPatternTimeFilter,
    historyTimeFilter,
    setHistoryTimeFilter,
    activePatternPhase,
    setActivePatternPhase,
    
    // Refs
    fileInputRef,
    recognitionRef,
    guidedMessagesEndRef,
  };
};
