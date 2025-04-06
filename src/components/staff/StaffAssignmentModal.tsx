import React, { useState, useEffect } from 'react';
import { getGameState } from '../../gameState';
import staffService, { getSkillLevelInfo, StaffTeam } from '../../services/staffService';
import { getActivityById } from '../../lib/game/activityManager';
import { calculateStaffWorkContribution, WorkCategory } from '../../lib/game/workCalculator';
import { getNationalityFlag, formatCurrency, getFallbackFlag } from '../../lib/core/utils'; // Import utility functions

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

  const handleStaffSelection = (staffId: string, checked: boolean) => {
    const newAssignments = checked 
      ? [...assignedStaffIds, staffId]
      : assignedStaffIds.filter(id => id !== staffId);
    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments, false);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    const newAssignments = checked ? staff.map(s => s.id) : [];
    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments, false);
  };

  const handleSave = () => {
    staffService.assignStaffToActivityById(activityId, assignedStaffIds);
    onAssignmentChange(assignedStaffIds, true);
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

  const renderSkillBars = (staffMember: any) => {
    const skills = {
      field: { color: '#ffcc00', label: 'F' },
      winery: { color: '#2179ff', label: 'W' },
      administration: { color: '#6c757d', label: 'A' },
      sales: { color: '#28a745', label: 'S' },
      maintenance: { color: '#d9534f', label: 'M' }
    };

    return (
      <div className="flex gap-1 h-5">
        {Object.entries(skills).map(([skill, { color, label }]) => (
          <div 
            key={skill}
            className="relative flex-1 bg-gray-200 rounded"
            title={`${skill.charAt(0).toUpperCase() + skill.slice(1)} Skill: ${staffMember.skills?.[skill] || 0}`}
          >
            <div
              className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold"
              style={{
                width: `${(staffMember.skills?.[skill] || 0) * 100}%`,
                backgroundColor: color,
                minWidth: '20px'
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const workProgress = calculateWorkProgress();

  return (
    <div className="w-full max-h-[80vh] overflow-y-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Assign Staff to Activity</h2>

      {/* Work Progress Preview */}
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

        <div className="h-4 bg-gray-200 rounded-full relative">
          <div 
            className="h-full bg-wine rounded-l-full"
            style={{ width: `${workProgress.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Available Staff</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="mr-2"
            />
            Select All
          </label>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Nationality</th>
              <th className="text-left p-2">Skills</th>
              <th className="text-right p-2">Wage</th>
              <th className="text-center p-2">Select</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.id} className="border-t">
                <td className="p-2">{member.name}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <img 
                      src={getNationalityFlag(member.nationality)}
                      alt={member.nationality}
                      className="w-4 h-4"
                      onError={(e) => {
                        e.currentTarget.src = getFallbackFlag();
                      }}
                    />
                    {member.nationality}
                  </div>
                </td>
                <td className="p-2">{renderSkillBars(member)}</td>
                <td className="p-2 text-right">{formatCurrency(member.wage)}</td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={assignedStaffIds.includes(member.id)}
                    onChange={(e) => handleStaffSelection(member.id, e.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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