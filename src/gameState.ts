// Basic game state for the Winery Management Game
import { Vineyard } from './lib/vineyard';
import { 
  Season, 
  STARTING_WEEK, 
  STARTING_SEASON, 
  STARTING_YEAR, 
  STARTING_MONEY, 
  STARTING_PRESTIGE 
} from './lib/constants';
import { GameDate } from './lib/constants';
import { GrapeVariety } from './lib/vineyardConstants';

// Player Type
export interface Player {
  id: string;
  name: string;
  money: number;
  prestige: number;
  companyName: string;
  foundedYear: number;
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
  vineyardId: string;
  grapeType: GrapeVariety;
  harvestGameDate: GameDate;
  quantity: number;
  quality: number;
  stage: 'grape' | 'must' | 'fermentation' | 'aging' | 'bottled';
  ageingStartGameDate: GameDate | null;
  ageingDuration: number | null; // in weeks
  storageLocation: string;
  characteristics?: {
    sweetness: number;
    acidity: number;
    tannins: number;
    body: number;
    spice: number;
    aroma: number;
  };
}

// Main game state
let gameState = {
  player: null as Player | null,
  vineyards: [] as Vineyard[],
  buildings: [] as Building[],
  staff: [] as Staff[],
  wineBatches: [] as WineBatch[],
  week: STARTING_WEEK,
  season: STARTING_SEASON,
  currentYear: STARTING_YEAR,
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
    money: STARTING_MONEY,
    prestige: STARTING_PRESTIGE,
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