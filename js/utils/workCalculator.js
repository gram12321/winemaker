import { BASE_WORK_UNITS, WORK_RATES, DENSITY_DIVISOR } from '../constants/constants.js';

export class WorkCalculator {
    constructor() {
        this.baseWorkUnits = BASE_WORK_UNITS;
    }

    calculateRealWorldWorkWeeks(acres, params = {}) {
        const { 
            taskType,
            density = DENSITY_DIVISOR,  // Default to DENSITY_DIVISOR (1000) so density/DENSITY_DIVISOR = 1
            taskIntensity = 1.0
        } = params;

        // Normalize density by dividing by DENSITY_DIVISOR
        // For acre-based tasks this becomes 1000/1000 = 1
        // For vine tasks this becomes actual_density/1000
        const normalizedDensity = density / DENSITY_DIVISOR;
        
        return (acres * normalizedDensity * taskIntensity) / WORK_RATES[taskType];
    }

    calculateTotalWork(acres, factors = {}) {
        const { 
            density = DEFAULT_VINE_DENSITY,
            tasks = [],
            taskMultipliers = {},
            workModifiers = []
        } = factors;

        let totalWork = 0;

        // Calculate base work from real-world rates
        tasks.forEach(task => {
            const taskIntensity = taskMultipliers[task] || 1.0;
            const workWeeks = this.calculateRealWorldWorkWeeks(acres, {
                taskType: task,
                density,
                taskIntensity
            });
            totalWork += workWeeks * this.baseWorkUnits;
        });

        // Apply additional modifiers (like altitude, fragility)
        workModifiers.forEach(modifier => {
            totalWork *= (1 + modifier);
        });

        return Math.ceil(totalWork);
    }
}

export const workCalculator = new WorkCalculator();
