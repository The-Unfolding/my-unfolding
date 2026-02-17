import React from 'react';

/**
 * Simple markdown renderer for chat messages
 * Supports bold text (**text**) and bullet lists (-, •, *)
 */
export const renderMarkdown = (text) => {
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
