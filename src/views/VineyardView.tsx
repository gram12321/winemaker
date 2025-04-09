import React from 'react';
import { useDisplayUpdate } from '../lib/game/displayManager';
import displayManager from '../lib/game/displayManager';
import { getGameState, updateGameState } from '@/gameState';
import { Vineyard, calculateVineyardYield, calculateLandValue } from '../lib/game/vineyard';
import { consoleService } from '../components/layout/Console';
import { getVineyards, addVineyard, plantVineyard, harvestVineyard } from '../services/vineyardService';
import { getActivitiesForTarget, getTargetProgress, getActivityById } from '../lib/game/activityManager';
import { WorkCategory } from '../lib/game/workCalculator';
import StorageSelector from '../components/buildings/StorageSelector';
import StaffAssignmentModal from '../components/staff/StaffAssignmentModal';
import { BASELINE_VINE_DENSITY, formatGameDate } from '../lib/core/constants/gameConstants';
import { ASPECT_FACTORS } from '../lib/core/constants/vineyardConstants';
import { ActivityProgressBar } from '../components/activities/ActivityProgressBar';
import PlantingOptionsModal from '@/components/vineyards/PlantingOptionsModal';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { formatNumber } from '@/lib/core/utils/formatUtils';
import { getCountryCodeForFlag } from '@/lib/core/utils/formatUtils';
import { getColorClass } from '@/lib/core/utils/formatUtils';
import { toast } from '@/lib/ui/toast';

// Display state type definition
interface VineyardViewDisplayState {
  selectedVineyardId: string | null;
  loading: boolean;
  selectedStorageLocations: { locationId: string; quantity: number }[];
  showStaffAssignment?: boolean;
  currentActivityId?: string | null;
  showPlantingModal: boolean;
}

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
  selectedStorageLocations: [] as { locationId: string; quantity: number }[],
  showStaffAssignment: false,
  currentActivityId: null,
  showPlantingModal: false,
});

const VineyardView: React.FC = () => {
  useDisplayUpdate();
  
  const gameState = getGameState();
  const displayState = displayManager.getDisplayState('vineyardView') as VineyardViewDisplayState;
  const vineyards = getVineyards();
  
  const { 
    selectedVineyardId, 
    loading, 
    selectedStorageLocations,
    showStaffAssignment,
    currentActivityId,
    showPlantingModal,
  } = displayState;

  // Get the selected vineyard from the current game state using the ID
  const selectedVineyard = selectedVineyardId 
    ? vineyards.find(v => v.id === selectedVineyardId) || null 
    : null;

  // --- NEW LOGIC: Fetch CURRENT activities directly ---
  const currentVineyardActivities = selectedVineyardId ? getActivitiesForTarget(selectedVineyardId) : [];
  
  const currentPlantingActivity = currentVineyardActivities.find(a => a.category === WorkCategory.PLANTING);
  // Fetch the absolute latest state of the activity object if it exists
  const latestPlantingActivityState = currentPlantingActivity ? getActivityById(currentPlantingActivity.id) : null;

  const currentHarvestingActivity = currentVineyardActivities.find(a => a.category === WorkCategory.HARVESTING);
  // Fetch the absolute latest state of the activity object if it exists
  const latestHarvestingActivityState = currentHarvestingActivity ? getActivityById(currentHarvestingActivity.id) : null;

  // Flags to determine if activities are in progress based on LATEST state
  const plantingInProgress = !!latestPlantingActivityState;
  const harvestingInProgress = !!latestHarvestingActivityState;
  // --- END NEW LOGIC ---

  // Handle adding a new vineyard using the vineyard service
  const handleAddVineyard = displayManager.createActionHandler(async () => {
    displayManager.updateDisplayState('vineyardView', { loading: true });
    try {
      const newVineyard = await addVineyard();
      if (newVineyard) {
        // Select the new vineyard immediately
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

  // Handle selecting a vineyard - REMOVED fetching/storing vineyardActivities
  const handleSelectVineyard = (vineyard: Vineyard) => {
    displayManager.updateDisplayState('vineyardView', { 
      selectedVineyardId: vineyard.id
    });
  };

  // Open the modal instead of directly calling the service
  const handleOpenPlantingModal = displayManager.createActionHandler(() => {
    if (!selectedVineyardId) return;
    displayManager.updateDisplayState('vineyardView', { showPlantingModal: true });
  });

  // Close the modal
  const handleClosePlantingModal = () => {
    displayManager.updateDisplayState('vineyardView', { showPlantingModal: false });
  };

  // Handle submission from the planting modal
  const handlePlantVineyardSubmit = displayManager.createActionHandler(async (options: { grape: GrapeVariety; density: number }) => {
    if (!selectedVineyardId) return;

    handleClosePlantingModal(); // Close modal first
    displayManager.updateDisplayState('vineyardView', { loading: true });
    try {
      const result = await plantVineyard(selectedVineyardId, options.grape, options.density);

      if (!result) {
        consoleService.error('Failed to start planting vineyard.');
      }
    } catch (error) {
      consoleService.error('Error planting vineyard.');
      console.error('Error planting vineyard:', error);
    } finally {
      displayManager.updateDisplayState('vineyardView', { loading: false });
      // No need to re-fetch activities here anymore
    }
  });

  // Handle harvesting a vineyard
  const handleHarvestVineyard = displayManager.createActionHandler(async () => {
    if (!selectedVineyardId) return;
    
    const totalStorageQuantity = selectedStorageLocations.reduce((sum: number, loc: { quantity: number }) => sum + loc.quantity, 0);
    if (totalStorageQuantity <= 0) {
      consoleService.error('Please select at least one storage location.');
      return;
    }
    
    const requiredQuantity = selectedVineyard ? Math.ceil(calculateVineyardYield(selectedVineyard)) : 0;
    const isPartialHarvest = totalStorageQuantity < requiredQuantity;
    
    displayManager.updateDisplayState('vineyardView', { loading: true });
    try {
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

  // Handle staff assignment - Use currentVineyardActivities
  const handleAssignStaff = (activityCategory: WorkCategory) => {
    const activity = currentVineyardActivities.find(a => a.category === activityCategory);
    if (activity) {
      displayManager.updateDisplayState('vineyardView', { 
        showStaffAssignment: true,
        currentActivityId: activity.id 
      });
    } else {
       // Optionally handle case where activity doesn't exist (e.g., completed just before click)
       console.warn(`Tried to assign staff, but no active ${activityCategory} activity found for vineyard ${selectedVineyardId}`);
       toast({ title: "Assign Staff", description: `No active ${activityCategory} activity found.`, variant: "default" });
    }
  };

  // Handle staff assignment modal close
  const handleStaffModalClose = () => {
    displayManager.updateDisplayState('vineyardView', { 
      showStaffAssignment: false,
      currentActivityId: null
    });
  };

  // Handle staff assignment change (remains the same)
  const handleStaffAssignmentChange = (staffIds: string[]) => {
    // ... 
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
                    <span className={`fi ${getCountryCodeForFlag(vineyard.country)} mr-2`}></span>
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

      {selectedVineyard ? (
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
                <li>
                  <span className="font-medium">Region:</span>
                  <span className={`fi ${getCountryCodeForFlag(selectedVineyard.country)} ml-2 mr-1`}></span>
                  {selectedVineyard.region}, {selectedVineyard.country}
                </li>
                <li><span className="font-medium">Size:</span> {selectedVineyard.acres.toFixed(1)} acres</li>
                <li><span className="font-medium">Altitude:</span> {selectedVineyard.altitude}m</li>
                <li>
                  <span className="font-medium">Aspect:</span> {selectedVineyard.aspect}
                  <span className={`ml-2 ${getColorClass(ASPECT_FACTORS[selectedVineyard.aspect] ?? 0)}`}>
                    ({((ASPECT_FACTORS[selectedVineyard.aspect] ?? 0) * 100).toFixed(0)}%)
                  </span>
                </li>
                <li>
                  <span className="font-medium">Soil:</span>{' '}
                  {selectedVineyard.soil.join(', ')}
                </li>
                <li>
                  <span className="font-medium">Farming Method:</span>{' '}
                  {selectedVineyard.farmingMethod}
                  {selectedVineyard.farmingMethod !== 'Conventional' && (
                    <span className="ml-1 text-green-600">
                      (Organic year: {selectedVineyard.organicYears})
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
                  <li><span className="font-medium">Planted Density:</span> {formatNumber(selectedVineyard.density)} vines per acre</li>
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
                  <li><span className="font-medium">Expected Yield:</span> {selectedVineyard.status === 'Harvested' ? '0 kg (Harvested)' : `${formatNumber(calculateVineyardYield(selectedVineyard))} kg`}</li>
                  
                  {/* Harvest controls - use harvestingInProgress flag */}
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
                          disabled={loading || selectedStorageLocations.length === 0 || harvestingInProgress}
                        >
                          {loading ? 'Processing...' : (harvestingInProgress ? 'Harvesting...' : 'Start Harvest')}
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">This vineyard is not planted yet.</p>
                  <button
                    onClick={handleOpenPlantingModal}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    disabled={loading || plantingInProgress}
                  >
                    {loading ? 'Processing...' : (plantingInProgress ? 'Planting...' : 'Plant Vineyard')}
                  </button>
                </div>
              )}
              
              {/* Display planting progress - Use latestPlantingActivityState */}
              {plantingInProgress && latestPlantingActivityState && (
                <div className="my-4">
                  <ActivityProgressBar
                    activityId={latestPlantingActivityState.id}
                    title="Planting Progress"
                    category={WorkCategory.PLANTING}
                    // Calculate progress directly from latest state
                    progress={latestPlantingActivityState.totalWork > 0 ? (latestPlantingActivityState.appliedWork / latestPlantingActivityState.totalWork) * 100 : 0} 
                    appliedWork={latestPlantingActivityState.appliedWork}
                    totalWork={latestPlantingActivityState.totalWork}
                    onAssignStaff={() => handleAssignStaff(WorkCategory.PLANTING)}
                    className=""
                  />
                </div>
              )}
              
              {/* Display harvesting progress - Use latestHarvestingActivityState */}
              {harvestingInProgress && latestHarvestingActivityState && (
                <div className="my-4">
                  <ActivityProgressBar
                    activityId={latestHarvestingActivityState.id}
                    title="Harvesting Progress"
                    category={WorkCategory.HARVESTING}
                     // Calculate progress directly from latest state
                    progress={latestHarvestingActivityState.totalWork > 0 ? (latestHarvestingActivityState.appliedWork / latestHarvestingActivityState.totalWork) * 100 : 0}
                    appliedWork={latestHarvestingActivityState.appliedWork}
                    totalWork={latestHarvestingActivityState.totalWork}
                    onAssignStaff={() => handleAssignStaff(WorkCategory.HARVESTING)}
                    className=""
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
                <div className="text-lg font-semibold">${formatNumber(selectedVineyard.landValue)}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-600">Prestige</div>
                <div className={`text-lg font-semibold ${getColorClass(selectedVineyard.vineyardPrestige)}`}>
                    {formatNumber(selectedVineyard.vineyardPrestige * 100)}/100
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded">
                <div className="text-sm text-gray-600">Annual Yield Factor</div>
                <div className="text-lg font-semibold">{Math.round(selectedVineyard.annualYieldFactor * 100)}%</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-sm text-gray-600">Quality Factor</div>
                <div className="text-lg font-semibold">{Math.round(selectedVineyard.annualQualityFactor * 100)}%</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Planting Modal */}
      {displayState.showPlantingModal && selectedVineyard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PlantingOptionsModal 
            vineyard={selectedVineyard}
            onClose={handleClosePlantingModal}
            onSubmit={handlePlantVineyardSubmit}
          />
        </div>
      )}

      {/* Staff assignment modal */}
      {showStaffAssignment && currentActivityId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl">
            <StaffAssignmentModal
              activityId={currentActivityId}
              category={getActivityById(currentActivityId)?.category || ''}
              onClose={handleStaffModalClose}
              initialAssignedStaffIds={getActivityById(currentActivityId)?.params?.assignedStaffIds || []}
              onAssignmentChange={handleStaffAssignmentChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VineyardView; 