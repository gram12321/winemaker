// Work Constants
export const BASE_WORK_UNITS = 50; // work units per standard week
export const DENSITY_DIVISOR = 1000;

// Real-world work rates (units per worker per week)
export const WORK_RATES = {
    PLANTING: 3500,      // vines planted per week
    UPROOTING: 2800,     // vines removed per week (slower than planting)
    VEGETATION: 0.5,     // acres cleared per week // arbitrary value Need confirmation
    DEBRIS: 0.4,         // acres cleared per week // arbitrary value Need confirmation
    AMENDMENT: 0.8       // acres amended per week // arbitrary value Need confirmation
};

// Farmland Constants 
export const DEFAULT_FARMLAND_HEALTH = 0.5; // 50% is the default/reset value
export const DEFAULT_VINE_DENSITY = 5000; // default vines per acre
export const ORGANIC_YEARS_REQUIRED = 3; // years needed for organic certification

