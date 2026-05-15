import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, Searchbar, Avatar } from 'react-native-paper';
import { Colors } from '../../theme';

const doctors = [
  { id: '1', name: 'Dr. Priya Sharma', speciality: 'Pulmonologist', rating: 4.8, available: true },
  { id: '2', name: 'Dr. Rajesh Patel', speciality: 'General Physician', rating: 4.5, available: false },
];

export default function DoctorConsultationScreen() {
  return (
    <View style={styles.container}>
      <Searchbar placeholder="Search doctors..." style={styles.searchBar} />
      <FlatList
        data={doctors}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Avatar.Icon size={50} icon="doctor" style={{ backgroundColor: Colors.primary }} />
              <View style={styles.docInfo}>
                <Text variant="titleMedium">{item.name}</Text>
                <Text variant="bodyMedium">{item.speciality}</Text>
                <Text>⭐ {item.rating}</Text>
              </View>
              <Button mode="contained" disabled={!item.available} style={styles.bookBtn}>
                {item.available ? 'Book' : 'Unavailable'}
              </Button>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 15 },
  searchBar: { marginBottom: 15, borderRadius: 20 },
  card: { marginBottom: 12, borderRadius: 20 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 15 },
  bookBtn: { borderRadius: 20 },
});