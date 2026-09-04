/**
 * sampleData.js
 * Generates realistic high-resolution retinal fundus images and benchmark cases for DR Screening.
 * Includes Grade 0 (Normal) through Grade 4 (PDR), plus Ungradeable cases.
 */

export const SAMPLE_CASES = [
    {
        id: 'CASE-001',
        patientId: 'PAT-RURAL-8042',
        age: 54,
        gender: 'Female',
        location: 'PHC Telemedicine Center, Chittoor, AP',
        grade: 0,
        gradeName: 'Grade 0: No DR',
        description: 'Normal retina. Clear macula, healthy vascular arcades, sharp optic disc boundaries.',
        cameraType: 'Portable Handheld Fundus Camera (30° FOV)',
        lesionSpecs: { ma: 0, exudates: 0, hemorrhages: 0, nv: false },
        isUngradeable: false,
        qualityIssues: []
    },
    {
        id: 'CASE-002',
        patientId: 'PAT-RURAL-9120',
        age: 61,
        gender: 'Male',
        location: 'PHC Telemedicine Center, Washim, MH',
        grade: 1,
        gradeName: 'Grade 1: Mild NPDR',
        description: 'Microaneurysms (MAs) detected near temporal arcade. No exudates or hemorrhages.',
        cameraType: 'Portable Non-Mydriatic Camera (45° FOV)',
        lesionSpecs: { ma: 5, exudates: 0, hemorrhages: 0, nv: false },
        isUngradeable: false,
        qualityIssues: []
    },
    {
        id: 'CASE-003',
        patientId: 'PAT-RURAL-4309',
        age: 49,
        gender: 'Female',
        location: 'PHC Telemedicine Center, Koraput, OD',
        grade: 2,
        gradeName: 'Grade 2: Moderate NPDR (Referable)',
        description: 'Multiple microaneurysms, punctate blot hemorrhages, and bright yellow hard exudates near macula.',
        cameraType: 'Smartphone-based Fundus Lens',
        lesionSpecs: { ma: 18, exudates: 12, hemorrhages: 8, nv: false },
        isUngradeable: false,
        qualityIssues: []
    },
    {
        id: 'CASE-004',
        patientId: 'PAT-RURAL-7751',
        age: 67,
        gender: 'Male',
        location: 'PHC Telemedicine Center, Wayanad, KL',
        grade: 3,
        gradeName: 'Grade 3: Severe NPDR (Referable)',
        description: 'Extensive (>20) hemorrhages in all 4 quadrants, venous beading, IRMA, and soft cotton-wool spots.',
        cameraType: 'Portable Non-Mydriatic Camera (45° FOV)',
        lesionSpecs: { ma: 42, exudates: 25, hemorrhages: 28, nv: false },
        isUngradeable: false,
        qualityIssues: []
    },
    {
        id: 'CASE-005',
        patientId: 'PAT-RURAL-1092',
        age: 58,
        gender: 'Male',
        location: 'PHC Telemedicine Center, Madhubani, BR',
        grade: 4,
        gradeName: 'Grade 4: Proliferative DR (PDR - Urgent Referral)',
        description: 'Neovascularization at Optic Disc (NVD), vitreous hemorrhage risk, dense exudate clusters threatening macula.',
        cameraType: 'Portable Handheld Fundus Camera',
        lesionSpecs: { ma: 65, exudates: 38, hemorrhages: 45, nv: true },
        isUngradeable: false,
        qualityIssues: []
    },
    {
        id: 'CASE-006-U',
        patientId: 'PAT-RURAL-5511',
        age: 72,
        gender: 'Female',
        location: 'PHC Telemedicine Center, Tehri, UK',
        grade: -1,
        gradeName: 'Ungradeable (Poor Focus & Lens Smudge)',
        description: 'Severe motion blur, low illumination contrast, lens smudge blocking macular field of view.',
        cameraType: 'Handheld Field Camera',
        lesionSpecs: { ma: 0, exudates: 0, hemorrhages: 0, nv: false },
        isUngradeable: true,
        qualityIssues: ['Severe Blur (Laplacian Variance < 45)', 'Illumination Non-Uniformity', 'Lens Smudge / Peripheral Flare']
    }
];

/**
 * Draws a realistic Fundus Canvas for a given case specification
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} caseItem 
 * @param {Object} options - { drawLesions: true, drawVessels: true, applyBlur: false, lowLight: false }
 */
export function drawFundusImage(canvas, caseItem, options = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background (dark frame)
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.44;

    // If case has custom uploaded image, render it directly
    if (caseItem.customImage) {
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(caseItem.customImage, 0, 0, width, height);
        
        if (options.drawLesions !== false && caseItem.grade > 0) {
            drawLesions(ctx, centerX, centerY, radius, centerX + radius * 0.4, centerY, centerX - radius * 0.35, centerY, caseItem.lesionSpecs);
        }
        return;
    }

    // 1. Draw Retinal Field of View (FOV Circle & Background Gradient)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Base Orange/Red Fundus Gradient
    const fundusGrad = ctx.createRadialGradient(
        centerX + radius * 0.1, centerY - radius * 0.05, radius * 0.1,
        centerX, centerY, radius
    );
    if (caseItem.isUngradeable || options.lowLight) {
        fundusGrad.addColorStop(0, '#5a2512');
        fundusGrad.addColorStop(0.5, '#3b1708');
        fundusGrad.addColorStop(1, '#1b0902');
    } else {
        fundusGrad.addColorStop(0, '#e25b26');
        fundusGrad.addColorStop(0.5, '#b83b14');
        fundusGrad.addColorStop(0.85, '#872106');
        fundusGrad.addColorStop(1, '#4d0d02');
    }
    ctx.fillStyle = fundusGrad;
    ctx.fillRect(0, 0, width, height);

    // Add subtle retinal choroidal background texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let i = 0; i < 400; i++) {
        const tx = centerX + (Math.random() - 0.5) * radius * 1.8;
        const ty = centerY + (Math.random() - 0.5) * radius * 1.8;
        const tr = Math.random() * 8 + 2;
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Macula & Fovea (Darker temporal region)
    const maculaX = centerX - radius * 0.35;
    const maculaY = centerY + radius * 0.05;
    const maculaGrad = ctx.createRadialGradient(maculaX, maculaY, 2, maculaX, maculaY, radius * 0.25);
    maculaGrad.addColorStop(0, '#360902');
    maculaGrad.addColorStop(0.6, 'rgba(92, 22, 7, 0.6)');
    maculaGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = maculaGrad;
    ctx.beginPath();
    ctx.arc(maculaX, maculaY, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Foveal reflex dot
    ctx.fillStyle = 'rgba(255, 220, 180, 0.4)';
    ctx.beginPath();
    ctx.arc(maculaX, maculaY, 3, 0, Math.PI * 2);
    ctx.fill();

    // 3. Optic Disc (OD) & Cup (Nasal side)
    const odX = centerX + radius * 0.42;
    const odY = centerY - radius * 0.02;
    const odRadius = radius * 0.16;

    // Optic Disc Halo / Margin
    const odGrad = ctx.createRadialGradient(odX, odY, odRadius * 0.3, odX, odY, odRadius);
    odGrad.addColorStop(0, '#fff4cc');
    odGrad.addColorStop(0.6, '#ffd685');
    odGrad.addColorStop(0.9, '#fca34d');
    odGrad.addColorStop(1, '#c45112');
    ctx.fillStyle = odGrad;
    ctx.shadowColor = 'rgba(255, 230, 150, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(odX, odY, odRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Optic Cup (Inner brighter region - CDR ~0.35)
    ctx.fillStyle = '#fffae6';
    ctx.beginPath();
    ctx.arc(odX + 2, odY, odRadius * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // 4. Retinal Blood Vessels (Arcades emerging from Optic Disc)
    if (options.drawVessels !== false) {
        drawVesselArcades(ctx, odX, odY, radius, caseItem.grade);
    }

    // 5. Pathological Lesions (MAs, Exudates, Hemorrhages, Neovascularization)
    if (options.drawLesions !== false && caseItem.grade > 0) {
        drawLesions(ctx, centerX, centerY, radius, odX, odY, maculaX, maculaY, caseItem.lesionSpecs);
    }

    // 6. Quality Defects if Ungradeable
    if (caseItem.isUngradeable || options.applyBlur) {
        // Add lens flare / dark shadow smudge
        const smudgeGrad = ctx.createRadialGradient(centerX - radius * 0.3, centerY - radius * 0.4, 10, centerX - radius * 0.3, centerY - radius * 0.4, radius * 0.6);
        smudgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
        smudgeGrad.addColorStop(0.4, 'rgba(200, 180, 140, 0.35)');
        smudgeGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = smudgeGrad;
        ctx.fillRect(0, 0, width, height);

        // Dark vignetting peripheral shadow
        const shadowGrad = ctx.createRadialGradient(centerX + radius * 0.4, centerY + radius * 0.3, radius * 0.2, centerX, centerY, radius);
        shadowGrad.addColorStop(0, 'transparent');
        shadowGrad.addColorStop(0.7, 'rgba(10, 5, 0, 0.75)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();

    // Fast canvas blur filter if ungradeable
    if (caseItem.isUngradeable) {
        // Canvas blur simulation
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, width, height);
    }
}

/**
 * Draws vascular tree arcades branching out from optic disc
 */
function drawVesselArcades(ctx, odX, odY, fovRadius, grade) {
    ctx.strokeStyle = '#610c04';
    ctx.lineCap = 'round';

    const mainArcades = [
        // Superior Temporal
        { control1: [odX - fovRadius * 0.2, odY - fovRadius * 0.35], end: [odX - fovRadius * 0.7, odY - fovRadius * 0.45], width: 7 },
        // Inferior Temporal
        { control1: [odX - fovRadius * 0.2, odY + fovRadius * 0.35], end: [odX - fovRadius * 0.7, odY + fovRadius * 0.45], width: 6.5 },
        // Superior Nasal
        { control1: [odX + fovRadius * 0.15, odY - fovRadius * 0.25], end: [odX + fovRadius * 0.35, odY - fovRadius * 0.5], width: 5 },
        // Inferior Nasal
        { control1: [odX + fovRadius * 0.15, odY + fovRadius * 0.25], end: [odX + fovRadius * 0.35, odY + fovRadius * 0.5], width: 5 }
    ];

    mainArcades.forEach(arc => {
        // Main trunk
        ctx.lineWidth = arc.width;
        ctx.strokeStyle = '#590903';
        ctx.beginPath();
        ctx.moveTo(odX, odY);
        ctx.quadraticCurveTo(arc.control1[0], arc.control1[1], arc.end[0], arc.end[1]);
        ctx.stroke();

        // Venous reflection center line
        ctx.lineWidth = arc.width * 0.25;
        ctx.strokeStyle = 'rgba(255, 160, 140, 0.4)';
        ctx.beginPath();
        ctx.moveTo(odX, odY);
        ctx.quadraticCurveTo(arc.control1[0], arc.control1[1], arc.end[0], arc.end[1]);
        ctx.stroke();

        // Secondary Branches
        drawBranches(ctx, arc.control1[0], arc.control1[1], arc.width * 0.5, 3);
        drawBranches(ctx, arc.end[0], arc.end[1], arc.width * 0.4, 2);
    });

    // If Grade 4 (PDR), draw Neovascularization (tangled abnormal vessel tufts near disc)
    if (grade >= 4) {
        ctx.strokeStyle = '#a81308';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(odX - 10 + Math.random() * 20, odY - 10 + Math.random() * 20);
            ctx.bezierCurveTo(
                odX - 30 + Math.random() * 40, odY - 30 + Math.random() * 40,
                odX - 40 + Math.random() * 50, odY - 40 + Math.random() * 50,
                odX - 25 + Math.random() * 50, odY - 25 + Math.random() * 50
            );
            ctx.stroke();
        }
    }
}

function drawBranches(ctx, startX, startY, width, count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * Math.PI * 0.8;
        const len = 30 + Math.random() * 45;
        const endX = startX + Math.cos(angle) * len;
        const endY = startY + Math.sin(angle) * len;

        ctx.lineWidth = Math.max(1, width * (0.6 - i * 0.15));
        ctx.strokeStyle = '#590903';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

/**
 * Renders Microaneurysms, Exudates, Hemorrhages, Neovascularization
 */
function drawLesions(ctx, centerX, centerY, radius, odX, odY, maculaX, maculaY, specs) {
    // Seeded pseudo-random coordinates around temporal arcades & macula
    const seedX = (offset) => centerX + Math.sin(offset * 7.3) * radius * 0.65;
    const seedY = (offset) => centerY + Math.cos(offset * 4.1) * radius * 0.55;

    // 1. Microaneurysms (Tiny red pinpoints)
    for (let i = 0; i < specs.ma; i++) {
        const lx = seedX(i + 1.2);
        const ly = seedY(i + 2.5);
        ctx.fillStyle = '#8a0303';
        ctx.beginPath();
        ctx.arc(lx, ly, 1.8 + Math.random() * 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Hard Exudates (Bright yellow/white waxy deposits with sharp borders)
    for (let i = 0; i < specs.exudates; i++) {
        const lx = maculaX + (Math.sin(i * 3.7) * radius * 0.32);
        const ly = maculaY + (Math.cos(i * 2.3) * radius * 0.28);

        // Exudate cluster
        ctx.fillStyle = '#fff0a6';
        ctx.shadowColor = '#ffe066';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 3 + Math.random() * 4, 2 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // 3. Hemorrhages (Blot and flame-shaped dark red pools)
    for (let i = 0; i < specs.hemorrhages; i++) {
        const lx = seedX(i + 14.8);
        const ly = seedY(i + 9.2);

        ctx.fillStyle = '#400202';
        ctx.beginPath();
        if (i % 2 === 0) {
            // Flame hemorrhage (elongated along nerve fibers)
            ctx.ellipse(lx, ly, 7 + Math.random() * 6, 2.5 + Math.random() * 2, Math.PI * 0.2, 0, Math.PI * 2);
        } else {
            // Dot/Blot hemorrhage
            ctx.arc(lx, ly, 4 + Math.random() * 5, 0, Math.PI * 2);
        }
        ctx.fill();
    }
}
