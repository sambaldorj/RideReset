import { Buffer } from 'buffer';

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

function formatDate(date: Date) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 10);
}

export async function getLatestRide(): Promise<IntervalsActivity | null> {
  const apiKey = process.env.EXPO_PUBLIC_INTERVALS_API_KEY;

  if (!apiKey) {
    throw new Error('Intervals.icu API key is missing.');
  }

  const newest = new Date();
  const oldest = new Date();
  oldest.setFullYear(oldest.getFullYear() - 1);

  const authorization = Buffer.from(`API_KEY:${apiKey}`).toString('base64');

  const url =
    `https://intervals.icu/api/v1/athlete/0/activities` +
    `?oldest=${formatDate(oldest)}&newest=${formatDate(newest)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${authorization}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Intervals.icu request failed: ${response.status}`);
  }

  const activities: IntervalsActivity[] = await response.json();

  const rides = activities
    .filter((activity) => activity.type === 'Ride')
    .sort(
      (a, b) =>
        new Date(b.start_date_local).getTime() -
        new Date(a.start_date_local).getTime()
    );

  return rides[0] ?? null;
}