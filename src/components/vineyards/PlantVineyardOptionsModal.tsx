// src/components/vineyards/PlantVineyardOptionsModal.tsx
import React, { useState, useEffect } from 'react';
import { ActivityOptionsModal, ActivityOptionField, ActivityWorkEstimate } from '../activities/ActivityOptionsModal';
import { WorkCategory, calculateTotalWork, BASE_WORK_UNITS } from '../../lib/game/workCalculator';
import { GrapeVariety, COUNTRY_REGION_MAP, REGION_SOIL_TYPES, REGION_ALTITUDE_RANGES, ASPECT_FACTORS } from '../../lib/core/constants/vineyardConstants';
import { Vineyard } from '../../lib/game/vineyard';
import { BASELINE_VINE_DENSITY } from '@/lib/core/constants/gameConstants';

interface PlantVineyardOptionsModalProps {
  vineyard: Vineyard;
  onClose: () => void;
  onSubmit: (options: { grape: GrapeVariety; density: number }) => void;
}

const PlantVineyardOptionsModal: React.FC<PlantVineyardOptionsModalProps> = ({
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

  // Calculate work estimate whenever options change
  useEffect(() => {
    const totalWork = calculateTotalWork(vineyard.acres, {
      category: WorkCategory.PLANTING,
      density: options.density,
    });

    // Basic time estimate (weeks = totalWork / baseWorkUnits)
    // This doesn't account for staff efficiency yet
    const weeks = Math.ceil(totalWork / BASE_WORK_UNITS);
    const timeEstimate = `${weeks} week${weeks === 1 ? '' : 's'}`;

    setWorkEstimate({
      totalWork: Math.round(totalWork),
      timeEstimate,
      // Cost estimate could be added here if planting has direct costs
    });
  }, [options.density, vineyard.acres]);

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
      onClose={onClose}
      onSubmit={handleSubmit} // Pass the options directly
      submitLabel="Start Planting"
      // Add canSubmit logic if needed (e.g., check funds)
    />
  );
};

export default PlantVineyardOptionsModal; 