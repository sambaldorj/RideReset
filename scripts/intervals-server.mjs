import http from "node:http";

const apiKey = process.env.INTERVALS_API_KEY;
const athleteId = process.env.INTERVALS_ATHLETE_ID;
const port = 3000;

if (!apiKey || !athleteId) {
  console.error("Missing Intervals.icu information in .env.local");
  process.exit(1);
}

const formatDate = (date) => date.toISOString().slice(0, 10);

const sendJson = (response, statusCode, data) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });

  response.end(JSON.stringify(data));
};

const getLatestRide = async () => {
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

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${authorization}`,
      Accept: "application/json",
    },
  });

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

  if (rides.length === 0) {
    return null;
  }

  const ride = rides[0];

  return {
    id: ride.id,
    name: ride.name ?? ride.type,
    type: ride.type,
    startDate: ride.start_date_local,
    distanceMiles: ride.distance
      ? Number((ride.distance / 1609.344).toFixed(1))
      : null,
    movingMinutes: ride.moving_time
      ? Math.round(ride.moving_time / 60)
      : null,
    averageWatts:
      ride.average_watts ?? ride.icu_average_watts ?? null,
    averageHeartRate: ride.average_heartrate ?? null,
    elevationGainFeet: ride.total_elevation_gain
      ? Math.round(ride.total_elevation_gain * 3.28084)
      : null,
    trainingLoad: ride.icu_training_load ?? null,
  };
};

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
    response.end();
    return;
  }

  if (request.method !== "GET" || request.url !== "/api/latest-ride") {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  try {
    const ride = await getLatestRide();
    sendJson(response, 200, { ride });
  } catch (error) {
    console.error(error.message);
    sendJson(response, 500, {
      error: "Unable to retrieve the latest ride",
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`RideReset server running at http://localhost:${port}`);
});