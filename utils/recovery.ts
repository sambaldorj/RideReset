import type {
    IntervalsActivity,
    TrainingSummary,
} from '../services/intervals';

export type SleepQuality = 'Poor' | 'Fair' | 'Good' | 'Great';

export type SleepEntry = {
    hours: number;
    quality: SleepQuality;
    savedAt: string;
};

export type RecoveryResult = {
    score: number;
    status: string;
    color: string;
    rideType: string;
    rideDetails: string;
    reason: string;
};

export function calculateRecovery(
    sleep: SleepEntry | null,
    ride: IntervalsActivity | null,
    trainingSummary: TrainingSummary | null
): RecoveryResult {
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

    let loadPenalty = 0;

    if (trainingSummary) {
        const weeklyLoad = trainingSummary.totalLoad;

        if (weeklyLoad >= 350) {
            loadPenalty = 18;
        } else if (weeklyLoad >= 250) {
            loadPenalty = 12;
        } else if (weeklyLoad >= 150) {
            loadPenalty = 6;
        } else if (weeklyLoad >= 75) {
            loadPenalty = 3;
        }
    } else if (ride) {
        const rideTime = new Date(ride.start_date_local).getTime();
        const hoursSinceRide = (Date.now() - rideTime) / 3_600_000;

        if (
            !Number.isNaN(hoursSinceRide) &&
            hoursSinceRide >= 0 &&
            hoursSinceRide <= 72
        ) {
            const load = ride.icu_training_load ?? 0;

            if (load >= 120) {
                loadPenalty = 20;
            } else if (load >= 90) {
                loadPenalty = 14;
            } else if (load >= 60) {
                loadPenalty = 8;
            } else if (load > 0) {
                loadPenalty = 4;
            }
        }
    }

    score = Math.max(0, score - loadPenalty);

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
                'Your sleep and recent training load suggest keeping the next session conversational.',
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