export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Recording: undefined;
  AIProcessing: { recordingId: string };
  Result: { diagnosisId: string };
  ChatAssistant: undefined;
  EmergencySOS: undefined;
  DoctorConsultation: undefined;
  Profile: undefined;
  Settings: undefined;
  HealthHistory: undefined;
  Reports: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Scan: undefined; // Quick access to recording
  Reports: undefined;
  Assistant: undefined;
  Profile: undefined;
};