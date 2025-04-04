import React from 'react';
import staffService, { 
  StaffSearchOptions, 
  getSkillLevelInfo, 
  SpecializedRoles,
  calculateSearchCost,
  calculateWage,
  generateStaffCandidates,
  Staff as ServiceStaff
} from '../../services/staffService';
import { updatePlayerMoney, getGameState } from '../../gameState';

interface StaffSearchProps {
  onClose: () => void;
  searchOptions: StaffSearchOptions;
  onSearchOptionsChange: (options: StaffSearchOptions) => void;
  searchResults: ServiceStaff[];
  onSearchResultsChange: (results: ServiceStaff[]) => void;
  isSearching: boolean;
  onSearchingChange: (isSearching: boolean) => void;
}

const StaffSearch: React.FC<StaffSearchProps> = ({
  onClose,
  searchOptions,
  onSearchOptionsChange,
  searchResults,
  onSearchResultsChange,
  isSearching,
  onSearchingChange,
}) => {
  const { player } = getGameState();
  const searchCost = calculateSearchCost(searchOptions);
  
  const handleSearch = async () => {
    if (!player) return;
    
    // Check if player has enough money
    if (player.money < searchCost) {
      alert('You do not have enough money for this search.');
      return;
    }
    
    // Deduct the search cost
    updatePlayerMoney(-searchCost);
    
    // Set searching state
    onSearchingChange(true);
    
    try {
      // Call generateStaffCandidates with the searchOptions object
      const candidates = await generateStaffCandidates(searchOptions);
      onSearchResultsChange(candidates);
    } catch (error) {
      console.error('Error generating staff candidates:', error);
    } finally {
      onSearchingChange(false);
    }
  };
  
  const handleHire = async (staff: ServiceStaff) => {
    if (!player) return;
    
    // Check if player has enough money for first month's wage
    if (player.money < staff.wage) {
      alert('You do not have enough money to pay the first month\'s wage.');
      return;
    }
    
    // Hire the staff member
    await staffService.addStaff(staff, true);
    
    // Deduct the first month's wage
    updatePlayerMoney(-staff.wage);
    
    // Close the search modal
    onClose();
    
    // Update search results
    onSearchResultsChange(searchResults.filter(s => s.id !== staff.id));
  };
  
  const handleSkillChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchOptionsChange({
      ...searchOptions,
      skillLevel: parseFloat(event.target.value)
    });
  };
  
  const handleCandidatesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSearchOptionsChange({
      ...searchOptions,
      numberOfCandidates: parseInt(event.target.value, 10)
    });
  };
  
  const handleSpecializationToggle = (specialization: string) => {
    const specializations = searchOptions.specializations.includes(specialization)
      ? searchOptions.specializations.filter(s => s !== specialization)
      : [...searchOptions.specializations, specialization];
    
    onSearchOptionsChange({
      ...searchOptions,
      specializations,
    });
  };
  
  const currentSkillInfo = getSkillLevelInfo(searchOptions.skillLevel);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Staff Search</h2>
        <button
          className="text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="w-full max-h-[80vh] overflow-y-auto">
        {!searchResults.length ? (
          <SearchForm
            searchOptions={searchOptions}
            currentSkillInfo={currentSkillInfo}
            searchCost={searchCost}
            player={player}
            onClose={onClose}
            onSearch={handleSearch}
            onSkillChange={handleSkillChange}
            onCandidatesChange={handleCandidatesChange}
            onSpecializationToggle={handleSpecializationToggle}
          />
        ) : (
          <SearchResults
            searchResults={searchResults}
            player={player}
            onClose={onClose}
            onBack={() => onSearchResultsChange([])}
            onHire={handleHire}
          />
        )}
        
        {/* Loading state during search */}
        {isSearching && (
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
    </div>
  );
};

interface SearchFormProps {
  searchOptions: StaffSearchOptions;
  currentSkillInfo: any;
  searchCost: number;
  player: any;
  onClose: () => void;
  onSearch: () => void;
  onSkillChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCandidatesChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onSpecializationToggle: (specId: string) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({
  searchOptions,
  currentSkillInfo,
  searchCost,
  player,
  onClose,
  onSearch,
  onSkillChange,
  onCandidatesChange,
  onSpecializationToggle
}) => (
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
            onChange={onCandidatesChange}
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
            onChange={onSkillChange}
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
      
      {/* Specializations */}
      <div>
        <h3 className="text-lg font-medium mb-3">Specializations</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select specialized roles to search for specific expertise. Each specialization increases search cost.
        </p>
        
        {Object.values(SpecializedRoles).map(role => (
          <div key={role.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={role.id}
              checked={searchOptions.specializations.includes(role.id)}
              onChange={() => onSpecializationToggle(role.id)}
              className="mr-2"
            />
            <label htmlFor={role.id} className="text-sm">
              {role.title} - {role.description}
            </label>
          </div>
        ))}
      </div>
    </div>
    
    {/* Search Costs */}
    <div className="border-t pt-6 mb-6">
      <h3 className="text-lg font-medium mb-3">Search Costs</h3>
      <div className="bg-gray-50 p-4 rounded">
        <p className="mb-2">
          <span className="font-medium">Search Fee:</span> ${searchCost.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">
          This is a one-time fee paid to the recruitment agency.
        </p>
      </div>
      <div className="mt-4 bg-gray-50 p-4 rounded">
        <p className="mb-2">
          <span className="font-medium">Expected Monthly Wage Range:</span> $650- $978
        </p>
        <p className="text-sm text-gray-600">
          Monthly wages will vary based on actual skills and specializations.
        </p>
      </div>
    </div>
    
    {/* Action Buttons */}
    <div className="flex justify-end gap-4">
      <button
        className="px-4 py-2 border rounded hover:bg-gray-50"
        onClick={onClose}
      >
        Cancel
      </button>
      <button
        className="px-4 py-2 bg-wine text-white rounded hover:bg-wine-dark disabled:opacity-50"
        onClick={onSearch}
        disabled={!player || player.money < searchCost}
      >
        Start Search (${searchCost.toLocaleString()})
      </button>
    </div>
  </>
);

interface SearchResultsProps {
  searchResults: ServiceStaff[];
  player: any;
  onClose: () => void;
  onBack: () => void;
  onHire: (staff: ServiceStaff) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchResults,
  player,
  onClose,
  onBack,
  onHire
}) => (
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
              onClick={() => onHire(candidate)}
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
        onClick={onBack}
      >
        Back to Search Options
      </button>
    </div>
  </>
);

export default StaffSearch; 