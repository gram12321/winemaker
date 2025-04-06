import React, { useState, useEffect } from 'react';
import { useDisplayUpdate } from '../lib/game/displayManager';
import staffService, { Staff, StaffTeam, StaffSearchOptions } from '../services/staffService';
import { StaffSearch } from '../components/staff';
import { 
  getActivitiesForTarget, 
  getAllActivities, 
  startActivityWithDisplayState,
  assignStaffWithDisplayState,
  setActivityCompletionCallback,
  getActivityProgressFromDisplayState,
  cancelActivityWithDisplayState
} from '../lib/game/activityManager';
import displayManager from '../lib/game/displayManager';
import StaffAssignmentModal from '../components/staff/StaffAssignmentModal';
import { toast } from '../lib/ui/toast';
import { ActivityProgressBar } from '../components/activities';
import { WorkCategory } from '../lib/game/workCalculator';

// Create display state for staff activities
displayManager.createDisplayState('staffSearchActivity', {
  activityId: null as string | null
});

displayManager.createDisplayState('staffHiringActivity', {
  activityId: null as string | null
});

const StaffView: React.FC = () => {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  useDisplayUpdate();
  
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
  const [showStaffSearch, setShowStaffSearch] = useState(false);
  const [showStaffAssignment, setShowStaffAssignment] = useState(false);
  const [showHiringStaffAssignment, setShowHiringStaffAssignment] = useState(false);
  
  // Get activity progress info
  const searchActivityProgress = getActivityProgressFromDisplayState('staffSearchActivity');
  const hiringActivityProgress = getActivityProgressFromDisplayState('staffHiringActivity');

  // Handle start of staff search
  const handleStartSearch = () => {
    console.log('[StaffView] Starting staff search');
    
    // Start the search activity
    const activityId = startActivityWithDisplayState('staffSearchActivity', {
      category: WorkCategory.STAFF_SEARCH,
      amount: searchOptions.numberOfCandidates,
      title: 'Staff Search',
      additionalParams: {
        searchOptions: searchOptions
      }
    });
    
    if (activityId) {
      // Set up completion callback
      setActivityCompletionCallback(activityId, () => {
        console.log('[StaffView] Staff search completed');
        
        // Get the activity to retrieve search options
        const activity = getAllActivities().find(a => a.id === activityId);
          
        if (activity && activity.params?.searchOptions) {
          const results = staffService.generateStaffCandidates(activity.params.searchOptions);
          setSearchResults(results);
          setIsSearching(false);
          setShowStaffSearch(true); // Show the modal with results
        }
      });
      
      // Close the search modal
      setShowStaffSearch(false);
      setIsSearching(true);
    }
  };

  // Handle hiring activity
  const handleStartHiring = (staffToHire: Staff) => {
    console.log('[StaffView] Starting hiring process for staff:', staffToHire.id);
    
    // Start the hiring activity
    const activityId = startActivityWithDisplayState('staffHiringActivity', {
      category: WorkCategory.ADMINISTRATION,
      amount: 1,
      title: `Hiring ${staffToHire.name}`,
      additionalParams: {
        staffToHire: staffToHire
      }
    });
    
    if (activityId) {
      // Set up completion callback
      setActivityCompletionCallback(activityId, () => {
        console.log('[StaffView] Hiring completed for activity:', activityId);
        
        // Call the completeHiringProcess function to finalize hiring
        const hiredStaff = staffService.completeHiringProcess(activityId);
        if (hiredStaff) {
          console.log('[StaffView] Successfully hired staff:', hiredStaff.id);
          
          // Update search results to remove the hired staff
          setSearchResults(prevResults => prevResults.filter(s => s.id !== hiredStaff.id));
          
          // Force staff list to update
          displayManager.updateAllDisplays();
          
          // Select the newly hired staff to show details
          setSelectedStaffId(hiredStaff.id);
        }
      });
      
      // Close the staff search modal
      setShowStaffSearch(false);
    }
  };

  // Handle staff assignment to search activity
  const handleAssignStaffToSearch = () => {
    setShowStaffAssignment(true);
  };

  // Handle staff assignment to hiring activity
  const handleAssignStaffToHiring = () => {
    setShowHiringStaffAssignment(true);
  };

  // Handle staff assignment completion for search
  const handleStaffAssigned = (staffIds: string[], finalSave = false) => {
    assignStaffWithDisplayState('staffSearchActivity', staffIds);
    if (finalSave) {
      setShowStaffAssignment(false);
    }
  };

  // Handle staff assignment for hiring completion
  const handleHiringStaffAssigned = (staffIds: string[], finalSave = false) => {
    assignStaffWithDisplayState('staffHiringActivity', staffIds);
    if (finalSave) {
      setShowHiringStaffAssignment(false);
    }
  };

  // Manual team loading function
  const loadTeamsData = async () => {
    const loadedTeams = await staffService.loadTeams();
    setTeams(loadedTeams);
    if (loadedTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(loadedTeams[0].id);
    }
  };

  // Reset teams function - clears all teams and recreates default ones
  const resetTeams = async () => {
    // Clear from localStorage
    localStorage.removeItem('staffTeams');
    
    try {
      // Clear teams from Firebase
      const db = await import('../firebase.config').then(module => module.db);
      const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
      
      // Delete all existing teams from Firebase
      const TEAMS_COLLECTION = 'staffTeams';
      const teamsSnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
      
      // Delete each team document
      const deletePromises = teamsSnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, TEAMS_COLLECTION, docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
      
      // Remove team assignments from all staff
      const allStaff = staffService.getAllStaff();
      for (const staff of allStaff) {
        if (staff.teamId) {
          staffService.assignStaffToTeam(staff.id, null);
        }
      }
      
      // Create default teams
      await staffService.initializeDefaultTeams();
      
      // Reload teams
      await loadTeamsData();
    } catch (error) {
      console.error('Error resetting teams:', error);
    }
  };

  // Load teams when component mounts
  useEffect(() => {
    loadTeamsData();
  }, []);

  const selectedStaff = selectedStaffId 
    ? staffService.getStaffById(selectedStaffId)
    : null;

  // Get the team for a staff member
  const getStaffTeam = (staffId: string) => {
    const team = teams.find(team => team.memberIds?.includes(staffId));
    return team || null;
  };

  // Get activities/tasks for a staff member
  const getStaffActivities = (staffId: string) => {
    const allActivities = getAllActivities();
    return allActivities.filter(activity => 
      activity.params?.assignedStaffIds?.includes(staffId)
    );
  };

  // Create an adapter function to match the expected interface for onStartHiring
  const adaptedStartHiring = (activityId: string, staffToHire: Staff) => {
    handleStartHiring(staffToHire);
  };

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
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={resetTeams}
          >
            Reset Teams
          </button>
        </div>
      </div>

      {/* Progress bars for staff activities */}
      {searchActivityProgress.isInProgress && (
        <div className="mb-6">
          <ActivityProgressBar
            activityId={searchActivityProgress.activityId || ''}
            title="Staff Search"
            category={WorkCategory.STAFF_SEARCH}
            progress={searchActivityProgress.progress}
            appliedWork={searchActivityProgress.appliedWork}
            totalWork={searchActivityProgress.totalWork}
            onAssignStaff={handleAssignStaffToSearch}
            className=""
          />
        </div>
      )}

      {/* Hiring Progress Bar */}
      {hiringActivityProgress.isInProgress && (
        <div className="mb-6">
          <ActivityProgressBar
            activityId={hiringActivityProgress.activityId || ''}
            title="Hiring Process"
            category={WorkCategory.ADMINISTRATION}
            progress={hiringActivityProgress.progress}
            appliedWork={hiringActivityProgress.appliedWork}
            totalWork={hiringActivityProgress.totalWork}
            onAssignStaff={handleAssignStaffToHiring}
            className=""
          />
        </div>
      )}

      {/* New layout: 2 columns for staff sections, full width for team management */}
      <div className="grid grid-cols-1 gap-6">
        {/* Staff sections in 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Staff List Section */}
          <div className="bg-white rounded-lg shadow p-4 your-staff-section">
            <h2 className="text-xl font-semibold mb-4">Your Staff</h2>
            <div className="space-y-4">
              {staffService.getAllStaff().length === 0 ? (
                <p className="text-gray-500">No staff members hired yet.</p>
              ) : (
                staffService.getAllStaff().map(staff => {
                  const staffTeam = getStaffTeam(staff.id);
                  return (
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
                          <p className="text-gray-600">
                            {staff.specializations?.length > 0 
                              ? staff.specializations.map(spec => staffService.SpecializedRoles[spec].title).join(', ') 
                              : 'General Worker'}
                          </p>
                        </div>
                        <span className="text-wine font-medium">${staff.wage}/mo</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <p><span className="font-medium">Skill Level:</span> {staffService.getSkillLevelInfo(staff.skillLevel).formattedName}</p>
                        <p><span className="font-medium">Nationality:</span> {staff.nationality}</p>
                        <p className="col-span-2"><span className="font-medium">Team:</span> {staffTeam ? staffTeam.name : 'Not assigned to any team'}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Staff Details Section */}
          <div className="bg-white rounded-lg shadow p-4 staff-data-section">
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
                    <p><span className="font-medium">Specializations:</span> {
                      selectedStaff.specializations?.length > 0
                        ? selectedStaff.specializations.map(spec => staffService.SpecializedRoles[spec].title).join(', ')
                        : 'None'
                    }</p>
                    
                    {/* Show Team Assignment */}
                    <p><span className="font-medium">Team:</span> {getStaffTeam(selectedStaff.id)?.name || 'Not assigned to any team'}</p>
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
                
                {/* Current Tasks Section */}
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-2">Current Assignments</h3>
                  {getStaffActivities(selectedStaff.id).length > 0 ? (
                    <div className="space-y-2">
                      {getStaffActivities(selectedStaff.id).map(activity => (
                        <div key={activity.id} className="p-3 border rounded">
                          <div className="font-medium">{activity.category}</div>
                          <div className="text-sm text-gray-600">
                            Progress: {Math.round((activity.appliedWork / activity.totalWork) * 100)}%
                          </div>
                          <div className="mt-1 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-wine rounded-full" 
                              style={{ width: `${(activity.appliedWork / activity.totalWork) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No active tasks assigned</p>
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
        
        {/* Team Management Section - Full Width */}
        <div className="bg-white rounded-lg shadow p-4 team-management-section">
          <h2 className="text-xl font-semibold mb-4">Team Management</h2>
          
          <div className="mb-4 flex justify-between items-center">
            <div>
              {teams.length === 0 ? (
                <p className="text-gray-500">No teams created yet.</p>
              ) : (
                <div className="text-sm text-gray-600">{teams.length} teams available</div>
              )}
            </div>
            <button
              className="bg-wine text-white px-3 py-1 rounded text-sm hover:bg-wine-dark"
              onClick={() => setIsCreatingTeam(true)}
            >
              New Team
            </button>
          </div>
          
          {isCreatingTeam ? (
            <div className="p-4 border rounded mb-4">
              <h3 className="text-lg font-semibold mb-3">Create New Team</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const teamName = formData.get('teamName') as string;
                  const description = formData.get('description') as string;
                  if (teamName.trim()) {
                    const newTeam = staffService.createTeam(teamName.trim(), description || '', '📊', []);
                    setTeams([...teams, newTeam]);
                    setSelectedTeamId(newTeam.id);
                    setIsCreatingTeam(false);
                    staffService.saveTeam(newTeam, true);
                  }
                }}
              >
                <div className="mb-3">
                  <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    id="teamName"
                    name="teamName"
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-wine focus:ring-wine"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-wine focus:ring-wine"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                    onClick={() => setIsCreatingTeam(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-wine text-white px-3 py-1 rounded hover:bg-wine-dark"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Team Selection */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {teams.map(team => (
                    <button
                      key={team.id}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTeamId === team.id 
                          ? 'bg-wine text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                      onClick={() => setSelectedTeamId(team.id)}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>
          
              {/* Selected Team Details */}
              {selectedTeamId ? (
                <div>
                  {(() => {
                    const team = teams.find(t => t.id === selectedTeamId);
                    if (!team) return null;
                    
                    return (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            {team.description && (
                              <p className="text-sm text-gray-600">{team.description}</p>
                            )}
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700 text-sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the team "${team.name}"?`)) {
                                const updatedTeams = teams.filter(t => t.id !== team.id);
                                setTeams(updatedTeams);
                                if (updatedTeams.length > 0) {
                                  setSelectedTeamId(updatedTeams[0].id);
                                } else {
                                  setSelectedTeamId(null);
                                }
                              }
                            }}
                          >
                            Delete Team
                          </button>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-2">Team Members</h4>
                          {team.memberIds && team.memberIds.length > 0 ? (
                            <div className="space-y-2">
                              {team.memberIds.map(memberId => {
                                const member = staffService.getStaffById(memberId);
                                if (!member) return null;
                                
                                return (
                                  <div key={member.id} className="flex justify-between items-center p-2 border rounded-lg">
                                    <div>
                                      <div className="font-medium">{member.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {member.specializations?.length > 0 
                                          ? member.specializations.map(spec => 
                                              staffService.SpecializedRoles[spec]?.title || spec
                                            ).join(', ') 
                                          : 'General Worker'}
                                      </div>
                                    </div>
                                    <button
                                      className="text-red-500 hover:text-red-700 text-sm"
                                      onClick={() => {
                                        staffService.assignStaffToTeam(member.id, null);
                                        const updatedTeams = teams.map(t => {
                                          if (t.id === team.id) {
                                            return {
                                              ...t,
                                              memberIds: t.memberIds?.filter(id => id !== member.id) || []
                                            };
                                          }
                                          return t;
                                        });
                                        setTeams(updatedTeams);
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No members in this team</p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Available Staff</h4>
                          {staffService.getAllStaff().filter(staff => !getStaffTeam(staff.id)).length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {staffService.getAllStaff()
                                .filter(staff => !getStaffTeam(staff.id))
                                .map(staff => (
                                  <div key={staff.id} className="flex justify-between items-center p-2 border rounded-lg">
                                    <div>
                                      <div className="font-medium">{staff.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {staff.specializations?.length > 0 
                                          ? staff.specializations.map(spec => 
                                              staffService.SpecializedRoles[spec]?.title || spec
                                            ).join(', ') 
                                          : 'General Worker'}
                                      </div>
                                    </div>
                                    <button
                                      className="text-wine hover:text-wine-dark text-sm"
                                      onClick={() => {
                                        staffService.assignStaffToTeam(staff.id, team.id);
                                        const updatedTeams = teams.map(t => {
                                          if (t.id === team.id) {
                                            return {
                                              ...t,
                                              memberIds: [...(t.memberIds || []), staff.id]
                                            };
                                          }
                                          return t;
                                        });
                                        setTeams(updatedTeams);
                                      }}
                                    >
                                      Add to Team
                                    </button>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No available staff</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {teams.length > 0 ? 
                    'Select a team to view details' : 
                    'Create a team to get started'
                  }
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Staff search modal */}
      {showStaffSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <StaffSearch
              onClose={() => setShowStaffSearch(false)}
              searchOptions={searchOptions}
              onSearchOptionsChange={setSearchOptions}
              searchResults={searchResults}
              onSearchResultsChange={setSearchResults}
              isSearching={isSearching}
              onSearchingChange={setIsSearching}
              onStartSearch={handleStartSearch}
              onStartHiring={adaptedStartHiring}
            />
          </div>
        </div>
      )}

      {/* Staff Assignment Modal */}
      {showStaffAssignment && searchActivityProgress.activityId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <StaffAssignmentModal
              activityId={searchActivityProgress.activityId}
              category="ADMINISTRATION"
              onClose={() => setShowStaffAssignment(false)}
              initialAssignedStaffIds={[]}
              onAssignmentChange={handleStaffAssigned}
            />
          </div>
        </div>
      )}

      {/* Staff Assignment Modal for Hiring */}
      {showHiringStaffAssignment && hiringActivityProgress.activityId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <StaffAssignmentModal
              activityId={hiringActivityProgress.activityId}
              category="ADMINISTRATION"
              onClose={() => setShowHiringStaffAssignment(false)}
              initialAssignedStaffIds={[]}
              onAssignmentChange={handleHiringStaffAssigned}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffView; 