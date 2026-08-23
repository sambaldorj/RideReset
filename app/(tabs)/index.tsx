import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type SleepQuality = 'Poor' | 'Fair' | 'Good' | 'Great';

type SleepEntry = {
  hours: number;
  quality: SleepQuality;
  savedAt: string;
};

const STORAGE_KEY = 'ridereset.latestSleep';

function calculateRecovery(sleep: SleepEntry | null) {
  if (!sleep) {
    return {
      score: 60,
      status: 'Sleep data needed',
      color: '#F4C95D',
      rideType: 'Easy ride or rest',
      rideDetails: 'Log your sleep first',
      reason:
        'RideReset needs your sleep duration and quality before suggesting your next session.',
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

  const score = Math.min(
    100,
    40 + durationPoints + qualityPoints[sleep.quality]
  );

  if (score >= 85) {
    return {
      score,
      status: 'Ready to train',
      color: '#4BE39A',
      rideType: 'Endurance or planned workout',
      rideDetails: 'Tomorrow · 60–90 minutes',
      reason:
        'Your sleep supports a normal training session. Adjust if your legs still feel unusually fatigued.',
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
        'Keep the effort conversational while your body absorbs your recent training.',
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
        'Your sleep suggests reducing intensity. Keep the ride light and reassess how you feel.',
    };
  }

  return {
    score,
    status: 'Prioritize recovery',
    color: '#FF7A7A',
    rideType: 'Rest day',
    rideDetails: 'No structured training',
    reason:
      'Short or poor-quality sleep may limit recovery. Consider resting and checking again tomorrow.',
  };
}

export default function HomeScreen() {
  const [sleep, setSleep] = useState<SleepEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSleep();
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

  const recovery = calculateRecovery(sleep);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      <Text style={styles.logo}>RIDERESET</Text>
      <Text style={styles.heading}>Good morning, Sam</Text>
      <Text style={styles.subtitle}>
        Here’s how your recovery is looking.
      </Text>

      <View style={styles.recoveryCard}>
        <View style={styles.recoveryInfo}>
          <Text style={styles.cardLabel}>RECOVERY SCORE</Text>
          <Text style={styles.score}>{recovery.score}</Text>

          <Text style={[styles.recoveryStatus, { color: recovery.color }]}>
            {recovery.status}
          </Text>
        </View>

        <View
          style={[
            styles.scoreCircle,
            {
              borderColor: recovery.color,
            },
          ]}
        >
          <Text style={styles.scorePercent}>{recovery.score}%</Text>
        </View>
      </View>

      <View style={styles.sleepSummary}>
        <Text style={styles.sleepSummaryLabel}>LAST NIGHT</Text>

        <Text style={styles.sleepSummaryValue}>
          {sleep
            ? `${sleep.hours} hours · ${sleep.quality} quality`
            : 'No sleep logged'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Latest ride</Text>

      <View style={styles.card}>
        <Text style={styles.rideTitle}>Morning Road Ride</Text>
        <Text style={styles.rideDate}>Demo activity</Text>

        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statValue}>28.4</Text>
            <Text style={styles.statLabel}>Miles</Text>
          </View>

          <View>
            <Text style={styles.statValue}>1h 42m</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>

          <View>
            <Text style={styles.statValue}>173 W</Text>
            <Text style={styles.statLabel}>Avg power</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recommended next steps</Text>

      <View style={styles.actionCard}>
        <Text style={styles.actionIcon}>💧</Text>

        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Rehydrate</Text>
          <Text style={styles.actionDescription}>
            Begin replacing the fluid lost during your ride.
          </Text>
        </View>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionIcon}>🥣</Text>

        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Refuel</Text>
          <Text style={styles.actionDescription}>
            Eat a balanced meal containing carbohydrates and protein.
          </Text>
        </View>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionIcon}>🧘</Text>

        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Mobility</Text>
          <Text style={styles.actionDescription}>
            Complete an easy eight-minute post-ride routine.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Suggested next ride</Text>

      <View style={styles.nextRideCard}>
        <Text style={styles.nextRideType}>{recovery.rideType}</Text>
        <Text style={styles.nextRideDetails}>
          {recovery.rideDetails}
        </Text>
        <Text style={styles.nextRideReason}>{recovery.reason}</Text>
      </View>

      <Text style={styles.disclaimer}>
        Prototype guidance only. Your perceived fatigue, pain, illness and
        other health factors should take priority.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071512',
  },
  content: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  logo: {
    color: '#4BE39A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    color: '#92A6A0',
    fontSize: 16,
    marginTop: 6,
    marginBottom: 24,
  },
  recoveryCard: {
    backgroundColor: '#102A24',
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recoveryInfo: {
    flex: 1,
  },
  cardLabel: {
    color: '#80A098',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  score: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '800',
    marginTop: 4,
  },
  recoveryStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercent: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  sleepSummary: {
    backgroundColor: '#0D211C',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  sleepSummaryLabel: {
    color: '#6F817B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sleepSummaryValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 5,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#10201C',
    borderRadius: 18,
    padding: 20,
  },
  rideTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  rideDate: {
    color: '#83948F',
    fontSize: 13,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#83948F',
    fontSize: 12,
    marginTop: 4,
  },
  actionCard: {
    backgroundColor: '#10201C',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 27,
    marginRight: 14,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionDescription: {
    color: '#9AA9A5',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  nextRideCard: {
    backgroundColor: '#194D3D',
    borderRadius: 18,
    padding: 20,
  },
  nextRideType: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  nextRideDetails: {
    color: '#6EF0AE',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },
  nextRideReason: {
    color: '#D2E5DE',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  disclaimer: {
    color: '#61736D',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 22,
  },
});