import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Switch, RadioButton, Text, Button } from 'react-native-paper';
import { Colors } from '../../theme';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [sensitivity, setSensitivity] = useState('medium');

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item title="Dark Mode" right={() => <Switch value={darkMode} onValueChange={setDarkMode} />} />
        <List.Item
          title="AI Sensitivity"
          description="Adjust model confidence threshold"
          right={() => (
            <RadioButton.Group onValueChange={setSensitivity} value={sensitivity}>
              <RadioButton.Item label="Low" value="low" />
              <RadioButton.Item label="Medium" value="medium" />
              <RadioButton.Item label="High" value="high" />
            </RadioButton.Group>
          )}
        />
      </List.Section>
      <List.Section>
        <List.Subheader>Data</List.Subheader>
        <List.Item title="Download Offline Model" right={() => <Button>Download</Button>} />
        <List.Item title="Backup Data" right={() => <Button>Backup</Button>} />
        <List.Item title="Clear Cache" right={() => <Button>Clear</Button>} />
      </List.Section>
      <List.Section>
        <List.Subheader>Security</List.Subheader>
        <List.Item title="Biometric Lock" right={() => <Switch value={true} />} />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});