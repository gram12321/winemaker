
# Winery Management Game - Architecture Guide (Next Iteration)

## Successful Elements from Previous Version

### 1. Core Game Systems
- **Vineyard Management**: The current implementation successfully handles planting, maintenance, and harvesting with precise calculations
- **Wine Production Pipeline**: The crush → ferment → age workflow proved effective
- **Staff Management**: The skill-based system with specializations worked well
- **Financial System**: Formula-based pricing provided good balance

### 2. Key Calculations (To Port)
- Wine Quality: Based on field prestige, staff skills, and process quality
- Yield Calculations: Based on density, health, and annual factors
- Staff Work Rate: Based on skill levels (Fresh Off the Vine to Living Legend)
- Wine Price Formula: Land value (62.5%) + Quality/Balance multiplier system

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
