import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loadBuildings, deserializeBuilding } from '@/lib/database/buildingDB';
import { getGameState, WineBatch } from '@/gameState';

export interface StorageOption {
  id: string;
  label: string;
  capacity: number;
  availableCapacity: number;
  buildingName: string;
  toolName: string;
  instanceNumber: number;
  currentGrapeType?: string;
  currentVintage?: number;
}

export interface StorageAllocation {
  locationId: string;
  quantity: number;
}

interface StorageSelectorProps {
  resourceType: 'grape' | 'must' | 'wine' | 'bottle';
  selectedStorageLocations: StorageAllocation[];
  onStorageChange: (storageLocations: StorageAllocation[]) => void;
  requiredCapacity?: number;
  grapeType?: string;  // The type of grape being harvested
  vintage?: number;     // The vintage year of the harvest
}

/**
 * StorageSelector component
 * Displays a dropdown of available storage options for a specific resource type
 * Allows splitting quantities across multiple storage locations
 * Prevents mixing different grape types and vintages in the same storage
 */
const StorageSelector: React.FC<StorageSelectorProps> = ({
  resourceType,
  selectedStorageLocations,
  onStorageChange,
  requiredCapacity = 0,
  grapeType,
  vintage
}) => {
  const [storageOptions, setStorageOptions] = useState<StorageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocationId, setCurrentLocationId] = useState<string>('');
  const [currentQuantity, setCurrentQuantity] = useState<number>(0);

  // Load storage options when the component mounts or resourceType changes
  useEffect(() => {
    const loadStorageOptions = () => {
      setLoading(true);
      
      try {
        const buildings = loadBuildings();
        const gameState = getGameState();
        const wineBatches = gameState.wineBatches;
        const options: StorageOption[] = [];
        
        // Process buildings to find viable storage options
        buildings.forEach(building => {
          try {
            const buildingInstance = deserializeBuilding(building);
            
            // Iterate through slots and tools to find storage options
            buildingInstance.slots.forEach(slot => {
              slot.tools.forEach(tool => {
                // Check if tool supports the requested resource type
                if (tool.supportedResources.includes(resourceType) && tool.capacity > 0) {
                  // Get current contents of the storage
                  const toolId = `${tool.name}#${tool.instanceNumber}`;
                  const currentContents = wineBatches.filter((batch: WineBatch) => 
                    batch.stage === 'grape' &&
                    batch.storageLocations.some(loc => loc.locationId === toolId)
                  );
                  
                  // Calculate available capacity
                  const usedCapacity = selectedStorageLocations
                    .find(loc => loc.locationId === toolId)
                    ?.quantity || 0;
                  const totalUsedCapacity = usedCapacity + currentContents.reduce((sum: number, batch: WineBatch) => {
                    const locationStorage = batch.storageLocations.find(loc => loc.locationId === toolId);
                    return sum + (locationStorage?.quantity || 0);
                  }, 0);
                  const availableCapacity = tool.capacity - totalUsedCapacity;
                  
                  // Get current grape type and vintage if storage is not empty
                  const currentBatch = currentContents[0];
                  const currentGrapeType = currentBatch?.grapeType;
                  
                  // Safe extraction of vintage year from harvest date which could be a single date or array
                  let currentVintage: number | undefined;
                  if (currentBatch?.harvestGameDate) {
                    if (Array.isArray(currentBatch.harvestGameDate)) {
                      // If it's an array, take the year from the first date
                      currentVintage = currentBatch.harvestGameDate[0]?.year;
                    } else {
                      // If it's a single date, access the year directly
                      currentVintage = currentBatch.harvestGameDate.year;
                    }
                  }
                  
                  // Add to options if:
                  // 1. Storage is empty, OR
                  // 2. Storage contains same grape type and vintage, OR
                  // 3. Storage is partially filled but compatible
                  const isCompatible = !currentGrapeType || 
                    (currentGrapeType === grapeType && currentVintage === vintage);
                  
                  if (availableCapacity > 0 && isCompatible) {
                    options.push({
                      id: toolId,
                      label: `${tool.name} #${tool.instanceNumber}`,
                      capacity: tool.capacity,
                      availableCapacity,
                      buildingName: building.name,
                      toolName: tool.name,
                      instanceNumber: tool.instanceNumber,
                      currentGrapeType,
                      currentVintage
                    });
                  }
                }
              });
            });
          } catch (error) {
            console.error(`Error processing building ${building.name}:`, error);
          }
        });
        
        setStorageOptions(options);
      } catch (error) {
        console.error('Error loading storage options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStorageOptions();
  }, [resourceType, selectedStorageLocations, grapeType, vintage]);

  // Calculate remaining required capacity
  const allocatedCapacity = selectedStorageLocations.reduce((sum, loc) => sum + loc.quantity, 0);
  const remainingCapacity = Math.max(0, requiredCapacity - allocatedCapacity);
  
  // Handle adding a new storage allocation
  const handleAddStorage = () => {
    if (!currentLocationId || currentQuantity <= 0) return;
    
    const option = storageOptions.find(opt => opt.id === currentLocationId);
    if (!option) return;
    
    // Validate quantity against available capacity
    if (currentQuantity > option.availableCapacity) return;
    
    // Add new allocation
    const newAllocations = [...selectedStorageLocations, {
      locationId: currentLocationId,
      quantity: currentQuantity
    }];
    
    onStorageChange(newAllocations);
    
    // Reset inputs
    setCurrentLocationId('');
    setCurrentQuantity(0);
  };

  // Handle storage location selection
  const handleStorageSelect = (locationId: string) => {
    setCurrentLocationId(locationId);
    
    // Set default quantity to maximum possible value
    const option = storageOptions.find(opt => opt.id === locationId);
    if (option) {
      const maxQuantity = Math.min(option.availableCapacity, remainingCapacity || Infinity);
      setCurrentQuantity(Math.ceil(maxQuantity));
    }
  };
  
  // Handle removing a storage allocation
  const handleRemoveStorage = (locationId: string) => {
    const newAllocations = selectedStorageLocations.filter(loc => loc.locationId !== locationId);
    onStorageChange(newAllocations);
  };

  // Get storage option details for a location ID
  const getStorageDetails = (locationId: string) => {
    const [toolName, instanceStr] = locationId.split('#');
    const instanceNumber = parseInt(instanceStr);
    const option = storageOptions.find(opt => 
      opt.toolName === toolName && opt.instanceNumber === instanceNumber
    );
    return option;
  };
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        Storage Locations {requiredCapacity > 0 && `(requires ${Math.ceil(requiredCapacity)} kg total)`}
      </label>
      
      {/* Current allocations */}
      {selectedStorageLocations.length > 0 && (
        <div className="space-y-2">
          {selectedStorageLocations.map(allocation => {
            const option = getStorageDetails(allocation.locationId);
            return (
              <div key={allocation.locationId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div>
                  <span className="font-medium">
                    {option ? `${option.buildingName} - ${option.label}` : allocation.locationId}
                  </span>
                  <span className="text-sm text-gray-600"> - {allocation.quantity} kg</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveStorage(allocation.locationId)}
                >
                  Remove
                </Button>
              </div>
            );
          })}
          
          <div className="text-sm text-gray-600">
            Total Allocated: {Math.ceil(allocatedCapacity)} kg
            {requiredCapacity > 0 && ` (${Math.ceil(remainingCapacity)} kg remaining)`}
          </div>
        </div>
      )}
      
      {/* Add new storage allocation */}
      <div className="flex gap-2">
        <Select
          value={currentLocationId}
          onValueChange={handleStorageSelect}
          disabled={loading || storageOptions.length === 0}
        >
          <SelectTrigger className="flex-grow">
            <SelectValue placeholder="Select storage location" />
          </SelectTrigger>
          
          <SelectContent>
            {storageOptions.map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option.buildingName} - {option.label} ({Math.ceil(option.availableCapacity)} kg available)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          type="number"
          min={1}
          max={currentLocationId ? Math.min(
            storageOptions.find(opt => opt.id === currentLocationId)?.availableCapacity || 0,
            remainingCapacity || Infinity
          ) : 0}
          value={currentQuantity || ''}
          onChange={e => setCurrentQuantity(Math.max(0, parseInt(e.target.value) || 0))}
          placeholder="Quantity (kg)"
          className="w-32"
        />
        
        <Button
          onClick={handleAddStorage}
          disabled={!currentLocationId || currentQuantity <= 0}
        >
          Add
        </Button>
      </div>
      
      {storageOptions.length === 0 && !loading && (
        <p className="text-sm text-red-500">
          No suitable storage available. Build storage facilities in the Buildings menu.
        </p>
      )}
    </div>
  );
};

export default StorageSelector; 