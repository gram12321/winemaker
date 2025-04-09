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

  // Handle specialization toggle separately as ActivityOptionsModal doesn't support multi-checkbox well
  const handleSpecializationToggle = (specId: string) => {
    setOptions(prev => {
      const specializations = prev.specializations.includes(specId)
        ? prev.specializations.filter(s => s !== specId)
        : [...prev.specializations, specId];
      return { ...prev, specializations };
    });
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
    // Need a wrapping element to contain the modal and the custom checkboxes
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
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
        onOptionsChange={(changedFields) => {
          // Merge changed fields with existing options state
          setOptions(prev => ({ ...prev, ...changedFields }));
        }} // Pass wrapped state setter for live updates
      />
      {/* Custom rendering for specializations checkbox group - RENDERED SEPARATELY */}
      <div className="mb-4 px-0 pt-4 border-t mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specializations
          <span className="ml-2 text-gray-400 hover:text-gray-600 text-sm" title="Select specialized roles. Each specialization increases search cost.">ⓘ</span>
        </label>
        <div className="space-y-2">
          {Object.values(SpecializedRoles).map(role => (
            <div key={role.id} className="flex items-center">
              <input
                type="checkbox"
                id={`spec-${role.id}`}
                checked={options.specializations.includes(role.id)}
                onChange={() => handleSpecializationToggle(role.id)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-wine focus:ring-wine"
              />
              <label htmlFor={`spec-${role.id}`} className="text-sm text-gray-700">
                {role.title} <span className="text-xs text-gray-500">({role.description})</span>
              </label>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Cost per candidate: €{perCandidateCost.toLocaleString()}
        </div>
      </div>
      {/* Need to re-add action buttons here as they are part of ActivityOptionsModal now */}
      <div className="mt-6 flex justify-end space-x-2 border-t pt-6">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          onClick={onClose}
        >
          Cancel
        </button>
        
        <button
          type="submit" // Changed to submit to trigger form inside ActivityOptionsModal if needed, or handle manually
          className={`px-4 py-2 rounded shadow-sm text-white ${isSubmitDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-wine hover:bg-wine-dark'}`}
          disabled={isSubmitDisabled}
          title={isSubmitDisabled ? `Insufficient funds (€${player?.money.toLocaleString()} / €${searchCost.toLocaleString()})` : ''}
          onClick={() => handleSubmit(options)} // Manually trigger submit logic
        >
          {`Start Search (€${searchCost.toLocaleString()})`}
        </button>
      </div>
    </div>
  );
};

export default StaffSearchOptionsModal; 