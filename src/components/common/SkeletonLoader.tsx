import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Radius } from '../../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function SkeletonCard({ style }: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View style={[styles.card, { opacity }, style]} />
  );
}

export function SkeletonRow({ width = '100%', height = 16, style }: { width?: string | number; height?: number; style?: StyleProp<ViewStyle> }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  return (
    <Animated.View
      style={[
        styles.row,
        { width: width as any, height, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    height: 80,
    borderRadius: Radius.md,
    backgroundColor: '#E0E4F0',
    marginBottom: 12,
  },
  row: {
    borderRadius: Radius.full,
    backgroundColor: '#E0E4F0',
    marginBottom: 8,
  },
});
