
import React, { useState, useEffect } from 'react';
import { getGameState } from '../../gameState';
import staffService, { getSkillLevelInfo, StaffTeam } from '../../services/staffService';
import { getActivityById } from '../../lib/game/activityManager';
import { calculateStaffWorkContribution, WorkCategory } from '../../lib/game/workCalculator';
import { getNationalityFlag } from '../../lib/core/utils/formatUtils';

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
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const loadTeams = async () => {
      const loadedTeams = await staffService.loadTeams();
      setTeams(loadedTeams);
    };

    loadTeams();
  }, []);

  const { staff } = getGameState();
  const activity = getActivityById(activityId);

  const handleAssignStaff = (staffId: string, checked: boolean) => {
    let newAssignments: string[];
    if (checked) {
      newAssignments = [...assignedStaffIds, staffId];
    } else {
      newAssignments = assignedStaffIds.filter(id => id !== staffId);
    }
    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments, false);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    const newAssignments = checked ? staff.map(s => s.id) : [];
    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments, false);
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

    const assignedStaff = staff.filter(s => assignedStaffIds.includes(s.id));
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

  const renderSkillBars = (member: any) => {
    const skills = ['field', 'winery', 'administration', 'sales', 'maintenance'];
    const letters = ['F', 'W', 'A', 'S', 'M'];
    
    return (
      <div className="flex gap-1">
        {skills.map((skill, index) => {
          const skillLevel = member.skills[skill];
          const backgroundColor = skillLevel > 0.7 ? '#22c55e' : 
                                skillLevel > 0.4 ? '#facc15' : 
                                '#ef4444';
          return (
            <span
              key={skill}
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-white rounded"
              style={{ backgroundColor }}
              title={`${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${Math.round(skillLevel * 100)}%`}
            >
              {letters[index]}
            </span>
          );
        })}
      </div>
    );
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

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Available Staff</h3>
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

        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Nationality</th>
                <th className="px-4 py-2 text-left">Skills</th>
                <th className="px-4 py-2 text-right">Wage</th>
                <th className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{member.name}</td>
                  <td className="px-4 py-2">
                    <span className={`flag-icon ${getNationalityFlag(member.nationality)}`}></span>
                    {" "}{member.nationality}
                  </td>
                  <td className="px-4 py-2">
                    {renderSkillBars(member)}
                  </td>
                  <td className="px-4 py-2 text-right">€{member.wage.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={assignedStaffIds.includes(member.id)}
                      onChange={(e) => handleAssignStaff(member.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          onClick={() => {
            staffService.assignStaffToActivityById(activityId, assignedStaffIds);
            onAssignmentChange(assignedStaffIds, true);
          }}
          className="px-4 py-2 bg-wine text-white rounded hover:bg-wine-dark"
        >
          Save Assignments
        </button>
      </div>
    </div>
  );
};

export default StaffAssignmentModal;
