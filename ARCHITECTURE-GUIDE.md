
# Winery Management Game - Architecture Guide (Next Iteration)

## Successful Elements from Previous Version

### 1. Core Game Systems

#### Vineyard Management
- Field system with health tracking (0-1 scale)
- Planting mechanics with density options (1000-10000 vines/acre)
- Harvest timing based on ripeness (0.5-1.0 scale)
- Field prestige calculation incorporating:
  - Vine age (30%)
  - Land value (25%)
  - Region prestige (25%)
  - Grape fragility (20%)

#### Wine Production Pipeline
- Crushing system: Manual → Mechanical → Crusher-Destemmer progression
- Fermentation options: Plastic → Steel → Concrete → Oak
- Quality tracking through each production stage
- Building system with tool management and upgrades
- Storage capacity management for different wine stages

#### Staff Management
- 5-tier skill system: Fresh Off the Vine → Living Legend
- Specializations: Field, Winery, Administration, Sales, Maintenance
- Skill impact on work quality (0.04-1.0 scale)
- Salary system based on skill level and specialization

#### Financial System
- Dynamic wine pricing based on multiple factors
- Building and tool depreciation
- Staff wage management
- Resource value calculations
- Transaction tracking and bookkeeping

### 2. Key Calculations (To Port)

#### Wine Quality Formula
```typescript
interface QualityFactors {
  fieldPrestige: number;  // 0-1 scale
  staffSkill: number;     // 0.04-1.0 scale
  processQuality: number; // 0-1 scale
  toolQuality: number;    // 0.9-1.5 scale
}

const calculateWineQuality = (factors: QualityFactors): number => {
  const baseQuality = (factors.fieldPrestige + factors.staffSkill + factors.processQuality) / 3;
  return baseQuality * factors.toolQuality;
};
```

#### Yield Calculation System
```typescript
interface YieldFactors {
  baseYield: number;      // 2400kg/acre
  density: number;        // 0.2-2.0 scale
  health: number;         // 0-1 scale
  annualFactor: number;   // 0.75-1.25 range
  naturalYield: number;   // Grape variety factor
}

const calculateYield = (factors: YieldFactors): number => {
  return factors.baseYield * 
         factors.density * 
         factors.health * 
         factors.annualFactor * 
         factors.naturalYield;
};
```

#### Staff Work Rate System
```typescript
interface WorkRateFactors {
  baseRate: number;           // Base work units per week
  skillLevel: number;         // 0.04-1.0 scale
  specializationBonus: number;// 0-0.4 additional bonus
  toolEfficiency: number;     // 0.9-1.5 multiplier
}

const calculateWorkRate = (factors: WorkRateFactors): number => {
  const skillBonus = factors.skillLevel * 0.4;
  const specialistBonus = factors.specializationBonus * 0.2;
  return (factors.baseRate * (1 + skillBonus + specialistBonus)) * factors.toolEfficiency;
};
```

#### Wine Price Formula
```typescript
interface PriceFactors {
  landValue: number;      // Base land value
  fieldPrestige: number;  // 0-1 scale
  quality: number;        // 0-1 scale
  balance: number;        // 0-1 scale
}

const calculateWinePrice = (factors: PriceFactors): number => {
  const basePrice = (factors.landValue * 0.625) + (factors.fieldPrestige * 0.375);
  const qualityMultiplier = Math.pow(2, (factors.quality * 0.6 + factors.balance * 0.4) * 10);
  return basePrice * qualityMultiplier;
};
```

## Key Features to Implement

1. **Vineyard Operations**
- Detailed field management with multiple attributes
- Dynamic health system affected by maintenance
- Harvest timing system with ripeness tracking
- Density-based planting system
- Field prestige calculation engine

2. **Production System**
- Multi-stage wine production tracking
- Tool-based quality modifiers
- Storage capacity management
- Production facility upgrades
- Quality inheritance system between stages

3. **Staff System**
- Skill progression system
- Specialization bonuses
- Work rate calculations
- Salary management
- Staff satisfaction tracking (optional)

4. **Economic System**
- Dynamic wine pricing engine
- Building economy (maintenance, depreciation)
- Resource market system
- Financial reporting tools
- Investment and upgrade costs

Note: The task system from the previous iteration will not be implemented. Instead, actions will be handled directly through the relevant views and components.

## New Architecture Implementation

### 1. State Management
```typescript
// gameState.ts
interface GameState {
  money: number;
  fields: Field[];
  staff: Staff[];
  buildings: Building[];
  inventory: Inventory;
  tasks: Task[];
}

// Single source of truth
const gameState = createStore<GameState>({...});
```

### 2. View Structure
```typescript
// App.tsx
const App = () => {
  const [view, setView] = useState<GameView>('vineyard');
  
  return (
    <main className="min-h-screen bg-slate-100">
      <Navigation onViewChange={setView} />
      <ViewContainer currentView={view} />
    </main>
  );
};
```

### 3. Core Components
```typescript
// No overlays - use grid layouts
const VineyardView = () => (
  <div className="grid grid-cols-12 gap-4">
    <FieldList className="col-span-8" />
    <TaskPanel className="col-span-4" />
  </div>
);
```

### 4. Business Logic
```typescript
// Centralize calculations in pure functions
export const calculateWineQuality = (
  fieldPrestige: number,
  staffSkill: number,
  processQuality: number
): number => {
  // Port existing quality calculations
  return (fieldPrestige + staffSkill + processQuality) / 3;
};
```

## Key Features to Implement

1. **Vineyard Operations**
- Field management
- Planting system
- Harvest mechanics
- Health tracking

2. **Production System**
- Must processing
- Fermentation
- Aging
- Quality tracking

3. **Staff System**
- Skill levels (5 tiers)
- Specializations
- Work calculation
- Team management

4. **Economic System**
- Wine pricing formula
- Building costs
- Staff wages
- Resource values

## Implementation Guidelines

1. **Component Structure**
```typescript
src/
  components/
    vineyard/
      FieldCard.tsx
      PlantingForm.tsx
    winery/
      ProcessingUnit.tsx
      StorageView.tsx
    staff/
      StaffList.tsx
      HiringPanel.tsx
```

2. **Game Logic**
```typescript
src/
  logic/
    calculations/
      wine.ts
      yield.ts
      pricing.ts
    systems/
      staff.ts
      production.ts
      vineyard.ts
```

3. **State Management**
- Use TypeScript interfaces for all game entities
- Implement pure functions for calculations
- Maintain single source of truth
- Use immutable state updates

## Migration Notes

1. **Preserve These Systems**
- Wine quality calculations
- Staff skill system
- Field prestige formula
- Building upgrade mechanics

2. **Improve These Areas**
- Unified state management
- Type safety with TypeScript
- Component composition
- Performance optimization

3. **New Architecture Benefits**
- Better type safety
- Simpler state management
- More maintainable codebase
- Easier testing
- Better performance

## Testing Strategy

```typescript
// Example test structure
describe('Wine Quality Calculation', () => {
  test('calculates basic wine quality', () => {
    expect(calculateWineQuality(0.8, 0.7, 0.9)).toBe(0.8);
  });
});
```

Remember:
- Write tests for all calculations
- Use TypeScript for type safety
- Keep components small and focused
- Avoid nested component state
- Use pure functions for game logic
