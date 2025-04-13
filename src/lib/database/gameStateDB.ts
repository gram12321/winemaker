import { db } from '../../firebase.config';
import { doc, setDoc } from 'firebase/firestore';
import { getGameState, updateGameState } from '../../gameState';
import { loadCompany } from './companyDB';
import { clearGameStorage } from './localStorageDB';
import { initializeActivitySystem } from './activityDB';

export const handleLogout = async (): Promise<boolean> => {
  try {
    const saveResult = await saveGameState();

    clearGameStorage();
    localStorage.removeItem('companyName');
    localStorage.removeItem('consoleMessages');
    
    // Reset game state to initial values
    updateGameState({
      player: null,
      vineyards: [],
      buildings: [],
      staff: [],
      wineBatches: [],
      activities: [],
      week: 1,
      season: 'Spring',
      currentYear: new Date().getFullYear(),
      currentView: 'login'
    });
    
    return saveResult;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

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
          completedClearingTasks: vineyard.completedClearingTasks || [],
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
    // const { updateGameState } = await import('../../gameState'); // This is likely still needed dynamically if gameState depends on gameStateDB
    
    // Create activities with proper types and callbacks before updating gameState
    const activities = data.activities?.map((activity: any) => ({
      id: activity.id,
      category: activity.category,
      totalWork: activity.totalWork || 0,
      appliedWork: activity.appliedWork || 0, // Explicitly map appliedWork
      targetId: activity.targetId || null,
      params: activity.params || {},
      userId: activity.userId || ''
    })) || [];

    
    // Update game state with loaded data
    updateGameState({
      player: data.player || null,
      vineyards: data.vineyards?.map((v: any) => ({ 
        ...v, 
        completedClearingTasks: v.completedClearingTasks || [] // Default to empty array if missing
      })) || [],
      buildings: data.buildings || [],
      staff: data.staff || [],
      wineBatches: data.wineBatches || [],
      activities: activities,
      week: data.week || 1,
      season: data.season || 'Spring',
      currentYear: data.currentYear || new Date().getFullYear(),
      currentView: 'mainMenu',
    });
    
    // After updating game state, initialize activity system using static import
    await initializeActivitySystem();
    
    return true;
  } catch (error) {
    console.error('Error loading game state:', error);
    return false;
  }
}; 