import EncryptedStorage from 'react-native-encrypted-storage';

export async function saveSecureData(key: string, value: string) {
  try {
    await EncryptedStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to save secure data for key ${key}:`, error);
  }
}

export async function getSecureData(key: string): Promise<string | null> {
  try {
    return await EncryptedStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get secure data for key ${key}:`, error);
    return null;
  }
}

export async function removeSecureData(key: string) {
  try {
    await EncryptedStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove secure data for key ${key}:`, error);
  }
}

export async function clearSecureStorage() {
  try {
    await EncryptedStorage.clear();
  } catch (error) {
    console.error('Failed to clear secure storage:', error);
  }
}
