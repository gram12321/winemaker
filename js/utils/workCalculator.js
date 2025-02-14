import { BASE_WORK_UNITS, WORK_RATES, Workrate } from '../constants/constants.js';

function calculateRealWorldWorkWeeks(acres, taskType, density, taskIntensity = 1.0) {
    const workRate = Workrate(taskType, WORK_RATES[taskType], density);
    return (acres * taskIntensity) / workRate;
}

export function calculateTotalWork(acres, factors = {}) {
    const { density, tasks = [], taskMultipliers = {}, workModifiers = [] } = factors;
    
    // Calculate base work from tasks
    const baseWork = tasks.reduce((total, task) => {
        const workWeeks = calculateRealWorldWorkWeeks(
            acres,
            task,
            density,
            taskMultipliers[task] || 1.0
        );
        return total + (workWeeks * BASE_WORK_UNITS);
    }, 0);

    // Apply modifiers
    const totalWork = workModifiers.reduce((work, modifier) => 
        work * (1 + modifier), baseWork);

    return Math.ceil(totalWork);
}
