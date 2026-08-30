import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type IntervalsActivity = {
  id: string;
  name?: string;
  start_date_local: string;
  type: string;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  icu_training_load?: number;
  icu_average_hr?: number;
  average_heartrate?: number;
  average_watts?: number;
  icu_average_watts?: number;
  icu_weighted_avg_watts?: number;
  weighted_average_watts?: number;
  total_elevation_gain?: number;
};

type BackendRide = {
  id: string;
  name: string;
  type: string;
  startDate: string;
  distanceMiles: number | null;
  movingMinutes: number | null;
  averageWatts: number | null;
  averageHeartRate: number | null;
  elevationGainFeet: number | null;
  trainingLoad: number | null;
};

type LatestRideResponse = {
  ride: BackendRide | null;
};

export type TrainingSummary = {
  days: number;
  rideCount: number;
  totalLoad: number;
  distanceMiles: number;
  movingMinutes: number;
};

type TrainingSummaryResponse = {
  summary: TrainingSummary;
};

function getServerAddress() {
  if (Platform.OS === 'web') {
    return `http://${window.location.hostname}:3000`;
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    throw new Error('Could not determine the development server address.');
  }

  const host = hostUri.replace(/^https?:\/\//, '').split(':')[0];

  return `http://${host}:3000`;
}

export async function getLatestRide(): Promise<IntervalsActivity | null> {
  const response = await fetch(
    `${getServerAddress()}/api/latest-ride`
  );

  if (!response.ok) {
    throw new Error(`RideReset server request failed: ${response.status}`);
  }

  const data: LatestRideResponse = await response.json();
  const ride = data.ride;

  if (!ride) {
    return null;
  }

  return {
    id: ride.id,
    name: ride.name,
    type: ride.type,
    start_date_local: ride.startDate,

    distance:
      ride.distanceMiles !== null
        ? ride.distanceMiles * 1609.344
        : undefined,

    moving_time:
      ride.movingMinutes !== null
        ? ride.movingMinutes * 60
        : undefined,

    elapsed_time:
      ride.movingMinutes !== null
        ? ride.movingMinutes * 60
        : undefined,

    average_watts: ride.averageWatts ?? undefined,
    icu_average_watts: ride.averageWatts ?? undefined,

    average_heartrate: ride.averageHeartRate ?? undefined,
    icu_average_hr: ride.averageHeartRate ?? undefined,

    total_elevation_gain:
      ride.elevationGainFeet !== null
        ? ride.elevationGainFeet / 3.28084
        : undefined,

    icu_training_load: ride.trainingLoad ?? undefined,
  };
}

export async function getTrainingSummary(): Promise<TrainingSummary> {
  const response = await fetch(
    `${getServerAddress()}/api/training-summary`
  );

  if (!response.ok) {
    throw new Error(
      `Training summary request failed: ${response.status}`
    );
  }

  const data: TrainingSummaryResponse = await response.json();

  return data.summary;
}