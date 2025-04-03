import React, { useState, useEffect } from 'react';
import staffService, { StaffTeam } from '../services/staffService';
import { useDisplayUpdate } from '../lib/game/displayManager';
import { getGameState } from '../gameState';

interface TeamManagementProps {
  onClose: () => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ onClose }) => {
  useDisplayUpdate();
  const { staff } = getGameState();
  
  const [teams, setTeams] = useState<StaffTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  
  // New team form state
  const [newTeam, setNewTeam] = useState<Omit<StaffTeam, 'id' | 'memberIds'>>({
    name: '',
    description: '',
    icon: '🍇', // Default icon
    defaultTaskTypes: []
  });
  
  // Load teams on component mount
  useEffect(() => {
    const loadTeamsData = async () => {
      const loadedTeams = await staffService.loadTeams();
      setTeams(loadedTeams);
      
      // Select first team if available
      if (loadedTeams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(loadedTeams[0].id);
      }
    };
    
    loadTeamsData();
  }, []);
  
  const selectedTeam = selectedTeamId 
    ? teams.find(team => team.id === selectedTeamId) 
    : null;
  
  const teamMembers = selectedTeam 
    ? staff.filter(member => member.teamId === selectedTeam.id)
    : [];
  
  const availableStaff = staff.filter(member => !member.teamId || (selectedTeam && member.teamId !== selectedTeam.id));
  
  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) {
      alert('Please enter a team name');
      return;
    }
    
    const team = staffService.createTeam(
      newTeam.name,
      newTeam.description,
      newTeam.icon,
      newTeam.defaultTaskTypes
    );
    
    // Save team to storage/database
    staffService.saveTeam(team, true);
    
    // Update state
    setTeams([...teams, team]);
    setSelectedTeamId(team.id);
    setIsCreatingTeam(false);
    
    // Reset form
    setNewTeam({
      name: '',
      description: '',
      icon: '🍇',
      defaultTaskTypes: []
    });
  };
  
  const handleDeleteTeam = () => {
    if (!selectedTeam) return;
    
    if (confirm(`Are you sure you want to delete the team "${selectedTeam.name}"?`)) {
      // Unassign all staff from this team
      teamMembers.forEach(member => {
        staffService.assignStaffToTeam(member.id, null);
      });
      
      // Remove team from state
      const updatedTeams = teams.filter(team => team.id !== selectedTeam.id);
      setTeams(updatedTeams);
      
      // Update localStorage
      localStorage.setItem('staffTeams', JSON.stringify(updatedTeams));
      
      // Select the first team if available
      if (updatedTeams.length > 0) {
        setSelectedTeamId(updatedTeams[0].id);
      } else {
        setSelectedTeamId(null);
      }
    }
  };
  
  const handleAssignStaff = (staffId: string) => {
    if (!selectedTeam) return;
    
    // Assign staff to team
    staffService.assignStaffToTeam(staffId, selectedTeam.id);
    
    // Update team in storage
    const updatedTeam = {
      ...selectedTeam,
      memberIds: [...selectedTeam.memberIds, staffId]
    };
    
    staffService.saveTeam(updatedTeam, true);
    
    // Update state
    const updatedTeams = teams.map(team => 
      team.id === selectedTeam.id ? updatedTeam : team
    );
    
    setTeams(updatedTeams);
  };
  
  const handleRemoveStaff = (staffId: string) => {
    // Unassign staff from team
    staffService.assignStaffToTeam(staffId, null);
    
    if (selectedTeam) {
      // Update team in storage
      const updatedTeam = {
        ...selectedTeam,
        memberIds: selectedTeam.memberIds.filter(id => id !== staffId)
      };
      
      staffService.saveTeam(updatedTeam, true);
      
      // Update state
      const updatedTeams = teams.map(team => 
        team.id === selectedTeam.id ? updatedTeam : team
      );
      
      setTeams(updatedTeams);
    }
  };
  
  // Icons for team selection
  const icons = ['🍇', '🍷', '🏡', '🌿', '🌄', '🍾', '📝', '💰', '🛠️', '📊'];
  
  return (
    <div className="w-full max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-6">Team Management</h2>
      
      {/* Team creation/management section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Team List - 1 column on mobile, 1/3 on desktop */}
        <div className="bg-gray-50 p-4 rounded">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Teams</h3>
            <button
              onClick={() => setIsCreatingTeam(true)}
              className="text-sm bg-wine text-white px-2 py-1 rounded hover:bg-wine-dark"
            >
              New Team
            </button>
          </div>
          
          {teams.length === 0 ? (
            <p className="text-sm text-gray-500">No teams created yet.</p>
          ) : (
            <ul className="space-y-2">
              {teams.map(team => (
                <li 
                  key={team.id}
                  className={`p-2 border rounded cursor-pointer hover:bg-gray-100 ${
                    selectedTeamId === team.id ? 'bg-gray-200 border-wine' : ''
                  }`}
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">{team.icon}</span>
                    <span className="font-medium">{team.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Team Details - 2/3 columns on desktop */}
        <div className="md:col-span-2">
          {isCreatingTeam ? (
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium mb-4">Create New Team</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Team Name</label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Enter team name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Enter team description"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewTeam({...newTeam, icon})}
                        className={`w-8 h-8 flex items-center justify-center rounded ${
                          newTeam.icon === icon ? 'bg-wine text-white' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setIsCreatingTeam(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTeam}
                    className="px-4 py-2 bg-wine text-white rounded hover:bg-wine-dark"
                  >
                    Create Team
                  </button>
                </div>
              </div>
            </div>
          ) : selectedTeam ? (
            <div className="bg-white p-4 rounded border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium flex items-center">
                  <span className="mr-2 text-lg">{selectedTeam.icon}</span>
                  {selectedTeam.name}
                </h3>
                <button
                  onClick={handleDeleteTeam}
                  className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete Team
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{selectedTeam.description}</p>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Team Members ({teamMembers.length})</h4>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-gray-500">No members assigned to this team.</p>
                ) : (
                  <ul className="space-y-2">
                    {teamMembers.map(member => (
                      <li key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-gray-500">
                            {member.specialization ? 
                              staffService.SpecializedRoles[member.specialization].title : 
                              'General Worker'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStaff(member.id)}
                          className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {availableStaff.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Available Staff</h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {availableStaff.map(member => (
                      <li key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-gray-500">
                            {member.specialization ? 
                              staffService.SpecializedRoles[member.specialization].title : 
                              'General Worker'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignStaff(member.id)}
                          className="text-xs bg-wine text-white px-2 py-1 rounded hover:bg-wine-dark"
                        >
                          Assign
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-4 rounded border flex items-center justify-center h-full">
              <p className="text-gray-500">
                {teams.length === 0 
                  ? "Create a team to get started" 
                  : "Select a team to view details"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TeamManagement; 