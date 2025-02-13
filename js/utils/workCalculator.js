import { BASE_WORK_UNITS, DENSITY_DIVISOR } from '../constants/constants.js';

export class WorkCalculator {
    constructor() {
        this.baseWorkUnits = BASE_WORK_UNITS;
    }

    calculateDensityFactor(density) {
        return density / DENSITY_DIVISOR;
    }

    calculateTotalWork(acres, factors = {}) {
        const { 
            density = 5000,  // Changed default to 5000
            tasks = [],
            taskMultipliers = {}
        } = factors;

        let totalWork = this.baseWorkUnits * acres;
        
        // Add density-based work using DENSITY_DIVISOR
        if (density) {
            const densityFactor = this.calculateDensityFactor(density);
            totalWork *= (1 + densityFactor);
        }

        // Add task-based work
        tasks.forEach(task => {
            const multiplier = taskMultipliers[task] || 1;
            totalWork *= multiplier;
        });

        return Math.ceil(totalWork);
    }
}

export const workCalculator = new WorkCalculator();
