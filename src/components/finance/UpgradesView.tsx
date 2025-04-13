import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGameState } from '@/gameState';
import { formatCurrency } from '@/lib/core/utils/formatUtils';
import { getUpgrades, startUpgrade, Upgrade, categorizeUpgrades } from '../../services/upgradeService';
import { Vineyard } from '@/lib/game/vineyard';
import { consoleService } from '@/components/layout/Console';
import { UpgradeActivityList } from './UpgradeActivityList';
import { useDisplayUpdate } from '@/lib/game/displayManager';

export function UpgradesView() {
  useDisplayUpdate();
  
  const gameState = getGameState();
  const { vineyards, player } = gameState;
  
  const [categorizedUpgrades, setCategorizedUpgrades] = useState<{
    research: Upgrade[];
    projects: Upgrade[];
    upgrades: Upgrade[];
  }>({ research: [], projects: [], upgrades: [] });
  
  const [selectedVineyards, setSelectedVineyards] = useState<Record<number, string>>({});

  useEffect(() => {
    const allUpgrades = getUpgrades();
    const categorized = categorizeUpgrades(allUpgrades);
    setCategorizedUpgrades(categorized);
  }, []);

  const handleStartUpgrade = (upgradeId: number) => {
    const upgrade = [...categorizedUpgrades.research, ...categorizedUpgrades.projects, ...categorizedUpgrades.upgrades]
      .find(u => u.id === upgradeId);
      
    if (!upgrade || !player) {
      consoleService.error("Upgrade or player not found.");
      return;
    }
    
    if (player.money < upgrade.requirements.money) {
      consoleService.error("Not enough money to start this upgrade.");
      return;
    }
    
    if (upgrade.applicableTo === 'farmland') {
      const vineyardId = selectedVineyards[upgradeId];
      if (!vineyardId) {
        consoleService.error("Please select a vineyard.");
        return;
      }
      const vineyard = vineyards.find(v => v.id === vineyardId);
      if (!vineyard) {
        consoleService.error("Selected vineyard not found.");
        return;
      }
      startUpgrade(upgradeId, vineyard);
    } else {
      startUpgrade(upgradeId);
    }
    
    // Refresh immediately after starting
    const updatedAllUpgrades = getUpgrades();
    const updatedCategorized = categorizeUpgrades(updatedAllUpgrades);
    setCategorizedUpgrades(updatedCategorized);
  };

  const handleVineyardSelect = (upgradeId: number, vineyardId: string) => {
    setSelectedVineyards(prev => ({ ...prev, [upgradeId]: vineyardId }));
  };

  const renderUpgradesList = (upgrades: Upgrade[], title: string) => (
    <div className="border border-wine/30 rounded-md p-4 bg-gray-50/50 min-h-[200px]">
      <h2 className="text-xl font-semibold text-wine mb-4 border-b border-wine/20 pb-2">{title}</h2>
      <div className="space-y-4">
        {upgrades.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No items available.</p>
        ) : (
          upgrades.map(upgrade => {
            const canAfford = player && player.money >= upgrade.requirements.money;
            const isCompleted = upgrade.completed;
            const eligibleVineyards = upgrade.applicableTo === 'farmland' 
              ? vineyards.filter(v => !v.upgrades || !v.upgrades.includes(upgrade.id.toString()))
              : [];
            const hasEligibleVineyards = eligibleVineyards.length > 0;
            const canStart = canAfford && !isCompleted && (upgrade.applicableTo !== 'farmland' || hasEligibleVineyards);
            
            return (
              <div key={upgrade.id} className="border border-wine/20 rounded-md p-3 bg-white shadow-sm">
                <h3 className="font-semibold text-wine-dark text-base">{upgrade.name}</h3>
                <p className="text-xs text-gray-600 mt-1 mb-2">{upgrade.description}</p>
                
                <div className="text-xs space-y-1 mb-2">
                  <p><span className="font-medium">Benefits:</span> {upgrade.benefitsDescription}</p>
                  <p><span className="font-medium">Cost:</span> {formatCurrency(upgrade.requirements.money)}</p>
                </div>
                
                {upgrade.applicableTo === 'farmland' && !isCompleted && (
                  <div className="mb-2">
                    {hasEligibleVineyards ? (
                      <Select onValueChange={(value) => handleVineyardSelect(upgrade.id, value)} value={selectedVineyards[upgrade.id] || ""}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="Select Vineyard" />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleVineyards.map(vineyard => (
                            <SelectItem key={vineyard.id} value={vineyard.id} className="text-xs">
                              {vineyard.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-orange-600 italic">No eligible vineyards</p>
                    )}
                  </div>
                )}
                
                <Button 
                  variant={isCompleted ? "secondary" : canStart ? "default" : "outline"} 
                  size="sm" 
                  disabled={!canStart}
                  onClick={() => handleStartUpgrade(upgrade.id)}
                  className="w-full h-8 text-xs bg-wine hover:bg-wine-dark disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed"
                >
                  {isCompleted 
                    ? "Completed" 
                    : !canAfford 
                      ? "Not Enough Funds" 
                      : upgrade.applicableTo === 'farmland' && !hasEligibleVineyards
                        ? "No Eligible Vineyards"
                        : upgrade.applicableTo === 'farmland' && !selectedVineyards[upgrade.id]
                          ? "Select a Vineyard"
                          : "Start Upgrade"
                  }
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <UpgradeActivityList />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderUpgradesList(categorizedUpgrades.research, "Research")}
        {renderUpgradesList(categorizedUpgrades.projects, "Projects")}
        {renderUpgradesList(categorizedUpgrades.upgrades, "Upgrades")}
      </div>
    </div>
  );
} 