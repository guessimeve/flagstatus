import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ActivityIndicator,
  SafeAreaView, ScrollView, StatusBar, Platform,
  TouchableOpacity, Linking, Modal, useWindowDimensions,
} from 'react-native';
import FlagPole from './FlagPole';

const API_BASE = Platform.OS === 'web' ? '' : 'http://localhost:3001';
const FEEDBACK_EMAIL = 'hello@example.com'; // TODO: replace
const BMC_URL = 'https://buymeacoffee.com/YOUR_USERNAME'; // TODO: replace

// ── Colors ───────────────────────────────────────────────────────────────────

const C = {
  // Hero — full staff (deep navy)
  heroFull:     '#0D1B2A',
  heroFullSub:  '#1E3A52',
  textOnFull:   '#F0EDE6',
  mutedOnFull:  '#7A9BB5',
  // Hero — half mast (deep burgundy)
  heroHalf:     '#1A0608',
  heroHalfSub:  '#3B1015',
  textOnHalf:   '#F0E8E6',
  mutedOnHalf:  '#9B6E72',
  // Content area (always light)
  bg:           '#F7F6F1',
  ink:          '#111111',
  muted:        '#777777',
  rule:         '#D8D5CC',
  white:        '#FFFFFF',
  red:          '#B22234',
  navy:         '#1a1a4e',
  accent:       '#C8102E',
};

// ── US States ────────────────────────────────────────────────────────────────

const US_STATES = [
  { code: 'AL', name: 'Alabama' },       { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },       { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },    { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },   { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },       { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },        { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },      { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },          { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },      { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },         { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },     { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },      { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },      { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },    { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },{ code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },          { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },        { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },         { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },       { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },    { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },     { code: 'WY', name: 'Wyoming' },
];

// ── Fonts ────────────────────────────────────────────────────────────────────

// Grain texture data URL (computed once — RN Web supports backgroundImage inline)
const GRAIN_URL = Platform.OS === 'web'
  ? `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="200" height="200" filter="url(#n)"/></svg>')}")`
  : null;

function useWebFonts() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (document.getElementById('flagstatus-fonts')) return;
    const link = document.createElement('link');
    link.id = 'flagstatus-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap';
    document.head.appendChild(link);
  }, []);
}

const SERIF = Platform.OS === 'web' ? '"DM Serif Display", Georgia, serif' : undefined;
const SANS  = Platform.OS === 'web' ? '"DM Sans", system-ui, sans-serif'  : undefined;

// ── Statutory dates ──────────────────────────────────────────────────────────

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

// ── State picker modal ───────────────────────────────────────────────────────

function StatePicker({ value, onChange, textColor, mutedColor }) {
  const [open, setOpen] = useState(false);
  const stateName = value ? US_STATES.find(s => s.code === value)?.name : null;

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.locationRow}>
        <Text style={styles.locationPin}>📍</Text>
        <Text style={[styles.locationName, { color: textColor }]}>
          {stateName ?? 'Select your state'}
        </Text>
        <Text style={[styles.locationChange, { color: mutedColor }]}>
          {stateName ? 'change' : '›'}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your location</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView bounces={false}>
              {value ? (
                <TouchableOpacity style={styles.modalRow} onPress={() => { onChange(null); setOpen(false); }}>
                  <Text style={[styles.modalRowText, { color: C.muted }]}>Use auto-detect</Text>
                </TouchableOpacity>
              ) : null}
              {US_STATES.map(s => (
                <TouchableOpacity
                  key={s.code}
                  style={[styles.modalRow, s.code === value && styles.modalRowActive]}
                  onPress={() => { onChange(s.code); setOpen(false); }}
                >
                  <Text style={[styles.modalRowText, s.code === value && styles.modalRowActiveText]}>
                    {s.name}
                  </Text>
                  {s.code === value ? <Text style={{ color: C.navy }}>✓</Text> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Reason card (shown when at half-mast) ────────────────────────────────────

function ReasonCard({ national, state }) {
  const item = national?.status === 'half' && national?.reason ? national
             : state?.status   === 'half' && state?.reason    ? state
             : null;

  if (!item) return null;

  const isNational = national?.status === 'half' && national?.reason;
  const issuer     = isNational ? 'Presidential Proclamation' : 'Governor\'s Order';
  // Use stored URL, force https, or fall back to source domain
  const rawUrl  = item.url ?? (item.source ? `https://${item.source}` : null);
  const linkUrl = rawUrl ? rawUrl.replace(/^http:\/\//i, 'https://') : null;
  const linkLabel  = isNational ? 'proclamation' : 'order';

  return (
    <View style={styles.reasonCard}>
      <Text style={styles.reasonCardEyebrow}>Why the flag is at half-mast</Text>
      <Text style={styles.reasonCardText}>"{item.reason}"</Text>
      <View style={styles.reasonCardFooter}>
        <Text style={styles.reasonCardIssuer}>— {issuer}</Text>
        {linkUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(linkUrl)}>
            <Text style={styles.reasonCardLink}>Read the full {linkLabel} ↗</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function App() {
  useWebFonts();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMd = windowWidth >= 768;
  const isLg = windowWidth >= 1024;

  const [flagData,    setFlagData]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [geoState,    setGeoState]    = useState(null);
  const [pickedState, setPickedState] = useState(null);
  const [updatedAt,   setUpdatedAt]   = useState(null);

  const effectiveState = pickedState ?? geoState;

  useEffect(() => { getStateCode().then(setGeoState); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE}/api/status${effectiveState ? `?state=${effectiveState}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) { setFlagData(data); setUpdatedAt(new Date()); setError(null); }
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [effectiveState]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.heroFull }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={C.mutedOnFull} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.heroFull }]}>
        <StatusBar barStyle="light-content" />
        <Text style={[styles.errorTitle, { color: C.textOnFull }]}>Could not load status</Text>
        <Text style={[styles.errorDetail, { color: C.mutedOnFull }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  const isHalf      = flagData?.effective === 'half';
  const isNatHalf   = flagData?.national?.status === 'half';
  const isStateHalf = flagData?.state?.status === 'half';

  const heroBg     = isHalf ? C.heroHalf    : C.heroFull;
  const textColor  = isHalf ? C.textOnHalf  : C.textOnFull;
  const mutedColor = isHalf ? C.mutedOnHalf : C.mutedOnFull;

  const statusLabel = isHalf ? 'At Half-Mast' : 'Full Staff';
  const stateName   = effectiveState ? US_STATES.find(s => s.code === effectiveState)?.name : null;
  const upcoming    = upcomingDates();
  const updatedStr  = updatedAt
    ? updatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: heroBg }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO (full viewport height) ── */}
        <View style={[styles.hero, {
          minHeight: windowHeight,
          backgroundColor: heroBg,
          paddingVertical: isMd ? 80 : 48,
          gap: isMd ? 28 : 20,
        }]}>
          {/* Film grain + vignette overlays (web only — RN Web passes backgroundImage through) */}
          {Platform.OS === 'web' ? <>
            <View pointerEvents="none" style={[styles.heroOverlay, {
              backgroundImage: GRAIN_URL,
              backgroundSize: '200px 200px',
              opacity: 0.09,
              mixBlendMode: 'overlay',
            }]} />
            <View pointerEvents="none" style={[styles.heroOverlay, {
              backgroundImage: 'radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,0.5) 100%)',
            }]} />
          </> : null}

          <FlagPole isHalf={isHalf} scale={isLg ? 1.35 : isMd ? 1.15 : 1} />

          <Text style={[styles.headline, {
            color: textColor,
            fontSize: isLg ? 76 : isMd ? 62 : 52,
            lineHeight: isLg ? 84 : isMd ? 70 : 58,
          }]}>{statusLabel}</Text>

          <StatePicker
            value={effectiveState}
            onChange={setPickedState}
            textColor={textColor}
            mutedColor={mutedColor}
          />

          {updatedStr ? (
            <Text style={[styles.updatedAt, { color: mutedColor }]}>as of {updatedStr}</Text>
          ) : null}

          {/* Reason — lives inside the dark hero when at half-mast */}
          {isHalf ? (
            <ReasonCard national={flagData?.national} state={flagData?.state} />
          ) : null}

          <Text style={[styles.scrollHint, { color: mutedColor }]}>↓</Text>
        </View>

        {/* ── CONTENT AREA (light background) ── */}
        <View style={styles.content}>
        <View style={styles.contentInner}>

          {/* Status breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Current status</Text>

            <View style={[styles.statusRow, { borderTopColor: C.rule }]}>
              <View style={styles.statusLeft}>
                <Text style={styles.statusScope}>National</Text>
                <Text style={styles.statusSub}>Presidential order</Text>
                {isNatHalf && flagData?.national?.reason ? (
                  <Text style={styles.statusReason}>{flagData.national.reason}</Text>
                ) : null}
              </View>
              <Text style={[styles.statusBadge, { color: isNatHalf ? C.red : C.navy }]}>
                {isNatHalf ? 'Half-Mast' : 'Full Staff'}
              </Text>
            </View>

            {effectiveState ? (
              <View style={[styles.statusRow, { borderTopColor: C.rule }]}>
                <View style={styles.statusLeft}>
                  <Text style={styles.statusScope}>{stateName ?? effectiveState}</Text>
                  <Text style={styles.statusSub}>Governor's order</Text>
                  {isStateHalf && flagData?.state?.reason ? (
                    <Text style={styles.statusReason}>{flagData.state.reason}</Text>
                  ) : null}
                </View>
                <Text style={[styles.statusBadge, { color: isStateHalf ? C.red : C.navy }]}>
                  {isStateHalf ? 'Half-Mast' : 'Full Staff'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Upcoming dates */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Upcoming half-mast dates</Text>
            {upcoming.map(item => (
              <View key={item.label} style={[styles.upcomingRow, { borderTopColor: C.rule }]}>
                <View style={styles.upcomingNum}>
                  <Text style={styles.upcomingDays}>{item.days}</Text>
                  <Text style={styles.upcomingDaysLabel}>days</Text>
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingName}>{item.label}</Text>
                  <Text style={styles.upcomingDate}>{item.dateStr}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => Linking.openURL(BMC_URL)}>
              <Text style={styles.footerSupport}>☕ Enjoying this project? Buy me a coffee</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=Flag%20Status%20Feedback`)}>
              <Text style={styles.footerFeedback}>Found a bug or have feedback? Let me know →</Text>
            </TouchableOpacity>
          </View>

        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Hero ──
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 20,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  headline: {
    fontFamily: SERIF,
    fontSize: 52,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 58,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  locationPin: {
    fontSize: 16,
  },
  locationName: {
    fontFamily: SANS,
    fontSize: 17,
    fontWeight: '500',
  },
  locationChange: {
    fontFamily: SANS,
    fontSize: 13,
    marginLeft: 2,
  },
  updatedAt: {
    fontFamily: SANS,
    fontSize: 12,
  },
  scrollHint: {
    fontFamily: SANS,
    fontSize: 20,
    position: 'absolute',
    bottom: 28,
  },

  // ── Content area ──
  content: {
    backgroundColor: C.bg,
    paddingBottom: 60,
  },
  contentInner: {
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
  },

  // ── Reason card (article snippet, inside dark hero) ──
  reasonCard: {
    marginHorizontal: 24,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#F5F0E8',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 10,
    // Shadow so it lifts off the dark background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  reasonCardEyebrow: {
    fontFamily: SANS,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: C.red,
  },
  reasonCardText: {
    fontFamily: SERIF,
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 27,
    color: '#1a1a1a',
  },
  reasonCardFooter: {
    gap: 6,
    marginTop: 2,
  },
  reasonCardIssuer: {
    fontFamily: SANS,
    fontSize: 12,
    color: '#666',
  },
  reasonCardLink: {
    fontFamily: SANS,
    fontSize: 13,
    fontWeight: '600',
    color: C.navy,
  },

  // ── Sections ──
  section: {
    marginHorizontal: 24,
    marginTop: 36,
  },
  sectionLabel: {
    fontFamily: SANS,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 4,
  },

  // ── Status rows ──
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 18,
    borderTopWidth: 1,
  },
  statusLeft: { flex: 1 },
  statusScope: {
    fontFamily: SANS,
    fontSize: 16,
    fontWeight: '600',
    color: C.ink,
  },
  statusSub: {
    fontFamily: SANS,
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  statusReason: {
    fontFamily: SANS,
    fontSize: 13,
    color: C.ink,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 18,
    opacity: 0.7,
  },
  statusBadge: {
    fontFamily: SANS,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 16,
    marginTop: 3,
  },

  // ── Upcoming ──
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  upcomingNum: {
    width: 52,
    alignItems: 'flex-end',
    marginRight: 20,
  },
  upcomingDays: {
    fontFamily: SERIF,
    fontSize: 28,
    color: C.ink,
    lineHeight: 30,
  },
  upcomingDaysLabel: {
    fontFamily: SANS,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: C.muted,
  },
  upcomingInfo: { flex: 1 },
  upcomingName: {
    fontFamily: SANS,
    fontSize: 15,
    fontWeight: '500',
    color: C.ink,
  },
  upcomingDate: {
    fontFamily: SANS,
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: 48,
    paddingHorizontal: 24,
  },
  footerSupport: {
    fontFamily: SANS,
    fontSize: 15,
    fontWeight: '600',
    color: C.navy,
  },
  footerFeedback: {
    fontFamily: SANS,
    fontSize: 12,
    color: C.muted,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '72%',
    paddingBottom: 32,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#D0D0D0',
    alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
  },
  modalTitle: {
    fontFamily: SANS,
    fontSize: 15,
    fontWeight: '600',
    color: C.ink,
  },
  modalDone: {
    fontFamily: SANS,
    fontSize: 15,
    fontWeight: '600',
    color: C.navy,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalRowActive: { backgroundColor: '#F0F0F8' },
  modalRowText: {
    fontFamily: SANS,
    fontSize: 15,
    color: C.ink,
  },
  modalRowActiveText: {
    color: C.navy,
    fontWeight: '600',
  },

  // ── Loading / error ──
  errorTitle:  { fontFamily: SERIF, fontSize: 22, textAlign: 'center', marginBottom: 8 },
  errorDetail: { fontFamily: SANS, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});
