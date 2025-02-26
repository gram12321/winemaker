import { BASE_WORK_UNITS, TASKS, DENSITY_BASED_TASKS, DEFAULT_VINE_DENSITY } from '../constants/constants.js';

// Move rate calculations from constants.js to here
export const WORK_RATES = Object.fromEntries(
    Object.entries(TASKS).map(([key, task]) => [key, task.rate])
);

export function calculateWorkRate(taskType, baseRate, density) {
    if (DENSITY_BASED_TASKS.includes(taskType)) {
        const densityRatio = density / DEFAULT_VINE_DENSITY;
        return baseRate / densityRatio;  // More vines = lower acres/week rate
    }
    return baseRate;
}

function calculateWorkWeeks(amount, taskType, density = null, taskMultiplier = 1.0) {
    const baseRate = WORK_RATES[taskType];
    const rate = density ? 
        calculateWorkRate(taskType, baseRate, density) : // Field tasks use density
        baseRate;                                        // Non-field tasks use base rate
    
    return (amount * taskMultiplier) / rate;
}

// Both field and non-field calculations now follow the same pattern:
// 1. Calculate work weeks based on amount (acres or units) and rate
// 2. Convert to work units
// 3. Apply modifiers

export function calculateFieldTotalWork(acres, factors = {}) {
    const { density, tasks = [], taskMultipliers = {}, workModifiers = [] } = factors;
    
    const baseWork = tasks.reduce((total, taskType) => {
        const workWeeks = calculateWorkWeeks(
            acres,
            taskType, 
            density,
            taskMultipliers[taskType] || 1.0
        );
        return total + (workWeeks * BASE_WORK_UNITS);
    }, 0);

    return Math.ceil(
        workModifiers.reduce((work, modifier) => work * (1 + modifier), baseWork)
    );
}

export function calculateNonFieldTotalWork(amount, factors = {}) {
    const { tasks = [], taskMultipliers = {}, workModifiers = [] } = factors;

    const baseWork = tasks.reduce((total, taskType) => {
        const workWeeks = calculateWorkWeeks(
            amount,
            taskType,
            null, // No density for non-field tasks
            taskMultipliers[taskType] || 1.0
        );
        return total + (workWeeks * BASE_WORK_UNITS);
    }, 0);

    return Math.ceil(
        workModifiers.reduce((work, modifier) => work * (1 + modifier), baseWork)
    );
}
