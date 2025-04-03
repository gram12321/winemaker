import React from 'react';
import { getGameState } from '../gameState';
import { Vineyard } from '../lib/game/vineyard';
import { addVineyard, plantVineyard, harvestVineyard } from '../services/vineyardService';
import { consoleService } from '../components/layout/Console';
import { GameDate, formatGameDate, BASELINE_VINE_DENSITY } from '../lib/core/constants';
import { useDisplayUpdate } from '../lib/game/displayManager';
import displayManager from '../lib/game/displayManager';
import { calculateVineyardYield } from '../lib/game/vineyard';
import StorageSelector from '../components/buildings/StorageSelector';
import { WorkProgress } from '../components/ui/progress';
import { getActivitiesForTarget, getTargetProgress } from '../lib/game/activityManager';
import { WorkCategory } from '../lib/game/workCalculator';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Growing':
      return 'text-green-600';
    case 'Ripening':
      return 'text-amber-600';
    case 'Ready for Harvest':
      return 'text-red-600';
    case 'Dormancy':
      return 'text-gray-600';
    case 'No yield in first season':
      return 'text-blue-600';
    default:
      return 'text-amber-600';
  }
};

// Create a display state for vineyard view
displayManager.createDisplayState('vineyardView', {
  selectedVineyardId: null as string | null,
  loading: false,
  selectedStorageLocations: [] as { locationId: string; quantity: number }[]
});

const VineyardView: React.FC = () => {
  // Use display update hook to subscribe to game state changes
  useDisplayUpdate();
  
  const gameState = getGameState();
  const { vineyards } = gameState;
  const displayState = displayManager.getDisplayState('vineyardView');
  const { selectedVineyardId, loading, selectedStorageLocations } = displayState;

  // Get the selected vineyard from the current game state using the ID
  const selectedVineyard = selectedVineyardId 
    ? vineyards.find(v => v.id === selectedVineyardId) || null 
    : null;

  // Get planting progress for the selected vineyard
  const plantingProgress = selectedVineyardId 
    ? getTargetProgress(selectedVineyardId, WorkCategory.PLANTING)
    : { overallProgress: 0, hasActivities: false };

  // Handle adding a new vineyard using the vineyard service
  const handleAddVineyard = displayManager.createActionHandler(async () => {
    displayManager.updateDisplayState('vineyardView', { loading: true });
    try {
      const newVineyard = await addVineyard();
      if (newVineyard) {
        consoleService.info(`New vineyard "${newVineyard.name}" acquired in ${newVineyard.region}, ${newVineyard.country}.`);
        displayManager.updateDisplayState('vineyardView', { selectedVineyardId: newVineyard.id });
      } else {
        consoleService.error('Failed to add new vineyard.');
      }
    } catch (error) {
      consoleService.error('Failed to add new vineyard.');
      console.error('Error adding vineyard:', error);
    } finally {
      displayManager.updateDisplayState('vineyardView', { loading: false });
    }
  });

  // Handle selecting a vineyard
  const handleSelectVineyard = (vineyard: Vineyard) => {
    displayManager.updateDisplayState('vineyardView', { selectedVineyardId: vineyard.id });
  };

  // Handle planting a vineyard
  const handlePlantVineyard = displayManager.createActionHandler(async () => {
    if (!selectedVineyardId) return;
    
    displayManager.updateDisplayState('vineyardView', { loading: true });
    try {
      // In a real implementation, we would have a modal/form to select grape type and density
      // For now, let's use a fixed grape type and density
      const grape = "Chardonnay";
      const density = BASELINE_VINE_DENSITY;
      
      const result = await plantVineyard(selectedVineyardId, grape, density);
      
      if (!result) {
        consoleService.error('Failed to start planting vineyard.');
      }
    } catch (error) {
      consoleService.error('Error planting vineyard.');
      console.error('Error planting vineyard:', error);
    } finally {
      displayManager.updateDisplayState('vineyardView', { loading: false });
    }
  });

  // Handle harvesting a vineyard
  const handleHarvestVineyard = displayManager.createActionHandler(async () => {
    if (!selectedVineyardId) return;
    
    // Check if any storage locations are selected
    const totalStorageQuantity = selectedStorageLocations.reduce((sum: number, loc: { quantity: number }) => sum + loc.quantity, 0);
    if (totalStorageQuantity <= 0) {
      consoleService.error('Please select at least one storage location.');
      return;
    }
    
    const requiredQuantity = selectedVineyard ? Math.ceil(calculateVineyardYield(selectedVineyard)) : 0;
    const isPartialHarvest = totalStorageQuantity < requiredQuantity;
    
    displayManager.updateDisplayState('vineyardView', { loading: true });
    try {
      // Harvest only what fits in storage
      const result = await harvestVineyard(selectedVineyardId, totalStorageQuantity, selectedStorageLocations);
      
      if (result) {
        const { vineyard, harvestedAmount } = result;
        let message = `Harvested ${Math.round(harvestedAmount).toLocaleString()} kg of ${vineyard.grape} grapes from ${vineyard.name}. `;
        message += `The grapes have been stored across ${selectedStorageLocations.length} location(s).`;
        
        if (isPartialHarvest) {
          const remainingYield = Math.ceil(requiredQuantity - harvestedAmount);
          message += ` There are still ${remainingYield.toLocaleString()} kg of grapes remaining to be harvested.`;
        }
        
        consoleService.success(message);
        
        // Reset storage locations after successful harvest
        displayManager.updateDisplayState('vineyardView', { selectedStorageLocations: [] });
      } else {
        consoleService.error('Failed to harvest vineyard.');
      }
    } catch (error) {
      consoleService.error('Error harvesting vineyard.');
      console.error('Error harvesting vineyard:', error);
    } finally {
      displayManager.updateDisplayState('vineyardView', { loading: false });
    }
  });

  // Handle storage location changes
  const handleStorageChange = (locations: { locationId: string; quantity: number }[]) => {
    displayManager.updateDisplayState('vineyardView', { selectedStorageLocations: locations });
  };

  return (
    <div className="p-4">
      <div className="Vineyard-section mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Vineyard Management</h1>
          <button 
            onClick={handleAddVineyard}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Add Vineyard'}
          </button>
        </div>
        
        {vineyards.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded">
            <p>You don't own any vineyards yet. Add a vineyard to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vineyards.map((vineyard) => (
              <div 
                key={vineyard.id} 
                className={`bg-white border ${selectedVineyardId === vineyard.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} rounded-lg shadow hover:shadow-md cursor-pointer`}
                onClick={() => handleSelectVineyard(vineyard)}
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{vineyard.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    {vineyard.region}, {vineyard.country}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Size:</span> {vineyard.acres.toFixed(1)} acres
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={getStatusColor(vineyard.status)}>
                        {vineyard.status}
                      </span>
                    </div>
                  </div>
                  {vineyard.grape && (
                    <div className="mt-2">
                      <span className="font-medium">Ripeness:</span>{' '}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                        <div 
                          className="bg-amber-500 h-2.5 rounded-full" 
                          style={{ width: `${vineyard.ripeness * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedVineyard && (
        <div className="Vineyard-details mt-6 bg-white border border-gray-200 rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{selectedVineyard.name}</h2>
            <div className="text-sm text-gray-500">
              Owned since {formatGameDate(selectedVineyard.ownedSince)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Location Details</h3>
              <ul className="space-y-2">
                <li><span className="font-medium">Region:</span> {selectedVineyard.region}, {selectedVineyard.country}</li>
                <li><span className="font-medium">Size:</span> {selectedVineyard.acres.toFixed(1)} acres</li>
                <li><span className="font-medium">Altitude:</span> {selectedVineyard.altitude}m</li>
                <li><span className="font-medium">Aspect:</span> {selectedVineyard.aspect}</li>
                <li>
                  <span className="font-medium">Soil:</span>{' '}
                  {selectedVineyard.soil.join(', ')}
                </li>
                <li>
                  <span className="font-medium">Farming Method:</span>{' '}
                  {selectedVineyard.farmingMethod}
                  {selectedVineyard.farmingMethod === 'Ecological' && (
                    <span className="ml-1 text-green-600">
                      ({selectedVineyard.organicYears} years)
                    </span>
                  )}
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Vineyard Status</h3>
              {selectedVineyard.grape ? (
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={getStatusColor(selectedVineyard.status)}>
                      {selectedVineyard.status}
                    </span>
                  </li>
                  <li><span className="font-medium">Planted Grape:</span> {selectedVineyard.grape}</li>
                  <li><span className="font-medium">Vine Age:</span> {selectedVineyard.vineAge} {selectedVineyard.vineAge === 1 ? 'year' : 'years'}</li>
                  <li><span className="font-medium">Planted Density:</span> {selectedVineyard.density.toLocaleString()} vines per acre</li>
                  <li>
                    <span className="font-medium">Health:</span>{' '}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedVineyard.vineyardHealth * 100}%` }}
                      ></div>
                    </div>
                  </li>
                  <li>
                    <span className="font-medium">Ripeness:</span>{' '}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className="bg-amber-500 h-2.5 rounded-full" 
                        style={{ width: `${selectedVineyard.ripeness * 100}%` }}
                      ></div>
                    </div>
                  </li>
                  <li><span className="font-medium">Expected Yield:</span> {selectedVineyard.status === 'Harvested' ? '0 kg (Harvested)' : `${Math.round(calculateVineyardYield(selectedVineyard)).toLocaleString()} kg`}</li>
                  
                  {/* Harvest controls */}
                  {selectedVineyard.status !== 'Harvested' && selectedVineyard.ripeness > 0.3 && (
                    <>
                      <li className="mt-4 pt-4 border-t border-gray-200">
                        <StorageSelector 
                          resourceType="grape"
                          selectedStorageLocations={selectedStorageLocations}
                          onStorageChange={handleStorageChange}
                          requiredCapacity={Math.ceil(calculateVineyardYield(selectedVineyard))}
                        />
                      </li>
                      <li className="mt-4">
                        <button 
                          onClick={handleHarvestVineyard}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded"
                          disabled={loading || selectedStorageLocations.length === 0}
                        >
                          {loading ? 'Processing...' : 'Start Harvest'}
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">This vineyard is not planted yet.</p>
                  <button
                    onClick={handlePlantVineyard}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Plant Vineyard'}
                  </button>
                </div>
              )}
              
              {/* Display planting progress if there's an active planting activity */}
              {plantingProgress.hasActivities && (
                <div className="my-4">
                  <WorkProgress 
                    value={plantingProgress.overallProgress} 
                    label="Planting Progress" 
                    showPercentage={true}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Vineyard Value</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-600">Land Value</div>
                <div className="text-lg font-semibold">${selectedVineyard.landValue.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VineyardView; 