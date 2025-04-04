import React, { useState, useEffect } from 'react';
import { getGameState } from '../../gameState';
import staffService, { getSkillLevelInfo, StaffTeam } from '../../services/staffService';
import { getActivityById } from '../../lib/game/activityManager';

interface StaffAssignmentModalProps {
  activityId: string;
  category: string;
  onClose: () => void;
  initialAssignedStaffIds?: string[];
  onAssignmentChange: (staffIds: string[]) => void;
}

const StaffAssignmentModal: React.FC<StaffAssignmentModalProps> = ({ 
  activityId, 
  category,
  onClose,
  initialAssignedStaffIds = [],
  onAssignmentChange
}) => {
  // Use state to track assignments locally
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>(initialAssignedStaffIds);
  const [teams, setTeams] = useState<StaffTeam[]>([]);
  
  // Load teams on mount
  useEffect(() => {
    const loadTeams = async () => {
      const loadedTeams = await staffService.loadTeams();
      setTeams(loadedTeams);
    };
    
    loadTeams();
  }, []);
  
  const { staff } = getGameState();
  
  // Filter staff based on assignments
  const assignedStaff = staff.filter(s => assignedStaffIds.includes(s.id));
  const unassignedStaff = staff.filter(s => !assignedStaffIds.includes(s.id));
  
  // Handle staff assignment
  const handleAssignStaff = (staffId: string) => {
    const newAssignments = [...assignedStaffIds, staffId];
    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments);
  };
  
  // Handle staff unassignment
  const handleUnassignStaff = (staffId: string) => {
    const newAssignments = assignedStaffIds.filter(id => id !== staffId);
    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments);
  };
  
  // Save assignments
  const handleSave = () => {
    // Apply the changes
    staffService.assignStaffToActivityById(activityId, assignedStaffIds);
    onClose();
  };
  
  // Assign a team
  const handleAssignTeam = (teamId: string) => {
    if (!teamId) return; // Skip empty selections
    
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const teamStaff = staff.filter(s => s.teamId === teamId);
    const teamStaffIds = teamStaff.map(s => s.id);
    
    // Add team members to assignments
    const newAssignments = [...assignedStaffIds];
    teamStaffIds.forEach(id => {
      if (!newAssignments.includes(id)) {
        newAssignments.push(id);
      }
    });
    
    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments);
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
            {teams.length > 0 && (
              <select
                onChange={(e) => handleAssignTeam(e.target.value)}
                className="text-sm bg-wine text-white px-2 py-1 rounded hover:bg-wine-dark"
              >
                <option value="">Assign Team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.icon} {team.name} ({staff.filter(s => s.teamId === team.id).length} members)
                  </option>
                ))}
              </select>
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
                        'General Worker'} - {getSkillLevelInfo(member.skillLevel).formattedName}
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
                        'General Worker'} - {getSkillLevelInfo(member.skillLevel).formattedName}
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