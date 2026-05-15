import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { Colors } from '../../theme';
import CircularProgress from 'react-native-circular-progress-indicator'; // or own component
import { ExplainableAIViewer } from '../../components/diagnostic/ExplainableAIViewer';

export default function ResultScreen({ route, navigation }: any) {
  // In real usage, fetch from route.params.diagnosisId
  const diagnosis = {
    disease: 'Asthma (Mild)',
    confidence: 92,
    risk: 'Low',
    spectrogramUrl: '',
    recommendations: ['Use prescribed inhaler', 'Avoid allergens', 'Breathing exercises daily'],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.resultCard}>
        <Text style={styles.diseaseTitle}>{diagnosis.disease}</Text>
        <CircularProgress
          value={diagnosis.confidence}
          radius={60}
          duration={1000}
          progressValueColor={Colors.primary}
          maxValue={100}
          title="Confidence"
          titleColor={Colors.textSecondary}
          activeStrokeColor={Colors.primary}
          inActiveStrokeColor={Colors.border}
        />
        <Text style={styles.riskBadge}>Risk: {diagnosis.risk}</Text>
      </Surface>

      <Text style={styles.sectionHeader}>Explainable AI Analysis</Text>
      <ExplainableAIViewer />

      <Text style={styles.sectionHeader}>Recommendations</Text>
      {diagnosis.recommendations.map((rec, idx) => (
        <Text key={idx} style={styles.recItem}>
          • {rec}
        </Text>
      ))}

      <Button
        mode="contained"
        style={styles.actionButton}
        onPress={() => navigation.navigate('DoctorConsultation')}
      >
        Consult a Doctor
      </Button>
      <Button
        mode="outlined"
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Reports')}
      >
        View Full Report
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  resultCard: {
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginBottom: 25,
    elevation: 8,
  },
  diseaseTitle: { fontSize: 26, fontWeight: '700', color: Colors.primary, marginBottom: 20 },
  riskBadge: {
    marginTop: 15,
    backgroundColor: Colors.green + '20',
    color: Colors.green,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: '600',
  },
  sectionHeader: { fontSize: 18, fontWeight: '700', marginVertical: 15, color: Colors.text },
  recItem: { fontSize: 15, marginBottom: 8, color: Colors.textSecondary },
  actionButton: { marginTop: 20, borderRadius: 28, backgroundColor: Colors.primary },
  secondaryButton: { marginTop: 12, borderRadius: 28, borderColor: Colors.primary },
});