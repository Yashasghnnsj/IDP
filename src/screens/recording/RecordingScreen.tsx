import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { wp, hp } from '../../utils/responsive';
import {
  startRecording,
  stopRecording,
  requestAudioPermission,
} from '../../services/audioUtils';

// Generates a smooth waveform path from amplitude bars
function buildWavePath(bars: number[], width: number, height: number): string {
  const midY = height / 2;
  const barWidth = width / bars.length;
  const points = bars.map((amp, i) => {
    const x = i * barWidth + barWidth / 2;
    const y = midY - amp * midY * 0.9;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  });
  const mirroredPoints = [...bars]
    .reverse()
    .map((amp, i) => {
      const x = (bars.length - 1 - i) * barWidth + barWidth / 2;
      const y = midY + amp * midY * 0.9;
      return `L ${x} ${y}`;
    });
  return [...points, ...mirroredPoints, 'Z'].join(' ');
}

const WAVE_BARS = 40;

export default function RecordingScreen({ navigation }: any) {
  const [isRecording, setIsRecording] = useState(false);
  const [decibel, setDecibel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(WAVE_BARS).fill(0.05));
  const animPulse = useRef(new Animated.Value(1)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;
  const waveAnimRef = useRef<NodeJS.Timeout | null>(null);

  // Duration formatting: mm:ss
  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Live waveform simulation driven by real decibel value
  useEffect(() => {
    if (isRecording) {
      // Pulse ring animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animPulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
          Animated.timing(animPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(animOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

      // Animate waveform bars using latest decibel
      waveAnimRef.current = setInterval(() => {
        setBars((prev) => {
          const amplitude = Math.max(0.05, decibel / 100);
          const newBars = prev.map(() =>
            Math.max(0.05, amplitude * (0.4 + Math.random() * 0.6))
          );
          return newBars;
        });
      }, 80);
    } else {
      animPulse.stopAnimation();
      Animated.timing(animOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      setBars(Array(WAVE_BARS).fill(0.05));
      if (waveAnimRef.current) clearInterval(waveAnimRef.current);
    }
    return () => {
      if (waveAnimRef.current) clearInterval(waveAnimRef.current);
    };
  }, [isRecording, decibel]);

  const handleStart = async () => {
    try {
      await requestAudioPermission();
      setIsRecording(true);
      await startRecording(setDecibel, setDuration);
    } catch (error: any) {
      Alert.alert('Recording Error', error.message || 'Could not start recording.');
    }
  };

  const handleStop = async () => {
    try {
      const uri = await stopRecording();
      setIsRecording(false);
      navigation.navigate('AIProcessing', { recordingUri: uri });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not stop recording.');
    }
  };

  const CANVAS_W = wp(80);
  const CANVAS_H = hp(8);
  const wavePath = buildWavePath(bars, CANVAS_W, CANVAS_H);
  const skPath = Skia.Path.MakeFromSVGString(wavePath) ?? Skia.Path.Make();

  return (
    <View style={styles.container}>
      {/* Instruction banner */}
      <View style={styles.instructions}>
        <Icon name="information-outline" size={20} color={Colors.primary} />
        <Text style={styles.instructionText}>
          Stay quiet, hold phone 15–20 cm away, and cough when prompted.
        </Text>
      </View>

      {/* Clinical disclaimer */}
      <View style={styles.disclaimer}>
        <Icon name="shield-alert-outline" size={14} color={Colors.warning} />
        <Text style={styles.disclaimerText}>
          Not a substitute for professional medical diagnosis.
        </Text>
      </View>

      {/* Mic pulse button */}
      <View style={styles.micSection}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: animPulse }] }]} />
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonActive]}
          onPress={isRecording ? handleStop : handleStart}
          activeOpacity={0.85}
        >
          <Icon name={isRecording ? 'stop' : 'microphone'} size={42} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Duration counter */}
      <Animated.View style={[styles.timerContainer, { opacity: animOpacity }]}>
        <View style={styles.timerDot} />
        <Text style={styles.timerText}>{formatDuration(duration)}</Text>
        <Text style={styles.timerLabel}>Recording...</Text>
      </Animated.View>

      {/* Live Skia waveform */}
      <Animated.View style={[styles.waveformContainer, { opacity: animOpacity }]}>
        <Canvas style={{ width: CANVAS_W, height: CANVAS_H }}>
          <Path
            path={skPath}
            color={Colors.primary}
            style="fill"
            opacity={0.85}
          />
        </Canvas>
      </Animated.View>

      {/* Decibel meter */}
      <Animated.View style={[styles.decibelRow, { opacity: animOpacity }]}>
        {[...Array(20)].map((_, i) => {
          const threshold = (i / 20) * 100;
          const active = decibel > threshold;
          return (
            <View
              key={i}
              style={[
                styles.decibelBar,
                {
                  height: 8 + (i / 20) * 20,
                  backgroundColor: active
                    ? i < 12 ? Colors.success : i < 17 ? Colors.warning : Colors.danger
                    : '#E0E4F0',
                },
              ]}
            />
          );
        })}
      </Animated.View>

      {/* State label */}
      <Text style={styles.statusLabel}>
        {isRecording ? 'Tap to stop and analyze' : 'Tap the microphone to begin'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.soft,
    width: '100%',
  },
  instructionText: { marginLeft: Spacing.sm, flex: 1, color: Colors.text, fontSize: 13 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8ED',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  disclaimerText: { marginLeft: 6, fontSize: 11, color: Colors.warning, flex: 1 },
  micSection: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: `${Colors.primary}55`,
    backgroundColor: `${Colors.primary}15`,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  micButtonActive: {
    backgroundColor: Colors.danger,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 8,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.danger,
  },
  timerText: { fontSize: 24, fontWeight: '700', color: Colors.text, letterSpacing: 2 },
  timerLabel: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4 },
  waveformContainer: {
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: `${Colors.primary}10`,
    padding: Spacing.sm,
  },
  decibelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: Spacing.lg,
  },
  decibelBar: {
    width: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});