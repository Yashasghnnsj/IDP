export type RiskLevel = 'Low' | 'Moderate' | 'High';

export type AnalyzeResponse = {
  predicted_class: string;
  confidence: number;
  risk: RiskLevel;
  description: string;
  all_probabilities: Record<string, number>;
  heatmap_b64: string;
  mel_b64: string;
  llm_explanation: string;
};
