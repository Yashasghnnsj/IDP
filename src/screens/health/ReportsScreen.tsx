import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { Colors } from '../../theme';

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Medical Reports</Text>
      <FlatList
        data={[{ id: '1', date: '2026-04-20', diagnosis: 'Healthy' }]}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.date}</Text>
              <Text variant="bodyMedium">{item.diagnosis}</Text>
              <View style={styles.actions}>
                <Button mode="text" icon="download">Download PDF</Button>
                <Button mode="text" icon="share">Share</Button>
              </View>
            </Card.Content>
          </Card>
        )}
      />
      <Button mode="contained" style={styles.generateBtn} onPress={() => {/* generate new report */}}>
        Generate New Report
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 15 },
  title: { marginBottom: 15, fontWeight: '700' },
  card: { marginBottom: 12, borderRadius: 18 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  generateBtn: { marginTop: 20, borderRadius: 28 },
});