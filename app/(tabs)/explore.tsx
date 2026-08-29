import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <StatusBar style="light" />

      <Text style={styles.logo}>RIDERESET</Text>

      <Text style={styles.heading}>Sleep</Text>

      <Text style={styles.subtitle}>
        Log last night’s sleep for today’s recovery estimate.
      </Text>

      <Text style={styles.sectionLabel}>DURATION</Text>

      <View style={styles.durationCard}>
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

      <View style={styles.durationScale}>
        <Text style={styles.scaleText}>Less</Text>
        <Text style={styles.scaleText}>Recommended 7–9 hr</Text>
        <Text style={styles.scaleText}>More</Text>
      </View>

      <Text style={styles.sectionLabel}>SLEEP QUALITY</Text>

      <View style={styles.qualityCard}>
        {qualities.map((option, index) => (
          <Pressable
            key={option}
            style={[
              styles.qualityRow,
              index < qualities.length - 1 && styles.qualityRowBorder,
            ]}
            onPress={() => {
              setQuality(option);
              setSaved(false);
            }}
          >
            <View>
              <Text
                style={[
                  styles.qualityText,
                  quality === option && styles.qualityTextSelected,
                ]}
              >
                {option}
              </Text>

              <Text style={styles.qualityDescription}>
                {option === 'Poor' && 'Restless or significantly disrupted'}
                {option === 'Fair' && 'Below your normal sleep quality'}
                {option === 'Good' && 'Mostly restful and uninterrupted'}
                {option === 'Great' && 'Deep, restful and refreshing'}
              </Text>
            </View>

            <View
              style={[
                styles.radioOuter,
                quality === option && styles.radioOuterSelected,
              ]}
            >
              {quality === option && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[
          styles.saveButton,
          saved && styles.saveButtonSaved,
        ]}
        onPress={saveSleep}
      >
        <Text
          style={[
            styles.saveButtonText,
            saved && styles.saveButtonTextSaved,
          ]}
        >
          {saved ? 'Saved' : 'Save sleep'}
        </Text>
      </Pressable>

      {saved && (
        <View style={styles.savedRow}>
          <View style={styles.savedDot} />

          <View style={styles.savedContent}>
            <Text style={styles.savedTitle}>
              Last night
            </Text>

            <Text style={styles.savedText}>
              {hours} hr · {quality}
            </Text>
          </View>

          <Text style={styles.savedMeta}>ON DEVICE</Text>
        </View>
      )}

      <Text style={styles.note}>
        Sleep entries are stored locally on this device and used by
        RideReset when calculating recovery.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09110F',
  },

  content: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 60,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },

  logo: {
    color: '#55DFA0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.4,
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
    lineHeight: 22,
    marginTop: 6,
    marginBottom: 34,
  },

  sectionLabel: {
    color: '#6E817A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 10,
  },

  durationCard: {
    backgroundColor: '#101A17',
    borderWidth: 1,
    borderColor: '#1C2B26',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#17231F',
    borderWidth: 1,
    borderColor: '#283833',
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlText: {
    color: '#DDE5E2',
    fontSize: 25,
    fontWeight: '500',
    lineHeight: 28,
  },

  durationCenter: {
    alignItems: 'center',
  },

  hours: {
    color: '#F7F9F8',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
  },

  hoursLabel: {
    color: '#70817B',
    fontSize: 12,
    marginTop: 1,
  },

  durationScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
    marginBottom: 34,
  },

  scaleText: {
    color: '#53635E',
    fontSize: 10,
  },

  qualityCard: {
    backgroundColor: '#101815',
    borderWidth: 1,
    borderColor: '#1B2924',
    borderRadius: 12,
    overflow: 'hidden',
  },

  qualityRow: {
    minHeight: 72,
    paddingVertical: 14,
    paddingHorizontal: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  qualityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1C2925',
  },

  qualityText: {
    color: '#98A6A1',
    fontSize: 15,
    fontWeight: '700',
  },

  qualityTextSelected: {
    color: '#F2F5F4',
  },

  qualityDescription: {
    color: '#61716C',
    fontSize: 11,
    marginTop: 4,
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#43534E',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },

  radioOuterSelected: {
    borderColor: '#55DFA0',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#55DFA0',
  },

  saveButton: {
    backgroundColor: '#55DFA0',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },

  saveButtonSaved: {
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#28513F',
  },

  saveButtonText: {
    color: '#09110F',
    fontSize: 15,
    fontWeight: '800',
  },

  saveButtonTextSaved: {
    color: '#55DFA0',
  },

  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101815',
    borderWidth: 1,
    borderColor: '#1B2924',
    borderRadius: 10,
    padding: 16,
    marginTop: 14,
  },

  savedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#55DFA0',
    marginRight: 12,
  },

  savedContent: {
    flex: 1,
  },

  savedTitle: {
    color: '#71827C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  savedText: {
    color: '#E8EDEB',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },

  savedMeta: {
    color: '#52615C',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  note: {
    color: '#52615C',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 22,
  },
});