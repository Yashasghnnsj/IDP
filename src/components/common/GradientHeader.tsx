import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme';

export function GradientHeader({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[Colors.primary, Colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: 50, paddingBottom: 60, paddingHorizontal: 20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}
    >
      {children}
    </LinearGradient>
  );
}