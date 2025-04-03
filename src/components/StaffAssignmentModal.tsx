import React, { useState, useEffect } from 'react';
import { useDisplayUpdate } from '../lib/game/displayManager';
import { getGameState } from '../gameState';
import staffService, { getSkillLevelInfo, StaffTeam } from '../services/staffService';
import { getActivityById } from '../lib/game/activityManager';

interface StaffAssignmentModalProps {
  activityId: string;
  category: string;
  onClose: () => void;
}

const StaffAssignmentModal: React.FC<StaffAssignmentModalProps> = ({ 
  activityId, 
  category,
  onClose 
}) => {
  useDisplayUpdate();
  const { staff } = getGameState();
  
  // Current assignments
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<StaffTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  
  // Load initial data
  useEffect(() => {
    // Load current assigned staff
    const activity = getActivityById(activityId);
    if (activity?.params?.assignedStaffIds) {
      setAssignedStaffIds(activity.params.assignedStaffIds as string[]);
    }
    
    // Load teams
    const loadedTeams = staffService.loadTeams();
    setTeams(loadedTeams);
  }, [activityId]);
  
  // Filter staff based on assignments
  const assignedStaff = staff.filter(s => assignedStaffIds.includes(s.id));
  const unassignedStaff = staff.filter(s => !assignedStaffIds.includes(s.id));
  
  // Handle staff assignment
  const handleAssignStaff = (staffId: string) => {
    setAssignedStaffIds(prev => [...prev, staffId]);
  };
  
  // Handle staff unassignment
  const handleUnassignStaff = (staffId: string) => {
    setAssignedStaffIds(prev => prev.filter(id => id !== staffId));
  };
  
  // Save assignments
  const handleSave = () => {
    staffService.assignStaffToActivityById(activityId, assignedStaffIds);
    onClose();
  };
  
  // Assign a team
  const handleAssignTeam = () => {
    if (!selectedTeamId) {
      alert('Please select a team');
      return;
    }
    
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return;
    
    const teamStaff = staff.filter(s => s.teamId === selectedTeamId);
    const teamStaffIds = teamStaff.map(s => s.id);
    
    // Add team members to assignments
    setAssignedStaffIds(prev => {
      const newAssignments = [...prev];
      teamStaffIds.forEach(id => {
        if (!newAssignments.includes(id)) {
          newAssignments.push(id);
        }
      });
      return newAssignments;
    });
    
    setShowTeamAssignment(false);
  };
  
  // Calculate efficiency based on current assignments
  const calculateEfficiency = () => {
    if (assignedStaffIds.length === 0) return 0;
    
    const efficiency = assignedStaffIds.reduce((sum, staffId) => {
      const member = staff.find(s => s.id === staffId);
      if (!member) return sum;
      
      // Determine relevant skill based on category
      const skillKey = staffService.mapCategoryToSkill ? 
        staffService.mapCategoryToSkill(category) : 
        'field';
      
      // Use detailed skill if available, otherwise use general level
      const skillLevel = member.skills ? 
        member.skills[skillKey] : 
        member.skillLevel;
      
      // Add specialization bonus if applicable
      const specializationBonus = member.specialization === skillKey ? 0.2 : 0;
      
      return sum + skillLevel + specializationBonus;
    }, 0);
    
    // Calculate the final efficiency with diminishing returns for team size
    const avgEfficiency = efficiency / assignedStaffIds.length;
    const teamSizeFactor = Math.min(1, 1 + (Math.log(assignedStaffIds.length) / Math.log(10)));
    
    return Math.min(1, avgEfficiency * teamSizeFactor);
  };
  
  const efficiency = calculateEfficiency();
  const efficiencyPercentage = Math.round(efficiency * 100);
  
  return (
    <div className="w-full max-h-[80vh] overflow-y-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Assign Staff to Activity</h2>
      
      {/* Efficiency display */}
      <div className="bg-gray-50 p-4 rounded mb-6">
        <h3 className="text-lg font-medium mb-2">Work Efficiency</h3>
        <div className="flex items-center gap-4">
          <div className="grow">
            <div className="h-4 bg-gray-200 rounded-full">
              <div 
                className="h-4 bg-wine rounded-full" 
                style={{ width: `${efficiencyPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="text-lg font-medium">{efficiencyPercentage}%</div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Staff efficiency affects how quickly work is completed. Higher skilled staff and specialists in {category} work more efficiently.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Assigned Staff */}
        <div>
          <div className="flex justify-between mb-2">
            <h3 className="font-medium">Assigned Staff ({assignedStaff.length})</h3>
            {!showTeamAssignment && teams.length > 0 && (
              <button
                onClick={() => setShowTeamAssignment(true)}
                className="text-sm bg-wine text-white px-2 py-1 rounded hover:bg-wine-dark"
              >
                Assign Team
              </button>
            )}
          </div>
          
          {assignedStaff.length === 0 ? (
            <p className="text-sm text-gray-500">No staff assigned yet.</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {assignedStaff.map(member => (
                <li key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-gray-500">
                      {member.specialization ? 
                        staffService.SpecializedRoles[member.specialization].title : 
                        'General Worker'} - {getSkillLevelInfo(member.skillLevel).name}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnassignStaff(member.id)}
                    className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {/* Team Assignment Panel */}
          {showTeamAssignment && (
            <div className="mt-4 p-3 border rounded bg-gray-50">
              <h4 className="font-medium mb-2">Select Team to Assign</h4>
              {teams.length === 0 ? (
                <p className="text-sm text-gray-500">No teams available.</p>
              ) : (
                <div>
                  <select
                    className="w-full p-2 mb-3 border rounded"
                    value={selectedTeamId || ''}
                    onChange={(e) => setSelectedTeamId(e.target.value || null)}
                  >
                    <option value="">Select a team...</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.icon} {team.name} ({staff.filter(s => s.teamId === team.id).length} members)
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowTeamAssignment(false)}
                      className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignTeam}
                      className="text-xs bg-wine text-white px-2 py-1 rounded hover:bg-wine-dark"
                      disabled={!selectedTeamId}
                    >
                      Assign Team
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Available Staff */}
        <div>
          <h3 className="font-medium mb-2">Available Staff ({unassignedStaff.length})</h3>
          {unassignedStaff.length === 0 ? (
            <p className="text-sm text-gray-500">No staff available.</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {unassignedStaff.map(member => (
                <li key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-gray-500">
                      {member.specialization ? 
                        staffService.SpecializedRoles[member.specialization].title : 
                        'General Worker'} - {getSkillLevelInfo(member.skillLevel).name}
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
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-wine text-white rounded hover:bg-wine-dark"
        >
          Save Assignments
        </button>
      </div>
    </div>
  );
};

export default StaffAssignmentModal; 