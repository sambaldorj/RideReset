import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type SleepQuality = 'Poor' | 'Fair' | 'Good' | 'Great';

type SleepEntry = {
  hours: number;
  quality: SleepQuality;
  savedAt: string;
};

const qualities: SleepQuality[] = ['Poor', 'Fair', 'Good', 'Great'];
const STORAGE_KEY = 'ridereset.latestSleep';

export default function SleepScreen() {
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState<SleepQuality>('Good');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSleep();
  }, []);

  async function loadSleep() {
    try {
      const storedSleep = await AsyncStorage.getItem(STORAGE_KEY);

      if (storedSleep) {
        const sleepEntry: SleepEntry = JSON.parse(storedSleep);

        setHours(sleepEntry.hours);
        setQuality(sleepEntry.quality);
        setSaved(true);
      }
    } catch (error) {
      console.error('Could not load sleep:', error);
    }
  }

  function changeHours(amount: number) {
    setHours((current) =>
      Math.max(0, Math.min(12, current + amount))
    );
    setSaved(false);
  }

  async function saveSleep() {
    const sleepEntry: SleepEntry = {
      hours,
      quality,
      savedAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sleepEntry)
      );

      setSaved(true);
    } catch (error) {
      console.error('Could not save sleep:', error);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      <Text style={styles.logo}>RIDERESET</Text>
      <Text style={styles.heading}>Sleep Log</Text>
      <Text style={styles.subtitle}>
        Record last night’s sleep to improve your next-ride recommendation.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>SLEEP DURATION</Text>

        <View style={styles.durationRow}>
          <Pressable
            style={styles.controlButton}
            onPress={() => changeHours(-0.5)}
          >
            <Text style={styles.controlText}>−</Text>
          </Pressable>

          <View style={styles.durationCenter}>
            <Text style={styles.hours}>{hours}</Text>
            <Text style={styles.hoursLabel}>hours</Text>
          </View>

          <Pressable
            style={styles.controlButton}
            onPress={() => changeHours(0.5)}
          >
            <Text style={styles.controlText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionTitle}>How did you sleep?</Text>

      <View style={styles.qualityGrid}>
        {qualities.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.qualityButton,
              quality === option && styles.qualityButtonSelected,
            ]}
            onPress={() => {
              setQuality(option);
              setSaved(false);
            }}
          >
            <Text
              style={[
                styles.qualityText,
                quality === option && styles.qualityTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.saveButton} onPress={saveSleep}>
        <Text style={styles.saveButtonText}>Save Sleep</Text>
      </Pressable>

      {saved && (
        <View style={styles.savedCard}>
          <Text style={styles.savedTitle}>Sleep saved on this device</Text>

          <Text style={styles.savedText}>
            {hours} hours · {quality} quality
          </Text>

          <Text style={styles.savedNote}>
            RideReset will use this entry when estimating your recovery.
          </Text>
        </View>
      )}
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
    lineHeight: 23,
    marginTop: 6,
    marginBottom: 26,
  },
  card: {
    backgroundColor: '#102A24',
    borderRadius: 22,
    padding: 22,
  },
  cardLabel: {
    color: '#80A098',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#194D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '500',
  },
  durationCenter: {
    alignItems: 'center',
  },
  hours: {
    color: '#FFFFFF',
    fontSize: 50,
    fontWeight: '800',
  },
  hoursLabel: {
    color: '#92A6A0',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 14,
  },
  qualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qualityButton: {
    width: '48%',
    backgroundColor: '#10201C',
    borderWidth: 1,
    borderColor: '#1D3931',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  qualityButtonSelected: {
    backgroundColor: '#194D3D',
    borderColor: '#4BE39A',
  },
  qualityText: {
    color: '#92A6A0',
    fontSize: 15,
    fontWeight: '700',
  },
  qualityTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#4BE39A',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: {
    color: '#071512',
    fontSize: 16,
    fontWeight: '800',
  },
  savedCard: {
    backgroundColor: '#10201C',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#4BE39A',
  },
  savedTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  savedText: {
    color: '#4BE39A',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 5,
  },
  savedNote: {
    color: '#92A6A0',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
});