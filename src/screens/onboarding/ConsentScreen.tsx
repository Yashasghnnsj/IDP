import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Radius, Shadows } from '../../theme';
import { wp, hp } from '../../utils/responsive';

const CONSENT_ITEMS = [
  {
    key: 'terms',
    icon: 'file-document-outline',
    title: 'Terms & Conditions',
    text: 'I agree to the AcuSound Terms of Service and understand that this app is a research prototype.',
  },
  {
    key: 'privacy',
    icon: 'shield-lock-outline',
    title: 'Privacy Policy',
    text: 'I consent to the collection and local storage of my audio recordings for respiratory analysis.',
  },
  {
    key: 'audio',
    icon: 'microphone-outline',
    title: 'Audio Recording Consent',
    text: 'I grant permission for AcuSound to access and record audio from my device microphone.',
  },
  {
    key: 'health',
    icon: 'heart-pulse',
    title: 'Health Data Consent',
    text: 'I understand that my health data is stored encrypted on-device and is not shared with third parties.',
  },
];

type Props = {
  onAccept: () => void;
};

export default function ConsentScreen({ onAccept }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    terms: false,
    privacy: false,
    audio: false,
    health: false,
  });

  const allChecked = Object.values(checked).every(Boolean);

  const toggle = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <View style={styles.iconCircle}>
          <Icon name="shield-check" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Privacy & Consent</Text>
        <Text style={styles.subtitle}>
          Please review and accept all consents to continue using AcuSound.
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Medical Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Icon name="alert-circle-outline" size={18} color={Colors.warning} style={{ marginRight: 8 }} />
          <Text style={styles.disclaimerText}>
            AcuSound is NOT a substitute for professional medical diagnosis. Results are for informational purposes only.
          </Text>
        </View>

        {/* Consent Items */}
        {CONSENT_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.consentCard, checked[item.key] && styles.consentCardChecked]}
            onPress={() => toggle(item.key)}
            activeOpacity={0.85}
          >
            <View style={styles.consentLeft}>
              <Icon name={item.icon} size={22} color={checked[item.key] ? Colors.primary : Colors.textSecondary} />
            </View>
            <View style={styles.consentBody}>
              <Text style={[styles.consentTitle, checked[item.key] && { color: Colors.primary }]}>
                {item.title}
              </Text>
              <Text style={styles.consentText}>{item.text}</Text>
            </View>
            <Checkbox
              status={checked[item.key] ? 'checked' : 'unchecked'}
              color={Colors.primary}
              onPress={() => toggle(item.key)}
            />
          </TouchableOpacity>
        ))}

        {/* Progress */}
        <Text style={styles.progressText}>
          {Object.values(checked).filter(Boolean).length}/{CONSENT_ITEMS.length} consents accepted
        </Text>
      </ScrollView>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.btn, !allChecked && styles.btnDisabled]}
        onPress={allChecked ? onAccept : undefined}
        activeOpacity={allChecked ? 0.85 : 1}
      >
        <Icon name="check-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.btnLabel}>I Accept All — Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: hp(7),
  },
  headerBox: { alignItems: 'center', marginBottom: Spacing.lg },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  scroll: { flex: 1 },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8ED',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  disclaimerText: { flex: 1, fontSize: 12, color: '#7A5C00', lineHeight: 18 },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    ...Shadows.soft,
  },
  consentCardChecked: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  consentLeft: { marginRight: Spacing.sm, width: 28, alignItems: 'center' },
  consentBody: { flex: 1 },
  consentTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  consentText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textSecondary,
    marginVertical: Spacing.md,
    fontWeight: '600',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    ...Shadows.medium,
    marginTop: Spacing.sm,
  },
  btnDisabled: { backgroundColor: '#C0C8D8', ...Shadows.soft },
  btnLabel: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
