import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, ActivityIndicator,
  SafeAreaView, ScrollView, StatusBar, Platform,
  TouchableOpacity, Linking, Modal, useWindowDimensions,
} from 'react-native';
import FlagPole from './FlagPole';

const API_BASE = (Platform.OS !== 'web' || (typeof __DEV__ !== 'undefined' && __DEV__))
  ? 'http://localhost:3001'
  : '';
const FEEDBACK_EMAIL = 'hello@example.com'; // TODO: replace

// ── Colors ───────────────────────────────────────────────────────────────────

const C = {
  // Hero — full staff (deep navy)
  heroFull:     '#0A1628',
  textOnFull:   '#E8E2D2',
  mutedOnFull:  '#4A6080',
  accentOnFull: '#6A90B0',
  ruleOnFull:   'rgba(215, 225, 245, 0.12)',
  // Hero — half-staff (near-black blood)
  heroHalf:       '#110303',
  textOnHalf:     '#EBE0D8',
  mutedOnHalf:    '#7A5252',
  accentOnHalf:   '#A85050',
  linkOnHalf:     '#C07070',
  captionOnHalf:  '#9B8A86',
  subtleOnHalf:   'rgba(255, 248, 240, 0.07)',
  ruleOnHalf:     'rgba(235, 224, 216, 0.12)',
  // Content area (always light)
  bg:       '#F7F3EA',
  ink:      '#0E0D0A',
  muted:    '#68655C',
  rule:     '#D6D1C4',
  divider:  '#C4BFB0',
  white:    '#FFFFFF',
  rowActive:'#F0F0F8',
  chrome:   '#D0D0D0',
  crimson:  '#A01818',
  navy:     '#1B2848',
  forest:   '#2A4528',
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

function useWebFonts() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!document.getElementById('flagstatus-fonts')) {
      const link = document.createElement('link');
      link.id = 'flagstatus-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('flagstatus-favicon')) {
      const favicon = document.createElement('link');
      favicon.id = 'flagstatus-favicon';
      favicon.rel = 'icon';
      favicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🇺🇸</text></svg>";
      document.head.appendChild(favicon);
    }
  }, []);
}

const SERIF = Platform.OS === 'web' ? '"Cormorant Garamond", Georgia, serif' : undefined;
const BODY  = Platform.OS === 'web' ? '"Crimson Pro", Georgia, serif'        : undefined;

const GRAIN_URL = Platform.OS === 'web'
  ? `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" seed="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="200" height="200" filter="url(#g)"/></svg>')}")`
  : null;

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

// ── State picker ─────────────────────────────────────────────────────────────

function StatePicker({ value, onChange, textColor, mutedColor }) {
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const stateName = value ? US_STATES.find(s => s.code === value)?.name : null;
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const filtered = US_STATES
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!search) return 0;
      const sl = search.toLowerCase();
      const aS = a.name.toLowerCase().startsWith(sl);
      const bS = b.name.toLowerCase().startsWith(sl);
      return aS === bS ? 0 : aS ? -1 : 1;
    });

  if (isDesktop) {
    return (
      <View style={{ alignItems: 'center', width: '100%' }}>
        <TouchableOpacity
          onPress={() => { setOpen(o => !o); setSearch(''); }}
          style={styles.locationRow}
          accessibilityLabel={stateName ? `State: ${stateName}. Tap to change.` : 'Select your state'}
          accessibilityRole="button"
        >
          <Text style={[styles.locationPin, { color: mutedColor }]}>◎</Text>
          <Text style={[styles.locationName, { color: textColor }]}>
            {stateName ?? 'Select your state'}
          </Text>
          <Text style={[styles.locationChange, { color: mutedColor }]}>
            {open ? '↑' : '↓'}
          </Text>
        </TouchableOpacity>

        {open ? (
          <View style={styles.dropdownPanel}>
            <View style={styles.dropdownSearchRow}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search states…"
                placeholderTextColor={C.muted}
                style={[styles.dropdownSearchInput, { outlineStyle: 'none' }]}
                autoFocus
              />
            </View>
            <ScrollView style={styles.dropdownList} bounces={false} keyboardShouldPersistTaps="handled">
              {value ? (
                <TouchableOpacity
                  style={styles.dropdownRow}
                  onPress={() => { onChange(null); setOpen(false); setSearch(''); }}
                >
                  <Text style={[styles.dropdownRowText, { color: C.muted, fontStyle: 'italic' }]}>
                    Use auto-detect
                  </Text>
                </TouchableOpacity>
              ) : null}
              {filtered.map(s => (
                <TouchableOpacity
                  key={s.code}
                  style={[styles.dropdownRow, s.code === value && styles.dropdownRowActive]}
                  onPress={() => { onChange(s.code); setOpen(false); setSearch(''); }}
                >
                  <Text style={[styles.dropdownRowText, s.code === value && styles.dropdownRowActiveText]}>
                    {s.name}
                  </Text>
                  {s.code === value ? <Text style={{ color: C.navy, fontFamily: BODY }}>✓</Text> : null}
                </TouchableOpacity>
              ))}
              {filtered.length === 0 ? (
                <View style={styles.dropdownRow}>
                  <Text style={[styles.dropdownRowText, { color: C.muted }]}>No states found</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.locationRow}
        accessibilityLabel={stateName ? `State: ${stateName}. Tap to change.` : 'Select your state'}
        accessibilityRole="button"
      >
        <Text style={[styles.locationPin, { color: mutedColor }]}>◎</Text>
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
              <TouchableOpacity onPress={() => setOpen(false)} accessibilityLabel="Done" accessibilityRole="button">
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
                  {s.code === value ? <Text style={{ color: C.navy, fontFamily: BODY }}>✓</Text> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Reason card (shown when at half-staff) ────────────────────────────────────

function ReasonCard({ national, state }) {
  const item = national?.status === 'half' && national?.reason ? national
             : state?.status   === 'half' && state?.reason    ? state
             : null;

  if (!item) return null;

  const isNational = national?.status === 'half' && national?.reason;
  const issuer     = isNational ? 'Presidential Proclamation' : 'Governor\'s Order';
  const rawUrl  = item.url ?? (item.source ? `https://${item.source}` : null);
  const linkUrl = rawUrl ? rawUrl.replace(/^http:\/\//i, 'https://') : null;
  const linkLabel  = isNational ? 'proclamation' : 'order';

  return (
    <View style={styles.reasonCard}>
      <View style={styles.reasonCardRule} />
      <View style={styles.reasonCardBody}>
        <Text style={styles.reasonCardEyebrow}>Why the flag is at half-staff</Text>
        <Text style={styles.reasonCardText}>"{item.reason}"</Text>
        <View style={styles.reasonCardFooter}>
          <Text style={styles.reasonCardIssuer}>— {issuer}</Text>
          {linkUrl ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(linkUrl)}
              accessibilityLabel={`Read the full ${linkLabel}`}
              accessibilityRole="link"
            >
              <Text style={styles.reasonCardLink}>Read the full {linkLabel} ↗</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────

function HeroRule({ color }) {
  return <View style={[styles.heroRule, { backgroundColor: color }]} />;
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

  const heroBg      = isHalf ? C.heroHalf    : C.heroFull;
  const textColor   = isHalf ? C.textOnHalf  : C.textOnFull;
  const mutedColor  = isHalf ? C.mutedOnHalf : C.mutedOnFull;
  const ruleColor   = isHalf ? C.ruleOnHalf  : C.ruleOnFull;

  const statusLabel = isHalf ? 'At Half-Staff' : 'Full Staff';
  const stateName   = effectiveState ? US_STATES.find(s => s.code === effectiveState)?.name : null;
  const upcoming    = upcomingDates();
  const updatedStr  = updatedAt
    ? updatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

  const dateline = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: heroBg }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO ── */}
        <View style={[styles.hero, {
          minHeight: windowHeight - 110,
          backgroundColor: heroBg,
          paddingVertical: isMd ? 80 : 52,
          gap: isMd ? 24 : 18,
        }]}>
          {Platform.OS === 'web' ? (
            <>
              <View pointerEvents="none" style={[styles.heroOverlay, {
                backgroundImage: GRAIN_URL,
                backgroundSize: '200px 200px',
                opacity: 0.065,
                mixBlendMode: 'screen',
              }]} />
              <View pointerEvents="none" style={[styles.heroOverlay, {
                backgroundImage: 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.25) 100%)',
              }]} />
            </>
          ) : null}

          <FlagPole isHalf={isHalf} scale={isLg ? 1.35 : isMd ? 1.15 : 1} />

          {/* Headline block */}
          <View style={[styles.headlineBlock, { width: '100%', paddingHorizontal: 32 }]}>
            <HeroRule color={ruleColor} />
            <Text style={[styles.headline, {
              color: textColor,
              fontSize: isLg ? 80 : isMd ? 66 : 56,
              lineHeight: isLg ? 88 : isMd ? 74 : 62,
            }]}>{statusLabel}</Text>
            <HeroRule color={ruleColor} />
          </View>

          <StatePicker
            value={effectiveState}
            onChange={setPickedState}
            textColor={textColor}
            mutedColor={mutedColor}
          />

          <Text style={[styles.datelineText, { color: mutedColor }]}>
            {dateline}{updatedStr ? `  ·  AS OF ${updatedStr}` : ''}
          </Text>

          {isHalf ? (
            <ReasonCard national={flagData?.national} state={flagData?.state} />
          ) : null}

        </View>

        {/* ── CONTENT AREA ── */}
        <View style={styles.content}>
        <View style={styles.contentInner}>

          {/* Status breakdown */}
          <View style={[styles.section, styles.statusSection]}>
            <View style={[styles.statusAccent, { backgroundColor: isHalf ? C.crimson : C.forest }]} />
            <Text style={styles.sectionLabel}>Current Status</Text>

            <View style={[styles.statusRow, { borderTopColor: C.rule }]}>
              <View style={styles.statusLeft}>
                <Text style={styles.statusScope}>National</Text>
                <Text style={styles.statusSub}>Presidential order</Text>
                {isNatHalf && flagData?.national?.reason ? (
                  <Text style={styles.statusReason}>{flagData.national.reason}</Text>
                ) : null}
              </View>
              <Text style={[styles.statusBadge, { color: isNatHalf ? C.crimson : C.forest }]}>
                {isNatHalf ? 'Half-Staff' : 'Full Staff'}
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
                <Text style={[styles.statusBadge, { color: isStateHalf ? C.crimson : C.forest }]}>
                  {isStateHalf ? 'Half-Staff' : 'Full Staff'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Upcoming dates */}
          <View style={[styles.section, styles.upcomingSection]}>
            <Text style={[styles.sectionLabel, styles.sectionLabelMuted]}>Upcoming Half-Staff Dates</Text>
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
            <View style={[styles.footerRule, { backgroundColor: C.divider }]} />
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=Flag%20Status%20Feedback`)}>
              <Text style={styles.footerFeedback}>Found a bug or have feedback? Let me know →</Text>
            </TouchableOpacity>
          </View>

        </View>
        </View>
      </ScrollView>

      {/* Fixed bottom blur strip — always visible, web only */}
      {Platform.OS === 'web' ? (
        <View pointerEvents="none" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 120, zIndex: 50,
        }}>
          <View pointerEvents="none" style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
          }} />
          <View pointerEvents="none" style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: GRAIN_URL, backgroundSize: '200px 200px',
            opacity: 0.13, mixBlendMode: 'screen',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
          }} />
        </View>
      ) : null}
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
    gap: 18,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },

  // Dateline
  datelineText: {
    fontFamily: BODY,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
  },

  // Headline block with horizontal rules
  headlineBlock: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 700,
    alignSelf: 'center',
  },
  heroRule: {
    width: '100%',
    height: 1,
    opacity: 0.18,
  },
  headline: {
    fontFamily: SERIF,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  locationPin: {
    fontFamily: BODY,
    fontSize: 14,
  },
  locationName: {
    fontFamily: BODY,
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  locationChange: {
    fontFamily: BODY,
    fontSize: 15,
    marginLeft: 2,
  },
  // ── Reason card (proclamation blockquote style) ──
  reasonCard: {
    marginHorizontal: 24,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: C.subtleOnHalf,
    paddingVertical: 22,
    paddingRight: 24,
  },
  reasonCardRule: {
    width: 2,
    backgroundColor: C.accentOnHalf,
    marginRight: 20,
    marginLeft: 0,
    borderRadius: 1,
    opacity: 0.8,
  },
  reasonCardBody: {
    flex: 1,
    gap: 10,
  },
  reasonCardEyebrow: {
    fontFamily: BODY,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: C.linkOnHalf,
  },
  reasonCardText: {
    fontFamily: SERIF,
    fontSize: 22,
    fontStyle: 'italic',
    lineHeight: 33,
    color: C.textOnHalf,
  },
  reasonCardFooter: {
    gap: 6,
    marginTop: 2,
  },
  reasonCardIssuer: {
    fontFamily: BODY,
    fontSize: 15,
    color: C.captionOnHalf,
  },
  reasonCardLink: {
    fontFamily: BODY,
    fontSize: 15,
    fontWeight: '600',
    color: C.linkOnHalf,
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

  // ── Sections ──
  section: {
    marginHorizontal: 28,
    marginTop: 40,
  },
  statusSection: {
    marginTop: 36,
  },
  statusAccent: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginBottom: 12,
  },
  upcomingSection: {
    marginTop: 32,
    opacity: 0.82,
  },
  sectionLabel: {
    fontFamily: BODY,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 6,
  },
  sectionLabelMuted: {
    fontSize: 10,
    letterSpacing: 1.6,
    opacity: 0.8,
  },

  // ── Status rows ──
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  statusLeft: { flex: 1 },
  statusScope: {
    fontFamily: BODY,
    fontSize: 19,
    fontWeight: '600',
    color: C.ink,
    letterSpacing: 0.2,
  },
  statusSub: {
    fontFamily: BODY,
    fontSize: 15,
    color: C.muted,
    marginTop: 2,
  },
  statusReason: {
    fontFamily: SERIF,
    fontSize: 17,
    fontStyle: 'italic',
    color: C.ink,
    marginTop: 8,
    lineHeight: 24,
    opacity: 0.65,
  },
  statusBadge: {
    fontFamily: BODY,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginLeft: 16,
    marginTop: 3,
  },

  // ── Upcoming ──
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderTopWidth: 1,
  },
  upcomingNum: {
    width: 64,
    alignItems: 'flex-end',
    marginRight: 24,
  },
  upcomingDays: {
    fontFamily: SERIF,
    fontSize: 36,
    fontWeight: '400',
    color: C.ink,
    lineHeight: 38,
  },
  upcomingDaysLabel: {
    fontFamily: BODY,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: C.muted,
    marginTop: 1,
  },
  upcomingInfo: { flex: 1 },
  upcomingName: {
    fontFamily: BODY,
    fontSize: 16,
    fontWeight: '600',
    color: C.ink,
    letterSpacing: 0.2,
  },
  upcomingDate: {
    fontFamily: BODY,
    fontSize: 13,
    color: C.muted,
    marginTop: 3,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    marginTop: 52,
    paddingHorizontal: 28,
  },
  footerRule: {
    width: 40,
    height: 1,
    marginBottom: 4,
  },
  footerFeedback: {
    fontFamily: BODY,
    fontSize: 15,
    color: C.muted,
  },

  // ── Desktop dropdown ──
  dropdownPanel: {
    backgroundColor: C.white,
    borderRadius: 10,
    marginTop: 10,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.rule,
  },
  dropdownSearchRow: {
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownSearchInput: {
    fontFamily: BODY,
    fontSize: 16,
    color: C.ink,
    height: 30,
  },
  dropdownList: {
    maxHeight: 260,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
  },
  dropdownRowActive: { backgroundColor: C.rowActive },
  dropdownRowText: {
    fontFamily: BODY,
    fontSize: 16,
    color: C.ink,
  },
  dropdownRowActiveText: {
    color: C.navy,
    fontWeight: '600',
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
    backgroundColor: C.chrome,
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
    fontFamily: BODY,
    fontSize: 16,
    fontWeight: '600',
    color: C.ink,
  },
  modalDone: {
    fontFamily: BODY,
    fontSize: 16,
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
    borderBottomColor: C.rule,
  },
  modalRowActive: { backgroundColor: C.rowActive },
  modalRowText: {
    fontFamily: BODY,
    fontSize: 16,
    color: C.ink,
  },
  modalRowActiveText: {
    color: C.navy,
    fontWeight: '600',
  },

  // ── Loading / error ──
  errorTitle:  { fontFamily: SERIF, fontSize: 24, textAlign: 'center', marginBottom: 8 },
  errorDetail: { fontFamily: BODY,  fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});
