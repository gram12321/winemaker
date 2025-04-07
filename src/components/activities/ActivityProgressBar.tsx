import React from 'react';
import { WorkCategory } from '@/lib/game/workCalculator';
import { getActivityById } from '@/lib/game/activityManager';
import { useDisplayUpdate } from '@/lib/game/displayManager';

// Interface for the activity progress bar props
interface ActivityProgressBarProps {
  activityId: string;
  title: string;
  category: WorkCategory;
  progress: number;
  appliedWork: number;
  totalWork: number;
  onAssignStaff?: () => void;
  className?: string;
}

/**
 * Activity Progress Bar Component
 * Displays progress of an activity with customized styling based on category
 */
export const ActivityProgressBar: React.FC<ActivityProgressBarProps> = ({
  activityId,
  title,
  category,
  progress,
  appliedWork,
  totalWork,
  onAssignStaff,
  className = '',
}) => {
  // Use the display update hook - this is an authorized exception to the no-hooks rule
  useDisplayUpdate();
  
  // Get the latest activity data directly
  const activity = getActivityById(activityId);
  
  // Use the latest activity data if available, otherwise use the props
  const actualAppliedWork = activity?.appliedWork ?? appliedWork;
  const actualTotalWork = activity?.totalWork ?? totalWork;
  
  // Calculate progress as a percentage, handling edge cases
  const calculateProgress = (): number => {
    if (actualTotalWork <= 0) return 0;
    return Math.min(100, (actualAppliedWork / actualTotalWork) * 100);
  };
  
  // Format progress as a percentage
  const formattedProgress = Math.min(100, Math.round(calculateProgress()));
  
  // Log the progress values for debugging
  console.log(`[ActivityProgressBar] Rendering activity ${activityId}: ${title}`);
  console.log(`[ActivityProgressBar] Raw work values: ${actualAppliedWork}/${actualTotalWork}`);
  console.log(`[ActivityProgressBar] Progress percentage: ${formattedProgress}%`);
  
  // Get icon based on category
  const getIconForCategory = (category: WorkCategory) => {
    switch (category) {
      case WorkCategory.PLANTING:
      case WorkCategory.HARVESTING:
      case WorkCategory.CLEARING:
      case WorkCategory.UPROOTING:
        return '🌿';
      case WorkCategory.CRUSHING:
      case WorkCategory.FERMENTATION:
        return '🍷';
      case WorkCategory.ADMINISTRATION:
        return '📋';
      case WorkCategory.STAFF_SEARCH:
        return '🔍';
      case WorkCategory.BUILDING:
      case WorkCategory.UPGRADING:
      case WorkCategory.MAINTENANCE:
        return '🔧';
      default:
        return '📊';
    }
  };
  
  // Get color based on category
  const getColorForCategory = (category: WorkCategory) => {
    switch (category) {
      case WorkCategory.PLANTING:
      case WorkCategory.HARVESTING:
      case WorkCategory.CLEARING:
      case WorkCategory.UPROOTING:
        return 'bg-green-600';
      case WorkCategory.CRUSHING:
      case WorkCategory.FERMENTATION:
        return 'bg-wine';
      case WorkCategory.ADMINISTRATION:
        return 'bg-blue-600';
      case WorkCategory.STAFF_SEARCH:
        return 'bg-purple-600';
      case WorkCategory.BUILDING:
      case WorkCategory.UPGRADING:
      case WorkCategory.MAINTENANCE:
        return 'bg-gray-600';
      default:
        return 'bg-wine';
    }
  };
  
  const color = getColorForCategory(category);
  const icon = getIconForCategory(category);
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`} data-activity-id={activityId}>
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium flex items-center">
          <span className="mr-2">{icon}</span>
          <span>{title}</span>
        </div>
        <span className="text-sm font-medium">{formattedProgress}%</span>
      </div>
      
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`${color} rounded-full h-2 transition-all duration-300`} 
            style={{ width: `${formattedProgress}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-600">
          {Math.round(actualAppliedWork)} / {Math.round(actualTotalWork)} work points
        </div>
        
        {onAssignStaff && (
          <button
            className="bg-wine text-white px-3 py-1 text-sm rounded hover:bg-wine-dark"
            onClick={onAssignStaff}
          >
            Assign Staff
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityProgressBar; 