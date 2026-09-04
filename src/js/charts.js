/**
 * charts.js
 * Canvas & SVG Charting Utilities for DR AI Screening Prototype
 */

/**
 * Draws ROC Sensitivity vs Specificity Curve on a canvas
 * @param {HTMLCanvasElement} canvas 
 */
export function drawROCChart(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const pad = 40;
    const chartW = w - pad * 2;
    const chartH = h - pad * 2;

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, pad + chartH);
    ctx.lineTo(pad + chartW, pad + chartH);
    ctx.stroke();

    // Grid lines & Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('0.0', pad - 20, pad + chartH + 15);
    ctx.fillText('1.0 (1-Specificity)', pad + chartW - 20, pad + chartH + 15);
    ctx.fillText('1.0 (Sensitivity)', pad - 30, pad + 10);

    // Diagonal Random Line (Baseline)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(pad, pad + chartH);
    ctx.lineTo(pad + chartW, pad);
    ctx.stroke();
    ctx.setLineDash([]);

    // AI Model ROC Curve (AUC = 0.962)
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pad, pad + chartH);
    
    // Smooth Bezier Curve through ROC benchmark points
    // (0,0) -> (0.05, 0.78) -> (0.108, 0.934) -> (0.3, 0.98) -> (1,1)
    const p1 = [pad + chartW * 0.05, pad + chartH * (1 - 0.78)];
    const p2 = [pad + chartW * 0.108, pad + chartH * (1 - 0.934)];
    const p3 = [pad + chartW * 0.35, pad + chartH * (1 - 0.98)];
    const pEnd = [pad + chartW, pad];

    ctx.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]);
    ctx.quadraticCurveTo(p3[0], p3[1], pEnd[0], pEnd[1]);
    ctx.stroke();

    // Highlight Operating Clinical Point (>90% Sensitivity, >85% Specificity)
    // Point: 1 - Specificity = 0.108 (89.2% Spec), Sensitivity = 93.4%
    const opX = pad + chartW * 0.108;
    const opY = pad + chartH * (1 - 0.934);

    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(opX, opY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('Operating Threshold (Sens: 93.4%, Spec: 89.2%)', opX + 10, opY + 4);

    // Legend
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('Explainable DR AI (AUC = 0.962)', pad + 15, pad + 25);
}

/**
 * Draws Telemedicine Queue Latency Line Chart over 30 days
 * @param {HTMLCanvasElement} canvas 
 * @param {Array} latencyData 
 */
export function drawQueueLatencyChart(canvas, latencyData) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const pad = 40;
    const chartW = w - pad * 2;
    const chartH = h - pad * 2;

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, pad + chartH);
    ctx.lineTo(pad + chartW, pad + chartH);
    ctx.stroke();

    if (!latencyData || latencyData.length === 0) return;

    const maxLat = Math.max(12, ...latencyData);

    // Draw Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    latencyData.forEach((val, i) => {
        const x = pad + (i / (latencyData.length - 1)) * chartW;
        const y = pad + chartH - (val / maxLat) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Target TAT Threshold Line (24 Hours)
    const targetY = pad + chartH - (24 / maxLat) * chartH;
    if (targetY > pad) {
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pad, targetY);
        ctx.lineTo(pad + chartW, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('Max Acceptable TAT (24h Target)', pad + 10, targetY - 4);
    }

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Day 1', pad, pad + chartH + 15);
    ctx.fillText('Day 30 (Operational Days)', pad + chartW - 130, pad + chartH + 15);
    ctx.fillText(`Turnaround Latency (Max: ${Math.round(maxLat)}h)`, pad + 10, pad + 15);
}
