import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { wp, hp } from '../../utils/responsive';

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest' | 'idle';

const PATTERNS: Record<string, { label: string; icon: string; phases: { phase: Phase; duration: number }[] }> = {
  box: {
    label: 'Box Breathing',
    icon: '⬛',
    phases: [
      { phase: 'inhale', duration: 4000 },
      { phase: 'hold', duration: 4000 },
      { phase: 'exhale', duration: 4000 },
      { phase: 'rest', duration: 4000 },
    ],
  },
  '478': {
    label: '4-7-8 Technique',
    icon: '🌙',
    phases: [
      { phase: 'inhale', duration: 4000 },
      { phase: 'hold', duration: 7000 },
      { phase: 'exhale', duration: 8000 },
    ],
  },
  calm: {
    label: 'Calm Breath',
    icon: '🍃',
    phases: [
      { phase: 'inhale', duration: 5000 },
      { phase: 'exhale', duration: 5000 },
    ],
  },
};

const PHASE_CONFIG: Record<Phase, { label: string; color: string; scale: number }> = {
  inhale: { label: 'Inhale', color: '#4DA3FF', scale: 1.3 },
  hold: { label: 'Hold', color: '#FF9500', scale: 1.3 },
  exhale: { label: 'Exhale', color: '#34C759', scale: 0.7 },
  rest: { label: 'Rest', color: '#A0A8C0', scale: 0.7 },
  idle: { label: 'Ready', color: Colors.primary, scale: 1.0 },
};

export default function BreathingExerciseScreen({ navigation }: any) {
  const [patternKey, setPatternKey] = useState<string>('box');
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [cycles, setCycles] = useState(0);

  const circleScale = useRef(new Animated.Value(1)).current;
  const circleOpacity = useRef(new Animated.Value(0.6)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const stopRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pattern = PATTERNS[patternKey];
  const config = PHASE_CONFIG[phase];

  useEffect(() => {
    if (active) {
      stopRef.current = false;
      runCycle();
    } else {
      stopRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      Animated.parallel([
        Animated.timing(circleScale, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(circleOpacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
      ]).start();
      setPhase('idle');
      setCountdown(0);
    }
  }, [active, patternKey]);

  const runCycle = async () => {
    while (!stopRef.current) {
      for (const step of pattern.phases) {
        if (stopRef.current) return;
        setPhase(step.phase);
        const cfg = PHASE_CONFIG[step.phase];
        const secs = step.duration / 1000;
        setCountdown(secs);

        // Animate circle
        Animated.parallel([
          Animated.timing(circleScale, {
            toValue: cfg.scale,
            duration: step.duration,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: true,
          }),
          Animated.timing(circleOpacity, {
            toValue: cfg.scale > 1 ? 1 : 0.55,
            duration: step.duration,
            useNativeDriver: true,
          }),
        ]).start();

        // Countdown
        await new Promise<void>((resolve) => {
          let remaining = secs;
          intervalRef.current = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);
            if (remaining <= 0) {
              clearInterval(intervalRef.current!);
              resolve();
            }
          }, 1000);
        });

        if (stopRef.current) return;
      }
      setCycles((c) => c + 1);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E21" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Breathing Exercise</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Pattern selector */}
      <View style={styles.patternRow}>
        {Object.entries(PATTERNS).map(([key, p]) => (
          <TouchableOpacity
            key={key}
            style={[styles.patternChip, patternKey === key && styles.patternChipActive]}
            onPress={() => { if (!active) setPatternKey(key); }}
          >
            <Text style={styles.patternChipIcon}>{p.icon}</Text>
            <Text style={[styles.patternChipLabel, patternKey === key && styles.patternChipLabelActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Animated breathing circle */}
      <View style={styles.circleWrapper}>
        {/* Outer decorative rings */}
        <View style={[styles.ring, { width: 280, height: 280, opacity: 0.08 }]} />
        <View style={[styles.ring, { width: 240, height: 240, opacity: 0.12 }]} />

        <Animated.View
          style={[
            styles.breathCircle,
            {
              backgroundColor: config.color,
              transform: [{ scale: circleScale }],
              opacity: circleOpacity,
            },
          ]}
        >
          <Text style={styles.phaseLabel}>{config.label}</Text>
          <Text style={styles.countdownText}>
            {active && countdown > 0 ? countdown : ''}
          </Text>
        </Animated.View>
      </View>

      {/* Cycle counter */}
      <Text style={styles.cycleText}>Cycles completed: {cycles}</Text>

      {/* Guidance text */}
      <Text style={styles.guidanceText}>
        {phase === 'inhale' && 'Breathe in slowly through your nose...'}
        {phase === 'hold' && 'Hold your breath gently...'}
        {phase === 'exhale' && 'Breathe out slowly through your mouth...'}
        {phase === 'rest' && 'Relax and rest...'}
        {phase === 'idle' && 'Tap Start to begin the exercise'}
      </Text>

      {/* Start / Stop button */}
      <TouchableOpacity
        style={[styles.actionBtn, active && styles.actionBtnStop]}
        onPress={() => setActive((a) => !a)}
        activeOpacity={0.85}
      >
        <Text style={styles.actionBtnText}>{active ? '⏹  Stop' : '▶  Start'}</Text>
      </TouchableOpacity>

      {/* Clinical note */}
      <Text style={styles.disclaimer}>
        🛡️ Consult your doctor before respiratory exercises if you have a diagnosed condition.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E21',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { color: '#4DA3FF', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  patternRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl, flexWrap: 'wrap', justifyContent: 'center' },
  patternChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: '#151A2E',
    borderWidth: 1.5,
    borderColor: '#252C44',
    gap: 6,
  },
  patternChipActive: { borderColor: '#4DA3FF', backgroundColor: '#0E1E3A' },
  patternChipIcon: { fontSize: 14 },
  patternChipLabel: { fontSize: 12, color: '#A0A8C0', fontWeight: '600' },
  patternChipLabelActive: { color: '#4DA3FF' },
  circleWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, height: 280 },
  ring: {
    position: 'absolute',
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: '#4DA3FF',
  },
  breathCircle: {
    width: 180,
    height: 180,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  phaseLabel: { fontSize: 20, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  countdownText: { fontSize: 38, fontWeight: '900', color: '#FFF', marginTop: 4 },
  cycleText: { fontSize: 13, color: '#A0A8C0', marginBottom: Spacing.sm },
  guidanceText: {
    fontSize: 15,
    color: '#C8D0E8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  actionBtn: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: '#4DA3FF',
    ...Shadows.soft,
    marginBottom: Spacing.lg,
  },
  actionBtnStop: { backgroundColor: '#FF4D6D' },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  disclaimer: {
    fontSize: 11,
    color: '#4A5272',
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 17,
  },
});
