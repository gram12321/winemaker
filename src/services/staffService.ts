import { v4 as uuidv4 } from 'uuid';
import { getGameState, updateGameState, updatePlayerMoney } from '../gameState';
import { assignStaffToActivity, getActivityById, addActivity, removeActivity } from '../lib/game/activityManager';
import { WorkCategory } from '../lib/game/workCalculator';
import { saveStaffToDb, removeStaffFromDb, updateStaffInDb, saveTeamToDb, loadTeamsFromDb, saveStaffAssignmentsToDb } from '../lib/database/staffDB';
import { BASE_WEEKLY_WAGE, SKILL_WAGE_MULTIPLIER, SkillLevels, DefaultTeams, italianMaleNames, italianFemaleNames, frenchMaleNames, frenchFemaleNames, spanishMaleNames, spanishFemaleNames, usMaleNames, usFemaleNames, germanMaleNames, germanFemaleNames, lastNamesByCountry } from '../lib/core/constants/staffConstants';
import { toast } from '../lib/ui/toast';
import { createActivityProgress, calculateTotalWork } from '@/lib/game/workCalculator';
import { addActivity as newAddActivity, setActivityCompletionCallback } from '@/lib/game/activityManager';
import displayManager from '@/lib/game/displayManager';

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
  specializations: string[];
  wage: number;
  teamId: string | null;
  skills: StaffSkills;
  hireDate: GameDate;
  workforce: number;
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
  specializations: string[] = [], 
  nationality: Nationality = 'United States',
  skills?: StaffSkills
): Staff {
  const id = uuidv4();
  const calculatedSkills = skills || generateRandomSkills(skillLevel, specializations);
  
  // Calculate wage with all specializations
  const monthlyWage = calculateWage(calculatedSkills, specializations);
  
  return {
    id,
    name: `${firstName} ${lastName}`,
    nationality,
    skillLevel,
    specializations: specializations,
    skills: calculatedSkills,
    wage: monthlyWage,
    workforce: 50,
    hireDate: getCurrentGameDate(),
    teamId: null
  };
}

export function addStaff(staff: Staff, saveToDb = false) {
  const gameState = getGameState();
  const updatedStaff = [...gameState.staff, staff];
  
  updateGameState({ staff: updatedStaff });
  
  if (saveToDb) {
    import('@/lib/database/gameStateDB').then(({ saveGameState }) => {
      saveGameState();
    });
  }
  
  return staff;
}

export function removeStaff(staffId: string, saveToDb = false) {
  const gameState = getGameState();
  const updatedStaff = gameState.staff.filter(s => s.id !== staffId);
  
  updateGameState({ staff: updatedStaff });
  
  if (saveToDb) {
    import('@/lib/database/gameStateDB').then(({ saveGameState }) => {
      saveGameState();
    });
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
    import('@/lib/database/gameStateDB').then(({ saveGameState }) => {
      saveGameState();
    });
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
export function generateRandomSkills(skillModifier: number = 0.5, specializations: string[] = []): StaffSkills {
  // Exactly match old system's skill randomization
  const getSkillValue = (isSpecialized: boolean): number => {
    // Calculate base skill value first - exactly like old system
    const baseValue = (Math.random() * 0.6) + (skillModifier * 0.4);
    
    // For specialized roles, add a percentage-based bonus that scales with skill
    if (isSpecialized) {
      const remainingPotential = 1.0 - baseValue;
      const bonusPercentage = 0.2 + (skillModifier * 0.2); // 20-40%
      const bonus = remainingPotential * bonusPercentage;
      return Math.min(1.0, baseValue + bonus);
    }
    
    return baseValue;
  };
  
  return {
    field: getSkillValue(specializations.includes('field')),
    winery: getSkillValue(specializations.includes('winery')),
    administration: getSkillValue(specializations.includes('administration')),
    sales: getSkillValue(specializations.includes('sales')),
    maintenance: getSkillValue(specializations.includes('maintenance'))
  };
}

// Calculate wage based on skills and specializations
export function calculateWage(skills: StaffSkills, specializations: string[] = []): number {
  const avgSkill = (
    skills.field +
    skills.winery +
    skills.administration +
    skills.sales +
    skills.maintenance
  ) / 5;
  
  // Add bonus for specialized roles (30% per specialization, multiplicative)
  const specializationBonus = specializations.length > 0 ? 
    Math.pow(1.3, specializations.length) : 1;
  
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
  const skillMultiplier = skillLevel;
  
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

export function calculatePerCandidateCost(options: StaffSearchOptions): number {
  const totalCost = calculateSearchCost(options);
  return Math.round(totalCost / options.numberOfCandidates);
}

// Function to generate randomized staff candidates
export function generateStaffCandidates(options: StaffSearchOptions | number, skillLevel?: number, specializations?: string[]): Staff[] {
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
    specs = specializations || [];
  }

  const candidates: Staff[] = [];
  
  for (let i = 0; i < count; i++) {
    // Randomly select nationality
    const nationality = selectRandomNationality();
    
    // Get random names based on nationality
    const firstName = getRandomFirstName(nationality);
    const lastName = getRandomLastName(nationality);
    
    // Create staff with randomized skills based on required min skill level
    const staff = createStaff(
      firstName,
      lastName,
      minSkillLevel,
      specs,
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
  // First verify activity exists
  const activity = getActivityById(activityId);
  if (!activity) {
    return [];
  }
  
  // Get staff IDs from activity params
  const staffIds = activity.params?.assignedStaffIds || [];
  if (!Array.isArray(staffIds) || staffIds.length === 0) {
    return [];
  }
  
  // Get staff from game state
  const gameState = getGameState();
  return gameState.staff.filter(staff => staffIds.includes(staff.id));
}

export function assignStaffToActivityById(activityId: string, staffIds: string[]) {
  // First ensure the activity exists
  const activity = getActivityById(activityId);
  if (!activity) {
    return null;
  }
  
  // Call the activity manager function to update the activity in memory
  const result = assignStaffToActivity(activityId, staffIds);
  
  // Only save to database if the activity update was successful
  if (result) {
    // Save assignment to database with explicit activity ID
    saveStaffAssignmentsToDb(activityId, staffIds);
    
    // Provide feedback
    toast({
      title: 'Staff Assigned',
      description: `Assigned ${staffIds.length} staff to activity.`
    });
  } else {
    toast({
      title: 'Assignment Failed',
      description: 'Could not assign staff to the activity.',
      variant: 'destructive'
    });
  }
  
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
  // First get the assigned staff specifically for this activity
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
      staff.specializations.includes(category)
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

// Activity categories
export const STAFF_ACTIVITY_CATEGORIES = {
  STAFF_SEARCH: WorkCategory.STAFF_SEARCH,
  STAFF_HIRING: WorkCategory.ADMINISTRATION
} as const;

// Function to start a staff search activity
export function startStaffSearch(options: StaffSearchOptions): string | null {
  const { numberOfCandidates } = options;
  const searchCost = calculateSearchCost(options);
  const { player } = getGameState();

  if (!player || player.money < searchCost) {
    return null; 
  }
  
  // Calculate work required for the search
  const totalWork = calculateTotalWork(numberOfCandidates, {
      category: WorkCategory.STAFF_SEARCH,
      skillLevel: options.skillLevel,
      specializations: options.specializations
  });

  // Temp variable for activity ID to use in callback closure
  let tempActivityId: string | null = null;

  // Define completion callback first
  const handleSearchComplete = async () => {
      if (!tempActivityId) return;
      const finalActivity = getActivityById(tempActivityId);
      const cost = finalActivity?.params?.searchCost || 0;
      const searchOpts = finalActivity?.params?.searchOptions;

      if (!searchOpts) {
          return;
      }

      // Deduct cost now
      updatePlayerMoney(-cost);
      
      // Generate candidates based on options stored in activity
      const candidates = generateStaffCandidates(searchOpts);
      
      // Store the results in the display state associated with the search
      displayManager.updateDisplayState('staffSearchActivity', {
        results: candidates,
        activityId: null // Clear the activity ID when complete
      });
      
      toast({ title: "Search Complete", description: `Found ${candidates.length} potential candidates.` });
  };

  // Create activity using imported functions
  const searchActivity = createActivityProgress(
    WorkCategory.STAFF_SEARCH,
    numberOfCandidates, // Amount is number of candidates
    {
        // Pass options and work details as params
        additionalParams: {
            title: `Search: ${numberOfCandidates} candidates (Skill ≥ ${options.skillLevel * 100}%)`, 
            searchOptions: options, // Store options for candidate generation
            candidates: [] as Staff[], 
            searchCost: searchCost // Store cost to deduct later
        },
        completionCallback: handleSearchComplete // Assign the callback directly to the activity
    }
  );
  
  // Assign the generated ID to the temp variable for the callback
  tempActivityId = searchActivity.id;

  // Add the activity to the manager
  newAddActivity(searchActivity);
  
  // Update the display state to track the activity
  displayManager.updateDisplayState('staffSearchActivity', {
    activityId: searchActivity.id
  });

  toast({
    title: 'Staff Search Started',
    description: `Started search for ${numberOfCandidates} candidates`
  });
  return searchActivity.id;
}

// Function to start hiring process
export function startHiringProcess(staff: Staff): string | null {
  const gameState = getGameState();
  const { player } = gameState;
  
  if (!player || player.money < staff.wage) {
    return null; 
  }
  
  if (!staff || !staff.id || !staff.name) {
    return null; // Return null instead of throwing
  }

  // Define completion callback logic first
  const handleHiringComplete = (activityId: string) => { // Pass ID to callback
      const finalActivity = getActivityById(activityId);
      const staffToHire = finalActivity?.params?.staffToHire as Staff | undefined;

      if (staffToHire) {
        // Use addStaff with saveToDb=true to ensure data is saved properly
        addStaff(staffToHire, true); 
        updatePlayerMoney(-staffToHire.wage); 
        toast({ title: "Hiring Complete!", description: `${staffToHire.name} has joined your team.` });
      } else {
        console.error(`[StaffService] Could not find staff details to hire for activity ${activityId}`);
        toast({ title: "Hiring Error", description: "Could not complete hiring process.", variant: "destructive" });
      }
      
      displayManager.updateDisplayState('staffHiringActivity', { activityId: null });
  };
  
  // Create the hiring activity using createActivityProgress
  const activity = createActivityProgress(
    STAFF_ACTIVITY_CATEGORIES.STAFF_HIRING, // Use the correct category
    1, // Amount is 1 (representing one hiring process)
    {
      additionalParams: {
        title: `Hiring: ${staff.name}`, // Add title
        staffToHire: { ...staff } // Store staff details
      },
      completionCallback: () => handleHiringComplete(activity.id) // Set callback logic here
    }
  );

  // Manually set the total work for hiring after creation
  activity.totalWork = 50;

  // Add the activity using the manager
  addActivity(activity);
  
  // Update the display state to track the activity
  displayManager.updateDisplayState('staffHiringActivity', {
    activityId: activity.id
  });

  toast({
    title: 'Hiring Process Started',
    description: `Started hiring process for ${staff.name}`
  });
  return activity.id;
}

/**
 * Completes the hiring process for a staff member
 * @param activityId ID of the hiring activity
 * @returns The hired staff object or null if hiring failed
 */
export function completeHiringProcess(activityId: string): Staff | null {
  // Get all necessary data from the activity before any operations
  const activity = getActivityById(activityId);
  if (!activity) {
    return null;
  }
  
  // Get the staff to hire from activity params
  const staffToHire = activity.params?.staffToHire as Staff;
  if (!staffToHire) {
    toast({
      title: 'Hiring Failed',
      description: 'Staff information not found',
      variant: 'destructive'
    });
    return null;
  }
  
  const { player } = getGameState();
  
  // Deduct first month's wage
  if (!player || player.money < staffToHire.wage) {
    toast({
      title: 'Hiring Failed',
      description: `You need ${staffToHire.wage - (player?.money || 0)} more to hire ${staffToHire.name}.`,
      variant: 'destructive'
    });
    return null;
  }
  
  // Deduct wage from account
  updatePlayerMoney(-staffToHire.wage);
  
  // Add the staff to your company with saveToDb=true to ensure data is saved correctly
  const addedStaff = addStaff(staffToHire, true);
  
  // Clean up - remove the activity
  removeActivity(activityId);
  
  // Get specialization titles for the toast
  const specializationTitles = staffToHire.specializations?.map(
    spec => SpecializedRoles[spec]?.title || spec
  ).join(', ') || 'General Worker';
  
  // Notify user
  toast({
    title: 'Staff Hired',
    description: `${staffToHire.name} has joined your winery! Their specialty is ${specializationTitles}. First month's wage of ${staffToHire.wage} has been withdrawn from your account.`,
  });
  
  // Return the added staff
  return addedStaff;
}

// --- NEW: Function to estimate hiring work range ---
export function estimateHiringWorkRange(searchSkillLevel: number, searchSpecializations: string[]):
{ minWork: number; maxWork: number } {
  
  // 1. Estimate min/max skill and wage based on search criteria (similar to old system)
  const minSkill = searchSkillLevel * 0.4; // Minimum possible skill
  const maxSkill = Math.min(1.0, 0.6 + (searchSkillLevel * 0.4)); // Maximum possible skill

  const specializationBonus = searchSpecializations.length > 0 ? Math.pow(1.3, searchSpecializations.length) : 1;
  const minWeeklyWage = (BASE_WEEKLY_WAGE + (minSkill * SKILL_WAGE_MULTIPLIER)) * specializationBonus;
  const maxWeeklyWage = (BASE_WEEKLY_WAGE + (maxSkill * SKILL_WAGE_MULTIPLIER)) * specializationBonus;
  
  // 2. Define modifiers based on candidate complexity
  // Wage Modifier (Linear, less extreme than old system's quadratic)
  // Assumes higher wage = more complex contract/process. Adjust divisor to tune sensitivity.
  const calculateWageModifier = (wage: number) => (wage / 5000) - 0.1; // e.g. 500 wage = -0% mod, 5000 wage = +90% mod
  
  // Specialization Modifier (Exponential, similar to old system)
  const specializationModifier = searchSpecializations.length > 0 
    ? Math.pow(1.5, searchSpecializations.length) - 1 
    : 0;

  // 3. Calculate work for min/max scenarios using ADMINISTRATION category
  const minFactors = {
      category: WorkCategory.ADMINISTRATION,
      workModifiers: [
          calculateWageModifier(minWeeklyWage),
          specializationModifier
      ]
  };
  const maxFactors = {
      category: WorkCategory.ADMINISTRATION,
      workModifiers: [
          calculateWageModifier(maxWeeklyWage),
          specializationModifier
      ]
  };

  const minWork = calculateTotalWork(1, minFactors); // Amount is 1 (per hire)
  const maxWork = calculateTotalWork(1, maxFactors);

  return { minWork, maxWork };
}
// --- END NEW --- 

export default { createStaff, addStaff, removeStaff, updateStaff, getStaffById, getAllStaff, generateRandomSkills, calculateWage, createTeam, saveTeam, loadTeams, assignStaffToTeam, calculateSearchCost, calculatePerCandidateCost, generateStaffCandidates, SpecializedRoles, SkillLevels, getAssignedStaffToActivity, assignStaffToActivityById, getStaffByTeam, assignTeamToActivity, calculateActivityStaffEfficiency, mapCategoryToSkill, mapSpecializationToCategory, initializeDefaultTeams, startStaffSearch, startHiringProcess, completeHiringProcess, estimateHiringWorkRange };