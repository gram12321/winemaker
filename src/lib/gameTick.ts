/**
 * GameTick System
 * Handles progression of game time (weeks, seasons, years)
 * and applies relevant changes to game state
 */

import { getGameState, updateGameState, updatePlayerMoney } from '../gameState';
import { consoleService } from '../components/layout/Console';
import { saveGameState } from './database/gameStateService';
import { Vineyard } from './vineyard';

// Constants for game time
export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
export const WEEKS_PER_SEASON = 12;

/**
 * Initialize game time with default values if not present
 */
export const initializeGameTime = () => {
  const gameState = getGameState();
  
  if (!gameState.week || !gameState.season) {
    updateGameState({
      week: 1,
      season: 'Spring',
      currentYear: gameState.currentYear || new Date().getFullYear()
    });
    
    consoleService.info(`Game time initialized: Week 1, Spring, ${gameState.currentYear}`);
  }
};

/**
 * Increment the week and handle season/year changes
 * @param autoSave Whether to automatically save game state after incrementing
 * @returns The updated game state
 */
export const incrementWeek = async (autoSave: boolean = true): Promise<ReturnType<typeof getGameState>> => {
  const gameState = getGameState();
  let { week = 1, season = 'Spring', currentYear = 2023 } = gameState;
  let currentSeasonIndex = SEASONS.indexOf(season);
  
  // Pre-tick processing
  // TODO: Process ongoing tasks
  
  // Increment the week
  week += 1;
  
  // Check if the week exceeds WEEKS_PER_SEASON, which indicates a change of season
  if (week > WEEKS_PER_SEASON) {
    week = 1;
    currentSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
    season = SEASONS[currentSeasonIndex];
    
    // If we're at the start of Spring, increment the year
    if (currentSeasonIndex === 0) {
      currentYear += 1;
      onNewYear();
    }
    
    // Season change processing
    onSeasonChange(season);
  }
  
  // Update game state with new time values
  updateGameState({
    week,
    season,
    currentYear
  });
  
  // Log the change to console
  consoleService.info(`Advanced to: Week ${week}, ${season}, ${currentYear}`);
  
  // Process gameplay effects for the new week
  processWeekEffects();
  
  // Process financial transactions
  // TODO: Implement recurring transactions
  
  // Auto-save if enabled
  if (autoSave) {
    await saveGameState();
  }
  
  return getGameState();
};

/**
 * Handle effects that happen on season change
 * @param newSeason The season that just started
 */
const onSeasonChange = (newSeason: string) => {
  consoleService.info(`The season has changed to ${newSeason}!`);
  
  const gameState = getGameState();
  
  // Different effects based on the new season
  switch (newSeason) {
    case 'Spring':
      consoleService.info("Spring has arrived. Time to prepare for planting!");
      // TODO: Handle spring-specific changes
      break;
    case 'Summer':
      consoleService.info("Summer heat is affecting your vineyards.");
      updateVineyardRipeness(0.05);
      // TODO: Handle summer-specific changes
      break;
    case 'Fall':
      consoleService.info("Fall has come. Harvest season approaches!");
      updateVineyardRipeness(0.15);
      // TODO: Handle fall-specific changes
      break;
    case 'Winter':
      consoleService.info("Winter has arrived. Vineyards enter dormancy.");
      // TODO: Cancel any harvest or planting tasks
      
      // Reset ripeness for all vineyards
      updateVineyardRipeness(-1); // Special value to reset to 0
      break;
  }
};

/**
 * Handle effects that happen at the start of a new year
 */
const onNewYear = () => {
  consoleService.info("A new year has begun!");
  
  const gameState = getGameState();
  
  // Update vineyard age and annual factors
  const updatedVineyards = gameState.vineyards.map(vineyard => {
    // Skip non-planted vineyards
    if (!vineyard.grape) {
      return vineyard;
    }
    
    // Create new vineyard object with updated values
    const updatedVineyard: Vineyard = {
      ...vineyard,
      vineAge: vineyard.vineAge + 1,
      annualYieldFactor: (0.75 + Math.random()),
      annualQualityFactor: Math.random(),
      remainingYield: null, // Reset remaining yield
    };
    
    // Handle organic farming progression
    if (vineyard.farmingMethod === 'Non-Conventional' || vineyard.farmingMethod === 'Ecological') {
      updatedVineyard.organicYears = (vineyard.organicYears || 0) + 1;
      
      // Convert to ecological after 3 years of organic farming
      if (updatedVineyard.farmingMethod === 'Non-Conventional' && updatedVineyard.organicYears >= 3) {
        updatedVineyard.farmingMethod = 'Ecological';
        consoleService.success(`${vineyard.name} is now certified Ecological after ${updatedVineyard.organicYears} years of organic farming!`);
      }
      
      // Organic farming improves vineyard health
      updatedVineyard.vineyardHealth = Math.min(1.0, vineyard.vineyardHealth + 0.05);
    } else {
      // Reset organic years if conventional
      updatedVineyard.organicYears = 0;
    }
    
    return updatedVineyard;
  });
  
  // Update game state with updated vineyards
  updateGameState({
    vineyards: updatedVineyards
  });
  
  // TODO: Process yearly financial summary
};

/**
 * Process effects that happen every week
 */
const processWeekEffects = () => {
  const gameState = getGameState();
  const { week, season } = gameState;
  
  // Update vineyard ripeness based on season
  let ripenessIncrease = 0;
  switch (season) {
    case 'Spring': ripenessIncrease = 0.01; break;
    case 'Summer': ripenessIncrease = 0.02; break;
    case 'Fall': ripenessIncrease = 0.05; break;
    case 'Winter': ripenessIncrease = 0; break;
  }
  
  if (ripenessIncrease > 0) {
    updateVineyardRipeness(ripenessIncrease);
  }
  
  // TODO: Process random events based on week/season
  
  // TODO: Generate wine orders or contracts
};

/**
 * Update the ripeness of all planted vineyards
 * @param amount The amount to increase ripeness by (or -1 to reset to 0)
 */
const updateVineyardRipeness = (amount: number) => {
  const gameState = getGameState();
  
  const updatedVineyards = gameState.vineyards.map(vineyard => {
    // Skip non-planted vineyards
    if (!vineyard.grape || vineyard.status === 'Harvested') {
      return vineyard;
    }
    
    let newRipeness = 0;
    if (amount === -1) {
      // Special case: reset to 0
      newRipeness = 0;
    } else {
      // Normal case: increase by amount
      newRipeness = Math.min(1.0, vineyard.ripeness + amount);
    }
    
    return {
      ...vineyard,
      ripeness: newRipeness
    };
  });
  
  updateGameState({
    vineyards: updatedVineyards
  });
}; 