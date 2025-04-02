/**
 * Game Constants
 * Central location for all game constants and configuration values
 */

// Time System
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];
export const WEEKS_PER_SEASON = 12;
export const SEASONS_PER_YEAR = 4;
export const STARTING_WEEK = 1;
export const STARTING_SEASON: Season = 'Spring';
export const STARTING_YEAR = 2023;

// Game Date structure
export interface GameDate {
  week: number;
  season: Season;
  year: number;
}

/**
 * Formats a GameDate object into a readable string
 * @param date GameDate object to format
 * @returns Formatted date string (e.g., "Week 3, Spring 2023")
 */
export function formatGameDate(date: GameDate): string {
  return `Week ${date.week}, ${date.season} ${date.year}`;
}

// Financial Constants
export const STARTING_MONEY = 10000000;
export const STARTING_PRESTIGE = 1;

// Vineyard Constants
export const BASE_YIELD_PER_ACRE = 2400; // kg
export const BASELINE_VINE_DENSITY = 5000; // vines per acre
export const CONVENTIONAL_YIELD_BONUS = 1.1; // 10% bonus for conventional farming
export const ORGANIC_CERTIFICATION_YEARS = 3; // Years to become certified ecological
export const ORGANIC_HEALTH_IMPROVEMENT = 0.05; // Health improvement per year for organic vineyards

// Ripeness Increases per Season
export const RIPENESS_INCREASE = {
  Spring: 0.01,
  Summer: 0.02,
  Fall: 0.05,
  Winter: 0
}; 