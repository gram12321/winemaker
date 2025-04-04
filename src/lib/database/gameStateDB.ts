/**
 * Game State Database Operations
 * Handles saving and loading the full game state
 */

import { db } from '../../firebase.config';
import { doc, setDoc } from 'firebase/firestore';
import { getGameState } from '../../gameState';
import { loadCompany } from './companyDB';

/**
 * Save the current game state to Firestore
 * @returns Promise resolving to true if saved successfully, false otherwise
 */
export const saveGameState = async (): Promise<boolean> => {
  try {
    const gameState = getGameState();
    const companyName = gameState.player?.companyName;
    
    if (!companyName) {
      console.error('No company name found to save game state');
      return false;
    }
    
    const docRef = doc(db, "companies", companyName);
    
    // Create a clean copy of the game state without functions and undefined values
    const cleanGameState = {
      player: gameState.player,
      vineyards: gameState.vineyards.map(vineyard => {
        // Create a clean copy with only the properties defined in the Vineyard interface
        const cleanVineyard = {
          id: vineyard.id,
          name: vineyard.name,
          country: vineyard.country,
          region: vineyard.region,
          acres: vineyard.acres,
          grape: vineyard.grape,
          vineAge: vineyard.vineAge,
          soil: vineyard.soil,
          altitude: vineyard.altitude,
          aspect: vineyard.aspect,
          density: vineyard.density,
          vineyardHealth: vineyard.vineyardHealth,
          landValue: vineyard.landValue,
          status: vineyard.status,
          ripeness: vineyard.ripeness,
          vineyardPrestige: vineyard.vineyardPrestige,
          canBeCleared: vineyard.canBeCleared,
          annualYieldFactor: vineyard.annualYieldFactor,
          annualQualityFactor: vineyard.annualQualityFactor,
          farmingMethod: vineyard.farmingMethod,
          organicYears: vineyard.organicYears,
          remainingYield: vineyard.remainingYield,
          ownedSince: vineyard.ownedSince
        };
        return cleanVineyard;
      }),
      buildings: gameState.buildings,
      staff: gameState.staff,
      wineBatches: gameState.wineBatches,
      activities: gameState.activities.map(activity => {
        const cleanActivity = {
          id: activity.id,
          category: activity.category,
          totalWork: activity.totalWork,
          appliedWork: activity.appliedWork,
          targetId: activity.targetId || null,
          params: activity.params ? { ...activity.params } : null
        };

        // Remove function properties from params if they exist
        if (cleanActivity.params) {
          delete cleanActivity.params.completionCallback;
          delete cleanActivity.params.progressCallback;
          delete cleanActivity.params.onComplete;
          delete cleanActivity.params.onProgress;
        }

        return cleanActivity;
      }),
      week: gameState.week,
      season: gameState.season,
      currentYear: gameState.currentYear
    };
    
    await setDoc(docRef, cleanGameState);
    
    return true;
  } catch (error) {
    console.error('Error saving game state:', error);
    return false;
  }
};

/**
 * Load a game state from Firestore
 * @param companyName The company name to load
 * @returns Promise resolving to true if loaded successfully, false otherwise
 */
export const loadGameState = async (companyName: string): Promise<boolean> => {
  try {
    const data = await loadCompany(companyName);
    
    if (!data) {
      console.error('No data found for company:', companyName);
      return false;
    }
    
    // Import updateGameState function here to avoid circular dependencies
    const { updateGameState } = await import('../../gameState');
    
    // Update game state with loaded data
    updateGameState({
      player: data.player || null,
      vineyards: data.vineyards || [],
      buildings: data.buildings || [],
      staff: data.staff || [],
      wineBatches: data.wineBatches || [],
      activities: data.activities || [],
      week: data.week || 1,
      season: data.season || 'Spring',
      currentYear: data.currentYear || new Date().getFullYear(),
      currentView: 'mainMenu',
    });
    
    return true;
  } catch (error) {
    console.error('Error loading game state:', error);
    return false;
  }
}; 