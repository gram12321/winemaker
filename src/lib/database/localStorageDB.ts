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

export const removeFromStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
};

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