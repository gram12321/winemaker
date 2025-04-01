import React from 'react';
import { Vineyard } from '../lib/vineyard';
import { GameDate, formatGameDate } from '../lib/constants';

type VineyardViewProps = {
  vineyard: Vineyard;
  onClose: () => void;
};

const VineyardView: React.FC<VineyardViewProps> = ({ vineyard, onClose }) => {
  // ... existing code ...

  const renderOwnershipDate = (ownedSince: GameDate) => {
    return <span>Owned since: {formatGameDate(ownedSince)}</span>;
  };

  return (
    <div className="vineyard-view">
      <h2>{vineyard.name}</h2>
      <button onClick={onClose}>Close</button>
      
      <div className="vineyard-details">
        <div className="detail-section">
          <h3>Location</h3>
          <p>Region: {vineyard.region}, {vineyard.country}</p>
          <p>
            Altitude: {vineyard.altitude}m<br />
            Aspect: {vineyard.aspect}
          </p>
          <p>Soil: {vineyard.soil.join(', ')}</p>
        </div>
        
        <div className="detail-section">
          <h3>Properties</h3>
          <p>Size: {vineyard.acres} acres</p>
          <p>
            Density: {vineyard.density} vines/acre<br />
            Vineyard Age: {vineyard.vineAge} years
          </p>
          <p>
            Health: {Math.round(vineyard.vineyardHealth * 100)}%<br />
            Ripeness: {Math.round(vineyard.ripeness * 100)}%
          </p>
          <p>Farming Method: {vineyard.farmingMethod}</p>
          {vineyard.farmingMethod === "Non-Conventional" && (
            <p>Organic Years: {vineyard.organicYears}</p>
          )}
        </div>

        <div className="detail-section">
          <h3>Business</h3>
          <p>
            Status: {vineyard.status}<br />
            Land Value: ${Math.round(vineyard.landValue).toLocaleString()}
          </p>
          <p>Prestige: {Math.round(vineyard.vineyardPrestige * 100)}%</p>
          {renderOwnershipDate(vineyard.ownedSince)}
        </div>
      </div>
    </div>
  );
};

export default VineyardView; 