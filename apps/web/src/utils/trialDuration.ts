import type { TrialDurationUnit } from '../types';

const UNIT_MS: Record<TrialDurationUnit, number> = {
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  years: 365 * 24 * 60 * 60 * 1000,
};

export function trialDurationToMs(value: number, unit: TrialDurationUnit): number {
  return value * UNIT_MS[unit];
}
