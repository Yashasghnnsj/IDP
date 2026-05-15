import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DiagnosisRecord = {
  id: string;
  date: string;
  disease: string;
  confidence: number;
  risk: 'Low' | 'Moderate' | 'High';
  audioUri?: string;
};

type HealthState = {
  records: DiagnosisRecord[];
  addRecord: (record: DiagnosisRecord) => void;
  clearHistory: () => void;
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (record) => set((state) => ({ records: [record, ...state.records] })),
      clearHistory: () => set({ records: [] }),
    }),
    { name: 'health-store', storage: { getItem: AsyncStorage.getItem, setItem: AsyncStorage.setItem, removeItem: AsyncStorage.removeItem } }
  )
);