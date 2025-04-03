import { v4 as uuidv4 } from 'uuid';
import { Staff } from '../gameState';
import { getGameState, updateGameState } from '../gameState';
import displayManager from '../lib/game/displayManager';
import { assignStaffToActivity, getActivityById } from '../lib/game/activityManager';

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

export interface StaffTeam {
  id: string;
  name: string;
  description: string;
  icon: string;
  memberIds: string[];
  defaultTaskTypes: string[];
}

// Constants for staff wages and skill levels
export const BASE_WEEKLY_WAGE = 500;
export const SKILL_WAGE_MULTIPLIER = 1000;

export const SkillLevels = {
  0.1: { name: "Fresh Off the Vine", costMultiplier: 0.5 },
  0.2: { name: "Amateur Enthusiast", costMultiplier: 0.7 },
  0.3: { name: "Developing Talent", costMultiplier: 1.0 },
  0.4: { name: "Competent Professional", costMultiplier: 1.5 },
  0.5: { name: "Seasoned Expert", costMultiplier: 2.0 },
  0.6: { name: "Regional Authority", costMultiplier: 3.0 },
  0.7: { name: "National Virtuoso", costMultiplier: 4.0 },
  0.8: { name: "Continental Master", costMultiplier: 5.0 },
  0.9: { name: "International Icon", costMultiplier: 7.0 },
  1.0: { name: "Living Legend", costMultiplier: 10.0 }
};

export function getSkillLevelInfo(skillLevel: number) {
  // Round to nearest 0.1
  const roundedSkill = Math.round(skillLevel * 10) / 10;
  const level = SkillLevels[roundedSkill as keyof typeof SkillLevels] || 
                SkillLevels[0.1];
  
  return {
    level: roundedSkill,
    name: level.name,
    costMultiplier: level.costMultiplier,
    formattedName: `${level.name} (${Math.round(roundedSkill * 100)}%)`
  };
}

// Staff creation and management functions
export function createStaff(
  firstName: string,
  lastName: string,
  skills: StaffSkills,
  skillLevel: number = 0.1,
  specialization: string | null = null,
  wage: number = 600
): Staff {
  const staff: Staff = {
    id: uuidv4(),
    name: `${firstName} ${lastName}`,
    nationality: selectRandomNationality(),
    skillLevel,
    specialization,
    wage,
    hireDate: new Date(),
    teamId: null,
    skills
  };

  return staff;
}

export function addStaff(staff: Staff, saveToDb = false) {
  const gameState = getGameState();
  const updatedStaff = [...gameState.staff, staff];
  
  updateGameState({ staff: updatedStaff });
  
  if (saveToDb) {
    // TODO: Implement Firebase saving when database is set up
    console.log('Staff saved to database');
  }
  
  return staff;
}

export function removeStaff(staffId: string, saveToDb = false) {
  const gameState = getGameState();
  const updatedStaff = gameState.staff.filter(s => s.id !== staffId);
  
  updateGameState({ staff: updatedStaff });
  
  if (saveToDb) {
    // TODO: Implement Firebase saving when database is set up
    console.log('Staff removed from database');
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
    // TODO: Implement Firebase saving when database is set up
    console.log('Staff updated in database');
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
function selectRandomNationality(): string {
  const countries = [
    'Italy', 'France', 'Spain', 'United States', 'Germany'
  ];
  return countries[Math.floor(Math.random() * countries.length)];
}

// Function to generate randomized skills
export function generateRandomSkills(skillModifier = 0.5, specialization: string | null = null): StaffSkills {
  // Generate base skill values
  const skills: StaffSkills = {
    field: randomizeSkill(skillModifier),
    winery: randomizeSkill(skillModifier),
    administration: randomizeSkill(skillModifier),
    sales: randomizeSkill(skillModifier),
    maintenance: randomizeSkill(skillModifier)
  };
  
  // Apply bonus for specialization
  if (specialization && specialization in SpecializedRoles) {
    const role = SpecializedRoles[specialization];
    const skillKey = role.skillBonus;
    const currentValue = skills[skillKey];
    const remainingPotential = 1.0 - currentValue;
    const bonus = remainingPotential * role.bonusAmount;
    skills[skillKey] = Math.min(1.0, currentValue + bonus);
  }
  
  return skills;
}

function randomizeSkill(skillModifier = 0.5): number {
  const baseValue = (Math.random() * 0.6) + (skillModifier * 0.4);
  return Math.min(1.0, baseValue);
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
    // TODO: Implement Firebase saving when database is set up
    console.log('Team saved to database');
  }
  
  return team;
}

export function loadTeams(): StaffTeam[] {
  const teamsJSON = localStorage.getItem('staffTeams');
  return teamsJSON ? JSON.parse(teamsJSON) : [];
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
  const skillMultiplier = skillInfo.costMultiplier;
  
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

export function generateStaffCandidates(options: StaffSearchOptions): Staff[] {
  const { numberOfCandidates, skillLevel, specializations } = options;
  const candidates: Staff[] = [];
  
  for (let i = 0; i < numberOfCandidates; i++) {
    // Generate random first and last names
    const firstName = generateRandomName();
    const lastName = generateRandomLastName();
    
    // Pick a specialization from provided ones, or null if none
    const specialization = specializations.length > 0 
      ? specializations[Math.floor(Math.random() * specializations.length)]
      : null;
    
    // Generate skills with a boost for the specialization
    const skills = generateRandomSkills(skillLevel, specialization);
    
    // Calculate appropriate wage
    const wage = calculateWage(skills, specialization);
    
    // Create staff record
    const staff = createStaff(
      firstName, 
      lastName, 
      skills, 
      skillLevel,
      specialization,
      wage
    );
    
    candidates.push(staff);
  }
  
  return candidates;
}

// Temporary name generation function
function generateRandomName(): string {
  const names = [
    "James", "John", "Robert", "Michael", "William",
    "David", "Richard", "Joseph", "Thomas", "Charles",
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth",
    "Barbara", "Susan", "Jessica", "Sarah", "Karen",
    "Paolo", "Marco", "Giuseppe", "Giovanni", "Antonio",
    "Maria", "Anna", "Francesca", "Sofia", "Giulia",
    "Jean", "Pierre", "Michel", "Louis", "François",
    "Marie", "Sophie", "Camille", "Julie", "Emma"
  ];
  
  return names[Math.floor(Math.random() * names.length)];
}

function generateRandomLastName(): string {
  const lastNames = [
    "Smith", "Johnson", "Williams", "Jones", "Brown",
    "Davis", "Miller", "Wilson", "Moore", "Taylor",
    "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi",
    "Romano", "Colombo", "Ricci", "Marino", "Greco",
    "Martin", "Bernard", "Dubois", "Thomas", "Robert",
    "Richard", "Petit", "Durand", "Leroy", "Moreau",
    "García", "Fernández", "González", "Rodríguez", "López",
    "Martínez", "Sánchez", "Pérez", "Gómez", "Martín"
  ];
  
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
  return assignStaffToActivity(activityId, staffIds);
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
  mapSpecializationToCategory
}; 