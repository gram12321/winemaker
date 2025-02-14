import { formatNumber } from '../utils.js';
import { BASE_WORK_UNITS } from '../constants/constants.js';

export function createWorkCalculationTable(data) {
    const {
        acres,
        density,
        tasks = [],
        totalWork,
        altitude,
        altitudeEffect,
        minAltitude,
        maxAltitude,
        medianAltitude,
        robustness,  // Use robustness instead of fragility
        fragilityEffect
    } = data;

    // Simplify the display logic:
    // Above median = more work
    // Below median = less work
    const isAboveMedian = altitude > medianAltitude;
    const effectDescription = isAboveMedian ? 'more' : 'less';

    return `
        <div class="work-preview">
            <div class="work-stats">
                <div class="table-responsive">
                    <table class="table table-sm">
                        <tbody>
                            <tr>
                                <td>Field Size:</td>
                                <td><span id="field-size">${formatNumber(acres)}</span> acres</td>
                            </tr>
                            <tr>
                                <td>Base Work per Acre:</td>
                                <td><span id="base-work">${formatNumber(BASE_WORK_UNITS)}</span> units</td>
                            </tr>
                            ${tasks.length > 0 ? `
                            <tr>
                                <td>Selected Tasks:</td>
                                <td><span id="selected-tasks">${tasks.join(', ')}</span></td>
                            </tr>
                            ` : ''}
                            ${density ? `
                            <tr>
                                <td>Plant Density:</td>
                                <td><span id="density">${formatNumber(density)}</span> vines/acre</td>
                            </tr>
                            ` : ''}
                            ${altitude ? `
                            <tr>
                                <td>Altitude:</td>
                                <td>${altitude}m (${minAltitude}-${maxAltitude}m region)
                                    <br>
                                    <small class="text-muted">
                                        ${formatNumber(Math.abs(altitudeEffect * 100))}% 
                                        ${effectDescription} work 
                                        (${isAboveMedian ? 'above' : 'below'} median)
                                    </small>
                                </td>
                            </tr>
                            ` : ''}
                            ${robustness !== undefined ? `
                            <tr>
                                <td>Grape Robustness:</td>
                                <td>${formatNumber(robustness * 100)}% robust
                                    <br>
                                    <small class="text-muted">
                                        ${formatNumber(fragilityEffect * 100)}% work modifier 
                                        (based on density)
                                    </small>
                                </td>
                            </tr>
                            ` : ''}
                            <tr class="table-primary">
                                <td><strong>Total Work:</strong></td>
                                <td><strong><span id="total-work">${formatNumber(totalWork)}</span> units</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}
