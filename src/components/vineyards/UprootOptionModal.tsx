import React, { useState, useEffect } from 'react';
import { ActivityOptionsModal, ActivityWorkEstimate } from '../activities/ActivityOptionsModal';
import { WorkCategory, calculateTotalWork, BASE_WORK_UNITS } from '../../lib/game/workCalculator';
import { Vineyard } from '../../lib/game/vineyard';
import { DEFAULT_VINEYARD_HEALTH } from '@/lib/core/constants/gameConstants';
import { WorkFactor } from '../activities/WorkCalculationTable';

interface UprootOptionModalProps {
  vineyard: Vineyard;
  onClose: () => void;
  onSubmit: () => void;
}

const UprootOptionModal: React.FC<UprootOptionModalProps> = ({
  vineyard,
  onClose,
  onSubmit,
}) => {
  const [options, setOptions] = useState<Record<string, any>>({});
  const [workEstimate, setWorkEstimate] = useState<ActivityWorkEstimate>({
    totalWork: 0,
    timeEstimate: 'Calculating...',
  });
  const [factors, setFactors] = useState<WorkFactor[]>([]);

  // Calculate work estimate and factors when component mounts
  useEffect(() => {
    const totalWork = calculateTotalWork(vineyard.acres, {
      category: WorkCategory.UPROOTING,
      density: vineyard.density || 0,
      altitude: vineyard.altitude,
      country: vineyard.country,
      region: vineyard.region,
    });

    // Basic time estimate
    const weeks = Math.ceil(totalWork / BASE_WORK_UNITS);
    const timeEstimate = `${weeks} week${weeks === 1 ? '' : 's'}`;
    
    // Construct factors for the breakdown table
    const calculatedFactors: WorkFactor[] = [
      { label: "Field Size", value: vineyard.acres, unit: "acres", isPrimary: true },
      { label: "Task", value: "Uprooting", isPrimary: true },
      { label: "Grape", value: vineyard.grape || 'None' },
      { label: "Vine Density", value: vineyard.density || 0, unit: "vines/acre" },
      { label: "Vine Age", value: vineyard.vineAge || 0, unit: "years", modifier: (vineyard.vineAge || 0) > 10 ? 0.2 : 0 },
      { label: "Altitude", value: vineyard.altitude, unit: "m" },
    ];

    setWorkEstimate({
      totalWork: Math.round(totalWork),
      timeEstimate,
    });
    setFactors(calculatedFactors);
  }, [vineyard]);

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <ActivityOptionsModal
      title={`Uproot Vineyard: ${vineyard.name}`}
      subtitle={`You are about to uproot ${vineyard.grape || 'this vineyard'}. This action cannot be undone and will destroy the current plantation.`}
      category={WorkCategory.UPROOTING}
      fields={[]} // No configurable options for uprooting
      workEstimate={workEstimate}
      workFactors={factors}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Start Uprooting"
      options={options}
      onOptionsChange={setOptions}
      warningMessage={`Uprooting will reset the vineyard health to ${DEFAULT_VINEYARD_HEALTH * 100}% and remove all planted grapes.`}
    >
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-medium text-amber-800 mb-1">Health Impact</h3>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-300" 
              style={{ width: `${vineyard.vineyardHealth * 100}%` }}
            />
          </div>
          <span className="ml-2 text-sm font-medium">→</span>
          <div className="w-full ml-2 bg-gray-200 h-4 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-300" 
              style={{ width: `${DEFAULT_VINEYARD_HEALTH * 100}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Current: {Math.round(vineyard.vineyardHealth * 100)}% → After: {Math.round(DEFAULT_VINEYARD_HEALTH * 100)}%
        </p>
      </div>
    </ActivityOptionsModal>
  );
};

export default UprootOptionModal; 