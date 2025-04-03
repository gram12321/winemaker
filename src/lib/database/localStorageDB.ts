/**
 * Local Storage Database
 * Handles all localStorage operations for the game
 */

/**
 * Save data to localStorage
 * @param key The key to store the data under
 * @param data The data to store
 * @returns True if successful, false if error occurred
 */
export const saveToStorage = <T>(key: string, data: T): boolean => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

/**
 * Load data from localStorage
 * @param key The key to load data from
 * @param defaultValue Default value to return if key doesn't exist
 * @returns The loaded data or defaultValue if not found
 */
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Remove a specific item from localStorage
 * @param key The key to remove
 * @returns True if successful, false if error occurred
 */
export const removeFromStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
};

/**
 * Clear all game-related data from localStorage
 * @returns True if successful, false if any errors occurred
 */
export const clearGameStorage = (): boolean => {
  const gameKeys = [
    StorageKeys.COMPANY_NAME,
    StorageKeys.VINEYARDS,
    StorageKeys.BUILDINGS,
    StorageKeys.STAFF,
    StorageKeys.WEEK,
    StorageKeys.SEASON,
    StorageKeys.CURRENT_YEAR,
    StorageKeys.CURRENT_VIEW,
    StorageKeys.WINE_BATCHES,
    'money',
    'calculatedPrestige',
    'prestigeHit',
    'playerInventory',
    'consoleMessages',
    'latestStaffId',
    'wineOrders',
    'transactions',
    'recurringTransactions',
    'activeTasks',
    'deletedDefaultTeams',
    'teams',
    'importers',
    'upgrades',
    'seenTutorials'
  ];

  let success = true;
  gameKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      success = false;
    }
  });
  
  return success;
};

/**
 * Storage keys used throughout the application
 */
export const StorageKeys = {
  COMPANY_NAME: 'companyName',
  VINEYARDS: 'vineyards',
  BUILDINGS: 'buildings',
  STAFF: 'staff',
  WEEK: 'week',
  SEASON: 'season',
  CURRENT_YEAR: 'currentYear',
  CURRENT_VIEW: 'currentView',
  WINE_BATCHES: 'wineBatches'
}; 