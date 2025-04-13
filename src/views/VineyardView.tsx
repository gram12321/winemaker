import React from 'react';
import { useDisplayUpdate } from '../lib/game/displayManager';
import displayManager from '../lib/game/displayManager';
import { getGameState, updateGameState } from '@/gameState';
import { Vineyard, calculateVineyardYield, calculateLandValue } from '../lib/game/vineyard';
import { consoleService } from '../components/layout/Console';
import { getVineyards, addVineyard, plantVineyard, harvestVineyard, clearVineyard, uprootVineyard } from '../services/vineyardService';
import { getActivitiesForTarget, getTargetProgress, getActivityById } from '../lib/game/activityManager';
import { WorkCategory } from '../lib/game/workCalculator';
import StorageSelector from '../components/buildings/StorageSelector';
import StaffAssignmentModal from '../components/activities/StaffAssignmentModal';
import { BASELINE_VINE_DENSITY, formatGameDate } from '../lib/core/constants/gameConstants';
import { ASPECT_FACTORS } from '../lib/core/constants/vineyardConstants';
import { ActivityProgressBar } from '../components/activities/ActivityProgressBar';
import PlantingOptionsModal from '@/components/vineyards/PlantingOptionsModal';
import ClearingOptionModal from '@/components/vineyards/ClearingOptionModal';
import UprootOptionModal from '@/components/vineyards/UprootOptionModal';
import { GrapeVariety } from '@/lib/core/constants/vineyardConstants';
import { formatNumber, formatCurrency } from '@/lib/core/utils/formatUtils';
import { getCountryCodeForFlag } from '@/lib/core/utils/formatUtils';
import { getColorClass } from '@/lib/core/utils/formatUtils';
import { toast } from '@/lib/ui/toast';
import { getUpgrades, startUpgrade, Upgrade, categorizeUpgrades } from '../services/upgradeService';

// Display state type definition
interface VineyardViewDisplayState {
  selectedVineyardId: string | null;
  loading: boolean;
  selectedStorageLocations: { locationId: string; quantity: number }[];
  showStaffAssignment?: boolean;
  currentActivityId?: string | null;
  showPlantingModal: boolean;
  showClearingModal: boolean;
  showUprootModal: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Clearing in Progress':
    case 'Uprooting in Progress':
    case 'Planting in Progress':
    case 'Harvesting in Progress':
      return 'text-blue-600'; // Use blue for in-progress activities
    case 'Not Planted':
    case 'Ready to be planted': // Added this case explicitly
      return 'text-gray-500';
    case 'Growing':
      return 'text-green-600';
    case 'Ready for Harvest':
      return 'text-amber-600';
    case 'Harvested':
    case 'Dormancy': // Grouped Dormancy here
      return 'text-purple-600'; // Changed color for harvested/dormant
    case 'No yield in first season':
        return 'text-indigo-600'; // Different color for this specific state
    default:
      return 'text-gray-700';
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
  showClearingModal: false,
  showUprootModal: false,
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
    showClearingModal,
    showUprootModal,
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

  // Add activity tracking for clearing and uprooting
  const currentClearingActivity = currentVineyardActivities.find(a => a.category === WorkCategory.CLEARING);
  const latestClearingActivityState = currentClearingActivity ? getActivityById(currentClearingActivity.id) : null;

  const currentUprootingActivity = currentVineyardActivities.find(a => a.category === WorkCategory.UPROOTING);
  const latestUprootingActivityState = currentUprootingActivity ? getActivityById(currentUprootingActivity.id) : null;

  // Flags to determine if activities are in progress based on LATEST state
  const plantingInProgress = !!latestPlantingActivityState;
  const harvestingInProgress = !!latestHarvestingActivityState;
  const clearingInProgress = !!latestClearingActivityState;
  const uprootingInProgress = !!latestUprootingActivityState;
  // --- END NEW LOGIC ---

  // Function to determine the display status
  const getDisplayStatus = (vineyard: Vineyard, isClearing: boolean, isUprooting: boolean): string => {
    if (isClearing) return 'Clearing in Progress';
    if (isUprooting) return 'Uprooting in Progress';
    // Add specific check for planting in progress based on activity
    if (plantingInProgress && selectedVineyardId === vineyard.id) return 'Planting in Progress';
    // Add specific check for harvesting in progress based on activity
    if (harvestingInProgress && selectedVineyardId === vineyard.id) return 'Harvesting in Progress';
    return vineyard.status || 'Unknown'; // Fallback to vineyard's own status
  };

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

  // NEW HANDLERS FOR CLEARING/UPROOTING
  
  // Open/close the clearing modal
  const handleOpenClearingModal = displayManager.createActionHandler(() => {
    if (!selectedVineyardId) return;
    displayManager.updateDisplayState('vineyardView', { showClearingModal: true });
  });

  const handleCloseClearingModal = () => {
    displayManager.updateDisplayState('vineyardView', { showClearingModal: false });
  };

  // Handle submission from the clearing modal
  const handleClearVineyardSubmit = displayManager.createActionHandler(async (options: {
    tasks: { [key: string]: boolean }; 
    replantingIntensity: number;
    isOrganicAmendment: boolean;
  }) => {
    if (!selectedVineyardId) return;

    handleCloseClearingModal(); // Close modal first
    displayManager.updateDisplayState('vineyardView', { loading: true });
    
    try {
      const result = await clearVineyard(selectedVineyardId, options);
      
      if (!result) {
        consoleService.error('Failed to start clearing vineyard.');
      }
    } catch (error) {
      consoleService.error('Error clearing vineyard.');
      console.error('Error clearing vineyard:', error);
    } finally {
      displayManager.updateDisplayState('vineyardView', { loading: false });
    }
  });

  // Open/close the uprooting modal
  const handleOpenUprootModal = displayManager.createActionHandler(() => {
    if (!selectedVineyardId) return;
    displayManager.updateDisplayState('vineyardView', { showUprootModal: true });
  });

  const handleCloseUprootModal = () => {
    displayManager.updateDisplayState('vineyardView', { showUprootModal: false });
  };

  // Handle submission from the uprooting modal
  const handleUprootVineyardSubmit = displayManager.createActionHandler(async () => {
    if (!selectedVineyardId) return;

    handleCloseUprootModal(); // Close modal first
    displayManager.updateDisplayState('vineyardView', { loading: true });
    
    try {
      // Use the actual uprooting service instead of placeholder
      const result = await uprootVineyard(selectedVineyardId);
      
      if (!result) {
        consoleService.error('Failed to start uprooting vineyard.');
      }
    } catch (error) {
      consoleService.error('Error uprooting vineyard.');
      console.error('Error uprooting vineyard:', error);
    } finally {
      displayManager.updateDisplayState('vineyardView', { loading: false });
    }
  });

  // Add after the existing const declarations
  const allUpgrades = getUpgrades();
  const { upgrades: vineyardUpgrades } = categorizeUpgrades(allUpgrades);
  
  // Filter upgrades that are applicable to farmland and not already applied
  const availableUpgrades = vineyardUpgrades.filter(upgrade => {
    if (upgrade.applicableTo !== 'farmland') return false;
    if (!selectedVineyard) return false;
    // Check if vineyard already has this upgrade
    return !(selectedVineyard.upgrades || []).includes(upgrade.id.toString());
  });

  const handleStartUpgrade = async (upgrade: Upgrade) => {
    if (!selectedVineyard) return;
    
    // Check if player can afford the upgrade
    const { player } = gameState;
    if (!player || player.money < upgrade.requirements.money) {
      toast({
        title: "Cannot Start Upgrade",
        description: "Not enough money for this upgrade.",
        variant: "destructive"
      });
      return;
    }
    
    // Start the upgrade
    const success = await startUpgrade(upgrade.id, selectedVineyard);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to start upgrade. Please try again.",
        variant: "destructive"
      });
    }
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
            {vineyards.map((vineyard) => {
              // Determine if activities are running for *this specific vineyard* in the map
              const activitiesForThisVineyard = getActivitiesForTarget(vineyard.id);
              const isClearingThis = activitiesForThisVineyard.some(a => a.category === WorkCategory.CLEARING);
              const isUprootingThis = activitiesForThisVineyard.some(a => a.category === WorkCategory.UPROOTING);
              const isPlantingThis = activitiesForThisVineyard.some(a => a.category === WorkCategory.PLANTING);
              const isHarvestingThis = activitiesForThisVineyard.some(a => a.category === WorkCategory.HARVESTING);
              
              // Use the helper function to get the status for the card
              const displayStatus = getDisplayStatus(vineyard, isClearingThis, isUprootingThis);
              
              return (
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
                        <span className={getStatusColor(displayStatus)}>
                          {displayStatus}
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
              );
            })}
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
              {(() => {
                // Use the helper function for the detailed view status as well
                const detailedDisplayStatus = getDisplayStatus(selectedVineyard, clearingInProgress, uprootingInProgress);
                
                if (!selectedVineyard.grape && !plantingInProgress && !clearingInProgress && !uprootingInProgress) {
                  return <p className="text-gray-600 mb-4">This vineyard is not planted yet.</p>;
                } else {
                  return (
                    <ul className="space-y-2">
                      <li>
                        <span className="font-medium">Status:</span>{' '}
                        <span className={getStatusColor(detailedDisplayStatus)}>
                          {detailedDisplayStatus}
                        </span>
                      </li>
                      {/* Conditionally render other status details only if planted */}
                      {selectedVineyard.grape && (
                        <>
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
                        </>
                      )}
                    </ul>
                  );
                }
              })()}
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
              <div className="bg-red-50 p-3 rounded">
                <div className="text-sm text-gray-600">Health</div>
                <div className={`text-lg font-semibold ${getColorClass(selectedVineyard.vineyardHealth)}`}>
                    {formatNumber(selectedVineyard.vineyardHealth * 100)}%
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

          {/* Add after the vineyard value section */}
          {selectedVineyard && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Vineyard Upgrades</h3>
              
              {/* Active Upgrades */}
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Active Upgrades</h4>
                {(selectedVineyard.upgrades || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedVineyard.upgrades || []).map(upgradeId => {
                      const upgrade = vineyardUpgrades.find(u => u.id.toString() === upgradeId);
                      if (!upgrade) return null;
                      return (
                        <div key={upgradeId} className="bg-green-50 border border-green-200 rounded-md p-3">
                          <h5 className="font-medium text-green-800">{upgrade.name}</h5>
                          <p className="text-sm text-green-600">{upgrade.benefitsDescription}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No active upgrades</p>
                )}
              </div>
              
              {/* Available Upgrades */}
              <div>
                <h4 className="text-md font-medium mb-2">Available Upgrades</h4>
                {availableUpgrades.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableUpgrades.map(upgrade => (
                      <div key={upgrade.id} className="border border-wine/20 rounded-md p-3 bg-white">
                        <h5 className="font-medium text-wine">{upgrade.name}</h5>
                        <p className="text-sm text-gray-600 mb-2">{upgrade.description}</p>
                        <div className="text-sm space-y-1 mb-3">
                          <p><span className="font-medium">Benefits:</span> {upgrade.benefitsDescription}</p>
                          <p><span className="font-medium">Cost:</span> {formatCurrency(upgrade.requirements.money)}</p>
                        </div>
                        <button
                          onClick={() => handleStartUpgrade(upgrade)}
                          className="w-full bg-wine text-white px-3 py-1.5 rounded text-sm hover:bg-wine-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!gameState.player || (gameState.player.money || 0) < upgrade.requirements.money}
                        >
                          Start Upgrade
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No available upgrades</p>
                )}
              </div>
              
              {/* Ongoing Upgrade Activities */}
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">Ongoing Upgrades</h4>
                <div className="space-y-3">
                  {currentVineyardActivities
                    .filter(activity => activity.category === WorkCategory.UPGRADING)
                    .map(activity => (
                      <ActivityProgressBar
                        key={activity.id}
                        activityId={activity.id}
                        title={activity.params?.title || 'Upgrade Activity'}
                        category={activity.category}
                        progress={(activity.appliedWork / activity.totalWork) * 100}
                        appliedWork={activity.appliedWork}
                        totalWork={activity.totalWork}
                        onAssignStaff={() => {
                          displayManager.updateDisplayState('vineyardView', {
                            showStaffAssignment: true,
                            currentActivityId: activity.id
                          });
                        }}
                        className="bg-white shadow-sm hover:shadow-md transition-shadow"
                      />
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Vineyard Status & Actions section */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Vineyard Actions</h3>
            <div className="flex space-x-4 items-start">
              {/* Planting Button (Only if not planted) */}
              {!selectedVineyard.grape && (
                <button
                  onClick={handleOpenPlantingModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || plantingInProgress || clearingInProgress || uprootingInProgress}
                >
                  {loading ? 'Processing...' : (plantingInProgress ? 'Planting...' : 'Plant Vineyard')}
                </button>
              )}

              {/* Clearing Button (Always available if vineyard selected) */}
              <button
                onClick={handleOpenClearingModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || clearingInProgress || plantingInProgress || uprootingInProgress}
              >
                {loading ? 'Processing...' : (clearingInProgress ? 'Clearing...' : 'Clear Vineyard')}
              </button>
              
              {/* Uprooting Button (Always visible, disable if not planted) */}
              <button
                onClick={handleOpenUprootModal}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || uprootingInProgress || clearingInProgress || plantingInProgress || !selectedVineyard.grape}
              >
                {loading ? 'Processing...' : (uprootingInProgress ? 'Uprooting...' : 'Uproot Vineyard')}
              </button>
            </div>
          </div>

          {/* Activity Progress Bars (conditionally rendered below actions) */}
          {(plantingInProgress || harvestingInProgress || clearingInProgress || uprootingInProgress) && currentVineyardActivities.length > 0 && (
            <div className="mt-4">
              {/* Keep the Planting progress bar in this section */}
              {plantingInProgress && 
                <ActivityProgressBar
                  activityId={currentVineyardActivities[0].id}
                  title="Planting Progress"
                  category={WorkCategory.PLANTING}
                  progress={(currentVineyardActivities[0].appliedWork / currentVineyardActivities[0].totalWork) * 100}
                  appliedWork={currentVineyardActivities[0].appliedWork}
                  totalWork={currentVineyardActivities[0].totalWork}
                  onAssignStaff={() => handleAssignStaff(WorkCategory.PLANTING)}
                />
              }
              {/* Keep other progress bars in this section */}
              {harvestingInProgress && 
                <ActivityProgressBar
                  activityId={currentVineyardActivities[0].id}
                  title="Harvesting Progress"
                  category={WorkCategory.HARVESTING}
                  progress={(currentVineyardActivities[0].appliedWork / currentVineyardActivities[0].totalWork) * 100}
                  appliedWork={currentVineyardActivities[0].appliedWork}
                  totalWork={currentVineyardActivities[0].totalWork}
                  onAssignStaff={() => handleAssignStaff(WorkCategory.HARVESTING)}
                />
              }
              {clearingInProgress && 
                <ActivityProgressBar
                  activityId={currentVineyardActivities[0].id}
                  title="Clearing Progress"
                  category={WorkCategory.CLEARING}
                  progress={(currentVineyardActivities[0].appliedWork / currentVineyardActivities[0].totalWork) * 100}
                  appliedWork={currentVineyardActivities[0].appliedWork}
                  totalWork={currentVineyardActivities[0].totalWork}
                  onAssignStaff={() => handleAssignStaff(WorkCategory.CLEARING)}
                />
              }
              {uprootingInProgress && 
                <ActivityProgressBar
                  activityId={currentVineyardActivities[0].id}
                  title="Uprooting Progress"
                  category={WorkCategory.UPROOTING}
                  progress={(currentVineyardActivities[0].appliedWork / currentVineyardActivities[0].totalWork) * 100}
                  appliedWork={currentVineyardActivities[0].appliedWork}
                  totalWork={currentVineyardActivities[0].totalWork}
                  onAssignStaff={() => handleAssignStaff(WorkCategory.UPROOTING)}
                />
              }
            </div>
          )}
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

      {/* Clearing Modal */}
      {displayState.showClearingModal && selectedVineyard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ClearingOptionModal 
            vineyard={selectedVineyard}
            onClose={handleCloseClearingModal}
            onSubmit={handleClearVineyardSubmit}
          />
        </div>
      )}

      {/* Uprooting Modal */}
      {displayState.showUprootModal && selectedVineyard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <UprootOptionModal 
            vineyard={selectedVineyard}
            onClose={handleCloseUprootModal}
            onSubmit={handleUprootVineyardSubmit}
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