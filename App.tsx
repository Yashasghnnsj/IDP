import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { RootStackParamList } from './src/navigation/types';
import { PaperTheme } from './src/theme';

// i18n must be imported early
import './src/services/i18n';

// Database
import { initDatabase } from './src/services/database';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import ConsentScreen from './src/screens/onboarding/ConsentScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import RecordingScreen from './src/screens/recording/RecordingScreen';
import AIProcessingScreen from './src/screens/diagnostic/AIProcessingScreen';
import ResultScreen from './src/screens/diagnostic/ResultScreen';
import BreathingExerciseScreen from './src/screens/breathing/BreathingExerciseScreen';
import HistoryScreen from './src/screens/health/HistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Initialize local SQLite database on app start
    initDatabase();
  }, []);

  return (
    <PaperProvider theme={PaperTheme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Consent" component={ConsentScreen} />
          <Stack.Screen name="Auth" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Recording" component={RecordingScreen} />
          <Stack.Screen name="AIProcessing" component={AIProcessingScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="Breathing" component={BreathingExerciseScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}