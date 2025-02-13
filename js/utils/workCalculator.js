export class WorkCalculator {
    constructor(baseWorkPerAcre = 50) {
        this.baseWorkPerAcre = baseWorkPerAcre;
    }

    calculateTotalWork(acres, factors = {}) {
        const { 
            density = 0,
            densityMultiplier = 1,
            tasks = [],
            taskMultipliers = {}
        } = factors;

        let totalWork = this.baseWorkPerAcre * acres;
        
        // Add density-based work
        if (density) {
            const densityFactor = (density / 1000) * densityMultiplier;
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
