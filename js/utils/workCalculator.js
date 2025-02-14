import { BASE_WORK_UNITS, WORK_RATES, Workrate } from '../constants/constants.js';

export class WorkCalculator {
    constructor() {
        this.baseWorkUnits = BASE_WORK_UNITS;
    }

    calculateRealWorldWorkWeeks(acres, params = {}) {
        const { 
            taskType,
            density,
            taskIntensity = 1.0
        } = params;

        // Debug logging
        console.log('=== Work Week Calculation Debug ===');
        console.log('Input:', { acres, taskType, density, taskIntensity, workRate: WORK_RATES[taskType] });

        const effectiveWorkRate = Workrate(taskType, WORK_RATES[taskType], density);
        const workWeeks = acres / effectiveWorkRate;

        // Debug logging
        console.log('Calculation Steps:', {
            effectiveWorkRate,
            workWeeks,
            finalWorkUnits: workWeeks * this.baseWorkUnits
        });

        return workWeeks;
    }

    calculateTotalWork(acres, factors = {}) {
        const { 
            density,
            tasks = [],
            taskMultipliers = {},
            workModifiers = []
        } = factors;

        console.log('Total Work Calculation:', {
            acres,
            density,
            tasks,
            taskMultipliers,
            workModifiers
        });

        let totalWork = 0;

        // Calculate base work from real-world rates
        tasks.forEach(task => {
            const taskIntensity = taskMultipliers[task] || 1.0;
            const workWeeks = this.calculateRealWorldWorkWeeks(acres, {
                taskType: task,
                density,
                taskIntensity
            });
            const taskWork = workWeeks * this.baseWorkUnits;
            console.log(`Task ${task}:`, { workWeeks, taskWork });
            totalWork += taskWork;
        });

        // Apply additional modifiers (like altitude, fragility)
        workModifiers.forEach(modifier => {
            totalWork *= (1 + modifier);
            console.log('After modifier:', { modifier, totalWork });
        });

        return Math.ceil(totalWork);
    }
}

export const workCalculator = new WorkCalculator();
