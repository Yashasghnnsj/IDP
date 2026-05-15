import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Radius, Shadows, DarkColors } from '../../theme';
import { wp, hp } from '../../utils/responsive';
import { SkeletonCard, SkeletonRow } from '../../components/common/SkeletonLoader';
import { useHealthStore } from '../../store/healthStore';

// Weekly bar chart data (placeholder until real AI backend)
const WEEKLY_DATA = [
  { day: 'Mon', score: 82 },
  { day: 'Tue', score: 78 },
  { day: 'Wed', score: 91 },
  { day: 'Thu', score: 85 },
  { day: 'Fri', score: 70 },
  { day: 'Sat', score: 88 },
  { day: 'Sun', score: 95 },
];

const QUICK_ACTIONS = [
  { label: 'Reports', icon: 'file-chart-outline', screen: 'Reports' },
  { label: 'AI Chat', icon: 'robot-outline', screen: 'Chat' },
  { label: 'Doctor', icon: 'doctor', screen: 'Consultation' },
  { label: 'Breathe', icon: 'lungs', screen: 'Breathing' },
  { label: 'History', icon: 'history', screen: 'History' },
  { label: 'SOS', icon: 'alert-octagon-outline', screen: 'Emergency' },
];

const AIQ_TIPS = [
  'Try to avoid dust-heavy environments this week.',
  'Your breathing patterns suggest mild airway tightening. Stay hydrated.',
  'Great recovery trend! Keep up the breathing exercises.',
  'Air quality in your area is moderate. Wear a mask when outdoors.',
];

export default function HomeScreen({ navigation }: any) {
  const { records } = useHealthStore();
  const [loading, setLoading] = useState(true);
  const [tipIndex] = useState(() => Math.floor(Math.random() * AIQ_TIPS.length));

  // Header entrance animation
  const headerAnim = useRef(new Animated.Value(-40)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    // Simulate loading state
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const lastRecord = records[0];
  const riskColor = lastRecord?.risk === 'Low' ? Colors.success : lastRecord?.risk === 'High' ? Colors.danger : Colors.warning;

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <Animated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerAnim }], opacity: headerOpacity },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Morning 👋</Text>
            <Text style={styles.greetingSub}>Your respiratory health report</Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton icon="bell-outline" size={22} iconColor="#FFF" onPress={() => {}} />
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarCircle}>
              <Icon name="account" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary pills */}
        <View style={styles.headerPills}>
          <View style={styles.pill}>
            <Icon name="lungs" size={14} color="#FFF" />
            <Text style={styles.pillText}>{lastRecord ? lastRecord.disease : 'No scans yet'}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: `${riskColor}55` }]}>
            <Icon name="shield-check-outline" size={14} color={riskColor} />
            <Text style={[styles.pillText, { color: riskColor }]}>
              {lastRecord ? `${lastRecord.risk} Risk` : '—'}
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- HERO: Start Recording --- */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => navigation.navigate('Recording')}
          activeOpacity={0.92}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>Start AI Scan</Text>
            <Text style={styles.heroSub}>Record your cough for instant analysis</Text>
            <View style={styles.heroBadge}>
              <Icon name="lightning-bolt" size={12} color="#FFF" />
              <Text style={styles.heroBadgeText}>Instant Results</Text>
            </View>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.heroMicCircle}>
              <Icon name="microphone" size={32} color="#FFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* --- AI INSIGHT CARD --- */}
        <View style={styles.insightCard}>
          <Icon name="robot-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>AI Health Insight</Text>
            <Text style={styles.insightText}>{AIQ_TIPS[tipIndex]}</Text>
          </View>
        </View>

        {/* --- HEALTH METRICS ROW --- */}
        <Text style={styles.sectionTitle}>Health Metrics</Text>
        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} style={{ width: 130, marginRight: 12 }} />)}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsRow}>
            <MetricCard title="Lung Score" value="8.2/10" sub="Healthy" color="#4DA3FF" icon="lungs" />
            <MetricCard title="Last Scan" value={lastRecord?.date?.slice(0, 5) ?? '—'} sub={lastRecord?.disease ?? 'No data'} color="#FF9500" icon="calendar-clock" />
            <MetricCard title="Oxygen Est." value="98%" sub="Normal" color="#34C759" icon="water-outline" />
            <MetricCard title="Scan Streak" value="5 days" sub="Keep going!" color="#FF4D6D" icon="fire" />
          </ScrollView>
        )}

        {/* --- WEEKLY TREND BAR CHART --- */}
        <Text style={styles.sectionTitle}>Weekly Respiratory Trend</Text>
        <View style={styles.chartCard}>
          {loading ? (
            <SkeletonRow width="100%" height={80} />
          ) : (
            <View style={styles.barChart}>
              {WEEKLY_DATA.map((d) => (
                <View key={d.day} style={styles.barGroup}>
                  <View style={[styles.bar, { height: hp(0.08) * d.score, backgroundColor: d.score > 85 ? '#34C759' : d.score > 70 ? '#4DA3FF' : '#FF9500' }]} />
                  <Text style={styles.barLabel}>{d.day}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.chartCaption}>Respiratory health score (0–100)</Text>
        </View>

        {/* --- DAILY WELLNESS SCORE --- */}
        <Text style={styles.sectionTitle}>Today's Wellness Score</Text>
        <WellnessScore score={lastRecord?.confidence ?? 78} loading={loading} />

        {/* --- QUICK ACTIONS --- */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.actionCard, item.label === 'SOS' && styles.actionCardSOS]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.82}
            >
              <Icon
                name={item.icon}
                size={26}
                color={item.label === 'SOS' ? '#FFF' : Colors.primary}
              />
              <Text style={[styles.actionLabel, item.label === 'SOS' && { color: '#FFF' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- DISCLAIMER --- */}
        <View style={styles.disclaimerBox}>
          <Icon name="shield-alert-outline" size={14} color={Colors.warning} />
          <Text style={styles.disclaimerText}>
            AcuSound is not a substitute for professional medical diagnosis.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function MetricCard({ title, value, sub, color, icon }: { title: string; value: string; sub: string; color: string; icon: string }) {
  return (
    <View style={[metricStyles.card, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Icon name={icon} size={20} color={color} style={{ marginBottom: 6 }} />
      <Text style={metricStyles.value}>{value}</Text>
      <Text style={metricStyles.title}>{title}</Text>
      <Text style={[metricStyles.sub, { color }]}>{sub}</Text>
    </View>
  );
}

function WellnessScore({ score, loading }: { score: number; loading: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!loading) {
      Animated.timing(anim, { toValue: score / 100, duration: 1200, useNativeDriver: false }).start();
    }
  }, [loading]);

  const barWidth = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const color = score >= 80 ? '#34C759' : score >= 60 ? '#FF9500' : '#FF4D6D';

  return (
    <View style={wellStyles.card}>
      {loading ? <SkeletonRow width="100%" height={60} /> : (
        <>
          <View style={wellStyles.topRow}>
            <Text style={wellStyles.scoreNumber}>{score}</Text>
            <Text style={wellStyles.scoreLabel}> / 100</Text>
            <View style={[wellStyles.badge, { backgroundColor: `${color}22` }]}>
              <Text style={[wellStyles.badgeText, { color }]}>
                {score >= 80 ? 'Excellent' : score >= 60 ? 'Moderate' : 'Needs Attention'}
              </Text>
            </View>
          </View>
          <View style={wellStyles.track}>
            <Animated.View style={[wellStyles.fill, { width: barWidth, backgroundColor: color }]} />
          </View>
          <Text style={wellStyles.hint}>Based on last scan confidence score</Text>
        </>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: hp(6),
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  greeting: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  greetingSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerPills: { flexDirection: 'row', gap: Spacing.sm },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full,
  },
  pillText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.lg },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
    overflow: 'hidden',
  },
  heroLeft: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.sm },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  heroBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  heroRight: { alignItems: 'center', justifyContent: 'center' },
  heroMicCircle: {
    width: 70, height: 70, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}12`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    alignItems: 'flex-start',
  },
  insightTitle: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 3 },
  insightText: { fontSize: 13, color: Colors.text, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  metricsRow: { marginBottom: Spacing.lg },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: hp(10) },
  barGroup: { alignItems: 'center', flex: 1 },
  bar: { width: 10, borderRadius: 5, marginBottom: 4 },
  barLabel: { fontSize: 10, color: Colors.textSecondary },
  chartCaption: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  actionCard: {
    width: (wp(100) - Spacing.lg * 2 - Spacing.sm * 2) / 3,
    backgroundColor: '#FFF',
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    ...Shadows.soft,
  },
  actionCardSOS: { backgroundColor: Colors.danger },
  actionLabel: { marginTop: 6, fontSize: 12, fontWeight: '700', color: Colors.text },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8ED',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: Colors.warning },
});

const metricStyles = StyleSheet.create({
  card: {
    width: 130,
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    ...Shadows.soft,
  },
  value: { fontSize: 20, fontWeight: '800', color: Colors.text },
  title: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  sub: { fontSize: 11, fontWeight: '600' },
});

const wellStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  topRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.sm },
  scoreNumber: { fontSize: 36, fontWeight: '900', color: Colors.text },
  scoreLabel: { fontSize: 16, color: Colors.textSecondary },
  badge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: 12, fontWeight: '700' },
  track: { height: 8, backgroundColor: '#E8ECF4', borderRadius: Radius.full, overflow: 'hidden', marginBottom: 8 },
  fill: { height: '100%', borderRadius: Radius.full },
  hint: { fontSize: 11, color: Colors.textSecondary },
});