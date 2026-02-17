/**
 * Local storage utilities for journal data
 */

const STORAGE_KEY = 'myUnfoldingJournal';

export const loadJournalData = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
};

export const saveJournalData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const clearJournalData = () => {
  localStorage.removeItem(STORAGE_KEY);
};
