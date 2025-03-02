export function createCharacteristicBar(trait, value, minBalance, maxBalance, adjustedRanges = null) {
    // Create the bar structure with table cells
    let barContent = `
        <td>
            <img src="/assets/icon/small/${trait}.png" alt="${trait}" class="characteristic-icon">
            ${trait.charAt(0).toUpperCase() + trait.slice(1)}
        </td>
        <td class="characteristic-bar-cell">
            <div class="characteristic-bar-container">
                <div class="characteristic-bar">
                    <!-- Background bar -->
                    <div class="bar-background"></div>
                    <!-- Base balanced range -->
                    <div class="balanced-range" style="left: ${minBalance * 100}%; width: ${(maxBalance - minBalance) * 100}%"></div>`;

    // Add adjusted ranges if provided
    if (adjustedRanges) {
        const [adjustedMin, adjustedMax] = adjustedRanges;
        const rangeSize = adjustedMax - adjustedMin;
        const centerSize = rangeSize * 0.25;
        const adjustedMiddle = (adjustedMin + adjustedMax) / 2;
        const centerMin = adjustedMiddle - centerSize;
        const centerMax = adjustedMiddle + centerSize;

        barContent += `
                    <!-- Lower part of adjusted range -->
                    <div class="adjusted-range adjusted-range-outer" style="left: ${adjustedMin * 100}%; width: ${(centerMin - adjustedMin) * 100}%"></div>
                    <!-- Center optimal part -->
                    <div class="adjusted-range adjusted-range-center" style="left: ${centerMin * 100}%; width: ${(centerMax - centerMin) * 100}%"></div>
                    <!-- Upper part of adjusted range -->
                    <div class="adjusted-range adjusted-range-outer" style="left: ${centerMax * 100}%; width: ${(adjustedMax - centerMax) * 100}%"></div>`;
    }

    barContent += `
                    <!-- Value marker -->
                    <div class="value-marker" style="left: ${value * 100}%"></div>
                </div>
                <div class="bar-labels">
                    <span class="value-label" style="left: ${value * 100}%">${(value * 100).toFixed(0)}%</span>
                </div>
            </div>
        </td>`;

    return barContent;
}
