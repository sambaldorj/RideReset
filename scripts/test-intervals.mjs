const apiKey = process.env.INTERVALS_API_KEY;
const athleteId = process.env.INTERVALS_ATHLETE_ID;

if (!apiKey || !athleteId) {
  console.error("Missing Intervals.icu information in .env.local");
  process.exit(1);
}

const formatDate = (date) => date.toISOString().slice(0, 10);

const oldest = new Date();
oldest.setDate(oldest.getDate() - 60);

const newest = new Date();
newest.setDate(newest.getDate() + 1);

const url = new URL(
  `https://intervals.icu/api/v1/athlete/${encodeURIComponent(
    athleteId
  )}/activities`
);

url.searchParams.set("oldest", formatDate(oldest));
url.searchParams.set("newest", formatDate(newest));
url.searchParams.set("limit", "50");

const authorization = Buffer.from(`API_KEY:${apiKey}`).toString("base64");

try {
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${authorization}`,
      Accept: "application/json",
    },
  });

  if (response.status === 204) {
    console.log("Connected, but no recent activities were found.");
    process.exit(0);
  }

  if (!response.ok) {
    throw new Error(`Intervals.icu returned status ${response.status}`);
  }

  const activities = await response.json();

  const rides = activities
    .filter((activity) =>
      ["Ride", "VirtualRide", "GravelRide"].includes(activity.type)
    )
    .sort(
      (a, b) =>
        new Date(b.start_date_local).getTime() -
        new Date(a.start_date_local).getTime()
    );

  console.log(`Connected successfully. Found ${rides.length} recent ride(s).`);

  if (rides.length > 0) {
    const ride = rides[0];

    console.log("Most recent ride:");
    console.log({
      name: ride.name ?? ride.type,
      date: ride.start_date_local,
      distanceMiles: ride.distance
        ? (ride.distance / 1609.344).toFixed(1)
        : "Unavailable",
      movingMinutes: ride.moving_time
        ? Math.round(ride.moving_time / 60)
        : "Unavailable",
      averageWatts:
        ride.average_watts ?? ride.icu_average_watts ?? "Unavailable",
    });
  }
} catch (error) {
  console.error("Connection failed:", error.message);
}