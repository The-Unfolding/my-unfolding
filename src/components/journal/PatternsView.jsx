import React from 'react';
import { BRAND } from '../../constants/brand';
import { formatDate, filterEntriesByTime } from '../../utils/dateUtils';
import { TimeFilter } from '../ui';

export default function PatternsView({
  entries,
  patterns,
  isAnalyzing,
  patternTimeFilter,
  setPatternTimeFilter,
  activePatternPhase,
  setActivePatternPhase,
  showGraph,
  setShowGraph,
  analyzePatterns,
  intentions,
  setShowAboutCore
}) {
  return (
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
                        <div class="phase-title">${phase} - ${phase === 'C' ? 'Confront' : phase === 'O' ? 'Own' : phase === 'R' ? 'Rewire' : 'Embed'}</div>
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
  );
}
