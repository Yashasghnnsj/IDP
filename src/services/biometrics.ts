import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export async function checkBiometricAvailability() {
  const { available, biometryType } = await rnBiometrics.isSensorAvailable();
  return { available, biometryType };
}

export async function authenticateUser(promptMessage: string = 'Confirm your identity') {
  try {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage });
    return success;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}

export async function createBiometricKeys() {
  try {
    const { publicKey } = await rnBiometrics.createKeys();
    return publicKey;
  } catch (error) {
    console.error('Failed to create biometric keys:', error);
    return null;
  }
}
