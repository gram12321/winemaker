// Work Constants
export const BASE_WORK_UNITS = 50; // work units per standard week
export const DEFAULT_VINE_DENSITY = 5000; // default vines per acre

// Farmland Constants 
export const DEFAULT_FARMLAND_HEALTH = 0.5; // 50% is the default/reset value
export const ORGANIC_YEARS_REQUIRED = 3; // years needed for organic certification

// Staff wage constants
export const BASE_WEEKLY_WAGE = 500; // Base weekly wage for lowest skill
export const SKILL_WAGE_MULTIPLIER = 1000; // Multiplier for skills

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
    },
    MAINTENANCE: {
        name: 'Building Maintenance',
        type: 'maintenance',
        rate: 100000,  // Can maintain €100,000 worth of value per week
        initialWork: 10  // Base setup work for any maintenance task is low. You can maintain a small building just for one day work. 
    },
    BOOKKEEPING: {
        name: 'Bookkeeping',
        type: 'administration',
        rate: 50,  // Can process 50 transactions/week
        initialWork: 5  // Very easy to start/stop, minimal setup needed
    }
};


