# Winery Management Game - Architecture Guide (Next Iteration)

## Core Game Systems & Features

### 1. Wine Production System
- Wine characteristics (Sweetness, Acidity, Tannins, Body, Spice, Aroma)
- Quality tracking through production stages
- Balance calculation system with archetypes
- Processing influence on characteristics (crushing methods, fermentation)
- Wine archetypes for style matching

### 2. Field Management
- Dynamic health system (0-1 scale)
- Field clearing and preparation
- Planting with grape variety selection
- Environmental factors (soil, altitude, aspect)
- Harvest timing and ripeness tracking

### 3. Staff System
- Skill-based hiring with specializations
- Work rate calculations based on skills
- Staff search and recruitment system
- Wage calculation and payment system
- Team management and task assignment

### 4. Sales System
- Wine order generation
- Dynamic pricing engine
- Contract system for stable income
- Customer preferences and archetypes
- Price negotiation mechanics

### 5. Game Flow
- End-day/tick system for game progression
- Tutorial system with guided learning
- Console messaging for game events
- Work calculation system for tasks
- Building maintenance cycle


## Key Interface Components

### 1. Land Management
```typescript
// buyLandOverlay.js
interface LandPurchaseOptions {
  country: string;
  region: string;
  previewData: {
    soil: string[];
    altitude: number;
    aspect: string;
    price: number;
  }
}
```

### 2. Field Operations
```typescript
// farmlandOverlay.js
interface FieldOperations {
  clearing: {
    cost: number;
    timeRequired: number;
  };
  planting: {
    grapeVarieties: GrapeVariety[];
    density: number;
    cost: number;
  }
}
```

### 3. Staff Management
```typescript
// staffOverlay.js
interface StaffDisplay {
  skills: SkillSet;
  specializations: string[];
  assignments: TaskAssignment[];
  salary: number;
}
```

### 4. Wine Information
```typescript
// wineInfoOverlay.js
interface WineDisplay {
  characteristics: WineCharacteristics;
  quality: number;
  balance: number;
  archetypalMatch: string;
  price: number;
}
```

## Database Architecture

### 1. Core Data Management
```typescript
// database/adminFunctions.js
interface DataOperations {
  loadGameState(): GameState;
  saveGameState(state: GameState): void;
  loadBuildings(): Building[];
  loadStaff(): Staff[];
  // etc.
}
```

### 2. Game Initialization
```typescript
// database/initiation.js
interface GameInitialization {
  initializeNewGame(): void;
  loadSavedGame(): void;
  setupRecurringTransactions(): void;
}
```

## Key Calculations to Port

### 1. Work Calculation
```typescript
interface WorkFactors {
  baseWork: number;
  skillModifier: number;
  toolEfficiency: number;
  specialization: number;
}

const calculateWork = (factors: WorkFactors): number => {
  return factors.baseWork * 
         factors.skillModifier * 
         factors.toolEfficiency * 
         (1 + factors.specialization);
};
```

### 2. Wine Balance
```typescript
interface WineCharacteristics {
  sweetness: number;
  acidity: number;
  tannins: number;
  body: number;
  spice: number;
  aroma: number;
}

const calculateBalance = (chars: WineCharacteristics): number => {
  // Port existing balance calculations
  // Consider archetype matching
  return balanceScore;
};
```

## Implementation Guidelines

### 1. State Management
```typescript
// Central game state
interface GameState {
  money: number;
  date: GameDate;
  inventory: Inventory;
  staff: Staff[];
  fields: Field[];
  buildings: Building[];
}
```

### 2. View Structure
```typescript
// No overlays - use grid layouts
const MainView = () => (
  <div className="grid grid-cols-12 gap-4">
    <GameHeader className="col-span-12" />
    <MainContent className="col-span-9" />
    <InfoPanel className="col-span-3" />
  </div>
);
```

### 3. Data Flow
- Centralized state management
- Pure calculation functions
- Event-driven updates
- Persistent storage via adminFunctions

### 4. Migration Notes
1. Preserve:
   - Wine characteristic system
   - Work calculations
   - Balance formulas
   - Price calculations

2. Improve:
   - State management
   - UI component structure
   - Type safety
   - Data persistence

Remember:
- Use TypeScript for type safety
- Keep components focused
- Centralize calculations
- Maintain clear data flow