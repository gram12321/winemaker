// js/overlays/plantingOverlay.js

export function showPlantingOverlay(farmland, plantCallback) {
  // Create the overlay container
  const overlay = document.createElement('div');
  overlay.className = 'overlay-container';
  document.body.appendChild(overlay);

  // Add the content for the overlay
  overlay.innerHTML = `
    <div class="overlay-content">
      <h2>Planting Overlay for ${farmland.name}</h2>
      <p>Region: ${farmland.region}, ${farmland.country}</p>
      <p>Acres: ${farmland.acres}</p>
      <button class="btn btn-primary plant-overlay-btn">Plant</button>
      <button class="btn btn-secondary close-overlay-btn">Close</button>
    </div>
  `;

  // Handle plant button click using the existing callback
  const plantButton = overlay.querySelector('.plant-overlay-btn');
  plantButton.addEventListener('click', () => {
    plantCallback();
    document.body.removeChild(overlay);
  });

  // Handle overlay close
  const closeButton = overlay.querySelector('.close-overlay-btn');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

export function closePlantingOverlay() {
  const overlay = document.querySelector('.overlay-container');
  if (overlay) {
    document.body.removeChild(overlay);
  }
}