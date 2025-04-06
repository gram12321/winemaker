import React, { useState, useEffect } from 'react';
import { getGameState } from '../../gameState';
import staffService, { getSkillLevelInfo, StaffTeam } from '../../services/staffService';
import { getActivityById } from '../../lib/game/activityManager';
import { calculateStaffWorkContribution, WorkCategory } from '../../lib/game/workCalculator';

interface StaffAssignmentModalProps {
  activityId: string;
  category: string;
  onClose: () => void;
  initialAssignedStaffIds?: string[];
  onAssignmentChange: (staffIds: string[], finalSave?: boolean) => void;
}

const StaffAssignmentModal: React.FC<StaffAssignmentModalProps> = ({ 
  activityId, 
  category,
  onClose,
  initialAssignedStaffIds = [],
  onAssignmentChange
}) => {
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>(initialAssignedStaffIds);
  const [teams, setTeams] = useState<StaffTeam[]>([]);
  const [selectAll, setSelectAll] = useState(false); // Added state for select all

  useEffect(() => {
    const loadTeams = async () => {
      const loadedTeams = await staffService.loadTeams();
      setTeams(loadedTeams);
    };

    loadTeams();
  }, []);

  const { staff, vineyards } = getGameState();
  const activity = getActivityById(activityId);

  const assignedStaff = staff.filter(s => assignedStaffIds.includes(s.id));
  const unassignedStaff = staff.filter(s => !assignedStaffIds.includes(s.id));

  const handleAssignStaff = (staffId: string) => {
    const newAssignments = [...assignedStaffIds, staffId];
    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments, false);
  };

  const handleUnassignStaff = (staffId: string) => {
    const newAssignments = assignedStaffIds.filter(id => id !== staffId);
    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments, false);
  };

  const handleSave = () => {
    staffService.assignStaffToActivityById(activityId, assignedStaffIds);
    onAssignmentChange(assignedStaffIds, true);
  };

  const handleAssignTeam = (teamId: string) => {
    if (!teamId) return;

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const teamStaff = staff.filter(s => (s as any).teamId === teamId);
    const teamStaffIds = teamStaff.map(s => s.id);

    const newAssignments = [...assignedStaffIds];
    teamStaffIds.forEach(id => {
      if (!newAssignments.includes(id)) {
        newAssignments.push(id);
      }
    });

    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments);
  };

  const calculateWorkProgress = () => {
    if (!activity || assignedStaffIds.length === 0) {
      return {
        workPerWeek: 0,
        totalWork: activity?.totalWork || 100,
        appliedWork: activity?.appliedWork || 0,
        weeksToComplete: 'N/A',
        progressPercentage: 0
      };
    }

    const workPerWeek = calculateStaffWorkContribution(
      assignedStaff, 
      category as WorkCategory
    );

    const totalWork = Math.round(activity.totalWork);
    const remainingWork = totalWork - Math.round(activity.appliedWork);
    const weeksToComplete = workPerWeek > 0 
      ? Math.ceil(remainingWork / workPerWeek)
      : 'N/A';

    const progressPercentage = totalWork > 0 
      ? (activity.appliedWork / totalWork) * 100
      : 0;

    return {
      workPerWeek: Math.round(workPerWeek),
      totalWork,
      appliedWork: Math.round(activity.appliedWork),
      weeksToComplete,
      progressPercentage
    };
  };

  const workProgress = calculateWorkProgress();

  const createProgressSegments = () => {
    if (workProgress.workPerWeek <= 0 || workProgress.weeksToComplete === 'N/A') {
      return null;
    }

    const numberOfWeeks = typeof workProgress.weeksToComplete === 'number' 
      ? workProgress.weeksToComplete
      : 0;

    const totalSegmentsWidth = 100 - workProgress.progressPercentage;

    return (
      <div 
        className="h-full absolute grid"
        style={{ 
          width: `${totalSegmentsWidth}%`, 
          left: `${workProgress.progressPercentage}%`,
          gridTemplateColumns: `repeat(${numberOfWeeks}, 1fr)`
        }}
      >
        {Array.from({ length: numberOfWeeks }).map((_, i) => {
          const weekWork = Math.min(
            workProgress.workPerWeek, 
            workProgress.totalWork - workProgress.appliedWork - (i * workProgress.workPerWeek)
          );

          if (weekWork <= 0) return null;

          return (
            <div 
              key={i}
              className="h-full bg-wine-light opacity-60 border-r border-gray-100"
              title={`Week ${i + 1}: ${Math.round(weekWork)} units`}
            />
          );
        })}
      </div>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setAssignedStaffIds(checked ? staff.map(s => s.id) : []);
    onAssignmentChange(checked ? staff.map(s => s.id) : [], false);
  };

  const getNationalityFlag = (nationality: string) => {
    // Add your nationality flag logic here.  This is a placeholder.
    return ''; // Replace with actual flag class
  };

  return (
    <div className="w-full max-h-[80vh] overflow-y-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Assign Staff to Activity</h2>

      <div className="bg-gray-50 p-4 rounded mb-6">
        <h3 className="text-lg font-medium mb-3">Work Progress Preview</h3>

        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
          <div>
            <span className="font-medium">Work per Week:</span> {workProgress.workPerWeek} units
          </div>
          <div>
            <span className="font-medium">Work Progress:</span> {workProgress.appliedWork}/{workProgress.totalWork} units
          </div>
          <div>
            <span className="font-medium">Weeks to Complete:</span> {workProgress.weeksToComplete}
          </div>
        </div>

        {workProgress.appliedWork > 0 && (
          <div className="mb-2">
            <div className="h-3 bg-gray-200 rounded-full relative">
              <div 
                className="h-3 bg-wine rounded-full absolute"
                style={{ width: `${workProgress.progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="h-8 bg-gray-200 rounded-full relative">
          <div 
            className="h-full bg-wine rounded-l-full absolute"
            style={{ width: `${workProgress.progressPercentage}%` }}
          />

          {createProgressSegments()}
        </div>

        <p className="text-xs text-gray-600 mt-2">
          The progress bar shows one segment for each week of estimated work.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    {team.icon} {team.name} ({staff.filter(s => (s as any).teamId === team.id).length} members)
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
                      {member.specializations?.length > 0 ? 
                        member.specializations.map(spec => staffService.SpecializedRoles[spec].title).join(', ') : 
                        'General Worker'} - {getSkillLevelInfo(member.skillLevel).formattedName} - {member.nationality}
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
                      {member.specializations?.length > 0 ? 
                        member.specializations.map(spec => staffService.SpecializedRoles[spec].title).join(', ') : 
                        'General Worker'} - {getSkillLevelInfo(member.skillLevel).formattedName} - {member.nationality}
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