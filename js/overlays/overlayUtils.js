
export function showMainViewOverlay(overlayContent) {
    hideAllOverlays();
    
    const overlay = document.createElement('div');
    overlay.classList.add('mainview-overlay');
    overlay.innerHTML = overlayContent;
    
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
        overlay.style.display = 'block';
    });
    
    return overlay;
}

export function showModalOverlay(overlayId, content) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.innerHTML = content;
        overlay.classList.add('active');
    }
    return overlay;
}

export function hideOverlay(overlay) {
    if (overlay.classList.contains('mainview-overlay')) {
        overlay.remove();
    } else {
        overlay.classList.remove('active');
    }
}
