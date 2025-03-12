// ---- Wine Sales Constants -----
export const WINE_ORDER_TYPES = {
    "Private Order": { amountMultiplier: 1, priceMultiplier: 1 },
    "Engross Order": { amountMultiplier: 12, priceMultiplier: 0.85 }
};

/**
 * Wine order generation chance constants
 * 
 * These control how likely orders are to appear based on company prestige:
 * - MIN_BASE_CHANCE: Minimum chance for new players (5%)
 * - MID_PRESTIGE_CHANCE: Chance at 100 prestige (50%)
 * - MAX_BASE_CHANCE: Maximum possible chance (99%)
 * - MIN_DIMINISHING_FACTOR: Lowest possible diminishing factor (10%)
 * 
 * The prestige thresholds determine where different formulas apply:
 * - Below PRESTIGE_THRESHOLD: Linear scaling from 5% to 50%
 * - Above PRESTIGE_THRESHOLD: Arctangent scaling from 50% to 99%
 */
export const ORDER_GENERATION = {
    MIN_BASE_CHANCE: 0.05,     // 5% minimum chance for new players
    MID_PRESTIGE_CHANCE: 0.5,  // 50% chance at 100 prestige
    MAX_BASE_CHANCE: 0.99,     // 99% maximum chance
    PRESTIGE_THRESHOLD: 100,   // Threshold where formula changes
    MIN_DIMINISHING_FACTOR: 0.1, // Minimum diminishing factor (10%)
};

/**
 * Wine order amount calculation constants
 * 
 * These factors determine the range of possible order amounts:
 * - MIN_BASE_FACTOR & MAX_BASE_FACTOR: Define the random range for base order amounts
 *   (0.1 to 6.0 means very small to medium-sized orders at base level)
 * 
 * - MIN_PRESTIGE_EFFECT & MAX_PRESTIGE_EFFECT: Control how field prestige affects order sizes
 *   (1.0 to 7.0 means field prestige can increase order amounts up to 7x for prestigious fields)
 * 
 * Together, these determine the baseline order amount before price adjustments and type multipliers.
 * At maximum values, a high-prestige wine could receive orders up to 42 bottles (6.0 * 7.0),
 * before applying discount multipliers and order type effects.
 */
export const ORDER_AMOUNT_FACTORS = {
    MIN_BASE_FACTOR: 0.1,   // Minimum random factor for base order amount
    MAX_BASE_FACTOR: 6.0,   // Maximum random factor for base order amount
    MIN_PRESTIGE_EFFECT: 1.0, // Minimum multiplier from field prestige (no boost for 0 prestige)
    MAX_PRESTIGE_EFFECT: 7.0  // Maximum multiplier from field prestige (7x for prestige = 1.0)
};

/**
 * Wine price negotiation constants
 * 
 * These factors control the haggling process when customers place orders:
 * - MIN_HAGGLING_FACTOR: The lowest possible price multiplier after haggling
 *   (0.5 means customers might offer as little as 50% of your set price)
 * 
 * - MAX_HAGGLING_FACTOR: The highest possible price multiplier after haggling
 *   (1.4 means customers might offer up to 140% of your set price for exceptional wines)
 * 
 * The actual haggling factor is randomly selected between these values for each order,
 * simulating customers who bargain for better deals or occasionally pay premium prices.
 */
export const PRICE_NEGOTIATION = {
    MIN_HAGGLING_FACTOR: 0.5,  // Minimum price multiplier after haggling (50% of set price)
    MAX_HAGGLING_FACTOR: 1.4   // Maximum price multiplier after haggling (140% of set price)
};

/**
 * Wine contract generation constants
 * 
 * CONTRACT_RELATIONSHIP_THRESHOLD: Minimum relationship needed to get contracts
 * BASE_CONTRACT_CHANCE: Base chance (5%) for an eligible importer to offer a contract
 * RELATIONSHIP_MIDPOINT: Relationship value where chance becomes 50%
 * MAX_CONTRACT_CHANCE: Maximum possible contract chance (80%)
 */
export const CONTRACT_GENERATION = {
    MIN_RELATIONSHIP_THRESHOLD: 0.01,  // Lowered threshold to make contracts more likely to appear
    BASE_CONTRACT_CHANCE: 0.05,      // 5% base chance
    RELATIONSHIP_MIDPOINT: 20,       // 50% chance at relationship 20
    MAX_CONTRACT_CHANCE: 0.8,        // 80% maximum chance
    MAX_PENDING_CONTRACTS: 5,        // Maximum number of pending contracts allowed
};

// ---- Farmland Constants ----
export const DEFAULT_FARMLAND_HEALTH = 0.5; // 50% is the default/reset value
export const ORGANIC_YEARS_REQUIRED = 3; // years needed for organic certification

// ---- Staff wage constants ----
export const BASE_WEEKLY_WAGE = 500; // Base weekly wage for lowest skill
export const SKILL_WAGE_MULTIPLIER = 1000; // Multiplier for skills

// ---- Work Constants ----
export const BASE_WORK_UNITS = 50; // work units per standard week
export const DEFAULT_VINE_DENSITY = 5000; // default vines per acre

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
        rate: 500000,  // Can maintain €500,000 worth of value per week
        initialWork: 10  // Base setup work for any maintenance task is low. You can maintain a small building just for one day work. 
    },
    CONSTRUCTION: {
        name: 'Building Construction',
        type: 'maintenance',
        rate: 100000,  // Can build/upgrade €100,000 worth of building per week (same as maintenance)
        initialWork: 200  // Initial setup of construction site, paperwork, permits, etc.
    },
    BOOKKEEPING: {
        name: 'Bookkeeping',
        type: 'administration',
        rate: 50,  // Can process 50 transactions/week
        initialWork: 5  // Very easy to start/stop, minimal setup needed
    },
    FERMENTATION: {
        name: 'Fermentation',
        type: 'winery',
        rate: 5.0,  // Can ferment 5000L per week (after converting to kL)
        initialWork: 25  // Setup fermentation vessels, yeast preparation, etc.
    }
};


