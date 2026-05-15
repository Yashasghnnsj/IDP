import React from 'react';
import { View, StyleSheet, SectionList } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { Colors } from '../../theme';

const records = [
  { date: '2026-04-20', disease: 'Healthy', confidence: 96, risk: 'Low' },
  { date: '2026-04-18', disease: 'Mild Asthma', confidence: 89, risk: 'Low' },
];

export default function HealthHistoryScreen() {
  return (
    <SectionList
      sections={[{ title: 'Recent Scans', data: records }]}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Content style={styles.row}>
            <View>
              <Text variant="titleSmall">{item.date}</Text>
              <Text variant="bodyMedium">{item.disease}</Text>
              <Text style={{ color: Colors.textSecondary }}>Confidence: {item.confidence}%</Text>
            </View>
            <IconButton icon="play-circle-outline" size={28} onPress={() => {/* play audio */}} />
          </Card.Content>
        </Card>
      )}
      renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 15 },
  sectionHeader: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  card: { marginBottom: 10, borderRadius: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});