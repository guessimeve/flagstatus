import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';

// TODO: change for production (e.g. https://api.flagstatus.app)
const API_BASE = 'http://localhost:3001';

const COLORS = {
  red: '#B22234',
  white: '#FFFFFF',
  navy: '#3C3B6E',
};

export default function App() {
  const [flagData, setFlagData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Request location permission and get state abbreviation
        const { status } = await Location.requestForegroundPermissionsAsync();
        let stateCode = 'US'; // fallback

        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const [place] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (place?.region) {
            stateCode = place.region;
          }
        }

        const response = await fetch(`${API_BASE}/api/status?state=${stateCode}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setFlagData(data);
      } catch (err) {
        setError(err.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.red} />
        <Text style={styles.loadingText}>Checking flag status…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>Could not load flag status</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </SafeAreaView>
    );
  }

  const isHalf = flagData?.effective === 'half';
  const statusLabel = isHalf ? 'HALF STAFF' : 'FULL STAFF';
  const statusColor = isHalf ? COLORS.red : COLORS.navy;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.center}>
        <Text style={styles.flagEmoji}>🇺🇸</Text>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        {flagData?.effectiveReason ? (
          <Text style={styles.reasonText}>{flagData.effectiveReason}</Text>
        ) : null}
        {flagData?.national?.since ? (
          <Text style={styles.sinceText}>Since {flagData.national.since}</Text>
        ) : null}
        {flagData?.national?.source ? (
          <Text style={styles.sourceText}>Source: {flagData.national.source}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  flagEmoji: {
    fontSize: 96,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  sinceText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#555',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.red,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
