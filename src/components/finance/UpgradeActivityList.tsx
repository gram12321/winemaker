import React, { useState } from 'react';
import { getActivitiesByCategory } from '@/lib/game/activityManager';
import { WorkCategory } from '@/lib/game/workCalculator';
import { ActivityProgressBar } from '../activities/ActivityProgressBar';
import StaffAssignmentModal from '../activities/StaffAssignmentModal';

export function UpgradeActivityList() {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  
  // Get all upgrade-related activities
  const upgradeActivities = getActivitiesByCategory(WorkCategory.UPGRADING);
  
  const handleAssignStaff = (activityId: string) => {
    setSelectedActivityId(activityId);
  };

  const handleCloseModal = () => {
    setSelectedActivityId(null);
  };

  const handleStaffAssignmentChange = (staffIds: string[]) => {
    // This will be handled internally by the StaffAssignmentModal
    if (staffIds.length === 0) {
      handleCloseModal();
    }
  };

  return (
    <div className="border border-wine/30 rounded-md p-4 bg-gray-50/50">
      <h2 className="text-xl font-semibold text-wine mb-4 border-b border-wine/20 pb-2">Ongoing Upgrades</h2>
      
      <div className="space-y-4">
        {upgradeActivities.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No ongoing upgrades.</p>
        ) : (
          upgradeActivities.map(activity => (
            <ActivityProgressBar
              key={activity.id}
              activityId={activity.id}
              title={activity.params?.title || 'Upgrade Activity'}
              category={activity.category}
              progress={(activity.appliedWork / activity.totalWork) * 100}
              appliedWork={activity.appliedWork}
              totalWork={activity.totalWork}
              onAssignStaff={() => handleAssignStaff(activity.id)}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            />
          ))
        )}
      </div>

      {/* Staff Assignment Modal */}
      {selectedActivityId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl">
            <StaffAssignmentModal
              activityId={selectedActivityId}
              category={WorkCategory.UPGRADING}
              onClose={handleCloseModal}
              initialAssignedStaffIds={[]}
              onAssignmentChange={handleStaffAssignmentChange}
            />
          </div>
        </div>
      )}
    </div>
  );
} 