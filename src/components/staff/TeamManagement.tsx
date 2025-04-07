import React from 'react';
import staffService, { StaffTeam } from '../../services/staffService';

interface TeamManagementProps {
  onClose: () => void;
  teams: StaffTeam[];
  onTeamUpdate: (teams: StaffTeam[]) => void;
  selectedTeamId: string | null;
  onTeamSelect: (teamId: string | null) => void;
  isCreatingTeam: boolean;
  onCreatingTeamChange: (isCreating: boolean) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({
  onClose,
  teams,
  onTeamUpdate,
  selectedTeamId,
  onTeamSelect,
  isCreatingTeam,
  onCreatingTeamChange,
}) => {
  const handleCreateTeam = (name: string) => {
    const newTeam = staffService.createTeam(
      name,
      `Team for ${name}`, // Default description
      '👥', // Default icon
      [] // Default task types
    );
    onTeamUpdate([...teams, newTeam]);
    onTeamSelect(newTeam.id);
    onCreatingTeamChange(false);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      const updatedTeams = teams.filter(team => team.id !== teamId);
      onTeamUpdate(updatedTeams);
      if (selectedTeamId === teamId) {
        onTeamSelect(null);
      }
    }
  };

  const handleAssignStaff = (teamId: string, staffId: string) => {
    staffService.assignStaffToTeam(staffId, teamId);
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          memberIds: [...(team.memberIds || []), staffId],
        };
      }
      return team;
    });
    onTeamUpdate(updatedTeams);
  };

  const handleRemoveStaff = (teamId: string, staffId: string) => {
    staffService.assignStaffToTeam(staffId, null);
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          memberIds: team.memberIds?.filter(id => id !== staffId) || [],
        };
      }
      return team;
    });
    onTeamUpdate(updatedTeams);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Team Management</h2>
        <button
          className="text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Team List */}
        <div className="col-span-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Teams</h3>
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              onClick={() => onCreatingTeamChange(true)}
            >
              New Team
            </button>
          </div>

          <div className="space-y-2">
            {teams.map(team => (
              <div
                key={team.id}
                className={`p-3 border rounded cursor-pointer ${
                  selectedTeamId === team.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => onTeamSelect(team.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{team.name}</span>
                  <button
                    className="text-red-500 hover:text-red-700 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {team.memberIds?.length || 0} members
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Details */}
        <div className="col-span-8">
          {isCreatingTeam ? (
            <div className="p-4 border rounded">
              <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const teamName = formData.get('teamName') as string;
                  if (teamName.trim()) {
                    handleCreateTeam(teamName.trim());
                  }
                }}
              >
                <div className="mb-4">
                  <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">
                    Team Name
                  </label>
                  <input
                    type="text"
                    id="teamName"
                    name="teamName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                    onClick={() => onCreatingTeamChange(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          ) : selectedTeamId ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {teams.find(t => t.id === selectedTeamId)?.name} Members
              </h3>
              
              {/* Team Members */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Current Members</h4>
                <div className="space-y-2">
                  {teams
                    .find(t => t.id === selectedTeamId)
                    ?.memberIds?.map(staffId => {
                      const staff = staffService.getStaffById(staffId);
                      return staff ? (
                        <div
                          key={staff.id}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <div>
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-sm text-gray-500">
                              {staff.specializations?.length > 0 
                                ? staff.specializations.map(spec => staffService.SpecializedRoles[spec].title).join(', ')
                                : 'General Worker'}
                            </div>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveStaff(selectedTeamId, staff.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : null;
                    })}
                </div>
              </div>

              {/* Available Staff */}
              <div>
                <h4 className="font-medium mb-2">Available Staff</h4>
                <div className="space-y-2">
                  {staffService
                    .getAllStaff()
                    .filter(staff => !staff.teamId)
                    .map(staff => (
                      <div
                        key={staff.id}
                        className="flex justify-between items-center p-2 border rounded"
                      >
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-sm text-gray-500">
                            {staff.specializations?.length > 0 
                              ? staff.specializations.map(spec => staffService.SpecializedRoles[spec].title).join(', ')
                              : 'General Worker'}
                          </div>
                        </div>
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => handleAssignStaff(selectedTeamId, staff.id)}
                        >
                          Add to Team
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a team to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamManagement; 