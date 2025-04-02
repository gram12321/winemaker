import React, { useState } from 'react';
import { getGameState } from '../gameState';
import { Vineyard } from '../lib/game/vineyard';
import { addVineyard, plantVineyard, harvestVineyard } from '../services/vineyardService';
import { consoleService } from '../components/layout/Console';
import { GameDate, formatGameDate, BASELINE_VINE_DENSITY } from '../lib/core/constants';
import { useDisplayUpdate } from '../lib/game/displayManager';
import displayManager from '../lib/game/displayManager';

const VineyardView: React.FC = () => {
  // Use display update hook to subscribe to game state changes
  useDisplayUpdate();
  
  const gameState = getGameState();
  const { vineyards, currentYear } = gameState;
  const [selectedVineyardId, setSelectedVineyardId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Get the selected vineyard from the current game state using the ID
  // This ensures we always have the latest vineyard data
  const selectedVineyard = selectedVineyardId 
    ? vineyards.find(v => v.id === selectedVineyardId) || null 
    : null;

  // Handle adding a new vineyard using the vineyard service
  const handleAddVineyard = async () => {
    setLoading(true);
    try {
      const newVineyard = await addVineyard(undefined, true);
      consoleService.info(`New vineyard "${newVineyard.name}" acquired in ${newVineyard.region}, ${newVineyard.country}.`);
      setSelectedVineyardId(newVineyard.id);
    } catch (error) {
      consoleService.error('Failed to add new vineyard.');
      console.error('Error adding vineyard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a vineyard
  const handleSelectVineyard = (vineyard: Vineyard) => {
    setSelectedVineyardId(vineyard.id);
  };

  // Handle planting a vineyard - using the displayManager's action handler
  const handlePlantVineyard = displayManager.createActionHandler(async () => {
    if (!selectedVineyardId) return;
    
    setLoading(true);
    try {
      // In a real implementation, we would have a modal/form to select grape type and density
      // For now, let's use a fixed grape type and density
      const grape = "Chardonnay";
      const density = BASELINE_VINE_DENSITY;
      
      const updatedVineyard = await plantVineyard(selectedVineyardId, grape, density, true);
      
      if (updatedVineyard) {
        consoleService.info(`${grape} planted in ${updatedVineyard.name} with a density of ${density} vines per acre.`);
      } else {
        consoleService.error('Failed to plant vineyard.');
      }
    } catch (error) {
      consoleService.error('Error planting vineyard.');
      console.error('Error planting vineyard:', error);
    } finally {
      setLoading(false);
    }
  });

  // Handle harvesting a vineyard - using the displayManager's action handler
  const handleHarvestVineyard = displayManager.createActionHandler(async () => {
    if (!selectedVineyardId) return;
    
    setLoading(true);
    try {
      // Harvest the full yield (amount = Infinity will harvest everything available)
      const result = await harvestVineyard(selectedVineyardId, Infinity, true);
      
      if (result) {
        const { vineyard, harvestedAmount } = result;
        consoleService.info(`Harvested ${Math.round(harvestedAmount).toLocaleString()} kg of ${vineyard.grape} grapes from ${vineyard.name}.`);
      } else {
        consoleService.error('Failed to harvest vineyard.');
      }
    } catch (error) {
      consoleService.error('Error harvesting vineyard.');
      console.error('Error harvesting vineyard:', error);
    } finally {
      setLoading(false);
    }
  });

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
                      <span className="font-medium">Altitude:</span> {vineyard.altitude}m
                    </div>
                    <div>
                      <span className="font-medium">Aspect:</span> {vineyard.aspect}
                    </div>
                    <div>
                      <span className="font-medium">Prestige:</span> {(vineyard.vineyardPrestige * 100).toFixed(0)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="font-medium">Status:</span>{' '}
                    <span className={vineyard.grape ? 'text-green-600' : 'text-amber-600'}>
                      {vineyard.grape ? `Planted with ${vineyard.grape}` : vineyard.status}
                    </span>
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
                  <li><span className="font-medium">Expected Yield:</span> {selectedVineyard.status === 'Harvested' ? '0 kg (Harvested)' : `${Math.round(selectedVineyard.remainingYield || 0).toLocaleString()} kg`}</li>
                </ul>
              ) : (
                <div className="text-amber-600">
                  This vineyard hasn't been planted yet. You need to plant grape varieties to start wine production.
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
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-600">Prestige</div>
                <div className="text-lg font-semibold">{(selectedVineyard.vineyardPrestige * 100).toFixed(0)}/100</div>
              </div>
              <div className="bg-amber-50 p-3 rounded">
                <div className="text-sm text-gray-600">Annual Yield Factor</div>
                <div className="text-lg font-semibold">{(selectedVineyard.annualYieldFactor * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-sm text-gray-600">Quality Factor</div>
                <div className="text-lg font-semibold">{(selectedVineyard.annualQualityFactor * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 mt-6">
            {!selectedVineyard.grape && (
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                onClick={handlePlantVineyard}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Plant Vineyard'}
              </button>
            )}
            {selectedVineyard.grape && selectedVineyard.status !== 'Harvested' && (
              <button 
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded"
                onClick={handleHarvestVineyard}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Harvest Grapes'}
              </button>
            )}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Manage Vineyard
            </button>
            <button
              onClick={() => setSelectedVineyardId(null)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VineyardView; 