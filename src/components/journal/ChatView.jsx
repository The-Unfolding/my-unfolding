import React from 'react';
import { BRAND } from '../../constants/brand';
import { renderMarkdown } from '../../utils/markdownUtils';

export default function ChatView({
  entries,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  isChatLoading,
  chatChart,
  setChatChart,
  sendChatMessage
}) {
  return (
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
  );
}
