import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { hp, wp } from '../../utils/responsive';
import { useHealthStore } from '../../store/healthStore';
import { generateDiagnosisReport } from '../../services/reportGenerator';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonLoader';

const RISK_COLORS: Record<string, string> = {
  Low: '#34C759',
  Moderate: '#FF9500',
  High: '#FF3B30',
};

export default function HistoryScreen({ navigation }: any) {
  const { records, clearHistory } = useHealthStore();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleGenerateReport = async (record: typeof records[0]) => {
    setGeneratingId(record.id);
    try {
      const path = await generateDiagnosisReport({
        disease: record.disease,
        confidence: record.confidence,
        risk: record.risk,
      });
      if (path) {
        Alert.alert('Report Ready', `Saved to: ${path}`);
      } else {
        Alert.alert('Error', 'Could not generate report.');
      }
    } catch (e) {
      Alert.alert('Error', 'Report generation failed.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all scan records?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
        {records.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Icon name="delete-outline" size={18} color={Colors.danger} />
            <Text style={styles.clearLabel}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {records.length === 0 ? (
        <EmptyState
          icon="file-search-outline"
          title="No Scans Yet"
          message="Your respiratory scan history will appear here once you complete your first AI analysis."
          actionLabel="Start a Scan"
          onAction={() => navigation.navigate('Recording')}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {records.map((record) => {
            const riskColor = RISK_COLORS[record.risk] ?? Colors.textSecondary;
            const isGenerating = generatingId === record.id;
            return (
              <View key={record.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
                  <Text style={styles.cardDisease}>{record.disease}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: `${riskColor}22` }]}>
                    <Text style={[styles.riskBadgeText, { color: riskColor }]}>{record.risk}</Text>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardDate}>
                    <Icon name="calendar-outline" size={12} color={Colors.textSecondary} /> {record.date}
                  </Text>
                  <Text style={styles.cardConfidence}>
                    Confidence: <Text style={{ fontWeight: '700', color: Colors.primary }}>{record.confidence}%</Text>
                  </Text>
                </View>
                {/* Confidence bar */}
                <View style={styles.confTrack}>
                  <View style={[styles.confFill, { width: `${record.confidence}%`, backgroundColor: riskColor }]} />
                </View>
                {/* Actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleGenerateReport(record)}
                    disabled={isGenerating}
                  >
                    <Icon name="file-pdf-box" size={15} color={Colors.primary} />
                    <Text style={styles.actionBtnText}>{isGenerating ? 'Generating…' : 'Export PDF'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('Result', { diagnosis: { disease: record.disease, confidence: record.confidence, risk: record.risk } })}
                  >
                    <Icon name="eye-outline" size={15} color={Colors.primary} />
                    <Text style={styles.actionBtnText}>View Result</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: hp(6) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearLabel: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  riskDot: { width: 10, height: 10, borderRadius: Radius.full },
  cardDisease: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  riskBadgeText: { fontSize: 12, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardDate: { fontSize: 12, color: Colors.textSecondary },
  cardConfidence: { fontSize: 12, color: Colors.textSecondary },
  confTrack: { height: 5, backgroundColor: '#F0F3F8', borderRadius: Radius.full, overflow: 'hidden', marginBottom: 12 },
  confFill: { height: '100%', borderRadius: Radius.full },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: `${Colors.primary}12`,
  },
  actionBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
});
