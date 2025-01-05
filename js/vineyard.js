
import { farmlandYield } from './farmland.js';

export function displayVineyard() {
  const farmlands = JSON.parse(localStorage.getItem('ownedFarmlands')) || [];
  const table = document.createElement('table');
  table.className = 'table table-bordered';
  
  table.innerHTML = `
    <thead>
      <tr>
        <th>Field Name</th>
        <th>Size</th>
        <th>Vine Age</th>
        <th>Crop</th>
        <th>Status</th>
        <th>Ripeness</th>
        <th>Expected Yield</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${farmlands.map(farmland => `
        <tr>
          <td>${farmland.name}</td>
          <td>${farmland.acres} acres</td>
          <td>${farmland.vineAge || '-'}</td>
          <td>${farmland.plantedResourceName || 'None'}</td>
          <td>${farmland.status}</td>
          <td>${(farmland.ripeness * 100).toFixed(1)}%</td>
          <td>${farmlandYield(farmland).toFixed(2)} kg</td>
          <td></td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  return table;
}
