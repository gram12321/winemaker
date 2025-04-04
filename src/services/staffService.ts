import { v4 as uuidv4 } from 'uuid';
import type { Staff as GameStateStaff } from '../gameState';
import { getGameState, updateGameState } from '../gameState';
import displayManager from '../lib/game/displayManager';
import { assignStaffToActivity, getActivityById } from '../lib/game/activityManager';
import {
  saveStaffToDb,
  removeStaffFromDb,
  updateStaffInDb,
  saveTeamToDb,
  loadTeamsFromDb,
  saveStaffAssignmentsToDb
} from '../lib/database/staffDB';
import {
  italianMaleNames,
  italianFemaleNames,
  frenchMaleNames,
  frenchFemaleNames,
  spanishMaleNames,
  spanishFemaleNames,
  usMaleNames,
  usFemaleNames,
  germanMaleNames,
  germanFemaleNames,
  lastNamesByCountry,
  BASE_WEEKLY_WAGE,
  SKILL_WAGE_MULTIPLIER,
  SPECIALIZATION_WAGE_BONUS,
  SkillLevels,
  DefaultTeams
} from '../constants/staff';

// Types for staff related functionality
export interface StaffSkills {
  field: number;
  winery: number;
  administration: number;
  sales: number;
  maintenance: number;
}

export interface SpecializedRole {
  id: string;
  title: string;
  description: string;
  skillBonus: keyof StaffSkills;
  bonusAmount: number;
}

export const SpecializedRoles: Record<string, SpecializedRole> = {
  field: { 
    id: 'field', 
    title: "Vineyard Manager", 
    description: "Expert in vineyard operations", 
    skillBonus: 'field',
    bonusAmount: 0.2
  },
  winery: { 
    id: 'winery', 
    title: "Master Winemaker", 
    description: "Specialist in wine production", 
    skillBonus: 'winery',
    bonusAmount: 0.2
  },
  administration: { 
    id: 'administration', 
    title: "Estate Administrator", 
    description: "Expert in business operations", 
    skillBonus: 'administration',
    bonusAmount: 0.2
  },
  sales: { 
    id: 'sales', 
    title: "Sales Director", 
    description: "Specialist in wine marketing and sales", 
    skillBonus: 'sales',
    bonusAmount: 0.2
  },
  maintenance: { 
    id: 'maintenance', 
    title: "Technical Director", 
    description: "Expert in facility maintenance", 
    skillBonus: 'maintenance',
    bonusAmount: 0.2
  }
};

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';

export interface GameDate {
  week: number;
  season: Season;
  year: number;
}

export interface StaffTeam {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  icon?: string;
  preferredTaskTypes: string[];
  recommendedSpecializations: string[];
  defaultTaskTypes?: string[];
}

export type Nationality = 'Italy' | 'Germany' | 'France' | 'Spain' | 'United States';

export interface Staff {
  id: string;
  name: string;
  nationality: Nationality;
  skillLevel: number;
  specialization: string | null;
  wage: number;
  teamId: string | null;
  skills: StaffSkills;
  hireDate: GameDate;
  workforce: number;
}

// Constants for staff wages and skill levels
export function getSkillLevelInfo(skillLevel: number) {
  // Find the closest skill level
  const levels = Object.values(SkillLevels);
  const closest = levels.reduce((prev, curr) => {
    return Math.abs(curr.value - skillLevel) < Math.abs(prev.value - skillLevel) ? curr : prev;
  });
  
  return {
    label: closest.label,
    formattedName: closest.formattedName,
    value: closest.value
  };
}

// Helper function to get the current game date from gameState
function getCurrentGameDate() {
  const gameState = getGameState();
  return {
    week: gameState.week,
    season: gameState.season,
    year: gameState.currentYear
  };
}

// Staff creation and management functions
export function createStaff(
  firstName: string, 
  lastName: string, 
  skillLevel: number = 0.1, 
  specialization: string = '', 
  nationality: string = 'United States',
  skills?: StaffSkills
): Staff {
  const id = uuidv4();
  const calculatedSkills = skills || generateRandomSkills(skillLevel, specialization);
  
  // Calculate wage based on skills and specialization - match old system's formula
  const avgSkill = (
    calculatedSkills.field +
    calculatedSkills.winery +
    calculatedSkills.administration +
    calculatedSkills.sales +
    calculatedSkills.maintenance
  ) / 5;

  // Add bonus for specialized roles (30% per specialization) - match old system
  const specializationBonus = specialization ? Math.pow(1.3, 1) : 1;
  
  // Use constants that match the old system
  const BASE_WEEKLY_WAGE = 500; // Same as old system
  const SKILL_WAGE_MULTIPLIER = 1000; // Same as old system
  
  // Calculate monthly wage exactly like old system:
  // Base (500/week) + Skill bonus (up to 1000/week extra) * specialization bonus
  const weeklyWage = (BASE_WEEKLY_WAGE + (avgSkill * SKILL_WAGE_MULTIPLIER)) * specializationBonus;
  
  // Convert to monthly (multiply by 52/12) - exact match to old system
  const monthlyWage = Math.round(weeklyWage * 52/12);
  
  return {
    id,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    nationality,
    skillLevel,
    specialization: specialization || null,
    skills: calculatedSkills,
    wage: monthlyWage || BASE_WEEKLY_WAGE * 52/12, // Fallback to base wage if calculation fails
    workforce: 50, // Default workforce value from old system
    hireDate: getCurrentGameDate(),
    teamId: null
  };
}

export function addStaff(staff: Staff, saveToDb = false) {
  const gameState = getGameState();
  const updatedStaff = [...gameState.staff, staff];
  
  updateGameState({ staff: updatedStaff });
  
  if (saveToDb) {
    saveStaffToDb(staff);
  }
  
  return staff;
}

export function removeStaff(staffId: string, saveToDb = false) {
  const gameState = getGameState();
  const updatedStaff = gameState.staff.filter(s => s.id !== staffId);
  
  updateGameState({ staff: updatedStaff });
  
  if (saveToDb) {
    removeStaffFromDb(staffId);
  }
  
  return updatedStaff;
}

export function updateStaff(updatedStaff: Staff, saveToDb = false) {
  const gameState = getGameState();
  const updatedStaffList = gameState.staff.map(s => 
    s.id === updatedStaff.id ? updatedStaff : s
  );
  
  updateGameState({ staff: updatedStaffList });
  
  if (saveToDb) {
    updateStaffInDb(updatedStaff);
  }
  
  return updatedStaff;
}

export function getStaffById(staffId: string): Staff | undefined {
  const gameState = getGameState();
  return gameState.staff.find(s => s.id === staffId);
}

export function getAllStaff(): Staff[] {
  const gameState = getGameState();
  return gameState.staff;
}

// Utility functions
function selectRandomNationality(): Nationality {
  const nationalities: Nationality[] = ['Italy', 'Germany', 'France', 'Spain', 'United States'];
  return nationalities[Math.floor(Math.random() * nationalities.length)];
}

// Function to generate randomized skills
export function generateRandomSkills(skillModifier: number = 0.5, specialization: string = ''): StaffSkills {
  // Exactly match old system's skill randomization
  const getSkillValue = (forSpecialization: boolean): number => {
    // Calculate base skill value first - exactly like old system
    const baseValue = (Math.random() * 0.6) + (skillModifier * 0.4);
    
    // For specialized roles, add a percentage-based bonus that scales with skill
    if (forSpecialization) {
      const remainingPotential = 1.0 - baseValue;
      const bonusPercentage = 0.2 + (skillModifier * 0.2); // 20-40%
      const bonus = remainingPotential * bonusPercentage;
      return Math.min(1.0, baseValue + bonus);
    }
    
    return baseValue;
  };
  
  return {
    field: getSkillValue(specialization === 'field'),
    winery: getSkillValue(specialization === 'winery'),
    administration: getSkillValue(specialization === 'administration'),
    sales: getSkillValue(specialization === 'sales'),
    maintenance: getSkillValue(specialization === 'maintenance')
  };
}

// Calculate wage based on skills and specialization
export function calculateWage(skills: StaffSkills, specialization: string | null = null): number {
  const avgSkill = (
    skills.field +
    skills.winery +
    skills.administration +
    skills.sales +
    skills.maintenance
  ) / 5;
  
  // Add bonus for specialized roles (30% bonus)
  const specializationBonus = specialization ? 1.3 : 1;
  
  // Calculate monthly wage
  const weeklyWage = (BASE_WEEKLY_WAGE + (avgSkill * SKILL_WAGE_MULTIPLIER)) * specializationBonus;
  
  // Convert to monthly (multiply by 52/12)
  return Math.round(weeklyWage * 52/12);
}

// Team management functions
export function createTeam(
  name: string,
  description: string,
  icon: string,
  defaultTaskTypes: string[] = []
): StaffTeam {
  return {
    id: uuidv4(),
    name,
    description,
    icon,
    memberIds: [],
    preferredTaskTypes: defaultTaskTypes,
    recommendedSpecializations: [],
    defaultTaskTypes
  };
}

export function saveTeam(team: StaffTeam, saveToDb = false) {
  // For now, just store in localStorage
  const teamsJSON = localStorage.getItem('staffTeams');
  const teams: StaffTeam[] = teamsJSON ? JSON.parse(teamsJSON) : [];
  
  // Update or add the team
  const existingIndex = teams.findIndex(t => t.id === team.id);
  if (existingIndex >= 0) {
    teams[existingIndex] = team;
  } else {
    teams.push(team);
  }
  
  localStorage.setItem('staffTeams', JSON.stringify(teams));
  
  if (saveToDb) {
    saveTeamToDb(team);
  }
  
  return team;
}

export async function loadTeams(): Promise<StaffTeam[]> {
  return await loadTeamsFromDb();
}

export function assignStaffToTeam(staffId: string, teamId: string | null) {
  const staff = getStaffById(staffId);
  if (!staff) return null;
  
  const updatedStaff = { ...staff, teamId };
  return updateStaff(updatedStaff);
}

// Staff search functionality
export interface StaffSearchOptions {
  numberOfCandidates: number;
  skillLevel: number;
  specializations: string[];
}

export function calculateSearchCost(options: StaffSearchOptions): number {
  const { numberOfCandidates, skillLevel, specializations } = options;
  const baseCost = 2000;
  const skillInfo = getSkillLevelInfo(skillLevel);
  const skillMultiplier = skillInfo.value;
  
  // Exponential scaling based on candidates and skill
  const candidateScaling = Math.pow(numberOfCandidates, 1.5);
  const skillScaling = Math.pow(skillMultiplier, 1.8);
  
  // Linear scaling for specialized roles (2x per role)
  const specializationMultiplier = specializations.length > 0 
    ? Math.pow(2, specializations.length) 
    : 1;
  
  // Combine all scalings
  const totalMultiplier = (candidateScaling * skillScaling * specializationMultiplier);
  
  return Math.round(baseCost * totalMultiplier);
}

// Function to generate randomized staff candidates
export function generateStaffCandidates(options: StaffSearchOptions | number, skillLevel?: number, specialization?: string): Staff[] {
  let count: number;
  let minSkillLevel: number;
  let specs: string[];

  // Handle either StaffSearchOptions object or separate arguments
  if (typeof options === 'object') {
    count = options.numberOfCandidates;
    minSkillLevel = options.skillLevel;
    specs = options.specializations;
  } else {
    count = options;
    minSkillLevel = skillLevel || 0.1;
    specs = specialization ? [specialization] : [];
  }

  const candidates: Staff[] = [];
  
  for (let i = 0; i < count; i++) {
    // Randomly select nationality
    const nationality = selectRandomNationality();
    
    // Choose a random specialization from the requested ones, if any
    const chosenSpecialization = specs.length > 0 
      ? specs[Math.floor(Math.random() * specs.length)]
      : '';
    
    // Get random names based on nationality
    const firstName = getRandomFirstName(nationality);
    const lastName = getRandomLastName(nationality);
    
    // Create staff with randomized skills based on required min skill level
    const staff = createStaff(
      firstName,
      lastName,
      minSkillLevel,
      chosenSpecialization,
      nationality
    );
    
    candidates.push(staff);
  }
  
  return candidates;
}

// Helper function to get random first name based on nationality
function getRandomFirstName(nationality: Nationality): string {
  // Random gender selection (50/50)
  const isMale = Math.random() > 0.5;
  
  // Select name list based on nationality and gender
  let nameList: string[];
  
  switch (nationality) {
    case 'Italy':
      nameList = isMale ? italianMaleNames : italianFemaleNames;
      break;
    case 'France':
      nameList = isMale ? frenchMaleNames : frenchFemaleNames;
      break;
    case 'Spain':
      nameList = isMale ? spanishMaleNames : spanishFemaleNames;
      break;
    case 'Germany':
      nameList = isMale ? germanMaleNames : germanFemaleNames;
      break;
    case 'United States':
    default:
      nameList = isMale ? usMaleNames : usFemaleNames;
      break;
  }
  
  // Return random name from the selected list
  return nameList[Math.floor(Math.random() * nameList.length)];
}

// Helper function to get random last name based on nationality
function getRandomLastName(nationality: Nationality): string {
  const lastNames = lastNamesByCountry[nationality] || lastNamesByCountry['United States'];
  return lastNames[Math.floor(Math.random() * lastNames.length)];
}

// Assignment management
export function getAssignedStaffToActivity(activityId: string): Staff[] {
  const activity = getActivityById(activityId);
  if (!activity || !activity.params || !activity.params.assignedStaffIds) {
    return [];
  }
  
  const staffIds = activity.params.assignedStaffIds as string[];
  const gameState = getGameState();
  
  return gameState.staff.filter(staff => staffIds.includes(staff.id));
}

export function assignStaffToActivityById(activityId: string, staffIds: string[]) {
  const result = assignStaffToActivity(activityId, staffIds);
  
  // Save assignment to database
  saveStaffAssignmentsToDb(activityId, staffIds);
  
  return result;
}

export function getStaffByTeam(teamId: string | null): Staff[] {
  const gameState = getGameState();
  
  return gameState.staff.filter(staff => staff.teamId === teamId);
}

export function assignTeamToActivity(activityId: string, teamId: string) {
  const teamStaff = getStaffByTeam(teamId);
  const staffIds = teamStaff.map(staff => staff.id);
  
  return assignStaffToActivityById(activityId, staffIds);
}

export function calculateActivityStaffEfficiency(activityId: string, category: string): number {
  const assignedStaff = getAssignedStaffToActivity(activityId);
  if (assignedStaff.length === 0) {
    return 0;
  }
  
  // Get the appropriate skill from each staff member based on the category
  const skills = assignedStaff.map(staff => {
    if (!staff.skills) {
      return staff.skillLevel;
    }
    
    // Map category to skill key
    const skillKey = mapCategoryToSkill(category);
    
    // Add specialization bonus if applicable
    const specializationBonus = 
      staff.specialization && mapSpecializationToCategory(staff.specialization) === category
        ? 0.2 // 20% bonus for specialization
        : 0;
    
    return staff.skills[skillKey] + specializationBonus;
  });
  
  // Calculate average skill level adjusted for team size
  // We use a diminishing returns approach for larger teams
  const baseEfficiency = skills.reduce((sum, skill) => sum + skill, 0) / skills.length;
  const teamSizeFactor = Math.min(1, 1 + (Math.log(assignedStaff.length) / Math.log(10)));
  
  return baseEfficiency * teamSizeFactor;
}

// Helper functions for mapping categories to skills
export function mapCategoryToSkill(category: string): keyof StaffSkills {
  const mapping: Record<string, keyof StaffSkills> = {
    'vineyard': 'field',
    'planting': 'field',
    'harvesting': 'field',
    'pruning': 'field',
    'production': 'winery',
    'crushing': 'winery',
    'fermentation': 'winery',
    'aging': 'winery',
    'bottling': 'winery',
    'admin': 'administration',
    'financial': 'administration',
    'marketing': 'sales',
    'distribution': 'sales',
    'repair': 'maintenance',
    'construction': 'maintenance',
    'general': 'field' // default
  };
  
  return mapping[category.toLowerCase()] || 'field';
}

export function mapSpecializationToCategory(specialization: string): string {
  const mapping: Record<string, string> = {
    'field': 'vineyard',
    'winery': 'production',
    'administration': 'admin',
    'sales': 'marketing',
    'maintenance': 'repair'
  };
  
  return mapping[specialization] || 'general';
}

export async function initializeDefaultTeams(): Promise<void> {
  // Extra check to make sure localStorage is clear
  const localStorageTeams = localStorage.getItem('staffTeams');
  if (localStorageTeams) {
    localStorage.removeItem('staffTeams');
  }
  
  const existingTeams = await loadTeamsFromDb();
  
  // Only create default teams if none exist
  if (existingTeams.length === 0) {
    // Create teams using the DefaultTeams defined in constants/staff.ts
    const teamList = [
      {
        id: DefaultTeams.VINEYARD_TEAM.id,
        name: DefaultTeams.VINEYARD_TEAM.name,
        description: DefaultTeams.VINEYARD_TEAM.description,
        memberIds: [],
        preferredTaskTypes: DefaultTeams.VINEYARD_TEAM.preferredTaskTypes,
        recommendedSpecializations: DefaultTeams.VINEYARD_TEAM.recommendedSpecializations,
        icon: '🍇' // Grape icon for vineyard team
      },
      {
        id: DefaultTeams.WINERY_TEAM.id,
        name: DefaultTeams.WINERY_TEAM.name,
        description: DefaultTeams.WINERY_TEAM.description,
        memberIds: [],
        preferredTaskTypes: DefaultTeams.WINERY_TEAM.preferredTaskTypes,
        recommendedSpecializations: DefaultTeams.WINERY_TEAM.recommendedSpecializations,
        icon: '🍷' // Wine icon for winery team
      },
      {
        id: DefaultTeams.MAINTENANCE_TEAM.id,
        name: DefaultTeams.MAINTENANCE_TEAM.name,
        description: DefaultTeams.MAINTENANCE_TEAM.description,
        memberIds: [],
        preferredTaskTypes: DefaultTeams.MAINTENANCE_TEAM.preferredTaskTypes,
        recommendedSpecializations: DefaultTeams.MAINTENANCE_TEAM.recommendedSpecializations,
        icon: '🔧' // Wrench icon for maintenance team
      },
      {
        id: DefaultTeams.SALES_TEAM.id,
        name: DefaultTeams.SALES_TEAM.name,
        description: DefaultTeams.SALES_TEAM.description,
        memberIds: [],
        preferredTaskTypes: DefaultTeams.SALES_TEAM.preferredTaskTypes,
        recommendedSpecializations: DefaultTeams.SALES_TEAM.recommendedSpecializations,
        icon: '💼' // Briefcase icon for sales team
      },
      {
        id: DefaultTeams.ADMIN_TEAM.id,
        name: DefaultTeams.ADMIN_TEAM.name,
        description: DefaultTeams.ADMIN_TEAM.description,
        memberIds: [],
        preferredTaskTypes: DefaultTeams.ADMIN_TEAM.preferredTaskTypes,
        recommendedSpecializations: DefaultTeams.ADMIN_TEAM.recommendedSpecializations,
        icon: '📊' // Chart icon for admin team
      }
    ];
    
    for (const team of teamList) {
      await saveTeamToDb(team);
    }
  }
}

export default {
  createStaff,
  addStaff,
  removeStaff,
  updateStaff,
  getStaffById,
  getAllStaff,
  generateRandomSkills,
  calculateWage,
  getSkillLevelInfo,
  createTeam,
  saveTeam,
  loadTeams,
  assignStaffToTeam,
  calculateSearchCost,
  generateStaffCandidates,
  SpecializedRoles,
  SkillLevels,
  getAssignedStaffToActivity,
  assignStaffToActivityById,
  getStaffByTeam,
  assignTeamToActivity,
  calculateActivityStaffEfficiency,
  mapCategoryToSkill,
  mapSpecializationToCategory,
  initializeDefaultTeams
}; 