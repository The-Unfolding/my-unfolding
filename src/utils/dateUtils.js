/**
 * Date formatting utilities
 */

export const formatDate = (iso) => 
  new Date(iso).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

export const formatFullDate = (iso) => 
  new Date(iso).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

/**
 * Filter entries by time period
 */
export const filterEntriesByTime = (entries, filter) => {
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

/**
 * Generate print-friendly HTML for journal entries
 */
export const generatePrintHTML = (entries, title = 'My Unfolding') => {
  return `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#2a2a28}
          h1{font-style:italic;font-weight:normal;border-bottom:2px solid #e2ff4d;padding-bottom:10px}
          .entry{margin-bottom:30px;page-break-inside:avoid}
          .date{font-size:14px;font-weight:bold;margin-bottom:5px}
          .prompt{font-style:italic;color:#6b6863;font-size:14px;margin:8px 0}
          .text{line-height:1.7}
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p style="color:#6b6863">${entries.length} entries</p>
        ${entries.map(e => `
          <div class="entry">
            <div class="date">${formatFullDate(e.date)}</div>
            ${e.prompt ? `<div class="prompt">"${e.prompt}"</div>` : ''}
            <div class="text">${e.text}</div>
          </div>
        `).join('')}
      </body>
    </html>
  `;
};

/**
 * Print journal entries
 */
export const printEntries = (entries) => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(generatePrintHTML(entries));
  printWindow.document.close();
  printWindow.print();
};
