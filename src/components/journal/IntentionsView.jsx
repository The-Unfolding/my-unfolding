import React from 'react';
import { BRAND } from '../../constants/brand';
import { formatDate } from '../../utils/dateUtils';

export default function IntentionsView({
  intentions,
  completedIntentions,
  newIntention,
  setNewIntention,
  intentionTimeframe,
  setIntentionTimeframe,
  addIntention,
  completeIntention,
  uncompleteIntention,
  deleteIntention
}) {
  return (
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
  );
}
