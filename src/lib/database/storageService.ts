/**
 * Storage Service
 * Handles all localStorage operations for the game
 */

/**
 * Save data to localStorage
 * @param key The key to store the data under
 * @param data The data to store
 */
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
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
 */
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

/**
 * Clear all game-related data from localStorage
 */
export const clearGameStorage = (): void => {
  const gameKeys = [
    'companyName',
    'money',
    'week',
    'season',
    'year',
    'calculatedPrestige',
    'prestigeHit',
    'buildings',
    'playerInventory',
    'consoleMessages',
    'staffData',
    'latestStaffId',
    'wineOrders',
    'transactions',
    'recurringTransactions',
    'activeTasks',
    'deletedDefaultTeams',
    'teams',
    'importers',
    'upgrades',
    'seenTutorials',
    'vineyards',
    'wineBatches'
  ];

  gameKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  });
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