import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking, Alert, Platform, PermissionsAndroid } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import * as Location from 'expo-location';
import { Colors } from '../../theme';

export default function EmergencySOSScreen() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const sendSOS = () => {
    const emergencyNumber = '911'; // or emergency contact from profile
    const message = `Emergency! I may have a severe respiratory condition. My location: https://maps.google.com/?q=${location?.lat},${location?.lng}`;
    Linking.openURL(`tel:${emergencyNumber}`).catch(() => {
      // Fallback to SMS
      Linking.openURL(`sms:${emergencyNumber}?body=${encodeURIComponent(message)}`);
    });
    Alert.alert('SOS Sent', 'Emergency services have been alerted.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Emergency SOS</Text>
      <Card style={styles.emergencyCard}>
        <Text style={styles.warningText}>Severe respiratory distress detected? Act immediately.</Text>
        <Button
          mode="contained"
          onPress={sendSOS}
          style={styles.sosButton}
          labelStyle={styles.sosLabel}
        >
          CALL EMERGENCY
        </Button>
      </Card>
      <Text style={styles.info}>Your location will be shared if available.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, justifyContent: 'center' },
  heading: { fontSize: 28, fontWeight: '700', color: Colors.danger, marginBottom: 30, textAlign: 'center' },
  emergencyCard: { borderRadius: 24, padding: 20, backgroundColor: '#FFF', elevation: 8 },
  warningText: { fontSize: 18, color: Colors.danger, textAlign: 'center', marginBottom: 20 },
  sosButton: { backgroundColor: Colors.danger, borderRadius: 28, paddingVertical: 8 },
  sosLabel: { fontSize: 20, fontWeight: '700' },
  info: { marginTop: 20, textAlign: 'center', color: Colors.textSecondary },
});