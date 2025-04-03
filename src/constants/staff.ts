export const STAFF_ROLES = {
  FIELD_WORKER: 'field_worker',
  WINEMAKER: 'winemaker',
  CELLAR_MASTER: 'cellar_master',
  SALES_MANAGER: 'sales_manager',
  MAINTENANCE: 'maintenance',
  ADMINISTRATOR: 'administrator',
} as const;

export const STAFF_ROLE_TITLES = {
  [STAFF_ROLES.FIELD_WORKER]: 'Field Worker',
  [STAFF_ROLES.WINEMAKER]: 'Winemaker',
  [STAFF_ROLES.CELLAR_MASTER]: 'Cellar Master',
  [STAFF_ROLES.SALES_MANAGER]: 'Sales Manager',
  [STAFF_ROLES.MAINTENANCE]: 'Maintenance Worker',
  [STAFF_ROLES.ADMINISTRATOR]: 'Administrator',
} as const;

export const STAFF_ROLE_DESCRIPTIONS = {
  [STAFF_ROLES.FIELD_WORKER]: 'Manages vineyard operations and grape harvesting',
  [STAFF_ROLES.WINEMAKER]: 'Oversees wine production and quality control',
  [STAFF_ROLES.CELLAR_MASTER]: 'Manages wine aging and storage',
  [STAFF_ROLES.SALES_MANAGER]: 'Handles wine sales and distribution',
  [STAFF_ROLES.MAINTENANCE]: 'Maintains equipment and facilities',
  [STAFF_ROLES.ADMINISTRATOR]: 'Manages administrative tasks and planning',
} as const;

export const STAFF_SKILLS = {
  FIELD: 'field',
  WINERY: 'winery',
  SALES: 'sales',
  MAINTENANCE: 'maintenance',
  ADMINISTRATION: 'administration',
} as const;

export const SKILL_LEVEL_LABELS = {
  0: 'Novice',
  0.2: 'Beginner',
  0.4: 'Intermediate',
  0.6: 'Advanced',
  0.8: 'Expert',
  1.0: 'Master',
} as const;

export const STAFF_ROLE_TO_PRIMARY_SKILL = {
  [STAFF_ROLES.FIELD_WORKER]: STAFF_SKILLS.FIELD,
  [STAFF_ROLES.WINEMAKER]: STAFF_SKILLS.WINERY,
  [STAFF_ROLES.CELLAR_MASTER]: STAFF_SKILLS.WINERY,
  [STAFF_ROLES.SALES_MANAGER]: STAFF_SKILLS.SALES,
  [STAFF_ROLES.MAINTENANCE]: STAFF_SKILLS.MAINTENANCE,
  [STAFF_ROLES.ADMINISTRATOR]: STAFF_SKILLS.ADMINISTRATION,
} as const;

export const BASE_WAGE = 2000; // Base monthly wage in currency units
export const SKILL_WAGE_MULTIPLIER = 1.5; // Wage multiplier per skill level
export const SPECIALIZATION_WAGE_BONUS = 500; // Additional wage for specialized roles 