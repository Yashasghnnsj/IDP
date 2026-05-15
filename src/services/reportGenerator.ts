import RNHTMLtoPDF from 'react-native-html-to-pdf';

type DiagnosisResult = {
  disease: string;
  confidence: number;
  risk: string;
};

export async function generateDiagnosisReport(diagnosis: DiagnosisResult): Promise<string | null> {
  const timestamp = new Date().toLocaleString();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>AcuSound Respiratory Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #F7F9FC; color: #1A1D2E; padding: 40px; }
  .header { background: linear-gradient(135deg, #1A6FFF, #0D47A1); padding: 32px; border-radius: 16px; margin-bottom: 32px; color: white; }
  .header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
  .header p { font-size: 13px; opacity: 0.8; margin-top: 6px; }
  .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  .section-title { font-size: 13px; font-weight: 700; color: #8896A5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
  .result-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #F0F3F8; }
  .result-row:last-child { border-bottom: none; }
  .result-label { font-size: 14px; color: #5A6A7E; }
  .result-value { font-size: 15px; font-weight: 700; color: #1A1D2E; }
  .badge { display: inline-block; padding: 4px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; }
  .badge-low { background: #E8F9EF; color: #1A7A40; }
  .badge-moderate { background: #FFF4E0; color: #B35F00; }
  .badge-high { background: #FFE8E8; color: #B31A1A; }
  .confidence-bar-track { height: 8px; background: #EEF1F8; border-radius: 999px; margin-top: 8px; overflow: hidden; }
  .confidence-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #1A6FFF, #00C4FF); }
  .disclaimer { background: #FFF8ED; border-left: 4px solid #FF9500; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px; }
  .disclaimer p { font-size: 12px; color: #7A5C00; line-height: 1.6; }
  .footer { text-align: center; font-size: 11px; color: #A0A8BA; margin-top: 32px; }
  .ai-badge { display: inline-flex; align-items: center; gap: 6px; background: #EDF2FF; color: #1A6FFF; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
</style>
</head>
<body>

<div class="header">
  <h1>🫁 AcuSound Respiratory Report</h1>
  <p>AI-powered respiratory analysis · Generated ${timestamp}</p>
  <div class="ai-badge">⚡ Powered by AcuSound ML Engine</div>
</div>

<div class="section">
  <div class="section-title">Diagnosis Summary</div>
  <div class="result-row">
    <span class="result-label">Detected Condition</span>
    <span class="result-value">${diagnosis.disease}</span>
  </div>
  <div class="result-row">
    <span class="result-label">Risk Level</span>
    <span class="badge badge-${diagnosis.risk.toLowerCase()}">${diagnosis.risk} Risk</span>
  </div>
  <div class="result-row" style="flex-direction: column; align-items: flex-start;">
    <span class="result-label">AI Confidence Score</span>
    <div style="width: 100%; margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 13px; color: #5A6A7E;">Score</span>
        <span style="font-size: 15px; font-weight: 700; color: #1A6FFF;">${diagnosis.confidence}%</span>
      </div>
      <div class="confidence-bar-track">
        <div class="confidence-bar-fill" style="width: ${diagnosis.confidence}%;"></div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">AI Analysis Pipeline</div>
  <div class="result-row">
    <span class="result-label">🔇 Noise Reduction</span>
    <span class="result-value" style="color: #34C759;">✓ Complete</span>
  </div>
  <div class="result-row">
    <span class="result-label">📊 MFCC Feature Extraction</span>
    <span class="result-value" style="color: #34C759;">✓ Complete</span>
  </div>
  <div class="result-row">
    <span class="result-label">🧠 Neural Network Inference</span>
    <span class="result-value" style="color: #34C759;">✓ Complete</span>
  </div>
  <div class="result-row">
    <span class="result-label">🧬 Explainable AI Layer</span>
    <span class="result-value" style="color: #34C759;">✓ Complete</span>
  </div>
</div>

<div class="section">
  <div class="section-title">Recommendations</div>
  <div class="result-row">
    <span class="result-label">📅 Next Scan</span>
    <span class="result-value">Within 7 days</span>
  </div>
  <div class="result-row">
    <span class="result-label">🏥 Doctor Consultation</span>
    <span class="result-value">${diagnosis.risk === 'High' ? 'Urgent — within 24h' : diagnosis.risk === 'Moderate' ? 'Recommended — within 1 week' : 'Routine check-up'}</span>
  </div>
  <div class="result-row">
    <span class="result-label">🫁 Breathing Exercise</span>
    <span class="result-value">Daily · 4-7-8 Technique</span>
  </div>
</div>

<div class="disclaimer">
  <p>⚠️ <strong>Medical Disclaimer:</strong> This report is generated by an AI model and is intended for informational and research purposes only. It is not a substitute for professional medical diagnosis, advice, or treatment. Always consult a qualified healthcare provider for any health concerns. AcuSound is a research prototype and has not been clinically validated.</p>
</div>

<div class="footer">
  <p>AcuSound · AI Respiratory Health Platform · Confidential Health Record</p>
  <p>Report generated automatically · ${timestamp}</p>
</div>

</body>
</html>
  `;

  try {
    const options = {
      html,
      fileName: `AcuSound_Report_${Date.now()}`,
      directory: 'Documents',
    };
    const file = await RNHTMLtoPDF.convert(options);
    return file.filePath ?? null;
  } catch (error) {
    console.error('[AcuSound] Report generation failed:', error);
    return null;
  }
}
