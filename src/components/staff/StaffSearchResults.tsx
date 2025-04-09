import React from 'react';
import { Staff } from '@/gameState';
import { SpecializedRoles } from '@/lib/core/constants/staffConstants';
import { formatNumber, getSkillLevelInfo, getCountryCodeForFlag } from '@/lib/core/utils/formatUtils';
import { Button } from '../ui/button'; // Assuming Button component exists

interface StaffSearchResultsProps {
  candidates: Staff[];
  onHire: (candidate: Staff) => void;
  onClose: () => void;
}

const StaffSearchResults: React.FC<StaffSearchResultsProps> = ({ 
  candidates, 
  onHire, 
  onClose 
}) => {

  const renderSkillBars = (member: Staff) => {
    const skills = [
      { key: 'field', letter: 'F', color: '#ffcc00' },
      { key: 'winery', letter: 'W', color: '#2179ff' },
      { key: 'administration', letter: 'A', color: '#6c757d' },
      { key: 'sales', letter: 'S', color: '#28a745' },
      { key: 'maintenance', letter: 'M', color: '#d9534f' }
    ] as const; // Use const assertion
    
    return (
      <div className="flex gap-1 w-48">
        {skills.map((skill) => {
          const skillValue = member.skills[skill.key] || 0; // Use || 0 as fallback
          return (
            <div 
              key={skill.key}
              className={`h-5 flex items-center justify-center text-xs font-medium text-white`}
              style={{ 
                backgroundColor: skill.color,
                width: `${Math.max(5, Math.round(skillValue * 100))}%` // Ensure minimum width for letter visibility
              }}
              title={`${skill.key.charAt(0).toUpperCase() + skill.key.slice(1)}: ${Math.round(skillValue * 100)}%`}
            >
              {skillValue > 0.05 ? skill.letter : ''} {/* Show letter only if skill > 5% */}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Staff Search Results</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Button>
      </div>

      <p className="mb-6 text-gray-600">
        Your search found {candidates.length} potential candidate{candidates.length !== 1 ? 's' : ''}. Review their profiles and hire the best fit.
      </p>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {candidates.map(candidate => (
          <div key={candidate.id} className="border rounded-md p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-grow">
              <h3 className="text-lg font-semibold mb-1">{candidate.name}</h3>
              <div className="text-sm text-gray-600 mb-2 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <span className={`fi fi-${getCountryCodeForFlag(candidate.nationality)} mr-1`}></span> 
                  {candidate.nationality}
                </span>
                <span>Skill: {getSkillLevelInfo(candidate.skillLevel).name}</span>
                <span>
                  Specialization: {candidate.specializations?.length > 0 
                    ? candidate.specializations.map(specId => SpecializedRoles[specId]?.title || specId).join(', ') 
                    : 'Generalist'}
                </span>
              </div>
              {candidate.skills && renderSkillBars(candidate)}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-2 sm:pt-0">
              <span className="text-lg font-medium text-wine">€{formatNumber(candidate.wage)}/week</span>
              <Button 
                size="sm"
                className="bg-wine hover:bg-wine-dark"
                onClick={() => {
                  console.log(`[StaffSearchResults] Hiring candidate: ${candidate.name}`)
                  onHire(candidate)
                }}
              >
                Hire
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Optional: Add a general Close button at the bottom if needed */}
      {/* <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>Close Results</Button>
      </div> */}
    </div>
  );
};

export default StaffSearchResults; 