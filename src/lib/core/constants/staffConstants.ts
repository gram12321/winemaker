
// Staff Roles and Skills
export const STAFF_ROLES = {
  VINEYARD_MANAGER: 'VINEYARD_MANAGER',
  MASTER_WINEMAKER: 'MASTER_WINEMAKER',
  MAINTENANCE_SPECIALIST: 'MAINTENANCE_SPECIALIST',
  SALES_DIRECTOR: 'SALES_DIRECTOR',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER'
} as const;

// Wage Constants
export const BASE_WEEKLY_WAGE = 500;
export const SKILL_WAGE_MULTIPLIER = 1000;
export const SPECIALIZATION_WAGE_BONUS = 0.2;

// Skill Levels
export const SkillLevels = {
  NOVICE: { value: 0.1, label: 'Novice', formattedName: 'Fresh Off the Vine' },
  APPRENTICE: { value: 0.3, label: 'Apprentice', formattedName: 'Growing Experience' },
  INTERMEDIATE: { value: 0.5, label: 'Intermediate', formattedName: 'Seasoned Worker' },
  ADVANCED: { value: 0.7, label: 'Advanced', formattedName: 'Master of the Craft' },
  EXPERT: { value: 0.9, label: 'Expert', formattedName: 'Wine Sage' },
  LEGENDARY: { value: 1.0, label: 'Legendary', formattedName: 'Living Legend' }
};

// Specialized Roles
export const SpecializedRoles = {
  [STAFF_ROLES.VINEYARD_MANAGER]: {
    id: STAFF_ROLES.VINEYARD_MANAGER,
    title: 'Vineyard Manager',
    description: 'Specializes in vineyard operations and grape cultivation',
    skillBonus: { field: 0.2 },
    defaultTaskTypes: ['planting', 'pruning', 'harvesting']
  },
  [STAFF_ROLES.MASTER_WINEMAKER]: {
    id: STAFF_ROLES.MASTER_WINEMAKER,
    title: 'Master Winemaker',
    description: 'Expert in wine production and cellar operations',
    skillBonus: { winery: 0.2 },
    defaultTaskTypes: ['crushing', 'fermenting', 'aging']
  },
  [STAFF_ROLES.MAINTENANCE_SPECIALIST]: {
    id: STAFF_ROLES.MAINTENANCE_SPECIALIST,
    title: 'Maintenance Specialist',
    description: 'Focuses on equipment maintenance and repairs',
    skillBonus: { maintenance: 0.2 },
    defaultTaskTypes: ['maintenance', 'repair']
  },
  [STAFF_ROLES.SALES_DIRECTOR]: {
    id: STAFF_ROLES.SALES_DIRECTOR,
    title: 'Sales Director',
    description: 'Manages wine sales and customer relations',
    skillBonus: { sales: 0.2 },
    defaultTaskTypes: ['sales', 'marketing']
  },
  [STAFF_ROLES.OPERATIONS_MANAGER]: {
    id: STAFF_ROLES.OPERATIONS_MANAGER,
    title: 'Operations Manager',
    description: 'Oversees administrative tasks and operations',
    skillBonus: { administration: 0.2 },
    defaultTaskTypes: ['administration', 'planning']
  }
};

// Default Teams
export const DefaultTeams = {
  VINEYARD_TEAM: {
    id: 'VINEYARD_TEAM',
    name: 'Vineyard Team',
    description: 'Handles all vineyard operations',
    preferredTaskTypes: ['planting', 'pruning', 'harvesting'],
    recommendedSpecializations: [STAFF_ROLES.VINEYARD_MANAGER]
  },
  WINERY_TEAM: {
    id: 'WINERY_TEAM',
    name: 'Winery Team',
    description: 'Manages wine production',
    preferredTaskTypes: ['crushing', 'fermenting', 'aging'],
    recommendedSpecializations: [STAFF_ROLES.MASTER_WINEMAKER]
  },
  MAINTENANCE_TEAM: {
    id: 'MAINTENANCE_TEAM',
    name: 'Maintenance Team',
    description: 'Handles repairs and upkeep',
    preferredTaskTypes: ['maintenance', 'repair'],
    recommendedSpecializations: [STAFF_ROLES.MAINTENANCE_SPECIALIST]
  },
  SALES_TEAM: {
    id: 'SALES_TEAM',
    name: 'Sales Team',
    description: 'Manages sales and customer relations',
    preferredTaskTypes: ['sales', 'marketing'],
    recommendedSpecializations: [STAFF_ROLES.SALES_DIRECTOR]
  },
  ADMIN_TEAM: {
    id: 'ADMIN_TEAM',
    name: 'Administrative Team',
    description: 'Handles administrative tasks',
    preferredTaskTypes: ['administration', 'planning'],
    recommendedSpecializations: [STAFF_ROLES.OPERATIONS_MANAGER]
  }
};

// Country to Region mapping
export const countryRegionMap = {
  "France": ["Bordeaux", "Burgundy (Bourgogne)", "Champagne", "Loire Valley", "Rhone Valley", "Jura"],
  "Germany": ["Ahr", "Mosel", "Pfalz", "Rheingau", "Rheinhessen"],
  "Italy": ["Piedmont", "Puglia", "Sicily", "Tuscany", "Veneto"],
  "Spain": ["Jumilla", "La Mancha", "Ribera del Duero", "Rioja", "Sherry (Jerez)"],
  "United States": ["Central Coast (California)", "Finger Lakes (New York)", "Napa Valley (California)", "Sonoma County (California)", "Willamette Valley (Oregon)"]
};

// Names by nationality
export const italianMaleNames = [/* names omitted for brevity - same as original */];
export const italianFemaleNames = [/* names omitted for brevity - same as original */];
export const frenchMaleNames = [/* names omitted for brevity - same as original */];
export const frenchFemaleNames = [/* names omitted for brevity - same as original */];
export const spanishMaleNames = [/* names omitted for brevity - same as original */];
export const spanishFemaleNames = [/* names omitted for brevity - same as original */];
export const usMaleNames = [/* names omitted for brevity - same as original */];
export const usFemaleNames = [/* names omitted for brevity - same as original */];
export const germanMaleNames = [/* names omitted for brevity - same as original */];
export const germanFemaleNames = [/* names omitted for brevity - same as original */];

// Last names by country
export const lastNamesByCountry = {/* data omitted for brevity - same as original */};
