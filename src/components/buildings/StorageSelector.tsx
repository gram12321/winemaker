import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { loadBuildings, deserializeBuilding } from '@/lib/database/buildingService';
import { BuildingType } from '@/lib/core/constants';

export interface StorageOption {
  id: string;
  label: string;
  capacity: number;
  availableCapacity: number;
  buildingName: string;
  toolName: string;
}

interface StorageSelectorProps {
  resourceType: 'grape' | 'must' | 'wine' | 'bottle';
  selectedStorage: string | null;
  onStorageChange: (storageId: string | null) => void;
  requiredCapacity?: number;
}

/**
 * StorageSelector component
 * Displays a dropdown of available storage options for a specific resource type
 */
const StorageSelector: React.FC<StorageSelectorProps> = ({
  resourceType,
  selectedStorage,
  onStorageChange,
  requiredCapacity = 0
}) => {
  const [storageOptions, setStorageOptions] = useState<StorageOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Load storage options when the component mounts or resourceType changes
  useEffect(() => {
    const loadStorageOptions = () => {
      setLoading(true);
      
      try {
        const buildings = loadBuildings();
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
                  // Calculate available capacity (for future use - not implemented yet)
                  const availableCapacity = tool.capacity; // In the future, subtract used capacity
                  
                  // Add to options if there's enough capacity
                  if (availableCapacity >= requiredCapacity) {
                    options.push({
                      id: `${tool.name}#${tool.instanceNumber}`,
                      label: `${tool.name} #${tool.instanceNumber} (${availableCapacity} kg available)`,
                      capacity: tool.capacity,
                      availableCapacity,
                      buildingName: building.name,
                      toolName: tool.name
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
  }, [resourceType, requiredCapacity]);
  
  // Handle storage selection change
  const handleStorageChange = (value: string) => {
    onStorageChange(value === 'none' ? null : value);
  };
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Storage Location {requiredCapacity > 0 && `(requires at least ${requiredCapacity} kg)`}
      </label>
      
      <Select
        disabled={loading || storageOptions.length === 0}
        value={selectedStorage || 'none'}
        onValueChange={handleStorageChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select storage location" />
        </SelectTrigger>
        
        <SelectContent>
          <SelectItem value="none">
            {loading 
              ? 'Loading options...' 
              : storageOptions.length === 0
                ? 'No suitable storage available'
                : 'Select a storage location'}
          </SelectItem>
          
          {storageOptions.map(option => (
            <SelectItem key={option.id} value={option.id}>
              {option.label} - {option.buildingName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {storageOptions.length === 0 && !loading && (
        <p className="text-sm text-red-500">
          No suitable storage available. Build storage facilities in the Buildings menu.
        </p>
      )}
    </div>
  );
};

export default StorageSelector; 