// Work Constants
export const BASE_WORK_UNITS = 50; // work units per standard week
export const DEFAULT_VINE_DENSITY = 5000; // default vines per acre

// Farmland Constants 
export const DEFAULT_FARMLAND_HEALTH = 0.5; // 50% is the default/reset value
export const ORGANIC_YEARS_REQUIRED = 3; // years needed for organic certification

// Define density-based tasks
export const DENSITY_BASED_TASKS = ['PLANTING', 'UPROOTING', 'HARVESTING'];

export const TASKS = {
    // Field tasks (rate in acres/week)
    PLANTING: { name: 'Planting', rate: 0.7 },
    UPROOTING: { name: 'Uprooting', rate: 0.56 },
    HARVESTING: { 
        name: 'Harvesting',  
        rate: 4.4  // 4.4 acres/week
    },
    // Field cleaning tasks
    VEGETATION: { name: 'Vegetation', rate: 0.5 },
    DEBRIS: { name: 'Debris', rate: 0.4 },
    AMENDMENT: { name: 'Amendment', rate: 0.8 },
    
    // Process tasks (rate in units/week)
    CRUSHING: {
        name: 'Crushing',
        rate: 2.5  // 2.5 tons/week
    },
    STAFF_SEARCH: {
        name: 'Staff Search',
        type: 'administration',
        rate: 5.0,  // Can process 5 candidates/week
        initialWork: 25  // Base paperwork needed regardless of candidates
    },
    STAFF_HIRING: {
        name: 'Hiring Process',
        type: 'administration',
        rate: 1.0,  // Can process 1 hire/week
        initialWork: 25  // Contract preparation, initial paperwork, etc
    }
};


