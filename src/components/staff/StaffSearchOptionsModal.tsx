// src/components/staff/StaffSearchOptionsModal.tsx
import React, { useState, useEffect } from 'react';
import { ActivityOptionsModal, ActivityOptionField, ActivityWorkEstimate } from '../activities/ActivityOptionsModal';
import { WorkCategory, calculateTotalWork, TASK_RATES, INITIAL_WORK, BASE_WORK_UNITS } from '../../lib/game/workCalculator';
import { calculateSearchCost, estimateHiringWorkRange } from '../../services/staffService';
import { SpecializedRoles as SpecializedRolesConstants, SkillLevels, BASE_WEEKLY_WAGE, SKILL_WAGE_MULTIPLIER } from '../../lib/core/constants/staffConstants';
import WorkCalculationTable, { WorkFactor } from '../activities/WorkCalculationTable';
import { formatNumber } from '../../lib/core/utils/formatUtils';

interface StaffSearchOptionsModalProps {
  onClose: () => void;
  onSubmit: (options: StaffSearchOptions) => void;
}

export interface StaffSearchOptions {
  numberOfCandidates: number;
  skillLevel: number;
  specializations: string[];
}

// Define the structure for work estimate state, including cost
interface SearchWorkEstimate extends ActivityWorkEstimate {
  cost: number;
}

// Define the structure for hiring estimate state, including maxWork
interface HiringWorkEstimate extends ActivityWorkEstimate {
  maxWork?: number; 
}

const StaffSearchOptionsModal: React.FC<StaffSearchOptionsModalProps> = ({ 
  onClose, 
  onSubmit 
}) => {
  const [options, setOptions] = useState<StaffSearchOptions>({
    numberOfCandidates: 5, // Default candidates
    skillLevel: 0.3,      // Default skill level
    specializations: [],  // Default no specializations
  });

  const [searchWorkEstimate, setSearchWorkEstimate] = useState<SearchWorkEstimate>({
    totalWork: 0,
    timeEstimate: 'Calculating...',
    cost: 0,
  });

  const [searchFactors, setSearchFactors] = useState<WorkFactor[]>([]);

  // --- State for Hiring Process Estimate (now includes maxWork) ---
  const [hiringWorkEstimate, setHiringWorkEstimate] = useState<HiringWorkEstimate>({
    totalWork: 0, // Will be minWork
    maxWork: 0,   // Will be maxWork
    timeEstimate: '?', 
  });
  const [hiringFactors, setHiringFactors] = useState<WorkFactor[]>([]);
  // --- End Hiring Process State ---

  // Define the fields for the modal
  const fields: ActivityOptionField[] = [
    {
      id: 'numberOfCandidates',
      label: 'Number of Candidates',
      type: 'select',
      defaultValue: options.numberOfCandidates,
      options: [
        { value: 1, label: '1 candidate' },
        { value: 3, label: '3 candidates' },
        { value: 5, label: '5 candidates' },
        { value: 10, label: '10 candidates' },
      ],
      required: true,
      tooltip: 'Select the number of candidates to search for.',
    },
    {
      id: 'skillLevel',
      label: `Minimum Skill Level (${SkillLevels[options.skillLevel as keyof typeof SkillLevels]?.name || 'Unknown'})`,
      type: 'range',
      defaultValue: options.skillLevel,
      min: 0.1,
      max: 1,
      step: 0.1,
      required: true,
      tooltip: 'Set the minimum required skill level for candidates. Higher levels cost more and take longer to find.',
    },
    {
      id: 'specializations',
      label: 'Specializations',
      type: 'checkbox-group',
      defaultValue: options.specializations,
      checkboxOptions: Object.entries(SpecializedRolesConstants).map(([key, role]) => ({
        value: key,
        label: role.title,
        description: role.description
      })),
      tooltip: 'Select desired specializations. Each adds significant cost and time to the search.',
    },
  ];

  // Calculate work estimate and factors whenever options change
  useEffect(() => {
    // --- Search Process Calculation (updated to use constants) ---
    const rate = TASK_RATES[WorkCategory.STAFF_SEARCH];
    const initialWork = INITIAL_WORK[WorkCategory.STAFF_SEARCH];
    
    // Calculate skill and specialization modifiers
    const searchSkillModifier = options.skillLevel > 0.5 ? (options.skillLevel - 0.5) * 0.4 : 0;
    let searchSpecModifier = 0;
    if (options.specializations.length > 0) {
      searchSpecModifier = Math.pow(1.3, options.specializations.length) - 1;
    }
    const workModifiers = [searchSkillModifier, searchSpecModifier];
    
    const searchTotalWork = calculateTotalWork(options.numberOfCandidates, {
      rate,
      initialWork,
      workModifiers
    });
    
    const searchCost = calculateSearchCost(options);
    const searchWeeks = Math.ceil(searchTotalWork / BASE_WORK_UNITS); 
    const searchTimeEstimate = `${searchWeeks} week${searchWeeks === 1 ? '' : 's'}`;
    
    const searchCalculatedFactors: WorkFactor[] = [
      { label: "Amount", value: options.numberOfCandidates, unit: "candidates", isPrimary: true },
      { label: "Task", value: "Staff Search", isPrimary: true },
      { label: "Method", value: `${SkillLevels[options.skillLevel as keyof typeof SkillLevels]?.name || 'Unknown'} Level Search`, modifier: searchSkillModifier, modifierLabel: "skill level effect" },
      { label: "Specializations", value: `${options.specializations.length} selected`, modifier: searchSpecModifier, modifierLabel: "specialization effect" },
    ];
    setSearchWorkEstimate({
      totalWork: Math.round(searchTotalWork),
      timeEstimate: searchTimeEstimate,
      cost: Math.round(searchCost)
    });
    setSearchFactors(searchCalculatedFactors);

    // --- Hiring Process Calculation (Now Dynamic Range) ---
    const { minWork, maxWork } = estimateHiringWorkRange(options.skillLevel, options.specializations);
    const hiringMinWeeks = Math.ceil(minWork / BASE_WORK_UNITS); 
    const hiringMaxWeeks = Math.ceil(maxWork / BASE_WORK_UNITS); 
    const hiringTimeEstimate = hiringMinWeeks === hiringMaxWeeks 
        ? `${hiringMinWeeks} week${hiringMinWeeks === 1 ? '' : 's'}`
        : `${hiringMinWeeks} - ${hiringMaxWeeks} weeks`;

    // Calculate factors based on the MINIMUM estimate for display consistency
    const minSkillForFactors = options.skillLevel * 0.4;
    const specializationBonusForFactors = options.specializations.length > 0 ? Math.pow(1.3, options.specializations.length) : 1;
    const minWeeklyWageForFactors = (BASE_WEEKLY_WAGE + (minSkillForFactors * SKILL_WAGE_MULTIPLIER)) * specializationBonusForFactors;
    const calculateWageModifier = (wage: number) => (wage / 200) - 1;
    const wageModifierForDisplay = calculateWageModifier(minWeeklyWageForFactors);
    const specializationModifierForDisplay = options.specializations.length > 0 
        ? Math.pow(1.5, options.specializations.length) - 1 
        : 0;

    const hiringCalculatedFactors: WorkFactor[] = [
      { label: "Amount", value: "1 candidate", isPrimary: true }, 
      { label: "Task", value: "Hiring Process", isPrimary: true },
      { label: "Method", value: `Based on ${SkillLevels[options.skillLevel as keyof typeof SkillLevels]?.name || 'Unknown'} Candidate`, modifier: wageModifierForDisplay, modifierLabel: "wage effect" },
       { label: "Specializations", value: `${options.specializations.length} selected`, modifier: specializationModifierForDisplay, modifierLabel: "specialization effect" },
    ];
    setHiringWorkEstimate({
        totalWork: Math.round(minWork),
        maxWork: Math.round(maxWork),
        timeEstimate: hiringTimeEstimate,
    });
    setHiringFactors(hiringCalculatedFactors);

  }, [options]);

  // Handle changes from the generic modal
  const handleOptionsChange = (changedOptions: Record<string, any>) => {
    setOptions({
      numberOfCandidates: changedOptions.numberOfCandidates as number,
      skillLevel: changedOptions.skillLevel as number,
      specializations: changedOptions.specializations as string[],
    });
  };

  const handleSubmit = () => {
    onSubmit(options);
  };

  // Render the generic modal
  return (
    <ActivityOptionsModal
      title="Staff Search"
      subtitle="Configure parameters for finding new staff candidates."
      category={WorkCategory.STAFF_SEARCH}
      fields={fields} // Pass defined fields (without specializations)
      workEstimate={searchWorkEstimate} // Pass calculated estimate
      workFactors={searchFactors} // Pass the constructed factors
      onClose={onClose}
      onSubmit={handleSubmit} // Pass submit handler
      submitLabel={`Start Search (€${formatNumber(searchWorkEstimate.cost)})`}
      options={options} // Pass the state down
      onOptionsChange={handleOptionsChange} 
    >
      {/* Add separator and title for the second table */}
      <hr className="my-6 border-gray-200" />
      <h3 className="text-lg font-medium mb-4">Hiring Process (Per Candidate)</h3>
      <div className="bg-gray-50 p-4 rounded mb-4">
        <WorkCalculationTable 
          factors={hiringFactors} 
          totalWork={hiringWorkEstimate.totalWork} 
          maxWork={hiringWorkEstimate.maxWork} // Pass maxWork
        />
      </div>
    </ActivityOptionsModal>
  );
};

export default StaffSearchOptionsModal; 