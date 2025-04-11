import React, { useState, useEffect } from 'react';
import { ActivityOptionsModal, ActivityOptionField, ActivityWorkEstimate } from '../activities/ActivityOptionsModal';
import { WorkCategory, calculateTotalWork, BASE_WORK_UNITS } from '../../lib/game/workCalculator';
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

// Define mapping from task ID to WorkCategory for calculation
const TASK_ID_TO_CATEGORY: Record<string, WorkCategory> = {
  'remove-vines': WorkCategory.UPROOTING, // Replanting uses uprooting work
  'clear-vegetation': WorkCategory.CLEARING,
  'remove-debris': WorkCategory.CLEARING,
  'soil-amendment': WorkCategory.CLEARING
};

const ClearingOptionModal: React.FC<ClearingOptionModalProps> = ({
  vineyard,
  onClose,
  onSubmit,
}) => {
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
    replantingIntensity: 0,
    // Default based on current farming method
    isOrganicAmendment: vineyard.farmingMethod === 'Ecological' || vineyard.farmingMethod === 'Non-Conventional',
  });

  const [workEstimate, setWorkEstimate] = useState<ActivityWorkEstimate>({
    totalWork: 0,
    timeEstimate: 'Calculating...',
  });

  const [factors, setFactors] = useState<WorkFactor[]>([]);
  const [projectedHealth, setProjectedHealth] = useState<number>(vineyard.vineyardHealth);

  // --- Fields Definition --- 
  // We define fields here but render them manually
  const fields: ActivityOptionField[] = [];

  useEffect(() => {
    console.log('[ClearingOptionModal] Recalculating work...', { options, vineyardAcres: vineyard.acres });
    let totalWork = 0;
    const calculatedFactors: WorkFactor[] = [
      { label: "Field Size", value: vineyard.acres, unit: "acres", isPrimary: true },
      { label: "Task", value: "Clearing", isPrimary: true },
    ];

    // --- Calculate Work --- 
    Object.entries(options.tasks).forEach(([taskId, isSelected]) => {
      if (!isSelected) return;

      const category = TASK_ID_TO_CATEGORY[taskId];
      if (!category) return;

      let taskAmount = vineyard.acres;
      let taskSpecificFactors: any = {
        category: category,
        density: vineyard.density || 0,
        altitude: vineyard.altitude,
        country: vineyard.country,
        region: vineyard.region,
        workModifiers: [],
      };
      let taskLabel = taskId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      let modifier = 0;
      let modifierLabel = "";

      if (taskId === 'remove-vines') {
        taskAmount *= (options.replantingIntensity / 100);
        if (taskAmount > 0) {
           taskLabel = `Vine Replanting (${options.replantingIntensity}%)`;
        } else {
            return; // Skip if intensity is 0
        }
      }
      
      if (taskId === 'soil-amendment') {
        if (options.isOrganicAmendment) {
           taskSpecificFactors.workModifiers.push(0.2); // Add 20% modifier for organic
           modifier = 0.2;
           modifierLabel = "organic method effect";
        }
        taskLabel = `Soil Amendment (${options.isOrganicAmendment ? 'Organic' : 'Synthetic'})`;
      }
      
      console.log(`[ClearingOptionModal] Calculating work for task: ${taskId}`, {
         taskAmount,
         taskSpecificFactors
       });

      const workForTask = calculateTotalWork(taskAmount, taskSpecificFactors);
      
      console.log(`[ClearingOptionModal] Work calculated for ${taskId}: ${workForTask}`);
      
      totalWork += workForTask;
      
      if (workForTask > 0) {
         calculatedFactors.push({ 
           label: taskLabel, 
           value: formatNumber(workForTask, 0), 
           unit: "units",
           ...(modifier !== 0 && { modifier: modifier, modifierLabel: modifierLabel })
        });
      }
    });

    // --- Calculate Health --- 
    let healthImprovement = 0;
    if (options.tasks['clear-vegetation']) healthImprovement += 0.10;
    if (options.tasks['remove-debris']) healthImprovement += 0.05;
    if (options.tasks['soil-amendment']) healthImprovement += 0.15;
    if (options.tasks['remove-vines']) {
      healthImprovement += (options.replantingIntensity / 100) * 0.20;
    }
    
    const newHealth = Math.min(1.0, vineyard.vineyardHealth + healthImprovement);
    setProjectedHealth(newHealth);

    // --- Update State --- 
    const weeks = totalWork > 0 ? Math.ceil(totalWork / BASE_WORK_UNITS) : 0;
    const timeEstimate = `${weeks} week${weeks === 1 ? '' : 's'}`;

    setWorkEstimate({
      totalWork: Math.round(totalWork),
      timeEstimate,
    });
    setFactors(calculatedFactors);

  }, [options, vineyard]);

  const handleTaskChange = (taskId: string, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: checked,
      },
      replantingIntensity: taskId === 'remove-vines' && !checked ? 0 : prev.replantingIntensity,
    }));
  };

  const handleSliderChange = (id: string, value: number) => {
    setOptions(prev => ({
      ...prev,
      [id]: value,
      tasks: id === 'replantingIntensity' && value > 0 && vineyard.grape ? { ...prev.tasks, 'remove-vines': true } : prev.tasks,
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

  // --- Render Logic --- 
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
          </label>
        </div>
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
          </label>
        </div>
      </div>

      {/* Health Impact Section */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        {/* ... health impact content ... */}
      </div>
      {/* ActivityOptionsModal will render the WorkCalculationTable based on workFactors */}
    </ActivityOptionsModal>
  );
};

export default ClearingOptionModal;