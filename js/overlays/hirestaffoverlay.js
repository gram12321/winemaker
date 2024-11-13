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
        const staffContainer = document.querySelector('#hireStaffOverlay .overlay-content');

        // Clear existing content except the close button
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
                    <p><strong>Skills:</strong> Field: ${staff.skills.field.field}, Winery: ${staff.skills.winery.winery}, Administration: ${staff.skills.administration.administration}, Sales: ${staff.skills.sales.sales}</p>
                    <button class="btn btn-primary hire-staff-button">Hire</button>
                </div>
                <hr>
            `;
        });

        staffHTML += '</div>';

        staffContainer.innerHTML += staffHTML;
        overlay.style.display = 'block';

        // Add event listeners for hire buttons
        document.querySelectorAll('.hire-staff-button').forEach((button, index) => {
            button.addEventListener('click', () => hireSelectedStaff(createdStaffOptions[index]));
        });
    }

    function hireSelectedStaff(staff) {
        // Implement the hiring logic - e.g., save to localStorage or a database
        console.log(`Hired staff member: ${staff.firstName} ${staff.lastName}, Nationality: ${staff.nationality}`);

        // For this example, just log the event and close the overlay
        closeOverlay();
    }

    function closeOverlay() {
        overlay.style.display = 'none';
    }
});