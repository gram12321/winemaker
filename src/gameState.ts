// Basic game state for the Winery Management Game

// Player Type
export interface Player {
  id: string;
  name: string;
  money: number;
  prestige: number;
  companyName: string;
  foundedYear: number;
}

// Farmland/Vineyard Type
export interface Farmland {
  id: string;
  name: string;
  size: number;
  quality: number;
  region: string;
  altitude: number;
  aspect: string; // North, South, East, West facing
  soilType: string;
  ownedSince: Date;
  plantedGrape: string | null;
  plantedDate: Date | null;
  vineAge: number;
  health: number;
}

// Building Type
export interface Building {
  id: string;
  name: string;
  type: 'winery' | 'storage' | 'cellar' | 'office';
  level: number;
  condition: number;
  capacityMax: number;
  capacityUsed: number;
  maintenanceNeeded: boolean;
  maintenanceLastDate: Date | null;
}

// Staff Member Type
export interface Staff {
  id: string;
  name: string;
  nationality: string;
  skillLevel: number;
  specialization: string | null;
  wage: number;
  hireDate: Date;
  teamId: string | null;
}

// Wine Batch Type
export interface WineBatch {
  id: string;
  grapeType: string;
  harvestDate: Date;
  quantity: number;
  quality: number;
  stage: 'grape' | 'must' | 'fermentation' | 'aging' | 'bottled';
  ageingStartDate: Date | null;
  ageingDuration: number | null;
  storageLocation: string;
}

// Main game state
let gameState = {
  player: null as Player | null,
  farmlands: [] as Farmland[],
  buildings: [] as Building[],
  staff: [] as Staff[],
  wineBatches: [] as WineBatch[],
  currentDay: 1,
  currentYear: 2023,
  currentView: 'login',
};

// State management functions
export const getGameState = () => gameState;

export const updateGameState = (newState: Partial<typeof gameState>) => {
  gameState = { ...gameState, ...newState };
  return gameState;
};

export const updatePlayerMoney = (amount: number) => {
  if (!gameState.player) return null;
  
  gameState.player.money += amount;
  return gameState.player.money;
};

export const initializePlayer = (name: string, companyName: string): Player => {
  const player: Player = {
    id: Date.now().toString(),
    name,
    companyName,
    money: 100000, // Starting money
    prestige: 1,
    foundedYear: gameState.currentYear,
  };
  
  gameState.player = player;
  return player;
};

export default {
  getGameState,
  updateGameState,
  updatePlayerMoney,
  initializePlayer,
}; 