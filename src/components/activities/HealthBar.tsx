import React from 'react';

interface HealthBarProps {
  currentHealth: number;      // Current health value (0-1)
  projectedHealth?: number;   // Projected health after changes (0-1), optional
  title?: string;             // Optional title for the health bar
  className?: string;         // Optional additional classes
}

/**
 * Reusable HealthBar component to display vineyard health and changes
 */
const HealthBar: React.FC<HealthBarProps> = ({
  currentHealth,
  projectedHealth,
  title = 'Health Impact',
  className = '',
}) => {
  // Calculate health improvement if projected health is provided
  const hasProjection = projectedHealth !== undefined;
  const improvement = hasProjection ? projectedHealth - currentHealth : 0;
  const isPositive = improvement > 0;
  
  // Format health value as a percentage
  const formatHealth = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  return (
    <div className={`p-3 bg-blue-50 border border-blue-200 rounded-md ${className}`}>
      <h3 className="text-sm font-medium text-blue-800 mb-2">{title}</h3>
      
      {/* Current Health Bar */}
      <div className="flex items-center">
        <div className="text-sm mr-3">
          <span className="font-medium">Current:</span> {formatHealth(currentHealth)}
        </div>
        <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
          <div 
            className="h-full bg-green-600" 
            style={{ width: `${currentHealth * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Projected Health Bar - Only show if projectedHealth is provided */}
      {hasProjection && (
        <div className="flex items-center mt-2">
          <div className="text-sm mr-3">
            <span className="font-medium">After:</span> {formatHealth(projectedHealth)}
          </div>
          <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
            <div 
              className="h-full bg-green-600" 
              style={{ width: `${projectedHealth * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Health Change Text - Only show if there's a change */}
      {hasProjection && improvement !== 0 && (
        <p className={`text-xs mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{(improvement * 100).toFixed(0)}% health {isPositive ? 'improvement' : 'reduction'}
        </p>
      )}
    </div>
  );
};

export default HealthBar; 