// buildingOverlay.js

export function showBuildingOverlay(building) {
  const overlay = document.getElementById('buildingOverlay');
  const details = document.getElementById('building-details');

  if (details && overlay) {
    const buildingDetails = `
      <h2>${building.name}</h2>
      <p>Capacity: ${building.capacity}</p>
      <p>Contents: ${building.listContents()}</p>
    `;

    details.innerHTML = buildingDetails;
    overlay.style.display = 'flex'; // Show the overlay
  }
}

export function hideBuildingOverlay() {
  const overlay = document.getElementById('buildingOverlay');
  if (overlay) {
    overlay.style.display = 'none'; // Hide the overlay
  }
}