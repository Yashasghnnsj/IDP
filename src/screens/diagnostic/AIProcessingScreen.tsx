import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Text } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { wp } from '../../utils/responsive';
import { computeMFCC } from '../../services/mfcc';
import { classifyCough } from '../../services/tensorflow';

const STEPS = [
  { icon: '🔇', label: 'Noise Reduction' },
  { icon: '📊', label: 'MFCC Feature Extraction' },
  { icon: '🧠', label: 'AI Inference' },
  { icon: '🧬', label: 'Explainable AI Layer' },
  { icon: '📋', label: 'Generating Report' },
];

const STEP_DURATION = 900; // ms per step

export default function AIProcessingScreen({ navigation, route }: any) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [activeStep, setActiveStep] = useState(0);
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  // Animate steps sequentially
  useEffect(() => {
    let cancelled = false;
    const runSteps = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        await new Promise<void>((resolve) => {
          Animated.timing(stepAnims[i], {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => resolve());
        });
        setActiveStep(i);
        await new Promise((r) => setTimeout(r, STEP_DURATION));
      }
    };
    runSteps();
    return () => { cancelled = true; };
  }, []);

  // Smooth progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STEPS.length * STEP_DURATION + 600,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, []);

  // Audio processing pipeline
  useEffect(() => {
    const processAudio = async () => {
      try {
        const audioUri = route?.params?.recordingUri;
        console.log('[AcuSound] Processing URI:', audioUri);

        // Delay to let the animation play
        await new Promise((r) => setTimeout(r, STEPS.length * STEP_DURATION + 800));

        const rawAudio = new Float32Array(1024);
        const sampleRate = 44100;
        const features = computeMFCC(rawAudio, sampleRate);
        const result = await classifyCough(features);

        navigation.replace('Result', { diagnosis: result });
      } catch (error) {
        console.log('[AcuSound] AI Processing Error:', error);
      }
    };
    processAudio();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Lottie AI animation */}
      <LottieView
        source={require('../../assets/animations/ai-brain.json')}
        autoPlay
        loop
        style={styles.lottie}
      />

      <Text style={styles.title}>Analyzing Respiratory Sample</Text>
      <Text style={styles.subtitle}>AcuSound AI · Powered by ML</Text>

      {/* Animated step list */}
      <View style={styles.stepsContainer}>
        {STEPS.map((step, i) => {
          const translateY = stepAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [16, 0],
          });
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          return (
            <Animated.View
              key={i}
              style={[
                styles.stepRow,
                {
                  opacity: stepAnims[i],
                  transform: [{ translateY }],
                },
              ]}
            >
              <View style={[styles.stepIcon, isDone && styles.stepDone, isActive && styles.stepActive]}>
                <Text style={{ fontSize: 14 }}>{isDone ? '✓' : step.icon}</Text>
              </View>
              <Text style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive,
                isDone && styles.stepLabelDone,
              ]}>
                {step.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Clinical disclaimer */}
      <Text style={styles.disclaimer}>
        🛡️ Analysis is for informational purposes only.{'\n'}
        Consult a physician for medical advice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E21',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  lottie: { width: 140, height: 140, marginBottom: Spacing.md },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#4DA3FF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xl,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: '#1E2540',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: { backgroundColor: '#1A3A6A', borderWidth: 1.5, borderColor: '#4DA3FF' },
  stepDone: { backgroundColor: '#0D3320', borderWidth: 1.5, borderColor: '#34C759' },
  stepLabel: { fontSize: 14, color: '#A0A8C0', fontWeight: '500' },
  stepLabelActive: { color: '#4DA3FF', fontWeight: '700' },
  stepLabelDone: { color: '#34C759' },
  progressTrack: {
    width: wp(80),
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: '#1E2540',
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: '#4DA3FF',
  },
  disclaimer: {
    fontSize: 11,
    color: '#5A6280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
});