import { create } from 'zustand';
import type { AnalyzeResponse, RiskLevel } from '../types/diagnosis';

const HISTORY_KEY = 'acusound_scan_history';

export type DiagnosisResult = {
  id: string;
  date: string;
  disease: string;
  confidence: number;
  risk: RiskLevel;
  audioUri?: string;
};

function loadHistory(): DiagnosisResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveHistory(history: DiagnosisResult[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

type HealthState = {
  history: DiagnosisResult[];
  addResult: (r: DiagnosisResult) => void;
  clearHistory: () => void;

  currentResult: AnalyzeResponse | null;
  audioBlob: Blob | null;
  setCurrentResult: (r: AnalyzeResponse | null) => void;
  setAudioBlob: (b: Blob | null) => void;
};

export const useHealthStore = create<HealthState>((set) => ({
  history: loadHistory(),
  addResult: (r) =>
    set((s) => {
      const updated = [r, ...s.history];
      saveHistory(updated);
      return { history: updated };
    }),
  clearHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },

  currentResult: null,
  audioBlob: null,
  setCurrentResult: (r) => set({ currentResult: r }),
  setAudioBlob: (b) => set({ audioBlob: b }),
}));
