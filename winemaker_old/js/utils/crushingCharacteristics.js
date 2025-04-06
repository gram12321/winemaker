export function calculateCrushingCharacteristics(baseCharacteristics, params) {
    const { destemming } = params;
    
    // Deep clone the base characteristics to avoid modifying the original
    const crushedCharacteristics = { ...baseCharacteristics };
    
    // Apply modifications based on destemming
    if (destemming) {
        // With destemming - increase positive characteristics
        crushedCharacteristics.body = Math.min(1, crushedCharacteristics.body + 0.1);
        crushedCharacteristics.tannins = Math.min(1, crushedCharacteristics.tannins + 0.15);
        crushedCharacteristics.spice = Math.min(1, crushedCharacteristics.spice + 0.1);
    } else {
        // Without destemming - decrease certain characteristics
        crushedCharacteristics.aroma = Math.max(0, crushedCharacteristics.aroma - 0.15);
        crushedCharacteristics.tannins = Math.max(0, crushedCharacteristics.tannins - 0.1);
    }

    return crushedCharacteristics;
}
