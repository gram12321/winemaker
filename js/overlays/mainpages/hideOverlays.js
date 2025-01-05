
export function hideAllOverlays() {
    const existingOverlays = document.querySelectorAll('.mainview-overlay');
    existingOverlays.forEach(overlay => {
        overlay.remove();
    });
}
