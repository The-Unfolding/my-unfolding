import React from 'react';
import { BRAND } from '../../constants/brand';
import { printEntries } from '../../utils/dateUtils';

export default function SettingsView({
  entries,
  intentions,
  completedIntentions,
  setEntries,
  setIntentions,
  setCompletedIntentions,
  setPatterns,
  setView
}) {
  return (
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
  );
}
