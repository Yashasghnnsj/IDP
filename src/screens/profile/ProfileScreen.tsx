import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, List, Divider } from 'react-native-paper';
import { Colors } from '../../theme';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Icon size={70} icon="account" style={{ backgroundColor: Colors.primary }} />
        <Text variant="headlineSmall" style={styles.name}>Yashas</Text>
        <Text>Male, 28 years</Text>
      </View>
      <Card style={styles.card}>
        <List.Item title="Email" description="yashas@example.com" left={props => <List.Icon {...props} icon="email" />} />
        <Divider />
        <List.Item title="Phone" description="+91 9876543210" left={props => <List.Icon {...props} icon="phone" />} />
        <Divider />
        <List.Item title="Blood Group" description="O+" left={props => <List.Icon {...props} icon="water" />} />
      </Card>
      <Card style={styles.card}>
        <Text variant="titleMedium" style={styles.section}>Health Profile</Text>
        <List.Item title="Smoking" description="Non-smoker" />
        <List.Item title="Allergies" description="Pollen" />
        <List.Item title="Chronic Conditions" description="None" />
        <List.Item title="Weight" description="72 kg" />
        <List.Item title="Height" description="175 cm" />
      </Card>
      <Card style={styles.card}>
        <Text variant="titleMedium" style={styles.section}>Emergency Contact</Text>
        <List.Item title="Rohit" description="Brother - +91 9876543211" />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingVertical: 30 },
  name: { marginTop: 10, fontWeight: '700' },
  card: { margin: 15, borderRadius: 20, padding: 5, backgroundColor: '#FFF' },
  section: { paddingHorizontal: 15, paddingTop: 10, fontWeight: '600', color: Colors.primary },
});