// Import required functions from other modules
import { showMainViewOverlay } from '/js/overlays/overlayUtils.js';

export function showAchievementOverlay() {
    const overlay = showMainViewOverlay(createAchievementOverlayHTML());
    setupAchievementEventListeners(overlay);
    
    setTimeout(() => {
        if (document.getElementById("achievement-graph")) {
            console.log("Rendering Achievement Graph...");
            renderAchievementGraph();
            updatePositionTable();
        } else {
            console.error("SVG container not found");
        }
    }, 100);
}

function createAchievementOverlayHTML() {
    return `
        <div class="mainview-overlay-content" style="background: #121212; color: white; text-align: center; padding: 20px;">
            <h3>Achievements</h3>
            <div id="achievement-graph-container">
                <svg id="achievement-graph" width="600" height="600"></svg>
            </div>
            <table id="position-table" style="width: 100%; color: white; margin-top: 20px; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid white; padding: 5px;">Name</th>
                        <th style="border: 1px solid white; padding: 5px;">Type</th>
                        <th style="border: 1px solid white; padding: 5px;">X</th>
                        <th style="border: 1px solid white; padding: 5px;">Y</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
}

function setupAchievementEventListeners(overlay) {
    console.log("Achievement overlay initialized");
}

let elementsData = [];

function renderAchievementGraph() {
    if (typeof d3 === "undefined") {
        console.error("D3.js is not loaded");
        return;
    }
    console.log("D3 version:", d3.version);
    
    const svg = d3.select("#achievement-graph");
    if (svg.empty()) {
        console.error("SVG selection failed");
        return;
    }
    svg.selectAll("*").remove();
    svg.style("background", "#1e1e1e");

    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const centerX = width / 2;
    const centerY = height / 2;

    console.log("SVG Found: Rendering Graph...");

    const angleStep = (2 * Math.PI) / 5;
    const radius = 200;
    const clusters = ["Financial", "Winemaking", "Taste", "Staff", "Expansion"].map((name, i) => ({
        name,
        x: centerX + radius * Math.cos(i * angleStep),
        y: centerY + radius * Math.sin(i * angleStep),
        type: "Cluster"
    }));

    const achievements = [
        { name: "First Harvest", financial: 2, winemaking: 5, taste: 1, staff: 2, expansion: 3 },
        { name: "Wine Master", financial: 4, winemaking: 7, taste: 6, staff: 3, expansion: 2 },
        { name: "Staff Guru", financial: 3, winemaking: 2, taste: 2, staff: 7, expansion: 4 },
        { name: "Land Baron", financial: 5, winemaking: 3, taste: 2, staff: 4, expansion: 7 }
    ];

    achievements.forEach(ach => {
        let totalWeight = ach.financial + ach.winemaking + ach.taste + ach.staff + ach.expansion;
        let posX = 0, posY = 0;
        clusters.forEach(cluster => {
            let weight = ach[cluster.name.toLowerCase()];
            posX += cluster.x * (weight / totalWeight);
            posY += cluster.y * (weight / totalWeight);
        });
        ach.x = posX;
        ach.y = posY;
        ach.type = "Achievement";
    });

    elementsData = clusters.concat(achievements);
    updatePositionTable();

    // Draw connections
    svg.selectAll(".connection")
        .data(achievements.flatMap(ach => 
            clusters.map(cluster => ({ source: ach, target: cluster, weight: ach[cluster.name.toLowerCase()] }))
        ))
        .enter()
        .append("line")
        .attr("class", "connection")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .style("stroke", "#8888ff")
        .style("stroke-width", d => d.weight)
        .style("opacity", "0.7")
        .style("filter", "drop-shadow(0px 0px 5px #8888ff)");

    // Draw clusters and achievements
    drawElements(svg, clusters, "cluster", 40, "#ff4444", "#ff8888");
    drawElements(svg, achievements, "achievement", 20, "#44aaff", "#88ccff");
}

function drawElements(svg, data, className, radius, fillColor, strokeColor) {
    svg.selectAll("." + className)
        .data(data)
        .enter()
        .append("circle")
        .attr("class", className)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", radius)
        .style("fill", fillColor)
        .style("stroke", strokeColor)
        .style("stroke-width", "3px")
        .style("filter", "drop-shadow(0px 0px 15px " + fillColor + ")");
}

function updatePositionTable() {
    const tableBody = document.querySelector("#position-table tbody");
    tableBody.innerHTML = "";

    elementsData.forEach(item => {
        const row = `<tr>
            <td style="border: 1px solid white; padding: 5px;">${item.name}</td>
            <td style="border: 1px solid white; padding: 5px;">${item.type}</td>
            <td style="border: 1px solid white; padding: 5px;">${Math.round(item.x)}</td>
            <td style="border: 1px solid white; padding: 5px;">${Math.round(item.y)}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}
