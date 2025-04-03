import React, { useState } from 'react';
import staffService, { 
  StaffSearchOptions, 
  getSkillLevelInfo, 
  SpecializedRoles,
  calculateSearchCost,
  calculateWage,
  generateStaffCandidates,
  StaffSkills
} from '../services/staffService';
import { updatePlayerMoney, getGameState, Staff } from '../gameState';

interface StaffSearchProps {
  onClose: () => void;
}

const StaffSearch: React.FC<StaffSearchProps> = ({ onClose }) => {
  const [searchOptions, setSearchOptions] = useState<StaffSearchOptions>({
    numberOfCandidates: 3,
    skillLevel: 0.3,
    specializations: [],
  });
  
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const { player } = getGameState();
  const searchCost = calculateSearchCost(searchOptions);
  
  const handleSearch = () => {
    if (!player) return;
    
    // Check if player has enough money
    if (player.money < searchCost) {
      alert('You do not have enough money for this search.');
      return;
    }
    
    // Deduct the search cost
    updatePlayerMoney(-searchCost);
    
    // Set searching state
    setSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      // Generate staff candidates
      const candidates = generateStaffCandidates(searchOptions);
      setSearchResults(candidates);
      setSearching(false);
    }, 1000);
  };
  
  const handleHire = (staff: any) => {
    if (!player) return;
    
    // Check if player has enough money for first month's wage
    if (player.money < staff.wage) {
      alert('You do not have enough money to pay the first month\'s wage.');
      return;
    }
    
    // Hire the staff member
    staffService.addStaff(staff, true);
    
    // Deduct the first month's wage
    updatePlayerMoney(-staff.wage);
    
    // Close the search modal
    onClose();
  };
  
  const handleSkillChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setSearchOptions(prev => ({
      ...prev,
      skillLevel: value
    }));
  };
  
  const handleCandidatesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value);
    setSearchOptions(prev => ({
      ...prev,
      numberOfCandidates: value
    }));
  };
  
  const handleSpecializationToggle = (specId: string) => {
    setSearchOptions(prev => {
      const exists = prev.specializations.includes(specId);
      
      if (exists) {
        return {
          ...prev,
          specializations: prev.specializations.filter(id => id !== specId)
        };
      } else {
        return {
          ...prev,
          specializations: [...prev.specializations, specId]
        };
      }
    });
  };
  
  const currentSkillInfo = getSkillLevelInfo(searchOptions.skillLevel);
  
  return (
    <div className="w-full max-h-[80vh] overflow-y-auto">
      {!searchResults.length ? (
        <>
          <h2 className="text-xl font-semibold mb-6">Staff Search</h2>
          
          {/* Search Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Search Parameters</h3>
              
              {/* Candidates Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Number of Candidates
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={searchOptions.numberOfCandidates}
                  onChange={handleCandidatesChange}
                >
                  <option value={1}>1 Candidate</option>
                  <option value={3}>3 Candidates</option>
                  <option value={5}>5 Candidates</option>
                  <option value={8}>8 Candidates</option>
                </select>
              </div>
              
              {/* Skill Level Slider */}
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <label className="block text-sm font-medium">
                    Minimum Skill Level
                  </label>
                  <span className="text-sm font-medium">
                    {currentSkillInfo.formattedName}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={searchOptions.skillLevel}
                  onChange={handleSkillChange}
                  className="w-full"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Fresh Off the Vine (10%)</span>
                  <span className="text-sm">Living Legend (100%)</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Specializations</h3>
              <p className="text-sm text-gray-600 mb-3">
                Select specialized roles to search for specific expertise. Each specialization increases search cost.
              </p>
              
              <div className="space-y-2">
                {Object.values(SpecializedRoles).map(role => (
                  <div key={role.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`spec-${role.id}`}
                      checked={searchOptions.specializations.includes(role.id)}
                      onChange={() => handleSpecializationToggle(role.id)}
                      className="mr-2"
                    />
                    <label htmlFor={`spec-${role.id}`} className="text-sm">
                      <span className="font-medium">{role.title}</span> - {role.description}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Search Cost Summary */}
          <div className="bg-gray-50 p-4 rounded mb-6">
            <h3 className="text-lg font-medium mb-2">Search Costs</h3>
            <p className="mb-2">
              <span className="font-medium">Search Fee:</span> ${searchCost.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mb-3">
              This is a one-time fee paid to the recruitment agency.
            </p>
            
            <p className="mb-2">
              <span className="font-medium">Expected Monthly Wage Range:</span> $
              {Math.round(calculateWage({ field: 0, winery: 0, administration: 0, sales: 0, maintenance: 0 }, null) * searchOptions.skillLevel).toLocaleString()} 
              - $
              {Math.round(calculateWage({ field: 1, winery: 1, administration: 1, sales: 1, maintenance: 1 }, searchOptions.specializations[0] ?? null) * searchOptions.skillLevel * 1.5).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Monthly wages will vary based on actual skills and specializations.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={`bg-wine text-white px-4 py-2 rounded ${
                (!player || player.money < searchCost) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-wine-dark'
              }`}
              onClick={handleSearch}
              disabled={!player || player.money < searchCost}
            >
              Start Search (${searchCost.toLocaleString()})
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <p className="mb-6">
            Your search found {searchResults.length} potential candidates. Review their profiles and hire the best fit for your winery.
          </p>
          
          <div className="space-y-6">
            {searchResults.map(candidate => (
              <div key={candidate.id} className="border rounded p-4 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <h3 className="text-lg font-medium">{candidate.name}</h3>
                  <span className="text-wine font-medium">${candidate.wage}/mo</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm"><span className="font-medium">Nationality:</span> {candidate.nationality}</p>
                    <p className="text-sm">
                      <span className="font-medium">Specialization:</span> {
                        candidate.specialization ? 
                        SpecializedRoles[candidate.specialization].title : 
                        'None'
                      }
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Skill Level:</span> {getSkillLevelInfo(candidate.skillLevel).formattedName}
                    </p>
                  </div>
                  
                  {candidate.skills && (
                    <div className="flex flex-col justify-center">
                      <div className="text-xs grid grid-cols-5 gap-1">
                        <div className="text-center">
                          <div className="font-medium mb-1">Field</div>
                          <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                            <div 
                              className="bg-wine rounded-full w-4 absolute bottom-0" 
                              style={{ height: `${candidate.skills.field * 100}%` }}
                            ></div>
                          </div>
                          <div className="mt-1">{Math.round(candidate.skills.field * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium mb-1">Winery</div>
                          <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                            <div 
                              className="bg-wine rounded-full w-4 absolute bottom-0" 
                              style={{ height: `${candidate.skills.winery * 100}%` }}
                            ></div>
                          </div>
                          <div className="mt-1">{Math.round(candidate.skills.winery * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium mb-1">Admin</div>
                          <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                            <div 
                              className="bg-wine rounded-full w-4 absolute bottom-0" 
                              style={{ height: `${candidate.skills.administration * 100}%` }}
                            ></div>
                          </div>
                          <div className="mt-1">{Math.round(candidate.skills.administration * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium mb-1">Sales</div>
                          <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                            <div 
                              className="bg-wine rounded-full w-4 absolute bottom-0" 
                              style={{ height: `${candidate.skills.sales * 100}%` }}
                            ></div>
                          </div>
                          <div className="mt-1">{Math.round(candidate.skills.sales * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium mb-1">Maint</div>
                          <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                            <div 
                              className="bg-wine rounded-full w-4 absolute bottom-0" 
                              style={{ height: `${candidate.skills.maintenance * 100}%` }}
                            ></div>
                          </div>
                          <div className="mt-1">{Math.round(candidate.skills.maintenance * 100)}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <button
                    className={`bg-wine text-white px-4 py-2 rounded ${
                      (!player || player.money < candidate.wage) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-wine-dark'
                    }`}
                    onClick={() => handleHire(candidate)}
                    disabled={!player || player.money < candidate.wage}
                  >
                    Hire (${candidate.wage}/mo)
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <button
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              onClick={() => {
                setSearchResults([]);
              }}
            >
              Back to Search Options
            </button>
          </div>
        </>
      )}
      
      {/* Loading state during search */}
      {searching && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-wine mx-auto"></div>
            </div>
            <p className="text-lg">Searching for candidates...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSearch; 