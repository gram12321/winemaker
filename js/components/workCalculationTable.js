import { formatNumber } from '../utils.js';

export function createWorkCalculationTable(data) {
    const {
        acres,
        baseWork,
        density,
        tasks = [],
        taskFactors = {},
        totalWork
    } = data;

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
                                <td><span id="base-work">${formatNumber(baseWork)}</span> units</td>
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
                            <tr>
                                <td>Density Factor:</td>
                                <td><span id="density-factor">${formatNumber(density/1000)}</span>x</td>
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
