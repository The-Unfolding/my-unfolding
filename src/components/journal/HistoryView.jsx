import React from 'react';
import { BRAND } from '../../constants/brand';
import { formatFullDate, filterEntriesByTime, printEntries } from '../../utils/dateUtils';
import { TimeFilter } from '../ui';

export default function HistoryView({
  entries,
  historyTimeFilter,
  setHistoryTimeFilter,
  expandedEntry,
  setExpandedEntry,
  deleteEntry
}) {
  return (
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
  );
}
