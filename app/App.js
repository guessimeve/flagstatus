import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ActivityIndicator,
  SafeAreaView, ScrollView, StatusBar, Platform,
} from 'react-native';
import FlagPole from './FlagPole';

const API_BASE = 'http://localhost:3001';

const COLORS = {
  red:    '#B22234',
  white:  '#FFFFFF',
  navy:   '#3C3B6E',
  bg:     '#F5F4F0',
  bgHalf: '#FDF5F5',
  muted:  '#888',
  border: '#E0DED8',
};

// ── Next statutory dates ─────────────────────────────────────────────────────

function lastMondayOfMay(year) {
  const last = new Date(year, 5, 0);
  return new Date(year, 4, last.getDate() - ((last.getDay() + 6) % 7));
}

function upcomingDates(from = new Date(), count = 3) {
  const year = from.getFullYear();
  const fixed = [
    { month: 4,  day: 15, label: 'Peace Officers Memorial Day' },
    { month: 8,  day: 11, label: 'Patriot Day'                 },
    { month: 11, day: 7,  label: 'Pearl Harbor Remembrance Day'},
  ];
  const candidates = [];
  for (const y of [year, year + 1]) {
    for (const { month, day, label } of fixed)
      candidates.push({ date: new Date(y, month, day), label });
    candidates.push({ date: lastMondayOfMay(y), label: 'Memorial Day' });
  }
  return candidates
    .filter(c => c.date > from)
    .sort((a, b) => a.date - b.date)
    .slice(0, count)
    .map(({ date, label }) => ({
      label,
      dateStr: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      days: Math.ceil((date - from) / 86_400_000),
    }));
}

// ── Geolocation ──────────────────────────────────────────────────────────────

async function getStateCode() {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      if (!navigator?.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const raw = data?.address?.['ISO3166-2-lvl4'] ?? '';
            resolve(raw.replace('US-', '') || null);
          } catch { resolve(null); }
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  }
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({});
    const [place] = await Location.reverseGeocodeAsync(pos.coords);
    return place?.region ?? null;
  } catch { return null; }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function StatusRow({ label, sublabel, data, isHalf, isLast }) {
  const color = isHalf ? COLORS.red : COLORS.navy;
  const statusText = isHalf ? 'Half Staff' : 'Full Staff';
  return (
    <View style={[styles.statusRow, !isLast && styles.statusRowBorder]}>
      <View style={styles.statusRowLeft}>
        <Text style={styles.statusRowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.statusRowSublabel}>{sublabel}</Text> : null}
        {data?.reason ? (
          <Text style={styles.statusRowReason}>{data.reason}</Text>
        ) : null}
        {data?.source ? (
          <Text style={styles.statusRowSource}>{data.source}</Text>
        ) : null}
      </View>
      <View style={styles.statusRowRight}>
        <View style={[styles.dot, { backgroundColor: color, marginBottom: 4 }]} />
        <Text style={[styles.statusRowStatus, { color }]}>{statusText}</Text>
      </View>
    </View>
  );
}

function UpcomingRow({ label, dateStr, days }) {
  return (
    <View style={styles.upcomingRow}>
      <View style={styles.upcomingLeft}>
        <Text style={styles.daysNum}>{days}</Text>
        <Text style={styles.daysUnit}>days</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.upcomingLabel}>{label}</Text>
        <Text style={styles.upcomingDate}>{dateStr}</Text>
      </View>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [flagData,  setFlagData]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [stateCode, setStateCode] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const state = await getStateCode();
        if (!cancelled) setStateCode(state);
        const url = `${API_BASE}/api/status${state ? `?state=${state}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) { setFlagData(data); setUpdatedAt(new Date()); }
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: COLORS.bg }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={COLORS.red} />
        <Text style={styles.loadingText}>Checking flag status…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: COLORS.bg }]}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>Could not load flag status</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </SafeAreaView>
    );
  }

  const isHalf      = flagData?.effective === 'half';
  const isStateHalf = flagData?.state?.status === 'half';
  const statusLabel = isHalf ? 'HALF STAFF' : 'FULL STAFF';
  const statusColor = isHalf ? COLORS.red : COLORS.navy;
  const bg          = isHalf ? COLORS.bgHalf : COLORS.bg;
  const reason      = flagData?.effectiveReason ?? null;
  const upcoming    = upcomingDates();
  const updatedStr  = updatedAt
    ? updatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.inner}>
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <FlagPole isHalf={isHalf} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          {reason ? (
            <View style={[styles.reasonPill, { borderColor: statusColor }]}>
              <Text style={[styles.reasonPillText, { color: statusColor }]}>{reason}</Text>
            </View>
          ) : null}
          {updatedStr || stateCode ? (
            <View style={styles.heroMeta}>
              {stateCode ? <Text style={styles.metaText}>📍 {stateCode}</Text> : null}
              {updatedStr ? <Text style={styles.metaText}>Updated {updatedStr}</Text> : null}
            </View>
          ) : null}
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── National + State ── */}
        <SectionHeader title="Current Status" />
        <View style={styles.statusCard}>
          <StatusRow
            label="National"
            sublabel="Presidential order"
            data={flagData?.national}
            isHalf={flagData?.national?.status === 'half'}
            isLast={!stateCode}
          />
          {stateCode ? (
            <StatusRow
              label={stateCode}
              sublabel="Governor's order"
              data={flagData?.state}
              isHalf={isStateHalf}
              isLast
            />
          ) : null}
        </View>

        {/* ── Upcoming ── */}
        <SectionHeader title="Upcoming Half-Staff Dates" />
        <View>
          {upcoming.map((item, i) => (
            <React.Fragment key={item.label}>
              <UpcomingRow {...item} />
              {i < upcoming.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered:  { alignItems: 'center', justifyContent: 'center' },
  scroll:    { paddingBottom: 48 },

  // Centered max-width column
  inner: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 32,
    gap: 16,
  },
  statusText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  reasonPill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  reasonPillText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.muted,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 24,
    marginBottom: 4,
  },

  // Section headers
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.muted,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    marginTop: 28,
    marginBottom: 10,
  },

  // Status — single stacked card
  statusCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  statusRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusRowLeft: {
    flex: 1,
    gap: 3,
  },
  statusRowLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusRowSublabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  statusRowReason: {
    fontSize: 13,
    color: '#444',
    marginTop: 4,
    lineHeight: 18,
  },
  statusRowSource: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
  },
  statusRowRight: {
    alignItems: 'center',
    marginLeft: 16,
  },
  statusRowStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Upcoming rows — no outer box, just spaced rows with a strong day number
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  upcomingLeft: {
    width: 52,
    alignItems: 'center',
    marginRight: 16,
  },
  daysNum: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
    lineHeight: 26,
  },
  daysUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  upcomingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  upcomingDate: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 24 + 52 + 16, // aligns under the text, not the number
  },

  // Loading / error
  loadingText: { marginTop: 12, fontSize: 15, color: '#555' },
  errorEmoji:  { fontSize: 48, marginBottom: 12 },
  errorText:   { fontSize: 18, fontWeight: '600', color: COLORS.red, marginBottom: 8 },
  errorDetail: { fontSize: 13, color: '#666', textAlign: 'center' },
});
