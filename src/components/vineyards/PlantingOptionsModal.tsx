import React, { useState, useEffect } from 'react';
import { ActivityOptionsModal, ActivityOptionField, ActivityWorkEstimate } from '../activities/ActivityOptionsModal';
import { WorkCategory, calculateTotalWork, BASE_WORK_UNITS, TASK_RATES, INITIAL_WORK, DENSITY_BASED_TASKS } from '../../lib/game/workCalculator';
import { GrapeVariety, COUNTRY_REGION_MAP, REGION_SOIL_TYPES, REGION_ALTITUDE_RANGES, ASPECT_FACTORS, getResourceByGrapeVariety } from '../../lib/core/constants/vineyardConstants';
import { Vineyard } from '../../lib/game/vineyard';
import { BASELINE_VINE_DENSITY } from '@/lib/core/constants/gameConstants';
import { WorkFactor } from '../activities/WorkCalculationTable';
import { formatNumber } from '@/lib/core/utils/formatUtils';

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
    const fragilityModifier = fragility; // Modifier increases work for fragile grapes

    // Calculate altitude modifier
    let altitudeModifier = 0;
    const countryData = REGION_ALTITUDE_RANGES[vineyard.country as keyof typeof REGION_ALTITUDE_RANGES];
    const altitudeRange = countryData ? (countryData[vineyard.region as keyof typeof countryData] as [number, number] || null) : null;
    if (altitudeRange) {
      const [minAltitude, maxAltitude] = altitudeRange;
      if (maxAltitude > minAltitude) {
        const medianAltitude = (minAltitude + maxAltitude) / 2;
        // Calculate deviation from median, positive for high altitude, negative for low
        // Modifier increases work for altitudes further from the median (0.5x deviation)
        const altitudeDeviation = Math.abs(vineyard.altitude - medianAltitude) / ((maxAltitude - minAltitude) / 2); // Normalize deviation 0 to 1+
        altitudeModifier = altitudeDeviation * 0.5; // Apply 0.5 factor to deviation
      }
    }

    // Prepare factors for calculateTotalWork
    const workModifiers = [fragilityModifier, altitudeModifier]; // Combine modifiers
    const rate = TASK_RATES[WorkCategory.PLANTING];
    const initialWork = INITIAL_WORK[WorkCategory.PLANTING];
    const useDensityAdjustment = DENSITY_BASED_TASKS.includes(WorkCategory.PLANTING);

    const totalWork = calculateTotalWork(vineyard.acres, {
      rate,
      initialWork,
      density: options.density,
      useDensityAdjustment,
      workModifiers,
    });

    // Basic time estimate
    const weeks = Math.ceil(totalWork / BASE_WORK_UNITS);
    const timeEstimate = `${weeks} week${weeks === 1 ? '' : 's'}`;

    // Construct factors for the breakdown table
    const robustness = 1 - fragility; // For display label
    const calculatedFactors: WorkFactor[] = [
      { label: "Field Size", value: vineyard.acres, unit: "acres", isPrimary: true },
      { label: "Task", value: "Planting", isPrimary: true },
      { label: "Grape", value: options.grape },
      { label: "Plant Density", value: options.density, unit: "vines/acre" },
      // Pass the fragility modifier (higher value means more work)
      { label: "Grape Fragility", value: `${(fragility * 100).toFixed(0)}% fragile`, modifier: fragilityModifier, modifierLabel: "fragility effect" },
      // Pass the altitude modifier (higher value means more work)
      // Format the altitude modifier for display
      { label: "Altitude Deviation", value: `${vineyard.altitude}m`, modifier: altitudeModifier, modifierLabel: `altitude effect (${altitudeModifier > 0 ? '+' : ''}${formatNumber(altitudeModifier * 100, 0)}%)` },
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