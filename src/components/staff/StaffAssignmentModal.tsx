import React, { useState, useEffect } from 'react';
import { getGameState, Staff } from '../../gameState';
import staffService, { StaffTeam } from '../../services/staffService';
import { getActivityById } from '../../lib/game/activityManager';
import { calculateStaffWorkContribution, WorkCategory } from '../../lib/game/workCalculator';
import { formatNumber } from '../../lib/core/utils/formatUtils';
import { toast } from '../../lib/ui/toast';
import { getCountryCodeForFlag } from '../../lib/core/utils/formatUtils';

interface StaffAssignmentModalProps {
  activityId: string;
  category: string | WorkCategory;
  onClose: () => void;
  initialAssignedStaffIds?: string[];
  onAssignmentChange: (staffIds: string[], finalSave?: boolean) => void;
}

/**
 * Staff Assignment Modal Component
 * Allows assigning staff members to any kind of activity
 */
const StaffAssignmentModal: React.FC<StaffAssignmentModalProps> = ({ 
  activityId, 
  category,
  onClose,
  initialAssignedStaffIds = [],
  onAssignmentChange
}) => {
  const { staff } = getGameState();
  
  // Get currently assigned staff from the activity
  const activity = getActivityById(activityId);
  const currentlyAssignedStaff = activity?.params?.assignedStaffIds || [];
  
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>(() => {
    // Initialize with either the prop value or currently assigned staff
    const initialIds = initialAssignedStaffIds.length > 0 ? initialAssignedStaffIds : currentlyAssignedStaff;
    return initialIds;
  });
  
  const [selectAll, setSelectAll] = useState(() => {
    const isAllSelected = assignedStaffIds.length === staff.length;
    return isAllSelected;
  });
  
  const [teams, setTeams] = useState<StaffTeam[]>([]);
  const [activityName, setActivityName] = useState<string>('');

  useEffect(() => {
    // Load teams
    const loadTeams = async () => {
      const loadedTeams = await staffService.loadTeams();
      setTeams(loadedTeams);
    };

    loadTeams();
    
    // Set a human-readable name for the activity category
    if (activity) {
      let readableName = activity.params?.title || 
                        `${String(category).charAt(0).toUpperCase()}${String(category).slice(1)} Activity`;
      setActivityName(readableName);
    } else {
      setActivityName('Activity');
    }
  }, [activity, category]);

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

    const teamStaff = staff.filter(s => s.teamId === teamId);
    const teamStaffIds = teamStaff.map(s => s.id);

    const newAssignments = [...assignedStaffIds];
    teamStaffIds.forEach(id => {
      if (!newAssignments.includes(id)) {
        newAssignments.push(id);
      }
    });

    setAssignedStaffIds(newAssignments);
    onAssignmentChange(newAssignments, false);
  };

  // Determine the most relevant skill for this activity category
  const getRelevantSkillForCategory = (categoryName: string | WorkCategory): string => {
    // Default mapping of categories to primary skills
    const categoryToSkill: Record<string, string> = {
      [WorkCategory.PLANTING]: 'field',
      [WorkCategory.HARVESTING]: 'field',
      [WorkCategory.CLEARING]: 'field',
      [WorkCategory.UPROOTING]: 'field',
      [WorkCategory.CRUSHING]: 'winery',
      [WorkCategory.FERMENTATION]: 'winery',
      [WorkCategory.ADMINISTRATION]: 'administration',
      [WorkCategory.STAFF_SEARCH]: 'administration',
      [WorkCategory.BUILDING]: 'maintenance',
      [WorkCategory.UPGRADING]: 'maintenance',
      [WorkCategory.MAINTENANCE]: 'maintenance',
    };
    
    return categoryToSkill[categoryName as string] || 'field'; // Default to field skill
  };

  interface WorkProgressInfo {
    workPerWeek: number;
    totalWork: number;
    appliedWork: number;
    weeksToComplete: number | string;
    progressPercentage: number;
    relevantSkill: string;
  }

  const calculateWorkProgress = (): WorkProgressInfo => {
    if (!activity || assignedStaffIds.length === 0) {
      return {
        workPerWeek: 0,
        totalWork: activity?.totalWork || 100,
        appliedWork: activity?.appliedWork || 0,
        weeksToComplete: 'N/A',
        progressPercentage: 0,
        relevantSkill: getRelevantSkillForCategory(category)
      };
    }

    const assignedStaff = staff.filter(s => assignedStaffIds.includes(s.id));
    
    // Convert the category to WorkCategory type for calculation
    const workCategoryValue = category as WorkCategory;
    
    // Calculate staff work contribution
    const workPerWeek = calculateStaffWorkContribution(
      assignedStaff, 
      workCategoryValue
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
      progressPercentage,
      relevantSkill: getRelevantSkillForCategory(category)
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
              title={`Week ${i + 1}: ${formatNumber(weekWork, 0)} units`}
            />
          );
        })}
      </div>
    );
  };

  interface SkillBarInfo {
    key: keyof Staff['skills'];
    letter: string;
    color: string;
  }

  const renderSkillBars = (member: Staff) => {
    const skills: SkillBarInfo[] = [
      { key: 'field', letter: 'F', color: '#ffcc00' },
      { key: 'winery', letter: 'W', color: '#2179ff' },
      { key: 'administration', letter: 'A', color: '#6c757d' },
      { key: 'sales', letter: 'S', color: '#28a745' },
      { key: 'maintenance', letter: 'M', color: '#d9534f' }
    ];
    
    // Highlight the most relevant skill for this activity
    const relevantSkill = workProgress.relevantSkill;
    
    return (
      <div className="flex gap-1 w-48">
        {skills.map((skill) => {
          const skillLevel = member.skills[skill.key];
          const isRelevant = skill.key === relevantSkill;
          
          return (
            <div 
              key={skill.key}
              className={`h-5 flex items-center justify-center text-xs font-medium text-white ${isRelevant ? 'ring-2 ring-yellow-300' : ''}`}
              style={{ 
                backgroundColor: skill.color,
                width: `${Math.round(skillLevel * 100)}%`
              }}
              title={`${skill.key.charAt(0).toUpperCase() + skill.key.slice(1)}: ${Math.round(skillLevel * 100)}%${isRelevant ? ' (Relevant for this activity)' : ''}`}
            >
              {skill.letter}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-h-[80vh] overflow-y-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Assign Staff to {activityName}</h2>

      <div className="bg-gray-50 p-4 rounded mb-6">
        <h3 className="text-lg font-medium mb-3">Work Progress Preview</h3>

        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
          <div>
            <span className="font-medium">Work per Week:</span> {formatNumber(workProgress.workPerWeek, 0)} units
          </div>
          <div>
            <span className="font-medium">Work Progress:</span> {formatNumber(workProgress.appliedWork, 0)}/{formatNumber(workProgress.totalWork, 0)} units
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
          <span className="font-medium ml-1">
            Primary skill for this activity: {workProgress.relevantSkill.charAt(0).toUpperCase() + workProgress.relevantSkill.slice(1)}
          </span>
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
                  {team.icon} {team.name} ({staff.filter(s => s.teamId === team.id).length} members)
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
                <th className="px-4 py-2 text-right">Wage (€/mo)</th>
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
                    <span className={`fi ${getCountryCodeForFlag(member.nationality)} mr-1`}></span>
                    {" "}{member.nationality}
                  </td>
                  <td className="px-4 py-2">
                    {renderSkillBars(member)}
                  </td>
                  <td className="px-4 py-2 text-right">€{formatNumber(member.wage)}</td>
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
            // Get current activity to verify it exists before saving
            const currentActivity = getActivityById(activityId);
            if (!currentActivity) {
              console.error(`Cannot save staff assignments - activity ${activityId} not found`);
              toast({
                title: 'Error',
                description: 'The activity no longer exists.',
                variant: 'destructive'
              });
              onClose();
              return;
            }
            
            // Save the assignments using the staffService
            const result = staffService.assignStaffToActivityById(activityId, assignedStaffIds);
            
            if (result) {
              toast({
                title: 'Success',
                description: `${assignedStaffIds.length} staff ${assignedStaffIds.length === 1 ? 'member' : 'members'} assigned to ${activityName}.`,
                variant: 'default'
              });
              
              // Only call the callback if successful
              onAssignmentChange(assignedStaffIds, true);
              
              // Close the modal after successful assignment
              onClose();
            } else {
              toast({
                title: 'Error',
                description: 'Failed to assign staff members.',
                variant: 'destructive'
              });
            }
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
