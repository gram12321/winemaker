import React from 'react';
import { useDisplayUpdate } from '../lib/game/displayManager';
import displayManager from '../lib/game/displayManager';
import { getGameState } from '../gameState';
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
import PlantVineyardOptionsModal from '../components/vineyards/PlantVineyardOptionsModal';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { getColorClass, formatNumber } from '@/lib/core/utils/utils';
import { getFlagIconClass } from '@/lib/core/utils/formatUtils';

// Display state type definition
interface VineyardViewDisplayState {
  selectedVineyardId: string | null;
  loading: boolean;
  selectedStorageLocations: { locationId: string; quantity: number }[];
  showStaffAssignment?: boolean;
  currentActivityId?: string | null;
  vineyardActivities: any[];
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
  vineyardActivities: [],
  showPlantingModal: false,
});

// Helper function to get vineyard activities
function getVineyardActivities(vineyardId: string | null): any[] {
  if (!vineyardId) return [];
  return getActivitiesForTarget(vineyardId);
}

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
    vineyardActivities,
    showPlantingModal,
  } = displayState;

  // Get the selected vineyard from the current game state using the ID
  const selectedVineyard = selectedVineyardId 
    ? vineyards.find(v => v.id === selectedVineyardId) || null 
    : null;

  // Get planting progress only if there's an active planting activity
  const plantingProgress = vineyardActivities.some(a => a.category === WorkCategory.PLANTING)
    ? getTargetProgress(selectedVineyardId!, WorkCategory.PLANTING)
    : { overallProgress: 0, hasActivities: false };

  // Get the planting work values from the vineyard status or directly from the activity
  const getPlantingWorkValues = () => {
    // Check if we have a direct activity first
    const plantingActivity = vineyardActivities.find(a => a.category === WorkCategory.PLANTING);
    
    if (plantingActivity) {
      return {
        appliedWork: plantingActivity.appliedWork,
        totalWork: plantingActivity.totalWork,
        activityId: plantingActivity.id
      };
    }
    
    // If no activity, try to extract from status
    if (selectedVineyard && selectedVineyard.status && selectedVineyard.status.includes('Planting:')) {
      // Extract work values from status
      const workMatch = selectedVineyard.status.match(/Planting: (\d+)\/(\d+)/);
      
      if (workMatch) {
        const appliedWork = parseInt(workMatch[1]);
        const totalWork = parseInt(workMatch[2]);
        
        console.log(`[VineyardView] Extracted Planting work values from status: ${appliedWork}/${totalWork}`);
        return { appliedWork, totalWork, activityId: '' };
      }
      
      // Fallback to old percentage format
      const percentMatch = selectedVineyard.status.match(/Planting: (\d+)%/);
      if (percentMatch) {
        const percent = parseInt(percentMatch[1]);
        console.log(`[VineyardView] Found old Planting percentage format in status: ${percent}%`);
        return { appliedWork: percent, totalWork: 100, activityId: '' };
      }
    }
    
    // Default values
    return { appliedWork: 0, totalWork: 100, activityId: '' };
  };

  // Get the work values
  const plantingWorkValues = getPlantingWorkValues();

  // Get harvesting progress only if there's an active harvesting activity
  const harvestingProgress = vineyardActivities.some(a => a.category === WorkCategory.HARVESTING)
    ? getTargetProgress(selectedVineyardId!, WorkCategory.HARVESTING)
    : { overallProgress: 0, hasActivities: false };

  // Get the harvesting work values from the activity or the vineyard status
  const getHarvestingWorkValues = () => {
    // Check if we have a direct activity first
    const harvestingActivity = vineyardActivities.find(a => a.category === WorkCategory.HARVESTING);
    
    if (harvestingActivity) {
      return {
        appliedWork: harvestingActivity.appliedWork,
        totalWork: harvestingActivity.totalWork,
        activityId: harvestingActivity.id
      };
    }
    
    // If no activity, try to extract from status
    if (selectedVineyard && selectedVineyard.status && selectedVineyard.status.includes('Harvesting:')) {
      // Extract work values from status
      const workMatch = selectedVineyard.status.match(/Harvesting: (\d+)\/(\d+)/);
      
      if (workMatch) {
        const appliedWork = parseInt(workMatch[1]);
        const totalWork = parseInt(workMatch[2]);
        
        console.log(`[VineyardView] Extracted Harvesting work values from status: ${appliedWork}/${totalWork}`);
        return { appliedWork, totalWork, activityId: '' };
      }
      
      // Fallback to old percentage format
      const percentMatch = selectedVineyard.status.match(/Harvesting: (\d+)%/);
      if (percentMatch) {
        const percent = parseInt(percentMatch[1]);
        console.log(`[VineyardView] Found old Harvesting percentage format in status: ${percent}%`);
        return { appliedWork: percent, totalWork: 100, activityId: '' };
      }
    }
    
    // Default values
    return { appliedWork: 0, totalWork: 100, activityId: '' };
  };

  // Get the work values
  const harvestingWorkValues = getHarvestingWorkValues();

  // Only log if there are actual activities
  if (plantingProgress.hasActivities) {
    console.log(`[VineyardView] Using planting work values: ${plantingWorkValues.appliedWork}/${plantingWorkValues.totalWork}`);
  }
  
  if (harvestingProgress.hasActivities) {
    console.log(`[VineyardView] Using harvesting work values: ${harvestingWorkValues.appliedWork}/${harvestingWorkValues.totalWork}`);
  }

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
    // Get the activities for this vineyard
    const activities = getVineyardActivities(vineyard.id);
    console.log(`[VineyardView] Found ${activities.length} activities for vineyard ${vineyard.id}`);
    
    // Update display state with both the selected vineyard and its activities
    displayManager.updateDisplayState('vineyardView', { 
      selectedVineyardId: vineyard.id,
      vineyardActivities: activities
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
      // Success message is handled within plantVineyard service now
    } catch (error) {
      consoleService.error('Error planting vineyard.');
      console.error('Error planting vineyard:', error);
    } finally {
      displayManager.updateDisplayState('vineyardView', { loading: false });
      // Re-fetch activities for the vineyard after starting planting
      const activities = getVineyardActivities(selectedVineyardId);
       displayManager.updateDisplayState('vineyardView', {
         vineyardActivities: activities
       });
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

  // Handle staff assignment
  const handleAssignStaff = (activityCategory: WorkCategory) => {
    // Find the first activity of the specified category for the selected vineyard
    const activity = vineyardActivities.find(a => a.category === activityCategory);
    if (activity) {
      displayManager.updateDisplayState('vineyardView', { 
        showStaffAssignment: true,
        currentActivityId: activity.id 
      });
    }
  };

  // Handle staff assignment modal close
  const handleStaffModalClose = () => {
    displayManager.updateDisplayState('vineyardView', { 
      showStaffAssignment: false,
      currentActivityId: null
    });
  };

  // Handle staff assignment change
  const handleStaffAssignmentChange = (staffIds: string[]) => {
    // This will be called when staff assignments change in the modal
    // No need to do anything here as the modal handles saving the assignments
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
                    <span className={`fi ${getFlagIconClass(vineyard.country)} mr-2`}></span>
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
                  <span className={`fi ${getFlagIconClass(selectedVineyard.country)} ml-2 mr-1`}></span>
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
                          disabled={loading || selectedStorageLocations.length === 0 || harvestingProgress.hasActivities}
                        >
                          {loading ? 'Processing...' : (harvestingProgress.hasActivities ? 'Harvesting...' : 'Start Harvest')}
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
                    disabled={loading || plantingProgress.hasActivities}
                  >
                    {loading ? 'Processing...' : (plantingProgress.hasActivities ? 'Planting...' : 'Plant Vineyard')}
                  </button>
                </div>
              )}
              
              {/* Display planting progress if there's an active planting activity */}
              {plantingProgress.hasActivities && (
                <div className="my-4">
                  <ActivityProgressBar
                    activityId={plantingWorkValues.activityId || vineyardActivities.find(a => a.category === WorkCategory.PLANTING)?.id || ''}
                    title="Planting Progress"
                    category={WorkCategory.PLANTING}
                    progress={plantingProgress.overallProgress} 
                    appliedWork={plantingWorkValues.appliedWork}
                    totalWork={plantingWorkValues.totalWork}
                    onAssignStaff={() => handleAssignStaff(WorkCategory.PLANTING)}
                    className=""
                  />
                </div>
              )}
              
              {/* Display harvesting progress if there's an active harvesting activity */}
              {harvestingProgress.hasActivities && (
                <div className="my-4">
                  <ActivityProgressBar
                    activityId={harvestingWorkValues.activityId || vineyardActivities.find(a => a.category === WorkCategory.HARVESTING)?.id || ''}
                    title="Harvesting Progress"
                    category={WorkCategory.HARVESTING}
                    progress={harvestingProgress.overallProgress}
                    appliedWork={harvestingWorkValues.appliedWork}
                    totalWork={harvestingWorkValues.totalWork}
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

      {/* --- Planting Modal --- */}
      {showPlantingModal && selectedVineyard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <PlantVineyardOptionsModal
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