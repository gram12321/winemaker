import React, { useState } from 'react';
import { useDisplayUpdate } from '../lib/game/displayManager';
import { getGameState } from '../gameState';
import staffService, { getSkillLevelInfo } from '../services/staffService';
import StaffSearch from '../components/StaffSearch';
import TeamManagement from '../components/TeamManagement';

const StaffView: React.FC = () => {
  useDisplayUpdate();
  const { staff } = getGameState();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  
  const selectedStaff = selectedStaffId 
    ? staff.find(s => s.id === selectedStaffId) 
    : null;
  
  return (
    <div className="staff-view p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-wine">Staff Management</h1>
        <div className="space-x-2">
          <button 
            className="bg-wine text-white px-4 py-2 rounded shadow hover:bg-wine-dark"
            onClick={() => setShowSearchMenu(true)}
          >
            Search Staff
          </button>
          <button 
            className="bg-wine text-white px-4 py-2 rounded shadow hover:bg-wine-dark"
            onClick={() => setShowTeamMenu(true)}
          >
            Manage Teams
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {/* Staff List - 4 columns */}
        <div className="col-span-4 bg-white rounded-lg shadow p-4 h-[70vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Your Staff</h2>
          {staff.length === 0 ? (
            <p className="text-gray-500">No staff members hired yet.</p>
          ) : (
            <ul className="space-y-2">
              {staff.map(member => (
                <li 
                  key={member.id}
                  className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                    selectedStaffId === member.id ? 'bg-gray-100 border-wine' : ''
                  }`}
                  onClick={() => setSelectedStaffId(member.id)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-gray-600">${member.wage}/mo</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.specialization ? 
                      staffService.SpecializedRoles[member.specialization].title : 
                      'General Worker'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Skill: {getSkillLevelInfo(member.skillLevel).formattedName}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Staff Details - 8 columns */}
        <div className="col-span-8 bg-white rounded-lg shadow p-4 h-[70vh] overflow-y-auto">
          {selectedStaff ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">{selectedStaff.name}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">General Information</h3>
                  <p><span className="font-medium">Nationality:</span> {selectedStaff.nationality}</p>
                  <p><span className="font-medium">Hired:</span> {selectedStaff.hireDate.toLocaleDateString()}</p>
                  <p><span className="font-medium">Wage:</span> ${selectedStaff.wage}/month</p>
                  <p>
                    <span className="font-medium">Skill Level:</span> {getSkillLevelInfo(selectedStaff.skillLevel).formattedName}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Role</h3>
                  <p>
                    <span className="font-medium">Specialization:</span> {
                      selectedStaff.specialization ? 
                      staffService.SpecializedRoles[selectedStaff.specialization].title : 
                      'None'
                    }
                  </p>
                  {selectedStaff.specialization && (
                    <p className="text-sm text-gray-600">
                      {staffService.SpecializedRoles[selectedStaff.specialization].description}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Team:</span> {
                      selectedStaff.teamId ? 
                      '(Team name placeholder)' : 
                      'Not assigned to a team'
                    }
                  </p>
                </div>
              </div>
              
              {/* Skill visualization */}
              <div>
                <h3 className="text-lg font-medium mb-3">Skills</h3>
                {selectedStaff.skills ? (
                  <div className="space-y-3">
                    <SkillBar name="Field Work" value={selectedStaff.skills.field} />
                    <SkillBar name="Winery Work" value={selectedStaff.skills.winery} />
                    <SkillBar name="Administration" value={selectedStaff.skills.administration} />
                    <SkillBar name="Sales" value={selectedStaff.skills.sales} />
                    <SkillBar name="Maintenance" value={selectedStaff.skills.maintenance} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SkillBar name="Field Work" value={selectedStaff.skillLevel} />
                    <SkillBar name="Winery Work" value={selectedStaff.skillLevel} />
                    <SkillBar name="Administration" value={selectedStaff.skillLevel} />
                    <SkillBar name="Sales" value={selectedStaff.skillLevel} />
                    <SkillBar name="Maintenance" value={selectedStaff.skillLevel} />
                    <p className="text-xs text-gray-500 mt-1">
                      Note: Detailed skills not available. Using general skill level.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex space-x-2">
                <button 
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                  onClick={() => {
                    // Fire the staff member
                    if (confirm(`Are you sure you want to fire ${selectedStaff.name}?`)) {
                      staffService.removeStaff(selectedStaff.id, true);
                      setSelectedStaffId(null);
                    }
                  }}
                >
                  Fire Staff
                </button>
                <button 
                  className="bg-wine text-white px-4 py-2 rounded hover:bg-wine-dark"
                  onClick={() => {
                    // Assign to team logic here
                    alert('Team assignment feature coming soon!');
                  }}
                >
                  Assign to Team
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a staff member to view details
            </div>
          )}
        </div>
      </div>
      
      {/* Staff search modal */}
      {showSearchMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <StaffSearch onClose={() => setShowSearchMenu(false)} />
          </div>
        </div>
      )}
      
      {/* Team management modal */}
      {showTeamMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <TeamManagement onClose={() => setShowTeamMenu(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for skill bars
const SkillBar: React.FC<{ name: string; value: number }> = ({ name, value }) => {
  const percentage = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-sm font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-wine h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StaffView; 