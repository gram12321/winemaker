import { createNewStaff } from '../staff.js'; // Ensure the path is correct for your project structure

document.addEventListener('DOMContentLoaded', () => {
    const hireStaffBtn = document.getElementById('hire-staff-btn');
    const overlay = document.getElementById('hireStaffOverlay');
    const closeOverlayBtn = document.getElementById('closeHireStaffOverlay');

    if (hireStaffBtn) hireStaffBtn.addEventListener('click', displayStaffOptions);
    if (closeOverlayBtn) closeOverlayBtn.addEventListener('click', closeOverlay);

    window.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeOverlay();
        }
    });

    function displayStaffOptions() {
        const staffContainer = overlay.querySelector('.overlay-content');

        // Clear existing content except the close button and header
        staffContainer.innerHTML = `<span id="closeHireStaffOverlay" class="close-btn">&times;</span><h3>Hire Staff</h3>`;

        const numberOfOptions = 5; // Generate this number of staff options
        const createdStaffOptions = [];

        for (let i = 0; i < numberOfOptions; i++) {
            const newStaff = createNewStaff();
            createdStaffOptions.push(newStaff);
        }

        let staffHTML = '<div class="staff-options-container">';

        createdStaffOptions.forEach(staff => {
            staffHTML += `
                <div class="staff-option">
                    <p><strong>Name:</strong> ${staff.firstName} ${staff.lastName}</p>
                    <p><strong>Nationality:</strong> ${staff.nationality}</p>
                    <div class="skill-bar-container">
                        <div class="skill-bar" style="width: ${parseFloat(staff.skills.field.field) * 100}%; background-color: #ffcc00;" title="Field: ${staff.skills.field.field}">F</div>
                        <div class="skill-bar" style="width: ${parseFloat(staff.skills.winery.winery) * 100}%; background-color: #2179ff;" title="Winery: ${staff.skills.winery.winery}">W</div>
                        <div class="skill-bar" style="width: ${parseFloat(staff.skills.administration.administration) * 100}%; background-color: #6c757d;" title="Administration: ${staff.skills.administration.administration}">A</div>
                        <div class="skill-bar" style="width: ${parseFloat(staff.skills.sales.sales) * 100}%; background-color: #28a745;" title="Sales: ${staff.skills.sales.sales}">S</div>
                    </div>
                    <button class="btn btn-primary hire-staff-button">Hire</button>
                </div>
                <hr>
            `;
        });

        staffHTML += '</div>';

        staffContainer.innerHTML += staffHTML;
        overlay.style.display = 'block';

        // Add event listeners for hire buttons
        overlay.querySelectorAll('.hire-staff-button').forEach((button, index) => {
            button.addEventListener('click', () => hireSelectedStaff(createdStaffOptions[index]));
        });
    }

    function hireSelectedStaff(staff) {
        // Implement the hiring logic - e.g., save to localStorage or a database
        console.log(`Hired staff member: ${staff.firstName} ${staff.lastName}, Nationality: ${staff.nationality}`);
        closeOverlay();
    }

    function closeOverlay() {
        overlay.style.display = 'none';
    }
});