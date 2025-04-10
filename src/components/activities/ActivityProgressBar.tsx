import React from 'react';
import { WorkCategory } from '@/lib/game/workCalculator';
import { formatNumber } from '@/lib/core/utils/formatUtils';

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
  // Calculate progress as a percentage, handling edge cases
  const formattedProgress = Math.min(100, Math.round(progress));
  
  // Get icon based on category
  const getIconForCategory = (category: WorkCategory | string): string => {
    // Define category-to-icon mapping
    const categoryIcons: Record<string, string> = {
      // Field/Vineyard activities
      [WorkCategory.PLANTING]: '🌿',
      [WorkCategory.HARVESTING]: '🌿',
      [WorkCategory.CLEARING]: '🌿',
      [WorkCategory.UPROOTING]: '🌿',
      
      // Winery activities
      [WorkCategory.CRUSHING]: '🍷',
      [WorkCategory.FERMENTATION]: '🍷',
      
      // Administrative activities
      [WorkCategory.ADMINISTRATION]: '📋',
      [WorkCategory.STAFF_SEARCH]: '🔍',
      
      // Building/maintenance activities
      [WorkCategory.BUILDING]: '🔧',
      [WorkCategory.UPGRADING]: '🔧',
      [WorkCategory.MAINTENANCE]: '🔧',
    };
    
    return categoryIcons[category] || '📊';
  };
  
  // Get color based on category
  const getColorForCategory = (category: WorkCategory | string): string => {
    // Define category-to-color mapping using color classes
    const categoryColors: Record<string, string> = {
      // Field/Vineyard activities - green theme
      [WorkCategory.PLANTING]: 'bg-green-600',
      [WorkCategory.HARVESTING]: 'bg-green-600',
      [WorkCategory.CLEARING]: 'bg-green-600',
      [WorkCategory.UPROOTING]: 'bg-green-600',
      
      // Winery activities - wine/purple theme
      [WorkCategory.CRUSHING]: 'bg-wine',
      [WorkCategory.FERMENTATION]: 'bg-wine',
      
      // Administrative activities - blue theme
      [WorkCategory.ADMINISTRATION]: 'bg-blue-600',
      [WorkCategory.STAFF_SEARCH]: 'bg-purple-600',
      
      // Building/maintenance activities - gray theme
      [WorkCategory.BUILDING]: 'bg-gray-600',
      [WorkCategory.UPGRADING]: 'bg-gray-600',
      [WorkCategory.MAINTENANCE]: 'bg-gray-600',
    };
    
    return categoryColors[category] || 'bg-wine';
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
          {formatNumber(appliedWork, 0)} / {formatNumber(totalWork, 0)} work points
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