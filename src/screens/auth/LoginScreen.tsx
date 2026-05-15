import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../theme';
import { AppTextInput } from '../../components/common/AppTextInput';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>AcuSound</Text>
        <Text style={styles.subtitle}>Welcome back</Text>
      </View>

      <View style={styles.form}>
        <AppTextInput
          label="Email / Phone"
          value={email}
          onChangeText={setEmail}
          left={<TextInput.Icon icon="email-outline" />}
        />
        <AppTextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
          right={
            <TextInput.Icon
              icon={secureText ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setSecureText(!secureText)}
            />
          }
          left={<TextInput.Icon icon="lock-outline" />}
        />

        <TouchableOpacity style={styles.biometricRow}>
          <Icon name="fingerprint" size={28} color={Colors.primary} />
          <Text style={styles.biometricText}>Login with Fingerprint</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.biometricRow}>
          <Icon name="face-recognition" size={28} color={Colors.primary} />
          <Text style={styles.biometricText}>Login with Face ID</Text>
        </TouchableOpacity>

        <Button
          mode="contained"
          onPress={() => navigation.replace('Main')}
          style={styles.loginButton}
          labelStyle={styles.buttonLabel}
        >
          Login
        </Button>

        <View style={styles.footerLinks}>
          <Button onPress={() => navigation.navigate('Register')} labelStyle={{ color: Colors.primary }}>
            Create Account
          </Button>
          <Button onPress={() => {}} labelStyle={{ color: Colors.textSecondary }}>
            Forgot Password?
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', marginTop: 80, marginBottom: 30 },
  logo: { fontSize: 32, fontWeight: '700', color: Colors.primary },
  subtitle: { fontSize: 18, color: Colors.textSecondary, marginTop: 8 },
  form: { paddingHorizontal: 30 },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 18,
    elevation: 2,
  },
  biometricText: { marginLeft: 15, fontSize: 16, fontWeight: '500', color: Colors.text },
  loginButton: {
    marginTop: 20,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
  },
  buttonLabel: { fontSize: 18, fontWeight: '600' },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
});