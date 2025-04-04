import React, { useState, useEffect } from 'react';
import { useDisplayUpdate } from '../lib/game/displayManager';
import staffService, { Staff, StaffTeam, StaffSearchOptions } from '../services/staffService';
import { StaffSearch, TeamManagement } from '../components/staff';

const StaffView: React.FC = () => {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const displayUpdate = useDisplayUpdate();

  // Team management state
  const [teams, setTeams] = useState<StaffTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Staff search state
  const [searchOptions, setSearchOptions] = useState<StaffSearchOptions>({
    numberOfCandidates: 3,
    skillLevel: 0.3,
    specializations: [],
  });
  const [searchResults, setSearchResults] = useState<Staff[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modal state
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showStaffSearch, setShowStaffSearch] = useState(false);

  // Manual team loading function
  const loadTeamsData = async () => {
    console.log('Loading teams manually');
    const loadedTeams = await staffService.loadTeams();
    console.log('Loaded teams:', loadedTeams.length > 0 ? loadedTeams.map(t => t.name) : 'None');
    setTeams(loadedTeams);
    if (loadedTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(loadedTeams[0].id);
    }
  };

  // Initialize default teams and then load them
  const initAndLoadTeams = async () => {
    console.log('Initializing and loading teams');
    await staffService.initializeDefaultTeams();
    await loadTeamsData();
  };

  const selectedStaff = selectedStaffId 
    ? staffService.getStaffById(selectedStaffId)
    : null;

  return (
    <div className="p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold text-wine">Staff Management</h1>
        <div className="space-x-2">
          <button
            className="bg-wine text-white px-4 py-2 rounded hover:bg-wine-dark"
            onClick={() => setShowStaffSearch(true)}
          >
            Search Staff
          </button>
          <button
            className="bg-wine text-white px-4 py-2 rounded hover:bg-wine-dark"
            onClick={() => setShowTeamManagement(true)}
          >
            Manage Teams
          </button>
          <button
            className="bg-wine text-white px-4 py-2 rounded hover:bg-wine-dark"
            onClick={initAndLoadTeams}
          >
            Initialize Teams
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={async () => {
              console.log('Resetting teams - clearing localStorage and Firebase');
              
              // Clear from localStorage
              localStorage.removeItem('staffTeams');
              
              try {
                // Clear teams from Firebase
                const db = await import('../firebase.config').then(module => module.db);
                const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
                
                // Delete all existing teams from Firebase
                const TEAMS_COLLECTION = 'staffTeams';
                const teamsSnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
                
                console.log(`Deleting ${teamsSnapshot.docs.length} teams from Firebase`);
                
                // Delete each team document
                const deletePromises = teamsSnapshot.docs.map(docSnapshot => 
                  deleteDoc(doc(db, TEAMS_COLLECTION, docSnapshot.id))
                );
                
                await Promise.all(deletePromises);
                console.log('All teams deleted from Firebase');
              } catch (error) {
                console.error('Error deleting teams from Firebase:', error);
              }
              
              // Wait a bit to ensure everything is cleared
              setTimeout(() => {
                initAndLoadTeams();
              }, 300);
            }}
          >
            Reset Teams
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Your Staff</h2>
          <div className="space-y-4">
            {staffService.getAllStaff().length === 0 ? (
              <p className="text-gray-500">No staff members hired yet.</p>
            ) : (
              staffService.getAllStaff().map(staff => (
                <div
                  key={staff.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStaffId === staff.id 
                      ? 'border-wine bg-wine/5' 
                      : 'border-gray-200 hover:border-wine/50'
                  }`}
                  onClick={() => setSelectedStaffId(staff.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{staff.name}</h3>
                      <p className="text-gray-600">{staff.specialization ? staffService.SpecializedRoles[staff.specialization].title : 'General Worker'}</p>
                    </div>
                    <span className="text-wine font-medium">${staff.wage}/mo</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <p><span className="font-medium">Skill Level:</span> {staffService.getSkillLevelInfo(staff.skillLevel).formattedName}</p>
                    <p><span className="font-medium">Nationality:</span> {staff.nationality}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff Details or Instructions */}
        <div className="bg-white rounded-lg shadow p-4">
          {selectedStaff ? (
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{selectedStaff.name}</h2>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setSelectedStaffId(null)}
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <p><span className="font-medium">Nationality:</span> {selectedStaff.nationality}</p>
                  <p><span className="font-medium">Hire Date:</span> Week {selectedStaff.hireDate.week}, {selectedStaff.hireDate.season} {selectedStaff.hireDate.year}</p>
                  <p><span className="font-medium">Monthly Wage:</span> ${selectedStaff.wage}</p>
                  <p><span className="font-medium">Specialization:</span> {
                    selectedStaff.specialization 
                      ? staffService.SpecializedRoles[selectedStaff.specialization].title 
                      : 'None'
                  }</p>
                </div>
                
                {selectedStaff.skills && (
                  <div className="flex flex-col justify-center">
                    <div className="text-xs grid grid-cols-5 gap-1">
                      <div className="text-center">
                        <div className="font-medium mb-1">Field</div>
                        <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                          <div 
                            className="bg-wine rounded-full w-4 absolute bottom-0" 
                            style={{ height: `${selectedStaff.skills.field * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-1">{Math.round(selectedStaff.skills.field * 100)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium mb-1">Winery</div>
                        <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                          <div 
                            className="bg-wine rounded-full w-4 absolute bottom-0" 
                            style={{ height: `${selectedStaff.skills.winery * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-1">{Math.round(selectedStaff.skills.winery * 100)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium mb-1">Admin</div>
                        <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                          <div 
                            className="bg-wine rounded-full w-4 absolute bottom-0" 
                            style={{ height: `${selectedStaff.skills.administration * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-1">{Math.round(selectedStaff.skills.administration * 100)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium mb-1">Sales</div>
                        <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                          <div 
                            className="bg-wine rounded-full w-4 absolute bottom-0" 
                            style={{ height: `${selectedStaff.skills.sales * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-1">{Math.round(selectedStaff.skills.sales * 100)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium mb-1">Maint</div>
                        <div className="bg-gray-200 rounded-full h-16 w-4 mx-auto relative">
                          <div 
                            className="bg-wine rounded-full w-4 absolute bottom-0" 
                            style={{ height: `${selectedStaff.skills.maintenance * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-1">{Math.round(selectedStaff.skills.maintenance * 100)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>Select a staff member to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTeamManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl">
            <TeamManagement
              onClose={() => setShowTeamManagement(false)}
              teams={teams}
              onTeamUpdate={setTeams}
              selectedTeamId={selectedTeamId}
              onTeamSelect={setSelectedTeamId}
              isCreatingTeam={isCreatingTeam}
              onCreatingTeamChange={setIsCreatingTeam}
            />
          </div>
        </div>
      )}
      
      {showStaffSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl">
            <StaffSearch
              onClose={() => setShowStaffSearch(false)}
              searchOptions={searchOptions}
              onSearchOptionsChange={setSearchOptions}
              searchResults={searchResults}
              onSearchResultsChange={setSearchResults}
              isSearching={isSearching}
              onSearchingChange={setIsSearching}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffView; 