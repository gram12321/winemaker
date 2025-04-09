import React, { useState, useEffect } from 'react';
import { ActivityOptionsModal, ActivityOptionField, ActivityWorkEstimate } from '../activities/ActivityOptionsModal';
import { WorkCategory, calculateTotalWork, BASE_WORK_UNITS } from '../../lib/game/workCalculator';
import { GrapeVariety, COUNTRY_REGION_MAP, REGION_SOIL_TYPES, REGION_ALTITUDE_RANGES, ASPECT_FACTORS, getResourceByGrapeVariety } from '../../lib/core/constants/vineyardConstants';
import { Vineyard } from '../../lib/game/vineyard';
import { BASELINE_VINE_DENSITY } from '@/lib/core/constants/gameConstants';
import { WorkFactor } from '../activities/WorkCalculationTable';

interface PlantingOptionsModalProps {
  vineyard: Vineyard;
  onClose: () => void;
  onSubmit: (options: { grape: GrapeVariety; density: number }) => void;
}

const PlantingOptionsModal: React.FC<PlantingOptionsModalProps> = ({
  vineyard,
  onClose,
  onSubmit,
}) => {
  const [options, setOptions] = useState<{ grape: GrapeVariety; density: number }>({
    grape: 'Chardonnay', // Default grape
    density: BASELINE_VINE_DENSITY, // Default density
  });
  const [workEstimate, setWorkEstimate] = useState<ActivityWorkEstimate>({
    totalWork: 0,
    timeEstimate: 'Calculating...',
  });
  const [factors, setFactors] = useState<WorkFactor[]>([]);

  // Define the fields for the modal
  const fields: ActivityOptionField[] = [
    {
      id: 'grape',
      label: 'Grape Variety',
      type: 'select',
      defaultValue: options.grape,
      options: [ // Reverted to original 5 grape varieties
        { value: 'Barbera', label: 'Barbera' },
        { value: 'Chardonnay', label: 'Chardonnay' },
        { value: 'Pinot Noir', label: 'Pinot Noir' },
        { value: 'Primitivo', label: 'Primitivo' },
        { value: 'Sauvignon Blanc', label: 'Sauvignon Blanc' },
      ],
      required: true,
      tooltip: 'Select the type of grape to plant in this vineyard.',
    },
    {
      id: 'density',
      label: 'Planting Density (vines per acre)',
      type: 'number',
      defaultValue: options.density,
      min: 1000,
      max: 10000,
      step: 100,
      required: true,
      tooltip: `Recommended density is around ${BASELINE_VINE_DENSITY}. Higher density can increase yield but may affect quality and require more work.`,
    },
  ];

  // Calculate work estimate and factors whenever options change
  useEffect(() => {
    const grapeResource = getResourceByGrapeVariety(options.grape);
    const fragility = grapeResource?.fragile ?? 0; // Get fragility (0 = robust, 1 = fragile)
    const robustness = 1 - fragility; // Calculate actual robustness
    const fragilityModifier = fragility; // The modifier is the fragility value itself
    const altitudeEffect = 0; // Placeholder for altitude effect calculation

    const totalWork = calculateTotalWork(vineyard.acres, {
      category: WorkCategory.PLANTING,
      density: options.density,
      resourceName: options.grape, // Pass grape name for fragility calc
      // Add altitude/region if needed for altitude calc
      // altitude: vineyard.altitude,
      // country: vineyard.country,
      // region: vineyard.region,
    });

    // Basic time estimate
    const weeks = Math.ceil(totalWork / BASE_WORK_UNITS);
    const timeEstimate = `${weeks} week${weeks === 1 ? '' : 's'}`;
    
    // Construct factors for the breakdown table
    const calculatedFactors: WorkFactor[] = [
      { label: "Field Size", value: vineyard.acres, unit: "acres", isPrimary: true },
      { label: "Task", value: "Planting", isPrimary: true },
      { label: "Grape", value: options.grape },
      { label: "Plant Density", value: options.density, unit: "vines/acre" },
      { label: "Grape Robustness", value: `${(robustness * 100).toFixed(0)}% robust`, modifier: fragilityModifier, modifierLabel: "fragility effect" },
      // Example row for altitude, needs real calculation logic
      // { label: "Altitude", value: vineyard.altitude, unit: "m", modifier: altitudeEffect, modifierLabel: "altitude effect" },
    ];

    setWorkEstimate({
      totalWork: Math.round(totalWork),
      timeEstimate,
    });
    setFactors(calculatedFactors); // Update factors state

  }, [options.grape, options.density, vineyard.acres, vineyard.altitude, vineyard.country, vineyard.region]); // Add dependencies

  const handleOptionsChange = (changedOptions: Record<string, any>) => {
    setOptions({
      grape: changedOptions.grape as GrapeVariety,
      density: changedOptions.density as number,
    });
  };

  const handleSubmit = () => {
    onSubmit(options);
  };

  return (
    <ActivityOptionsModal
      title={`Plant Vineyard: ${vineyard.name}`}
      subtitle={`Configure planting options for this ${vineyard.acres.toFixed(1)} acre vineyard.`}
      category={WorkCategory.PLANTING}
      fields={fields}
      workEstimate={workEstimate}
      workFactors={factors}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Start Planting"
      options={options}
      onOptionsChange={handleOptionsChange}
    />
  );
};

export default PlantingOptionsModal; 