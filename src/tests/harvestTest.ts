import { getGameState } from '../gameState';
import { addVineyard, harvestVineyard } from '../services/vineyardService';
import { GrapeVariety } from '../lib/core/constants/vineyardConstants';

/**
 * Simple test script to verify harvest functionality
 */
async function testHarvest() {
  console.log('Starting harvest test...');
  
  // Create a test vineyard
  const vineyard = await addVineyard({
    name: 'Test Vineyard',
    acres: 10,
    grape: 'Chardonnay' as GrapeVariety,
    status: 'Planted',
    ripeness: 0.9,
    vineyardHealth: 0.8,
    annualYieldFactor: 0.9,
    annualQualityFactor: 0.85,
    density: 1500
  }, true);
  
  console.log(`Created test vineyard: ${vineyard.id} - ${vineyard.name}`);
  
  // Harvest the vineyard
  const harvestResult = await harvestVineyard(vineyard.id, Infinity, true, 'Test Storage');
  
  if (harvestResult) {
    console.log(`Harvested ${harvestResult.harvestedAmount.toFixed(2)} kg of grapes`);
    
    // Verify the wine batch was created
    const gameState = getGameState();
    const wineBatches = gameState.wineBatches;
    
    console.log(`Wine batches in storage: ${wineBatches.length}`);
    
    if (wineBatches.length > 0) {
      const batch = wineBatches[wineBatches.length - 1];
      console.log('Latest wine batch:');
      console.log(`- ID: ${batch.id}`);
      console.log(`- Vineyard ID: ${batch.vineyardId}`);
      console.log(`- Grape Type: ${batch.grapeType}`);
      console.log(`- Quantity: ${batch.quantity.toFixed(2)} kg`);
      console.log(`- Quality: ${(batch.quality * 100).toFixed(2)}%`);
      console.log(`- Storage: ${batch.storageLocation}`);
      console.log(`- Characteristics:`, batch.characteristics);
    }
  } else {
    console.error('Harvest failed');
  }
}

// Run the test
testHarvest().catch(console.error); 