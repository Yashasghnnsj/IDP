import { create } from 'zustand';

export type DiagnosisResult = {
  id: string;
  date: string;
  disease: string;
  confidence: number;
  risk: 'Low' | 'Moderate' | 'High';
  audioUri?: string;
};

type HealthState = {
  history: DiagnosisResult[];
  addResult: (r: DiagnosisResult) => void;
  clearHistory: () => void;
};

export const useHealthStore = create<HealthState>((set) => ({
  history: [],
  addResult: (r) => set((s) => ({ history: [r, ...s.history] })),
  clearHistory: () => set({ history: [] }),
}));
