import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getLatestRide,
  type IntervalsActivity,
} from '../../services/intervals';

type SleepQuality = 'Poor' | 'Fair' | 'Good' | 'Great';

type SleepEntry = {
  hours: number;
  quality: SleepQuality;
  savedAt: string;
};

const STORAGE_KEY = 'ridereset.latestSleep';

function calculateRecovery(
  sleep: SleepEntry | null,
  ride: IntervalsActivity | null
) {
  if (!sleep) {
    return {
      score: 60,
      status: 'Sleep data needed',
      color: '#F4C95D',
      rideType: 'Easy ride or rest',
      rideDetails: 'Log your sleep first',
      reason:
        'RideReset needs sleep data before combining it with your recent training load.',
    };
  }

  let durationPoints = 5;

  if (sleep.hours >= 8) {
    durationPoints = 35;
  } else if (sleep.hours >= 7) {
    durationPoints = 28;
  } else if (sleep.hours >= 6) {
    durationPoints = 18;
  }

  const qualityPoints: Record<SleepQuality, number> = {
    Poor: 0,
    Fair: 8,
    Good: 17,
    Great: 25,
  };

  let score = Math.min(
    100,
    40 + durationPoints + qualityPoints[sleep.quality]
  );

  if (ride) {
    const rideTime = new Date(ride.start_date_local).getTime();
    const hoursSinceRide = (Date.now() - rideTime) / 3_600_000;

    if (
      !Number.isNaN(hoursSinceRide) &&
      hoursSinceRide >= 0 &&
      hoursSinceRide <= 72
    ) {
      const load = ride.icu_training_load ?? 0;
      let loadPenalty = 0;

      if (load >= 120) {
        loadPenalty = 20;
      } else if (load >= 90) {
        loadPenalty = 14;
      } else if (load >= 60) {
        loadPenalty = 8;
      } else if (load > 0) {
        loadPenalty = 4;
      } else if ((ride.moving_time ?? 0) >= 7200) {
        loadPenalty = 8;
      } else if ((ride.moving_time ?? 0) >= 3600) {
        loadPenalty = 4;
      }

      score = Math.max(0, score - loadPenalty);
    }
  }

  if (score >= 85) {
    return {
      score,
      status: 'Ready to train',
      color: '#4BE39A',
      rideType: 'Endurance or planned workout',
      rideDetails: 'Tomorrow · 60–90 minutes',
      reason:
        'Your sleep and recent training load support a normal session. Adjust if your legs feel unusually fatigued.',
    };
  }

  if (score >= 70) {
    return {
      score,
      status: 'Recovering well',
      color: '#8EDB72',
      rideType: 'Easy Zone 2',
      rideDetails: 'Tomorrow · 45–60 minutes',
      reason:
        'Your sleep and recent ride suggest keeping the next session conversational.',
    };
  }

  if (score >= 55) {
    return {
      score,
      status: 'Take it easy',
      color: '#F4C95D',
      rideType: 'Recovery spin',
      rideDetails: 'Tomorrow · 30–45 minutes',
      reason:
        'Your sleep and recent training load suggest reducing intensity while recovery continues.',
    };
  }

  return {
    score,
    status: 'Prioritize recovery',
    color: '#FF7A7A',
    rideType: 'Rest day',
    rideDetails: 'No structured training',
    reason:
      'Your recent training load and sleep suggest prioritizing recovery before another structured session.',
  };
}

function formatDistance(distance?: number) {
  if (distance === undefined) {
    return '—';
  }

  return (distance / 1609.344).toFixed(1);
}

function formatDuration(seconds?: number) {
  if (seconds === undefined) {
    return '—';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function formatRideDate(date?: string) {
  if (!date) {
    return 'Date unavailable';
  }

  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const [sleep, setSleep] = useState<SleepEntry | null>(null);
  const [ride, setRide] = useState<IntervalsActivity | null>(null);
  const [rideLoading, setRideLoading] = useState(true);
  const [rideError, setRideError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadSleep();
      void loadRide();
    }, [])
  );

  async function loadSleep() {
    try {
      const storedSleep = await AsyncStorage.getItem(STORAGE_KEY);

      if (storedSleep) {
        setSleep(JSON.parse(storedSleep));
      }
    } catch (error) {
      console.error('Could not load sleep:', error);
    }
  }

  async function loadRide() {
    try {
      setRideLoading(true);
      setRideError(false);

      const latestRide = await getLatestRide();
      setRide(latestRide);
    } catch (error) {
      console.error('Could not load ride:', error);
      setRideError(true);
    } finally {
      setRideLoading(false);
    }
  }

  const recovery = calculateRecovery(sleep, ride);

  const averagePower =
    ride?.average_watts ??
    ride?.icu_average_watts ??
    ride?.icu_weighted_avg_watts ??
    ride?.weighted_average_watts;

  const averageHeartRate =
    ride?.average_heartrate ?? ride?.icu_average_hr;

  const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

  return (
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <StatusBar style="light" />

    <View style={styles.headerRow}>
      <Text style={styles.logo}>RIDERESET</Text>
      <Text style={styles.date}>{todayLabel}</Text>
    </View>

    <Text style={styles.heading}>Recovery</Text>
    <Text style={styles.subtitle}>
      Sleep and training readiness at a glance.
    </Text>

    <View style={styles.recoveryPanel}>
      <View style={styles.recoveryTopRow}>
        <View style={styles.scoreGroup}>
          <Text style={styles.score}>{recovery.score}</Text>

          <View style={styles.scoreMeta}>
            <Text style={styles.cardLabel}>RECOVERY SCORE</Text>
            <Text
              style={[
                styles.recoveryStatus,
                { color: recovery.color },
              ]}
            >
              {recovery.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${recovery.score}%`,
              backgroundColor: recovery.color,
            },
          ]}
        />
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>SLEEP</Text>
          <Text style={styles.metricValue}>
            {sleep ? `${sleep.hours} hr` : 'Not logged'}
          </Text>
          <Text style={styles.metricSubvalue}>
            {sleep ? sleep.quality : 'Add last night’s sleep'}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>RECENT LOAD</Text>
          <Text style={styles.metricValue}>
            {ride?.icu_training_load
              ? Math.round(ride.icu_training_load)
              : '—'}
          </Text>
          <Text style={styles.metricSubvalue}>
            {ride ? 'Intervals.icu' : 'No recent activity'}
          </Text>
        </View>
      </View>
    </View>

    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Latest activity</Text>
      <Text style={styles.sourcePill}>INTERVALS.ICU</Text>
    </View>

    <View style={styles.card}>
      {rideLoading ? (
        <Text style={styles.rideMessage}>
          Loading your latest ride...
        </Text>
      ) : rideError ? (
        <Text style={styles.errorMessage}>
          RideReset could not load your Intervals.icu activity.
        </Text>
      ) : ride ? (
        <>
          <Text style={styles.rideTitle}>
            {ride.name || 'Cycling activity'}
          </Text>

          <Text style={styles.rideDate}>
            {formatRideDate(ride.start_date_local)}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>
                {formatDistance(ride.distance)}
              </Text>
              <Text style={styles.statLabel}>MILES</Text>
            </View>

            <View style={[styles.statCell, styles.statCellBorder]}>
              <Text style={styles.statValue}>
                {formatDuration(ride.moving_time)}
              </Text>
              <Text style={styles.statLabel}>MOVING</Text>
            </View>

            <View style={[styles.statCell, styles.statCellBorder]}>
              <Text style={styles.statValue}>
                {averagePower ? `${Math.round(averagePower)} W` : '—'}
              </Text>
              <Text style={styles.statLabel}>AVG POWER</Text>
            </View>
          </View>

          <View style={styles.rideMetaRow}>
            <Text style={styles.rideMeta}>
              {averageHeartRate
                ? `${Math.round(averageHeartRate)} bpm avg`
                : 'Heart rate unavailable'}
            </Text>

            <Text style={styles.rideMeta}>
              {ride.icu_training_load
                ? `Load ${Math.round(ride.icu_training_load)}`
                : ''}
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.rideMessage}>
          No cycling activity was found.
        </Text>
      )}
    </View>

    <Text style={styles.sectionTitle}>Today</Text>

    <View style={styles.actionList}>
      <View style={styles.actionRow}>
        <Text style={styles.actionNumber}>01</Text>

        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Hydration</Text>
          <Text style={styles.actionDescription}>
            Replace fluids throughout the day.
          </Text>
        </View>

        <Text style={styles.actionArrow}>›</Text>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.actionNumber}>02</Text>

        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Nutrition</Text>
          <Text style={styles.actionDescription}>
            Prioritize carbohydrates and protein.
          </Text>
        </View>

        <Text style={styles.actionArrow}>›</Text>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.actionNumber}>03</Text>

        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Mobility</Text>
          <Text style={styles.actionDescription}>
            Keep movement easy for 5–10 minutes.
          </Text>
        </View>

        <Text style={styles.actionArrow}>›</Text>
      </View>
    </View>

    <Text style={styles.sectionTitle}>Next session</Text>

    <View style={styles.nextRideCard}>
      <Text style={styles.nextRideEyebrow}>RECOMMENDATION</Text>

      <Text style={styles.nextRideType}>
        {recovery.rideType}
      </Text>

      <Text style={styles.nextRideDetails}>
        {recovery.rideDetails}
      </Text>

      <Text style={styles.nextRideReason}>
        {recovery.reason}
      </Text>
    </View>

    <Text style={styles.disclaimer}>
      Prototype guidance only. Perceived fatigue, pain, illness and other
      health factors should take priority.
    </Text>
      </ScrollView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safeArea: {
  flex: 1,
  backgroundColor: '#09110F',
},

  screen: {
    flex: 1,
    backgroundColor: '#09110F',
  },

  content: {
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 60,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logo: {
    color: '#55DFA0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.4,
  },

  date: {
    color: '#73827D',
    fontSize: 13,
    fontWeight: '600',
  },

  heading: {
    color: '#F5F7F6',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 28,
  },

  subtitle: {
    color: '#84918D',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 28,
  },

  recoveryPanel: {
    backgroundColor: '#101A17',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C2B26',
    padding: 24,
  },

  recoveryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  scoreGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  score: {
    color: '#F7F9F8',
    fontSize: 58,
    fontWeight: '800',
    letterSpacing: -2,
  },

  scoreMeta: {
    marginLeft: 20,
  },

  cardLabel: {
    color: '#6E817A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
  },

  recoveryStatus: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 5,
  },

  progressTrack: {
    height: 4,
    backgroundColor: '#22302C',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },

  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  metricRow: {
    flexDirection: 'row',
    marginTop: 24,
  },

  metric: {
    flex: 1,
  },

  metricDivider: {
    width: 1,
    backgroundColor: '#26332F',
    marginHorizontal: 24,
  },

  metricLabel: {
    color: '#6E817A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  metricValue: {
    color: '#F2F5F4',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 7,
  },

  metricSubvalue: {
    color: '#74857F',
    fontSize: 12,
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 34,
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#F0F3F2',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 34,
    marginBottom: 12,
  },

  sourcePill: {
    color: '#55DFA0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 34,
  },

  card: {
    backgroundColor: '#101815',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B2924',
    padding: 22,
  },

  rideTitle: {
    color: '#F5F7F6',
    fontSize: 21,
    fontWeight: '700',
  },

  rideDate: {
    color: '#71827C',
    fontSize: 13,
    marginTop: 5,
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: 26,
    borderTopWidth: 1,
    borderTopColor: '#22302B',
    borderBottomWidth: 1,
    borderBottomColor: '#22302B',
  },

  statCell: {
    flex: 1,
    paddingVertical: 18,
  },

  statCellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#22302B',
    paddingLeft: 20,
  },

  statValue: {
    color: '#F5F7F6',
    fontSize: 22,
    fontWeight: '700',
  },

  statLabel: {
    color: '#687A74',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 5,
  },

  rideMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  rideMeta: {
    color: '#758780',
    fontSize: 12,
  },

  rideMessage: {
    color: '#9AA9A4',
    fontSize: 14,
  },

  errorMessage: {
    color: '#E78282',
    fontSize: 14,
    lineHeight: 20,
  },

  actionList: {
    backgroundColor: '#101815',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B2924',
    overflow: 'hidden',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2925',
  },

  actionNumber: {
    color: '#53645E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    width: 38,
  },

  actionText: {
    flex: 1,
  },

  actionTitle: {
    color: '#EDF1EF',
    fontSize: 15,
    fontWeight: '700',
  },

  actionDescription: {
    color: '#71817C',
    fontSize: 12,
    marginTop: 3,
  },

  actionArrow: {
    color: '#596A64',
    fontSize: 25,
    fontWeight: '300',
    marginLeft: 16,
  },

  nextRideCard: {
    backgroundColor: '#12241E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#244438',
    padding: 22,
  },

  nextRideEyebrow: {
    color: '#55DFA0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  nextRideType: {
    color: '#F4F7F5',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
  },

  nextRideDetails: {
    color: '#55DFA0',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },

  nextRideReason: {
    color: '#A0AFA9',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
    maxWidth: 650,
  },

  disclaimer: {
    color: '#53615D',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 26,
  },
});