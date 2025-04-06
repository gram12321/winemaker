import { BASE_WORK_UNITS, TASKS, DENSITY_BASED_TASKS, DEFAULT_VINE_DENSITY } from '../constants/constants.js';

// Universal work calculation that handles both field and non-field tasks:
// 1. Get task's base processing rate (adjusted for density if applicable)
// 2. Calculate work weeks needed based on amount/rate
// 3. Add any initial setup work defined for the task
// 4. Convert to work units (weeks * BASE_WORK_UNITS)
// 5. Apply modifiers
// 6. Return total work rounded up to nearest whole number


export function calculateTotalWork(amount, factors = {}) {
    const { density = null, tasks = [], taskMultipliers = {}, workModifiers = [] } = factors;

    const baseWork = tasks.reduce((total, taskType) => {
        const task = TASKS[taskType];
        const baseRate = task.rate;
        
        // Adjust rate for density if it's a density task
        const rate = DENSITY_BASED_TASKS.includes(taskType) && density ? 
            baseRate / (density / DEFAULT_VINE_DENSITY) : 
            baseRate;
        
        // Calculate work weeks and convert to work units
        const workWeeks = (amount * (taskMultipliers[taskType] || 1.0)) / rate;
        const workUnits = workWeeks * BASE_WORK_UNITS;
        
        // Add any initial work defined for the task
        const initialWork = task.initialWork || 0;
        
        return total + initialWork + workUnits;
    }, 0);

    // Apply modifiers
    const totalWork = workModifiers.reduce((work, modifier) => 
        work * (1 + modifier), baseWork);

    return Math.ceil(totalWork);
}
