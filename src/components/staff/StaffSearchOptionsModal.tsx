// src/components/staff/StaffSearchOptionsModal.tsx
import React, { useState, useEffect } from 'react';
import { ActivityOptionsModal, ActivityOptionField, ActivityWorkEstimate } from '../activities/ActivityOptionsModal';
import { WorkCategory, calculateTotalWork, BASE_WORK_UNITS } from '../../lib/game/workCalculator';
import { StaffSearchOptions, SpecializedRoles, calculateSearchCost, calculatePerCandidateCost } from '../../services/staffService';
import { getSkillLevelInfo } from '../../lib/core/utils/formatUtils';
import { getGameState } from '../../gameState';

interface StaffSearchOptionsModalProps {
  onClose: () => void;
  onSubmit: (options: StaffSearchOptions) => void;
}

const StaffSearchOptionsModal: React.FC<StaffSearchOptionsModalProps> = ({ 
  onClose, 
  onSubmit 
}) => {
  const { player } = getGameState();
  const [options, setOptions] = useState<StaffSearchOptions>({
    numberOfCandidates: 5, // Default candidates
    skillLevel: 0.3,      // Default skill level
    specializations: [],  // Default no specializations
  });

  const [workEstimate, setWorkEstimate] = useState<ActivityWorkEstimate>({
    totalWork: 0,
    timeEstimate: 'Calculating...',
    costEstimate: 0,
  });

  const currentSkillInfo = getSkillLevelInfo(options.skillLevel);
  const searchCost = calculateSearchCost(options);
  const perCandidateCost = calculatePerCandidateCost(options);

  // Define the fields for the modal
  const fields: ActivityOptionField[] = [
    {
      id: 'numberOfCandidates',
      label: 'Number of Candidates',
      type: 'select',
      defaultValue: options.numberOfCandidates,
      options: [3, 4, 5, 6, 7, 8, 9, 10].map(num => ({ value: num, label: `${num} candidates` })),
      required: true,
      tooltip: 'Select how many candidates the recruitment agency should find.',
    },
    {
      id: 'skillLevel',
      label: `Minimum Skill Level (${currentSkillInfo.name})`,
      type: 'range',
      defaultValue: options.skillLevel,
      min: 0.1,
      max: 1.0,
      step: 0.1,
      required: true,
      tooltip: 'Set the desired minimum overall skill level for candidates. Higher levels cost more.',
    },
    {
      id: 'specializations',
      label: 'Specializations',
      type: 'checkbox-group',
      defaultValue: options.specializations, // Use initial state
      checkboxOptions: Object.values(SpecializedRoles).map(role => ({
        value: role.id,
        label: role.title,
        description: role.description,
      })),
      tooltip: 'Select specialized roles. Each specialization increases search cost.',
    },
  ];

  // Calculate work estimate whenever options change
  useEffect(() => {
    const totalWork = calculateTotalWork(options.numberOfCandidates, {
      category: WorkCategory.STAFF_SEARCH,
      // Pass skill level and specializations if they affect work calculation
      // taskMultipliers: { [WorkCategory.STAFF_SEARCH]: options.skillLevel }, // Example if needed
    });

    const weeks = Math.ceil(totalWork / BASE_WORK_UNITS);
    const timeEstimate = `${weeks} week${weeks === 1 ? '' : 's'}`;

    setWorkEstimate({
      totalWork: Math.round(totalWork),
      timeEstimate,
      costEstimate: searchCost, // Use calculated search cost
    });
  // Depend on all options that affect work or cost
  }, [options.numberOfCandidates, options.skillLevel, options.specializations, searchCost]);

  // Handle changes from the generic modal
  const handleOptionsChange = (changedOptions: Record<string, any>) => {
    // Special handling for specializations if needed, otherwise rely on generic modal state
    setOptions(prev => ({
      ...prev,
      ...changedOptions
    }));
  };

  const handleSubmit = (submittedOptions: Record<string, any>) => {
    // Ensure options passed to onSubmit match StaffSearchOptions structure
    const finalOptions: StaffSearchOptions = {
      numberOfCandidates: submittedOptions.numberOfCandidates,
      skillLevel: submittedOptions.skillLevel,
      // Retrieve specializations from component state as it's handled separately
      specializations: options.specializations, 
    };
    onSubmit(finalOptions);
  };

  const isSubmitDisabled = !player || player.money < searchCost;

  // Render the generic modal
  return (
    <ActivityOptionsModal
      title="Staff Search"
      subtitle="Configure parameters for finding new staff candidates."
      category={WorkCategory.STAFF_SEARCH}
      fields={fields} // Pass defined fields (without specializations)
      workEstimate={workEstimate} // Pass calculated estimate
      onClose={onClose}
      onSubmit={handleSubmit} // Pass submit handler
      submitLabel={`Start Search (€${searchCost.toLocaleString()})`}
      canSubmit={() => !isSubmitDisabled}
      disabledMessage={isSubmitDisabled ? `Insufficient funds (€${player?.money.toLocaleString()} / €${searchCost.toLocaleString()})` : ''}
      options={options} // Pass the state down
      onOptionsChange={(changedFields) => { // Pass the wrapped state setter
        // Merge changed fields with existing options state
        setOptions(prev => ({ ...prev, ...changedFields }));
      }} 
    />
  );
};

export default StaffSearchOptionsModal; 