// Work Constants
export const BASE_WORK_UNITS = 50; // work units per standard week
export const DEFAULT_VINE_DENSITY = 5000; // default vines per acre

export const TASKS = {
    PLANTING: { name: 'Planting', rate: 0.7 },
    UPROOTING: { name: 'Uprooting', rate: 0.56 },
    HARVESTING: { 
        name: 'Harvesting',  
        rate: 4.4  // Changed from 0.8 to 4.4 based on real-world calculations:
                   // 1 worker (50 units/week) can harvest ~10500kg/week
                   // With baseYieldPerAcre of 2400kg, this means 4.4 acres/week
    },
    CRUSHING: {  // Add crushing task
        name: 'Crushing',
        rate: 2.5  // Change from 1.5 to 2.5
                   // This means one worker (50 units/week) can crush 2.5 tons/week by hand
                   // Which is roughly 250-300kg per day (realistic for hand crushing)
    },
    VEGETATION: { name: 'Vegetation', rate: 0.5 },
    DEBRIS: { name: 'Debris', rate: 0.4 },
    AMENDMENT: { name: 'Amendment', rate: 0.8 },
    'Staff Search': { name: 'Staff Search', type: 'administration' },
    'Hiring Process': { name: 'Hiring Process', type: 'administration' }
};

// Then update WORK_RATES to use these:
export const WORK_RATES = Object.fromEntries(
    Object.entries(TASKS).map(([key, task]) => [key, task.rate])
);

// Define density-based tasks
export const DENSITY_BASED_TASKS = ['PLANTING', 'UPROOTING', 'HARVESTING'];

// Apply density ratio to work rates for density-based tasks
export function Workrate(taskType, baseRate, density) {
    if (DENSITY_BASED_TASKS.includes(taskType)) {
        const densityRatio = density / DEFAULT_VINE_DENSITY;
        return baseRate / densityRatio;  // More vines = lower acres/week rate
    }
    return baseRate;
}

// Farmland Constants 
export const DEFAULT_FARMLAND_HEALTH = 0.5; // 50% is the default/reset value
export const ORGANIC_YEARS_REQUIRED = 3; // years needed for organic certification

