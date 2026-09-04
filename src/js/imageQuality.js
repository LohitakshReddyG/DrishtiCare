/**
 * imageQuality.js
 * Image Quality Assessment (IQA) & Adaptive CLAHE Enhancement Engine
 */

/**
 * Assesses fundus image quality metrics
 * @param {HTMLCanvasElement} canvas 
 * @returns {Object} Quality metrics & recommendation
 */
export function assessImageQuality(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let totalLuminance = 0;
    let validPixels = 0;
    let minLum = 255, maxLum = 0;

    // Convert to grayscale & evaluate FOV / Illumination
    const grayscale = new Float32Array(width * height);
    const greenChannel = new Float32Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        
        const idx = i / 4;
        grayscale[idx] = lum;
        greenChannel[idx] = g;

        // FOV mask filter (ignore black outer margins)
        if (lum > 15) {
            totalLuminance += lum;
            validPixels++;
            if (lum < minLum) minLum = lum;
            if (lum > maxLum) maxLum = lum;
        }
    }

    const meanLuminance = validPixels > 0 ? totalLuminance / validPixels : 0;
    const fovCoverage = (validPixels / (width * height)) * 100;

    // 1. Focus Metric: Laplacian Variance (Edge Sharpness)
    let laplacianVar = 0;
    let lapSum = 0;
    let lapSqSum = 0;
    let lapCount = 0;

    // 3x3 Laplacian Kernel: [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            const idx = y * width + x;
            if (grayscale[idx] < 20) continue; // Skip non-FOV pixels

            const center = grayscale[idx];
            const up = grayscale[idx - width];
            const down = grayscale[idx + width];
            const left = grayscale[idx - 1];
            const right = grayscale[idx + 1];

            const lap = Math.abs(up + down + left + right - 4 * center);
            lapSum += lap;
            lapSqSum += lap * lap;
            lapCount++;
        }
    }

    if (lapCount > 0) {
        const lapMean = lapSum / lapCount;
        laplacianVar = (lapSqSum / lapCount) - (lapMean * lapMean);
    }

    // 2. Illumination Uniformity (Standard deviation of patch means)
    const patchGrid = 4;
    const patchWidth = Math.floor(width / patchGrid);
    const patchHeight = Math.floor(height / patchGrid);
    const patchMeans = [];

    for (let py = 0; py < patchGrid; py++) {
        for (let px = 0; px < patchGrid; px++) {
            let patchSum = 0;
            let patchCount = 0;

            for (let y = py * patchHeight; y < (py + 1) * patchHeight; y++) {
                for (let x = px * patchWidth; x < (px + 1) * patchWidth; x++) {
                    const val = grayscale[y * width + x];
                    if (val > 20) {
                        patchSum += val;
                        patchCount++;
                    }
                }
            }
            if (patchCount > 50) {
                patchMeans.push(patchSum / patchCount);
            }
        }
    }

    let illumStdDev = 0;
    if (patchMeans.length > 0) {
        const meanPatch = patchMeans.reduce((a, b) => a + b, 0) / patchMeans.length;
        const patchVar = patchMeans.reduce((sq, val) => sq + Math.pow(val - meanPatch, 2), 0) / patchMeans.length;
        illumStdDev = Math.sqrt(patchVar);
    }

    // Quality Threshold Evaluation
    const focusScore = Math.min(100, Math.round(laplacianVar * 1.8));
    const illuminationScore = Math.max(0, Math.min(100, Math.round(100 - illumStdDev * 1.6)));
    const fovScore = Math.min(100, Math.round(fovCoverage * 1.6));

    const overallQualityScore = Math.round((focusScore * 0.45) + (illuminationScore * 0.35) + (fovScore * 0.20));

    let status = 'ADEQUATE';
    const issues = [];
    const feedback = [];

    if (focusScore < 40) {
        issues.push('Poor Focus / Image Blur');
        feedback.push('Ask patient to remain still; adjust camera diopter focus knob.');
    }
    if (illuminationScore < 45 || meanLuminance < 40) {
        issues.push('Low / Non-Uniform Illumination');
        feedback.push('Increase flash intensity; ensure non-mydriatic room dark ambient lighting.');
    }
    if (fovCoverage < 40) {
        issues.push('FOV Clipping / Off-center Alignment');
        feedback.push('Realign camera axis directly with patient pupil.');
    }

    if (overallQualityScore < 50 || focusScore < 30) {
        status = 'UNGRADEABLE';
    } else if (overallQualityScore < 72) {
        status = 'BORDERLINE';
    }

    return {
        overallScore: overallQualityScore,
        focusScore,
        illuminationScore,
        fovScore,
        meanLuminance: Math.round(meanLuminance),
        contrastRange: Math.round(maxLum - minLum),
        status,
        issues,
        feedback: feedback.length > 0 ? feedback : ['Image quality optimal for automated AI triage and clinician validation.']
    };
}

/**
 * Applies Adaptive CLAHE (Contrast Limited Adaptive Histogram Equalization) & Green Channel Isolation
 * @param {HTMLCanvasElement} sourceCanvas 
 * @param {HTMLCanvasElement} targetCanvas 
 * @param {Object} params - { clipLimit: 2.5, gridSize: 8, greenOnly: false, denoise: true }
 */
export function applyCLAHEEnhancement(sourceCanvas, targetCanvas, params = {}) {
    const clipLimit = params.clipLimit || 2.5;
    const gridSize = params.gridSize || 8;
    const greenOnly = params.greenOnly || false;

    const sCtx = sourceCanvas.getContext('2d');
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const srcData = sCtx.getImageData(0, 0, width, height);
    const data = srcData.data;

    targetCanvas.width = width;
    targetCanvas.height = height;
    const tCtx = targetCanvas.getContext('2d');
    const outImgData = tCtx.createImageData(width, height);
    const outData = outImgData.data;

    // Process Green channel or Luminance channel
    const channel = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        channel[i / 4] = greenOnly ? data[i + 1] : Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    // Grid-based Histogram Equalization
    const tileW = Math.floor(width / gridSize);
    const tileH = Math.floor(height / gridSize);
    const histograms = Array.from({ length: gridSize * gridSize }, () => new Int32Array(256));
    const cdfs = Array.from({ length: gridSize * gridSize }, () => new Float32Array(256));

    // 1. Calculate Histograms & Clip Limits per tile
    for (let gy = 0; gy < gridSize; gy++) {
        for (let gx = 0; gx < gridSize; gx++) {
            const histIdx = gy * gridSize + gx;
            const hist = histograms[histIdx];

            let count = 0;
            for (let y = gy * tileH; y < Math.min(height, (gy + 1) * tileH); y++) {
                for (let x = gx * tileW; x < Math.min(width, (gx + 1) * tileW); x++) {
                    const val = channel[y * width + x];
                    hist[val]++;
                    count++;
                }
            }

            // Apply Clip Limit
            const clipVal = Math.max(1, Math.floor((clipLimit * count) / 256));
            let excess = 0;
            for (let i = 0; i < 256; i++) {
                if (hist[i] > clipVal) {
                    excess += hist[i] - clipVal;
                    hist[i] = clipVal;
                }
            }
            const redist = Math.floor(excess / 256);
            for (let i = 0; i < 256; i++) {
                hist[i] += redist;
            }

            // Calculate CDF
            let sum = 0;
            const cdf = cdfs[histIdx];
            for (let i = 0; i < 256; i++) {
                sum += hist[i];
                cdf[i] = (sum / count) * 255;
            }
        }
    }

    // 2. Bilinear Interpolation across tile boundaries
    for (let y = 0; y < height; y++) {
        const gy = Math.min(gridSize - 1, Math.floor(y / tileH));
        const yWeight = (y % tileH) / tileH;

        for (let x = 0; x < width; x++) {
            const gx = Math.min(gridSize - 1, Math.floor(x / tileW));
            const xWeight = (x % tileW) / tileW;

            const idx = y * width + x;
            const val = channel[idx];

            const g00 = cdfs[gy * gridSize + gx][val];
            const g10 = cdfs[gy * gridSize + Math.min(gridSize - 1, gx + 1)][val];
            const g01 = cdfs[Math.min(gridSize - 1, gy + 1) * gridSize + gx][val];
            const g11 = cdfs[Math.min(gridSize - 1, gy + 1) * gridSize + Math.min(gridSize - 1, gx + 1)][val];

            const top = g00 * (1 - xWeight) + g10 * xWeight;
            const bottom = g01 * (1 - xWeight) + g11 * xWeight;
            const enhancedVal = Math.min(255, Math.max(0, Math.round(top * (1 - yWeight) + bottom * yWeight)));

            const pixelIdx = idx * 4;
            if (greenOnly) {
                outData[pixelIdx] = Math.round(data[pixelIdx] * 0.3);
                outData[pixelIdx + 1] = enhancedVal; // High contrast green channel
                outData[pixelIdx + 2] = Math.round(data[pixelIdx + 2] * 0.2);
            } else {
                // Adaptive Contrast Boost on RGB
                const factor = val > 0 ? enhancedVal / val : 1;
                outData[pixelIdx] = Math.min(255, Math.round(data[pixelIdx] * factor * 0.9 + enhancedVal * 0.1));
                outData[pixelIdx + 1] = Math.min(255, Math.round(data[pixelIdx + 1] * factor * 0.8 + enhancedVal * 0.2));
                outData[pixelIdx + 2] = Math.min(255, Math.round(data[pixelIdx + 2] * factor * 0.8));
            }
            outData[pixelIdx + 3] = 255;
        }
    }

    tCtx.putImageData(outImgData, 0, 0);
}
