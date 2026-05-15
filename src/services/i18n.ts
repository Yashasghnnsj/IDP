import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Onboarding
      onboarding_title_1: 'AI Cough Analysis',
      onboarding_desc_1: 'Detect respiratory conditions with a simple cough recording.',
      onboarding_title_2: 'Offline & Instant',
      onboarding_desc_2: 'No internet needed. Get results in seconds.',
      onboarding_title_3: 'Your Health, Secured',
      onboarding_desc_3: 'Your data stays encrypted on device.',
      // Home
      greeting: 'Good Morning',
      start_scan: 'Start AI Scan',
      start_scan_sub: 'Record your cough for instant analysis',
      weekly_trend: 'Weekly Respiratory Trend',
      wellness_score: "Today's Wellness Score",
      quick_actions: 'Quick Actions',
      health_metrics: 'Health Metrics',
      ai_insight: 'AI Health Insight',
      // Recording
      recording_instruction: 'Stay quiet, hold phone 15-20 cm away, and cough when prompted.',
      recording_start: 'Tap the microphone to begin',
      recording_stop: 'Tap to stop and analyze',
      disclaimer: 'Not a substitute for professional medical diagnosis.',
      // AI Processing
      processing_title: 'Analyzing Respiratory Sample',
      step_noise: 'Noise Reduction',
      step_mfcc: 'MFCC Feature Extraction',
      step_ai: 'AI Inference',
      step_xai: 'Explainable AI Layer',
      step_report: 'Generating Report',
      // Result
      result_title: 'Diagnosis Result',
      confidence: 'Confidence',
      risk_level: 'Risk Level',
      // Breathing
      breathing_title: 'Breathing Exercise',
      breathing_inhale: 'Inhale',
      breathing_hold: 'Hold',
      breathing_exhale: 'Exhale',
      breathing_rest: 'Rest',
      breathing_start: 'Start',
      breathing_stop: 'Stop',
      // General
      back: 'Back',
      retry: 'Try Again',
      no_data: 'No data available',
      no_reports: 'No reports yet',
      no_scans: 'No scans available',
      no_internet: 'No internet connection',
    },
  },
  kn: {
    translation: {
      // Onboarding
      onboarding_title_1: 'AI ಕೆಮ್ಮು ವಿಶ್ಲೇಷಣೆ',
      onboarding_desc_1: 'ಸರಳ ಕೆಮ್ಮು ರೆಕಾರ್ಡಿಂಗ್‌ನೊಂದಿಗೆ ಉಸಿರಾಟದ ಸ್ಥಿತಿಗಳನ್ನು ಪತ್ತೆ ಮಾಡಿ.',
      onboarding_title_2: 'ಆಫ್ಲೈನ್ & ತಕ್ಷಣ',
      onboarding_desc_2: 'ಇಂಟರ್ನೆಟ್ ಅಗತ್ಯವಿಲ್ಲ. ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಫಲಿತಾಂಶ ಪಡೆಯಿರಿ.',
      onboarding_title_3: 'ನಿಮ್ಮ ಆರೋಗ್ಯ, ಸುರಕ್ಷಿತ',
      onboarding_desc_3: 'ನಿಮ್ಮ ಡೇಟಾ ಸಾಧನದಲ್ಲಿ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಆಗಿ ಉಳಿಯುತ್ತದೆ.',
      // Home
      greeting: 'ಶುಭ ಬೆಳಿಗ್ಗೆ',
      start_scan: 'AI ಸ್ಕ್ಯಾನ್ ಪ್ರಾರಂಭಿಸಿ',
      start_scan_sub: 'ತಕ್ಷಣದ ವಿಶ್ಲೇಷಣೆಗಾಗಿ ನಿಮ್ಮ ಕೆಮ್ಮನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ',
      weekly_trend: 'ಸಾಪ್ತಾಹಿಕ ಉಸಿರಾಟ ಟ್ರೆಂಡ್',
      wellness_score: 'ಇಂದಿನ ಆರೋಗ್ಯ ಸ್ಕೋರ್',
      quick_actions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
      health_metrics: 'ಆರೋಗ್ಯ ಮಾಪನಗಳು',
      ai_insight: 'AI ಆರೋಗ್ಯ ಒಳನೋಟ',
      // Recording
      recording_instruction: 'ಸದ್ದಿಲ್ಲದಿರಿ, ಫೋನ್ 15-20 ಸೆಂ.ಮೀ. ದೂರದಲ್ಲಿ ಹಿಡಿಯಿರಿ ಮತ್ತು ಸೂಚಿಸಿದಾಗ ಕೆಮ್ಮಿ.',
      recording_start: 'ಪ್ರಾರಂಭಿಸಲು ಮೈಕ್ ಟ್ಯಾಪ್ ಮಾಡಿ',
      recording_stop: 'ನಿಲ್ಲಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
      disclaimer: 'ವೃತ್ತಿಪರ ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯದ ಬದಲಾಗಿ ಅಲ್ಲ.',
      // AI Processing
      processing_title: 'ಉಸಿರಾಟದ ಮಾದರಿ ವಿಶ್ಲೇಷಣೆ',
      step_noise: 'ಶಬ್ದ ಕಡಿತ',
      step_mfcc: 'MFCC ವೈಶಿಷ್ಟ್ಯ ಹೊರತೆಗೆಯುವಿಕೆ',
      step_ai: 'AI ಅನುಮಾನ',
      step_xai: 'ವಿವರಿಸಬಹುದಾದ AI',
      step_report: 'ವರದಿ ರಚಿಸಲಾಗುತ್ತಿದೆ',
      // Breathing
      breathing_title: 'ಉಸಿರಾಟ ವ್ಯಾಯಾಮ',
      breathing_inhale: 'ಉಸಿರು ತೆಗೆದುಕೋ',
      breathing_hold: 'ಹಿಡಿ',
      breathing_exhale: 'ಉಸಿರು ಬಿಡು',
      breathing_rest: 'ವಿಶ್ರಾಂತಿ',
      breathing_start: 'ಪ್ರಾರಂಭಿಸಿ',
      breathing_stop: 'ನಿಲ್ಲಿಸಿ',
      // General
      back: 'ಹಿಂದೆ',
      retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
      no_data: 'ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ',
      no_reports: 'ಯಾವುದೇ ವರದಿಗಳಿಲ್ಲ',
      no_scans: 'ಯಾವುದೇ ಸ್ಕ್ಯಾನ್‌ಗಳಿಲ್ಲ',
      no_internet: 'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ',
    },
  },
  hi: {
    translation: {
      // Onboarding
      onboarding_title_1: 'AI खांसी विश्लेषण',
      onboarding_desc_1: 'एक सरल खांसी रिकॉर्डिंग से श्वसन स्थितियों का पता लगाएं।',
      onboarding_title_2: 'ऑफलाइन और तत्काल',
      onboarding_desc_2: 'इंटरनेट की जरूरत नहीं। सेकंडों में परिणाम प्राप्त करें।',
      onboarding_title_3: 'आपका स्वास्थ्य, सुरक्षित',
      onboarding_desc_3: 'आपका डेटा डिवाइस पर एन्क्रिप्टेड रहता है।',
      // Home
      greeting: 'सुप्रभात',
      start_scan: 'AI स्कैन शुरू करें',
      start_scan_sub: 'तत्काल विश्लेषण के लिए अपनी खांसी रिकॉर्ड करें',
      weekly_trend: 'साप्ताहिक श्वसन प्रवृत्ति',
      wellness_score: 'आज का स्वास्थ्य स्कोर',
      quick_actions: 'त्वरित क्रियाएं',
      health_metrics: 'स्वास्थ्य मेट्रिक्स',
      ai_insight: 'AI स्वास्थ्य अंतर्दृष्टि',
      // Recording
      recording_instruction: 'शांत रहें, फोन को 15-20 सेमी दूर रखें, और संकेत पर खांसें।',
      recording_start: 'शुरू करने के लिए माइक टैप करें',
      recording_stop: 'रोकने के लिए टैप करें',
      disclaimer: 'यह पेशेवर चिकित्सा निदान का विकल्प नहीं है।',
      // AI Processing
      processing_title: 'श्वसन नमूना विश्लेषण',
      step_noise: 'शोर न्यूनीकरण',
      step_mfcc: 'MFCC फीचर निष्कर्षण',
      step_ai: 'AI अनुमान',
      step_xai: 'व्याख्यात्मक AI परत',
      step_report: 'रिपोर्ट तैयार हो रही है',
      // Breathing
      breathing_title: 'श्वास व्यायाम',
      breathing_inhale: 'सांस लें',
      breathing_hold: 'रोकें',
      breathing_exhale: 'सांस छोड़ें',
      breathing_rest: 'आराम',
      breathing_start: 'शुरू करें',
      breathing_stop: 'रोकें',
      // General
      back: 'वापस',
      retry: 'फिर कोशिश करें',
      no_data: 'कोई डेटा उपलब्ध नहीं',
      no_reports: 'अभी तक कोई रिपोर्ट नहीं',
      no_scans: 'कोई स्कैन उपलब्ध नहीं',
      no_internet: 'इंटरनेट कनेक्शन नहीं',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v3',
});

export default i18n;
