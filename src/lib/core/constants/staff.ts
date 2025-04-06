
import { type Staff, type StaffSkills } from '../../../services/staffService';

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

// Staff Names
export const italianMaleNames = ['Marco', 'Giuseppe', 'Antonio', 'Giovanni', 'Luigi'];
export const italianFemaleNames = ['Sofia', 'Isabella', 'Giulia', 'Maria', 'Valentina'];
export const frenchMaleNames = ['Jean', 'Pierre', 'Michel', 'François', 'Louis'];
export const frenchFemaleNames = ['Marie', 'Sophie', 'Claire', 'Anne', 'Isabelle'];
export const spanishMaleNames = ['Juan', 'Carlos', 'Miguel', 'Antonio', 'José'];
export const spanishFemaleNames = ['María', 'Ana', 'Carmen', 'Isabel', 'Laura'];
export const usMaleNames = ['John', 'James', 'Robert', 'William', 'Michael'];
export const usFemaleNames = ['Mary', 'Jennifer', 'Linda', 'Patricia', 'Elizabeth'];
export const germanMaleNames = ['Hans', 'Klaus', 'Peter', 'Wolfgang', 'Heinrich'];
export const germanFemaleNames = ['Anna', 'Maria', 'Ursula', 'Elisabeth', 'Helga'];

// Last names by country
export const lastNamesByCountry = {
  'Italy': ['Rossi', 'Ferrari', 'Russo', 'Bianchi', 'Romano'],
  'France': ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert'],
  'Spain': ['García', 'Rodríguez', 'González', 'Fernández', 'López'],
  'United States': ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'],
  'Germany': ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber']
};
