// farmlandOverlay.js

// Function to display detailed farmland information
export function showFarmlandOverlay(farmland) {
  const overlay = document.getElementById('farmlandOverlay');
  const details = document.getElementById('farmland-details');

  details.innerHTML = `
    <div class="overlay-content">
      <h2 class="text-center mb-3">${farmland.name}</h2>
      <table class="table table-bordered table-hover">
        <thead class="thead-dark">
          <tr>
            <th>Property</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Country</td><td>${farmland.country}</td></tr>
          <tr><td>Region</td><td>${farmland.region}</td></tr>
          <tr><td>Acres</td><td>${farmland.acres}</td></tr>
          <tr><td>Status</td><td>${farmland.status}</td></tr>
          <tr><td>Ripeness</td><td>${farmland.ripeness}</td></tr>
          <tr><td>Soil</td><td>${farmland.soil}</td></tr>
          <tr><td>Altitude</td><td>${farmland.altitude}</td></tr>
          <tr><td>Aspect</td><td>${farmland.aspect}</td></tr>
          <tr><td>Density</td><td>${farmland.density}</td></tr>
        </tbody>
      </table>
    </div>
  `;

  overlay.style.display = 'block'; // Show the overlay

  // Add event listener to close the overlay on clicking the close button
  document.getElementById('closeOverlay').addEventListener('click', function() {
    overlay.style.display = 'none';
  });
}

// Ensure this is executed after page load
document.addEventListener('DOMContentLoaded', () => {
  // Add event listener for outside click
  window.addEventListener('click', (event) => {
    const overlay = document.getElementById('farmlandOverlay');
    if (event.target === overlay) {
      overlay.style.display = 'none';
    }
  });
});