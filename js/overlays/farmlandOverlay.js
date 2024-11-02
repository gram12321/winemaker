// farmlandOverlay.js

// Function to display detailed farmland information
export function showFarmlandOverlay(farmland) {
  const overlay = document.getElementById('farmlandOverlay');
  const details = document.getElementById('farmland-details');

  // Double-check if farmland details are properly inserted
  if (details) {
    details.innerHTML = `
      <div class="overlay-content">
        <h2 class="text-center mb-3">${farmland.name}</h2>
        <!-- Make sure this id is correctly used after creating the HTML -->
        <span class="close-btn" id="closeFarmlandOverlay">&times;</span>
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

    // Ensure overlay is displayed
    overlay.style.display = 'block';

    // Attach event listener to the close button
    const closeBtn = document.getElementById('closeFarmlandOverlay');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            overlay.style.display = 'none';
        });
    } else {
        console.error('Close button not found');
    }
  }
}

// Event listener for closing the overlay when clicking outside the content
document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('click', (event) => {
    const overlay = document.getElementById('farmlandOverlay');
    if (event.target === overlay) {
      overlay.style.display = 'none';
    }
  });
});