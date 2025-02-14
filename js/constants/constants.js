// Work Constants
export const BASE_WORK_UNITS = 50; // work units per standard week
export const DEFAULT_VINE_DENSITY = 5000; // default vines per acre

// Real-world work rates (all in acres per week)
export const WORK_RATES = {
    // A worker can plant 3500 vines per week
    // At DEFAULT_VINE_DENSITY (5000 vines/acre), this means:
    // 3500 vines/week ÷ 5000 vines/acre = 0.7 acres/week
    PLANTING: 0.7,      // acres planted per week at default density
    
    // 20% slower than planting: 2800 vines/week
    // 2800 vines/week ÷ 5000 vines/acre = 0.56 acres/week
    UPROOTING: 0.56,    // acres removed per week at default density
    
    // 4000 vines/week ÷ 5000 vines/acre = 0.8 acres/week
    HARVESTING: 0.8,    // acres harvested per week at default density
    
    // Non-vine tasks (straight acres per week)
    VEGETATION: 0.5,    // acres cleared per week
    DEBRIS: 0.4,        // acres cleared per week
    AMENDMENT: 0.8      // acres amended per week
};

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

