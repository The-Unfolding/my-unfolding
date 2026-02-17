import React from 'react';
import { BRAND } from '../../constants/brand';
import { CORE_PROMPTS } from '../../constants/prompts';

export default function WriteView({
  // State
  currentEntry,
  setCurrentEntry,
  selectedPhase,
  setSelectedPhase,
  currentPrompt,
  setCurrentPrompt,
  reflectOnIntentions,
  setReflectOnIntentions,
  intentions,
  isTranscribing,
  isRecording,
  voiceSupported,
  isGuidedReflection,
  setIsGuidedReflection,
  guidedMessages,
  setGuidedMessages,
  guidedInput,
  setGuidedInput,
  isGuidedLoading,
  setIsGuidedLoading,
  isWrappingUp,
  setIsWrappingUp,
  
  // Refs
  fileInputRef,
  guidedMessagesEndRef,
  
  // Functions
  selectPhase,
  selectIntentionReflection,
  shufflePrompt,
  saveEntry,
  startGuidedReflection,
  sendGuidedMessage,
  wrapUpReflection,
  saveGuidedReflection,
  cancelGuidedReflection,
  handleImageUpload,
  startRecording,
  stopRecording,
  setShowAboutCore
}) {
  return (
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
              <button onClick={saveEntry} disabled={!currentEntry.trim()}
                className="px-5 py-2 rounded-lg text-sm disabled:opacity-30"
                style={{ backgroundColor: currentEntry.trim() ? BRAND.charcoal : BRAND.lightGray, color: 'white' }}>
                Save entry
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
  );
}
