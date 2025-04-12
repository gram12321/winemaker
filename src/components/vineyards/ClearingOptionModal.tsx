import React, { useState, useEffect } from 'react';
import { ActivityOptionsModal, ActivityOptionField, ActivityWorkEstimate } from '../activities/ActivityOptionsModal';
import { WorkCategory, calculateTotalWork, getDefaultRate, getDefaultInitialWork } from '../../lib/game/workCalculator';
import { Vineyard } from '../../lib/game/vineyard';
import { DEFAULT_VINEYARD_HEALTH } from '@/lib/core/constants/gameConstants';
import { WorkFactor } from '../activities/WorkCalculationTable';
import { formatNumber } from '@/lib/core/utils/formatUtils';

interface ClearingOptionModalProps {
  vineyard: Vineyard;
  onClose: () => void;
  onSubmit: (options: {
    tasks: { [key: string]: boolean }; // Use object for tasks
    replantingIntensity: number; // 0-100
    isOrganicAmendment: boolean;
  }) => void;
}

// ===== CLEARING-SPECIFIC CONSTANTS =====
// Clearing sub-task rates (acres per week)
const CLEARING_SUBTASK_RATES = {
  'clear-vegetation': 0.5, // 0.5 acres/week for vegetation clearing
  'remove-debris': 0.4,    // 0.4 acres/week for debris removal
  'soil-amendment': 0.8    // 0.8 acres/week for soil amendment
};

// Initial setup work for each clearing sub-task
const CLEARING_SUBTASK_INITIAL_WORK = {
  'clear-vegetation': 20,  // Initial setup work for vegetation clearing
  'remove-debris': 15,     // Initial setup work for debris removal
  'soil-amendment': 25     // Initial setup work for soil amendment
};

const ClearingOptionModal: React.FC<ClearingOptionModalProps> = ({
  vineyard,
  onClose,
  onSubmit,
}) => {
  // ===== STATE MANAGEMENT =====
  const [options, setOptions] = useState<{
    tasks: { [key: string]: boolean };
    replantingIntensity: number;
    isOrganicAmendment: boolean;
  }>({
    tasks: {
      'remove-vines': false,
      'clear-vegetation': false,
      'remove-debris': false,
      'soil-amendment': false,
    },
    replantingIntensity: 100, // Default to 100% for remove-vines
    // Default based on current farming method
    isOrganicAmendment: vineyard.farmingMethod === 'Ecological' || vineyard.farmingMethod === 'Non-Conventional',
  });

  const [workEstimate, setWorkEstimate] = useState<ActivityWorkEstimate>({
    totalWork: 0,
    timeEstimate: 'Calculating...',
  });

  const [factors, setFactors] = useState<WorkFactor[]>([]);
  const [projectedHealth, setProjectedHealth] = useState<number>(vineyard.vineyardHealth);

  // We define fields here but render them manually
  const fields: ActivityOptionField[] = [];

  // ===== WORK CALCULATION LOGIC =====
  useEffect(() => {
    console.log('[ClearingOptionModal] Recalculating work...', { options, vineyardAcres: vineyard.acres });
    
    // Calculate clearing work - similar to the previous special handling in workCalculator.ts
    let totalClearingWork = 0;
    const calculatedFactors: WorkFactor[] = [
      { label: "Field Size", value: vineyard.acres, unit: "acres", isPrimary: true },
      { label: "Task", value: "Clearing", isPrimary: true },
    ];

    // Process each selected task
    Object.entries(options.tasks).forEach(([taskId, isSelected]) => {
      if (!isSelected) return;

      // Skip tasks with 0 amount
      let taskAmount = vineyard.acres;
      let taskLabel = taskId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      let workModifiers: number[] = [];
      let rate: number;
      let initialWork: number;
      let useDensityAdjustment = false;

      // Handle each task type differently
      if (taskId === 'remove-vines') {
        // Handle vine removal (uses UPROOTING category)
        taskAmount *= (options.replantingIntensity / 100);
        if (taskAmount <= 0) return; // Skip if no work to do
          
        rate = getDefaultRate(WorkCategory.UPROOTING);
        initialWork = getDefaultInitialWork(WorkCategory.UPROOTING);
        useDensityAdjustment = true;
        taskLabel = `Vine Replanting (${options.replantingIntensity}%)`;
      } else if (taskId in CLEARING_SUBTASK_RATES) {
        // Handle standard clearing sub-tasks
        rate = CLEARING_SUBTASK_RATES[taskId as keyof typeof CLEARING_SUBTASK_RATES];
        initialWork = CLEARING_SUBTASK_INITIAL_WORK[taskId as keyof typeof CLEARING_SUBTASK_INITIAL_WORK];
          
        // No work penalty for organic amendment - just label it differently
        if (taskId === 'soil-amendment') {
          taskLabel = `Soil Amendment (${options.isOrganicAmendment ? 'Organic' : 'Synthetic'})`;
        }
      } else {
        console.warn(`[ClearingOptionModal] Unknown task ID: ${taskId}`);
        return; // Skip unknown tasks
      }

      // Calculate work for this task using the simplified calculator
      const taskWork = calculateTotalWork(taskAmount, {
        rate,
        initialWork,
        density: useDensityAdjustment ? vineyard.density : undefined,
        useDensityAdjustment,
        workModifiers
      });
      
      // Add to total work
      totalClearingWork += taskWork;
      
      // Add to factors for display
      calculatedFactors.push({ 
        label: taskLabel, 
        value: formatNumber(taskWork, 0), 
        unit: "units"
        // Removed the modifier display since we don't apply one for organic
      });
    });

    // ===== HEALTH CALCULATION LOGIC =====
    // Calculate health improvement from selected tasks
    let healthImprovement = 0;
    if (options.tasks['clear-vegetation']) healthImprovement += 0.10;
    if (options.tasks['remove-debris']) healthImprovement += 0.05;
    if (options.tasks['soil-amendment']) healthImprovement += 0.15;
    if (options.tasks['remove-vines']) {
      healthImprovement += (options.replantingIntensity / 100) * 0.20;
    }
    
    const newHealth = Math.min(1.0, vineyard.vineyardHealth + healthImprovement);
    setProjectedHealth(newHealth);

    // ===== UPDATE UI STATE =====
    // Calculate time estimate based on work
    const BASE_WORK_UNITS = 50; // Match the value in workCalculator.ts
    const weeks = totalClearingWork > 0 ? Math.ceil(totalClearingWork / BASE_WORK_UNITS) : 0;
    const timeEstimate = `${weeks} week${weeks === 1 ? '' : 's'}`;

    setWorkEstimate({
      totalWork: Math.round(totalClearingWork),
      timeEstimate,
    });
    setFactors(calculatedFactors);

  }, [options, vineyard]);

  // ===== EVENT HANDLERS =====
  const handleTaskChange = (taskId: string, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: checked,
      },
      // Reset replanting intensity if removing vines is unchecked
      replantingIntensity: taskId === 'remove-vines' && !checked ? 0 : prev.replantingIntensity,
    }));
  };

  const handleSliderChange = (id: string, value: number) => {
    setOptions(prev => ({
      ...prev,
      [id]: value,
      // Auto-check remove-vines if intensity is set above 0
      tasks: id === 'replantingIntensity' && value > 0 && vineyard.grape 
        ? { ...prev.tasks, 'remove-vines': true } 
        : prev.tasks,
    }));
  };
  
  const handleAmendmentMethodChange = (isOrganic: boolean) => {
    setOptions(prev => ({ ...prev, isOrganicAmendment: isOrganic }));
  };

  const handleSubmit = () => {
    const finalOptions = { ...options };
    if (!options.tasks['remove-vines']) {
        finalOptions.replantingIntensity = 0;
    }
    onSubmit(finalOptions);
  };

  const canSubmit = (opts: Record<string, any>): boolean => {
    const tasks = opts.tasks as { [key: string]: boolean } | undefined;
    return tasks ? Object.values(tasks).some(isSelected => isSelected) : false;
  };

  // ===== RENDER UI =====
  return (
    <ActivityOptionsModal
      title={`Clear Vineyard: ${vineyard.name}`}
      subtitle={`Select clearing tasks to improve the health of this ${vineyard.acres.toFixed(1)} acre vineyard.`}
      category={WorkCategory.CLEARING}
      fields={fields}
      workEstimate={workEstimate}
      workFactors={factors}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Start Clearing"
      options={options}
      onOptionsChange={() => {}}
      canSubmit={canSubmit}
      disabledMessage="You must select at least one clearing task"
    >
      {/* Manual field rendering */}
      <div className="space-y-4 mb-6">
        {/* Vine Replanting - Show checkbox first, slider appears below if checked */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="remove-vines"
            checked={options.tasks['remove-vines']}
            onChange={(e) => handleTaskChange('remove-vines', e.target.checked)}
            disabled={!vineyard.grape}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-wine focus:ring-wine disabled:opacity-50"
          />
          <label htmlFor="remove-vines" className={`text-sm ${!vineyard.grape ? 'text-gray-400' : 'text-gray-700'}`}>
            Remove vines
            {vineyard.grape && (
              <span className="text-xs text-gray-500 ml-2">
                (Current: {vineyard.grape})
              </span>
            )}
          </label>
        </div>
        
        {/* Vine Replanting Slider - only show if checkbox is checked */}
        {options.tasks['remove-vines'] && (
          <div className="ml-6 mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={options.replantingIntensity}
              onChange={(e) => handleSliderChange('replantingIntensity', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-sm text-gray-700 mt-1">
              Replanting intensity: <span className="font-medium">{options.replantingIntensity}%</span>
              {vineyard.vineAge > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  (Vine age: {vineyard.vineAge.toFixed(1)} → 
                  {(vineyard.vineAge * (1 - options.replantingIntensity/100)).toFixed(1)} years)
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Clear Vegetation */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="clear-vegetation"
            checked={options.tasks['clear-vegetation']}
            onChange={(e) => handleTaskChange('clear-vegetation', e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-wine focus:ring-wine disabled:opacity-50"
          />
          <label htmlFor="clear-vegetation" className="text-sm text-gray-700">
            Clear vegetation
            <span className="text-xs text-gray-500 ml-2">
              (+10% health)
            </span>
          </label>
        </div>
        
        {/* Debris Removal */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="remove-debris"
            checked={options.tasks['remove-debris']}
            onChange={(e) => handleTaskChange('remove-debris', e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-wine focus:ring-wine disabled:opacity-50"
          />
          <label htmlFor="remove-debris" className="text-sm text-gray-700">
            Remove debris
            <span className="text-xs text-gray-500 ml-2">
              (+5% health)
            </span>
          </label>
        </div>
        
        {/* Soil Amendment */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="soil-amendment"
            checked={options.tasks['soil-amendment']}
            onChange={(e) => handleTaskChange('soil-amendment', e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-wine focus:ring-wine disabled:opacity-50"
          />
          <label htmlFor="soil-amendment" className="text-sm text-gray-700">
            Soil amendment
            <span className="text-xs text-gray-500 ml-2">
              (+15% health)
            </span>
          </label>
        </div>
        
        {/* Show amendment method options only if soil amendment is selected */}
        {options.tasks['soil-amendment'] && (
          <div className="ml-6 mt-2">
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-wine focus:ring-wine h-4 w-4"
                  name="amendment-method"
                  checked={!options.isOrganicAmendment}
                  onChange={() => handleAmendmentMethodChange(false)}
                />
                <span className="ml-2 text-sm text-gray-700">Synthetic</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-wine focus:ring-wine h-4 w-4"
                  name="amendment-method"
                  checked={options.isOrganicAmendment}
                  onChange={() => handleAmendmentMethodChange(true)}
                />
                <span className="ml-2 text-sm text-gray-700">Organic</span>
                <span className="text-xs text-gray-500 ml-2">(Changes farming method)</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current farming method: <span className="font-medium">{vineyard.farmingMethod}</span>
              {vineyard.organicYears > 0 && (
                <span> ({vineyard.organicYears}/{DEFAULT_VINEYARD_HEALTH} years organic)</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Health Impact Section */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Health Impact</h3>
        <div className="flex items-center">
          <div className="text-sm mr-3">
            <span className="font-medium">Current:</span> {(vineyard.vineyardHealth * 100).toFixed(0)}%
          </div>
          <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
            <div 
              className="h-full bg-green-600" 
              style={{ width: `${vineyard.vineyardHealth * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="flex items-center mt-2">
          <div className="text-sm mr-3">
            <span className="font-medium">After:</span> {(projectedHealth * 100).toFixed(0)}%
          </div>
          <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
            <div 
              className="h-full bg-green-600" 
              style={{ width: `${projectedHealth * 100}%` }}
            ></div>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Health improvement: +{((projectedHealth - vineyard.vineyardHealth) * 100).toFixed(0)}%
        </p>
      </div>
    </ActivityOptionsModal>
  );
};

export default ClearingOptionModal;