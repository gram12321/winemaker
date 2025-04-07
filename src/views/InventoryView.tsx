import React, { useState, useEffect } from 'react';
import { getGameState, WineBatch } from '../gameState';
import { useDisplayUpdate } from '../lib/game/displayManager';
import { consoleService } from '../components/layout/Console';
import { formatGameDate, GameDate } from '../lib/core/constants';

const InventoryView: React.FC = () => {
  useDisplayUpdate();
  
  const gameState = getGameState();
  const { wineBatches } = gameState;
  
  // Filter for different stages
  const grapes = wineBatches.filter(batch => batch.stage === 'grape');
  const musts = wineBatches.filter(batch => batch.stage === 'must');
  const fermenting = wineBatches.filter(batch => batch.stage === 'fermentation');
  const aging = wineBatches.filter(batch => batch.stage === 'aging');
  const bottled = wineBatches.filter(batch => batch.stage === 'bottled');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'all' | 'grape' | 'must' | 'fermentation' | 'aging' | 'bottled'>('all');
  
  // Handle batch selection
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const selectedBatch = selectedBatchId 
    ? wineBatches.find(b => b.id === selectedBatchId) 
    : null;
  
  // Quality formatting helper
  const formatQuality = (quality: number) => {
    return `${(quality * 100).toFixed(0)}%`;
  };
  
  // CSS class for quality colors
  const getQualityClass = (quality: number) => {
    if (quality >= 0.9) return 'text-purple-600 font-bold';
    if (quality >= 0.8) return 'text-blue-600 font-bold';
    if (quality >= 0.7) return 'text-green-600';
    if (quality >= 0.6) return 'text-yellow-600';
    if (quality >= 0.5) return 'text-orange-600';
    return 'text-red-600';
  };
  
  // Format the quantity
  const formatQuantity = (quantity: number, stage: string) => {
    if (stage === 'bottled') {
      return `${Math.round(quantity)} bottles`;
    }
    return quantity >= 1000 
      ? `${(quantity / 1000).toFixed(2)} tonnes` 
      : `${Math.round(quantity)} kg`;
  };
  
  // Add this helper function near the other formatting helpers
  const formatStorageLocations = (storageLocations: { locationId: string; quantity: number }[]) => {
    if (!storageLocations || storageLocations.length === 0) return 'No storage';
    
    return storageLocations.map(loc => 
      `${loc.locationId} (${Math.ceil(loc.quantity)} kg)`
    ).join(', ');
  };
  
  // Add formatHarvestDate helper function at the top with other formatting helpers
  const formatHarvestDate = (batch: WineBatch) => {
    if (batch.harvestDateRange) {
      const { first, last } = batch.harvestDateRange;
      if (first.year === last.year && first.season === last.season && first.week === last.week) {
        return formatGameDate(first);
      }
      return `${formatGameDate(first)} to ${formatGameDate(last)}`;
    }
    
    // Safe extraction of date for display
    if (Array.isArray(batch.harvestGameDate)) {
      // If it's an array, take the first date
      return batch.harvestGameDate.length > 0 ? formatGameDate(batch.harvestGameDate[0]) : 'Unknown';
    }
    
    // If it's a single date
    return formatGameDate(batch.harvestGameDate);
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
      </div>
      
      {/* Tabs for filtering */}
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'grape' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('grape')}
        >
          Warehouse ({grapes.length})
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'must' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('must')}
        >
          Winery ({musts.length + fermenting.length})
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'aging' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('aging')}
        >
          Aging ({aging.length})
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'bottled' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('bottled')}
        >
          Cellar ({bottled.length})
        </button>
      </div>
      
      {/* Inventory Sections */}
      <div className="grid grid-cols-1 gap-6">
        {/* Warehouse Section - Grapes */}
        {(activeTab === 'all' || activeTab === 'grape') && grapes.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-green-600 text-white px-4 py-2 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Warehouse - Grapes</h2>
              <span className="bg-white text-green-600 px-2 py-1 rounded text-sm font-medium">
                Total: {grapes.reduce((sum, batch) => sum + batch.quantity, 0).toFixed(0)} kg
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grape</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ripeness</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grapes.map(batch => (
                    <tr 
                      key={batch.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedBatchId(batch.id)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">{formatStorageLocations(batch.storageLocations)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{batch.grapeType}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatQuantity(batch.quantity, batch.stage)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={getQualityClass(batch.quality)}>
                          {formatQuality(batch.quality)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatHarvestDate(batch)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={getQualityClass(batch.ripeness)}>
                          {formatQuality(batch.ripeness)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button 
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            consoleService.info(`Selected ${batch.grapeType} batch for crushing`);
                            // Future: Add crushing functionality
                          }}
                        >
                          Crush
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            consoleService.info(`Sell functionality not implemented yet`);
                            // Future: Add sell functionality
                          }}
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Winery Section - Must */}
        {(activeTab === 'all' || activeTab === 'must') && (musts.length > 0 || fermenting.length > 0) && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-amber-600 text-white px-4 py-2 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Winery - Must & Fermentation</h2>
              <span className="bg-white text-amber-600 px-2 py-1 rounded text-sm font-medium">
                Total: {[...musts, ...fermenting].reduce((sum, batch) => sum + batch.quantity, 0).toFixed(0)} liters
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grape</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...musts, ...fermenting].map(batch => (
                    <tr 
                      key={batch.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedBatchId(batch.id)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">{formatStorageLocations(batch.storageLocations)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{batch.grapeType}</td>
                      <td className="px-4 py-2 whitespace-nowrap capitalize">{batch.stage}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{batch.quantity.toFixed(0)} liters</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={getQualityClass(batch.quality)}>
                          {formatQuality(batch.quality)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {batch.stage === 'must' && (
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              consoleService.info(`Selected ${batch.grapeType} must for fermentation`);
                              // Future: Add fermentation functionality
                            }}
                          >
                            Ferment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aging Section */}
        {(activeTab === 'all' || activeTab === 'aging') && aging.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-orange-600 text-white px-4 py-2 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Aging Cellar</h2>
              <span className="bg-white text-orange-600 px-2 py-1 rounded text-sm font-medium">
                Total: {aging.reduce((sum, batch) => sum + batch.quantity, 0).toFixed(0)} liters
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grape</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aging Start</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {aging.map(batch => (
                    <tr 
                      key={batch.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedBatchId(batch.id)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">{formatStorageLocations(batch.storageLocations)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{batch.grapeType}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{batch.quantity.toFixed(0)} liters</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={getQualityClass(batch.quality)}>
                          {formatQuality(batch.quality)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {batch.ageingStartGameDate ? formatGameDate(batch.ageingStartGameDate) : 'N/A'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {batch.ageingDuration ? `${batch.ageingDuration} weeks` : 'N/A'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            consoleService.info(`Selected ${batch.grapeType} wine for bottling`);
                            // Future: Add bottling functionality
                          }}
                        >
                          Bottle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottled Section */}
        {(activeTab === 'all' || activeTab === 'bottled') && bottled.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Wine Cellar - Bottled</h2>
              <span className="bg-white text-red-600 px-2 py-1 rounded text-sm font-medium">
                Total: {bottled.reduce((sum, batch) => sum + batch.quantity, 0).toFixed(0)} bottles
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wine</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vintage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bottled.map(batch => (
                    <tr 
                      key={batch.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedBatchId(batch.id)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">{batch.grapeType}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{batch.quantity.toFixed(0)} bottles</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={getQualityClass(batch.quality)}>
                          {formatQuality(batch.quality)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {/* Safe extraction of vintage year */}
                        {Array.isArray(batch.harvestGameDate) 
                          ? batch.harvestGameDate[0]?.year 
                          : batch.harvestGameDate.year}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button 
                          className="text-green-600 hover:text-green-800 mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            consoleService.info(`Set price functionality not implemented yet`);
                            // Future: Add price setting functionality
                          }}
                        >
                          Set Price
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            consoleService.info(`Sell wine functionality not implemented yet`);
                            // Future: Add sell wine functionality
                          }}
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Batch Details Panel (shown when a batch is selected) */}
      {selectedBatch && (
        <div className="mt-6 bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">{selectedBatch.grapeType} - {selectedBatch.stage.charAt(0).toUpperCase() + selectedBatch.stage.slice(1)}</h2>
            <button 
              onClick={() => setSelectedBatchId(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Batch Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">ID:</div>
                <div>{selectedBatch.id}</div>
                
                <div className="text-gray-600">Grape Type:</div>
                <div>{selectedBatch.grapeType}</div>
                
                <div className="text-gray-600">Stage:</div>
                <div className="capitalize">{selectedBatch.stage}</div>
                
                <div className="text-gray-600">Quantity:</div>
                <div>{formatQuantity(selectedBatch.quantity, selectedBatch.stage)}</div>
                
                <div className="text-gray-600">Quality:</div>
                <div className={getQualityClass(selectedBatch.quality)}>
                  {formatQuality(selectedBatch.quality)}
                </div>
                
                <div className="text-gray-600">Harvest Date:</div>
                <div>{formatHarvestDate(selectedBatch)}</div>
                
                <div className="text-gray-600">Ripeness:</div>
                <div className={getQualityClass(selectedBatch.ripeness)}>
                  {formatQuality(selectedBatch.ripeness)}
                </div>
                
                <div className="text-gray-600">Storage Locations:</div>
                <div>{formatStorageLocations(selectedBatch.storageLocations)}</div>
                
                {selectedBatch.stage === 'aging' && (
                  <>
                    <div className="text-gray-600">Aging Start:</div>
                    <div>{selectedBatch.ageingStartGameDate ? formatGameDate(selectedBatch.ageingStartGameDate) : 'N/A'}</div>
                    
                    <div className="text-gray-600">Aging Duration:</div>
                    <div>{selectedBatch.ageingDuration ? `${selectedBatch.ageingDuration} weeks` : 'N/A'}</div>
                  </>
                )}
              </div>
            </div>
            
            {selectedBatch.characteristics && (
              <div>
                <h3 className="text-lg font-medium mb-2">Wine Characteristics</h3>
                <div className="space-y-3">
                  {Object.entries(selectedBatch.characteristics).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="capitalize">{key}:</span>
                        <span>{(value * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${value * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {wineBatches.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-center">
          <p className="text-amber-800">Your inventory is empty. Harvest some grapes to get started!</p>
        </div>
      )}
    </div>
  );
};

export default InventoryView; 