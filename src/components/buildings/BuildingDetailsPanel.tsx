import React, { useState } from 'react';
import { BuildingType, ToolCategory, TOOL_CATEGORY_NAMES } from '@/lib/core/constants';
import { getToolsForBuilding} from '@/lib/game/building';
import {
  loadBuildings,
  deserializeBuilding,
  serializeBuilding,
  getBuildingByName
} from '@/lib/database/buildingDB';
import {
  upgradeBuilding,
  addToolToBuilding,
  sellToolFromBuilding
} from '@/services/buildingService';
import { getGameState } from '@/gameState';
import { useDisplayUpdate } from '@/lib/game/displayManager';
import { consoleService } from '@/components/layout/Console';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface BuildingDetailsPanelProps {
  buildingType: BuildingType;
  onClose: () => void;
}

const BuildingDetailsPanel: React.FC<BuildingDetailsPanelProps> = ({ 
  buildingType, 
  onClose 
}) => {
  useDisplayUpdate(); // Register for game state updates
  
  const gameState = getGameState();
  const serializedBuilding = getBuildingByName(buildingType);
  const playerMoney = gameState.player?.money || 0;
  
  // Default to the "tools" tab
  const [activeTab, setActiveTab] = useState<'tools' | 'slots'>('tools');
  
  // Loading state for purchasing tools
  const [isBuying, setIsBuying] = useState<Record<string, boolean>>({});
  const [isSelling, setIsSelling] = useState<Record<string, boolean>>({});
  
  // If building doesn't exist, show an error
  if (!serializedBuilding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Building not found</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onClose}>Close</Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Create a Building instance from the serialized data
  const building = deserializeBuilding(serializedBuilding);
  
  // Get available tools for this building
  const availableTools = getToolsForBuilding(buildingType);
  
  // Group tools by category
  const toolsByCategory: Record<ToolCategory, typeof availableTools> = {} as Record<ToolCategory, typeof availableTools>;
  
  // Initialize all categories
  Object.values(ToolCategory).forEach(category => {
    toolsByCategory[category] = [];
  });
  
  // Group tools into their categories
  availableTools.forEach(tool => {
    // If tool has multiple categories, put it in each
    tool.validTasks.forEach(category => {
      toolsByCategory[category].push(tool);
    });
    
    // Add general tools (with multiple tasks) to General category
    if (tool.validTasks.length > 1 && !toolsByCategory[ToolCategory.GENERAL].includes(tool)) {
      toolsByCategory[ToolCategory.GENERAL].push(tool);
    }
  });
  
  // Function to handle tool purchase
  const handleBuyTool = async (toolName: string) => {
    setIsBuying({ ...isBuying, [toolName]: true });
    
    try {
      const success = await addToolToBuilding(buildingType, toolName);
      
      if (!success) {
        consoleService.error(`Failed to add ${toolName} to ${buildingType}.`);
      }
    } catch (error) {
      console.error(`Error adding tool ${toolName}:`, error);
      consoleService.error(`Error adding ${toolName} to ${buildingType}.`);
    } finally {
      setIsBuying({ ...isBuying, [toolName]: false });
    }
  };
  
  // Function to handle tool selling
  const handleSellTool = async (slotIndex: number) => {
    const slotId = building.slots[slotIndex].id;
    setIsSelling({ ...isSelling, [slotId]: true });
    
    try {
      const success = await sellToolFromBuilding(buildingType, slotIndex);
      
      if (!success) {
        consoleService.error(`Failed to sell tool from ${buildingType}.`);
      }
    } catch (error) {
      console.error(`Error selling tool from slot ${slotIndex}:`, error);
      consoleService.error(`Error selling tool from ${buildingType}.`);
    } finally {
      setIsSelling({ ...isSelling, [slotId]: false });
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return `€${amount.toLocaleString()}`;
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{buildingType}</CardTitle>
            <CardDescription>
              Level {building.level} &bull; {building.slots.filter((s: any) => s.tools.length > 0).length} / {building.calculateCapacity()} slots used
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'tools' | 'slots')}>
          <TabsList className="w-full">
            <TabsTrigger value="tools" className="flex-1">Available Tools</TabsTrigger>
            <TabsTrigger value="slots" className="flex-1">Building Slots</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-4 mt-4">
            <div className="text-sm text-gray-500">
              Select tools to purchase for this building. Each tool provides different bonuses or capabilities.
            </div>
            
            <Accordion type="multiple" className="w-full">
              {/* Tool Categories */}
              {Object.entries(toolsByCategory).map(([category, tools]) => {
                // Skip empty categories
                if (tools.length === 0) return null;
                
                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-base font-medium">
                      {TOOL_CATEGORY_NAMES[category as ToolCategory]}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-3">
                        {tools.map((tool) => (
                          <div 
                            key={tool.name} 
                            className="border rounded-md p-3 hover:bg-gray-50"
                          >
                            <div className="flex justify-between mb-2">
                              <h4 className="font-medium text-sm">{tool.name}</h4>
                              <Badge variant={tool.toolType === 'manual' ? "outline" : "secondary"}>
                                {tool.toolType}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Cost:</span>
                                <span>{formatCurrency(tool.cost)}</span>
                              </div>
                              
                              {tool.speedBonus !== 1.0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Speed Bonus:</span>
                                  <span>+{((tool.speedBonus - 1) * 100).toFixed(0)}%</span>
                                </div>
                              )}
                              
                              {tool.capacity > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Capacity:</span>
                                  <span>{tool.capacity.toLocaleString()} kg</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between">
                                <span className="text-gray-500">Weight:</span>
                                <span>{tool.weight} units</span>
                              </div>
                              
                              {tool.supportedResources.length > 0 && (
                                <div className="flex justify-between col-span-2">
                                  <span className="text-gray-500">Stores:</span>
                                  <span>{tool.supportedResources.join(', ')}</span>
                                </div>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handleBuyTool(tool.name)}
                              disabled={
                                playerMoney < tool.cost || 
                                isBuying[tool.name] ||
                                building.slots.every((s: any) => s.currentWeight + tool.weight > building.slotWeightCapacity)
                              }
                              className="w-full"
                            >
                              {isBuying[tool.name] ? "Purchasing..." : `Buy (${formatCurrency(tool.cost)})`}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>
          
          <TabsContent value="slots" className="space-y-4 mt-4">
            <div className="text-sm text-gray-500 mb-4">
              View and manage tools installed in this building. Selling tools returns 50% of the original cost.
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {building.slots.map((slot: any, index: number) => {
                // Get the first tool for display purposes
                const firstTool = slot.tools[0];
                const isEmpty = !firstTool;
                
                return (
                  <Card 
                    key={slot.id} 
                    className={isEmpty ? "border-dashed border-gray-300" : ""}
                  >
                    <CardHeader className="p-3 pb-0">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">
                          Slot {index + 1}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {slot.currentWeight} / {building.slotWeightCapacity} units
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 pt-2">
                      {isEmpty ? (
                        <div className="h-16 flex items-center justify-center text-gray-400 text-sm">
                          Empty slot
                        </div>
                      ) : (
                        <div>
                          <div className="text-base font-medium">
                            {firstTool.name}
                            {slot.tools.length > 1 && (
                              <span className="text-sm font-normal text-gray-500 ml-1">
                                ({slot.tools.length}x)
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-1 mt-1">
                            {firstTool.speedBonus > 1 && (
                              <div>Speed: +{((firstTool.speedBonus - 1) * 100).toFixed(0)}%</div>
                            )}
                            
                            {firstTool.capacity > 0 && (
                              <div>Storage: {firstTool.capacity.toLocaleString()} kg</div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    
                    {!isEmpty && (
                      <CardFooter className="p-3 pt-0">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleSellTool(index)}
                          disabled={isSelling[slot.id]}
                          className="w-full text-xs"
                        >
                          {isSelling[slot.id] ? "Selling..." : "Sell Tool"}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BuildingDetailsPanel; 