import React, { useState } from 'react';
import { BuildingType, BUILDING_CONFIG } from '@/lib/core/constants';
import { useDisplayUpdate } from '@/lib/game/displayManager';
import { getGameState } from '@/gameState';
import { consoleService } from '@/components/layout/Console';
import { loadBuildings, deserializeBuilding } from '@/lib/database/buildingDB';
import { startBuildingConstruction, upgradeBuilding } from '@/services/buildingService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BuildingDetailsPanel from '@/components/buildings/BuildingDetailsPanel';
import { formatNumber } from '@/lib/core/utils/formatUtils';

/**
 * BuildingsView Component
 * Shows all buildings and allows construction, upgrading, and management
 */
const BuildingsView: React.FC = () => {
  useDisplayUpdate(); // Register for game state updates
  
  const gameState = getGameState();
  const buildings = loadBuildings();
  const playerMoney = gameState.player?.money || 0;
  
  // Selected building for details panel
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  
  // Loading states for button actions
  const [isBuilding, setIsBuilding] = useState<Record<BuildingType, boolean>>({} as Record<BuildingType, boolean>);
  const [isUpgrading, setIsUpgrading] = useState<Record<BuildingType, boolean>>({} as Record<BuildingType, boolean>);
  
  // Handle building construction
  const handleBuild = async (buildingType: BuildingType) => {
    // Set loading state
    setIsBuilding({
      ...isBuilding,
      [buildingType]: true
    });
    
    try {
      const success = await startBuildingConstruction(buildingType);
      if (success) {
        // If successful, open the details panel
        setSelectedBuilding(buildingType);
      }
    } catch (error) {
      console.error(`Error building ${buildingType}:`, error);
      consoleService.error(`Error building ${buildingType}.`);
    } finally {
      // Clear loading state
      setIsBuilding({
        ...isBuilding,
        [buildingType]: false
      });
    }
  };
  
  // Handle building upgrade
  const handleUpgrade = async (buildingType: BuildingType) => {
    // Set loading state
    setIsUpgrading({
      ...isUpgrading,
      [buildingType]: true
    });
    
    try {
      await upgradeBuilding(buildingType);
    } catch (error) {
      console.error(`Error upgrading ${buildingType}:`, error);
      consoleService.error(`Error upgrading ${buildingType}.`);
    } finally {
      // Clear loading state
      setIsUpgrading({
        ...isUpgrading,
        [buildingType]: false
      });
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Buildings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="grid grid-cols-1 gap-4">
            {/* Building Cards */}
            {Object.values(BuildingType).map((buildingType) => {
              const buildingConfig = BUILDING_CONFIG[buildingType];
              const existingBuilding = buildings.find(b => b.name === buildingType);
              
              // Building level and capacity
              const level = existingBuilding?.level || 0;
              let capacity = 0;
              let usedCapacity = 0;
              
              if (existingBuilding) {
                const buildingInstance = deserializeBuilding(existingBuilding);
                capacity = buildingInstance.calculateCapacity();
                usedCapacity = buildingInstance.slots.filter(s => s.tools.length > 0).length;
              }
              
              // Calculate costs
              const buildCost = buildingConfig.baseCost;
              const upgradeCost = existingBuilding ? 
                deserializeBuilding(existingBuilding).getUpgradeCost() : 0;
              
              // Check if player can afford
              const canAffordBuild = playerMoney >= buildCost;
              const canAffordUpgrade = playerMoney >= upgradeCost;
              
              return (
                <Card 
                  key={buildingType}
                  className={`${existingBuilding ? "border-green-500" : "border-gray-300"} ${existingBuilding ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
                  onClick={() => existingBuilding && setSelectedBuilding(buildingType)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 bg-contain bg-center bg-no-repeat mr-4" 
                        style={{ backgroundImage: `url(${buildingConfig.icon})` }}
                      />
                      <div>
                        <CardTitle>{buildingType}</CardTitle>
                        <CardDescription>{buildingConfig.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={existingBuilding ? "text-green-600 font-medium" : "text-gray-500"}>
                          {existingBuilding ? "Operational" : "Not Built"}
                        </span>
                      </div>
                      
                      {existingBuilding && (
                        <>
                          <div className="flex justify-between">
                            <span>Level:</span>
                            <span className="font-medium">{level}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Capacity:</span>
                            <span className="font-medium">{usedCapacity} / {capacity} slots</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Upgrade Cost:</span>
                            <span className="font-medium">€{formatNumber(upgradeCost)}</span>
                          </div>
                        </>
                      )}
                      
                      {!existingBuilding && (
                        <div className="flex justify-between">
                          <span>Build Cost:</span>
                          <span className="font-medium">€{formatNumber(buildCost)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2">
                    {!existingBuilding ? (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleBuild(buildingType);
                        }}
                        disabled={!canAffordBuild || isBuilding[buildingType]}
                        className="w-full"
                      >
                        {isBuilding[buildingType] ? "Building..." : "Build"}
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleUpgrade(buildingType);
                          }}
                          disabled={!canAffordUpgrade || isUpgrading[buildingType]}
                          className="flex-1"
                        >
                          {isUpgrading[buildingType] ? "Upgrading..." : "Upgrade"}
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
        
        {/* Building Details Panel */}
        <div>
          {selectedBuilding ? (
            <BuildingDetailsPanel 
              buildingType={selectedBuilding} 
              onClose={() => setSelectedBuilding(null)}
            />
          ) : (
            <Card className="h-full flex items-center justify-center p-8 text-center">
              <div>
                <h3 className="text-lg font-medium mb-2">Building Management</h3>
                <p className="text-gray-500">
                  Select a building to manage its tools and equipment.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildingsView; 