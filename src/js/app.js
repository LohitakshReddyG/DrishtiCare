/**
 * app.js
 * Central Application Controller for Explainable AI DR Screening Prototype
 */

import { SAMPLE_CASES, drawFundusImage } from './sampleData.js';
import { assessImageQuality, applyCLAHEEnhancement } from './imageQuality.js';
import { segmentRetinalStructures, renderSegmentationOverlay } from './segmentation.js';
import { classifyDRSeverity, generateGradCAMHeatmap } from './gradingGradCAM.js';
import { generateClinicalReportHTML } from './explainabilityReport.js';
import { TelemedicinePipelineSimulator } from './simulinkSimulator.js';
import { drawROCChart, drawQueueLatencyChart } from './charts.js';

class AppController {
    constructor() {
        this.selectedCaseIndex = 2; // Default to Grade 2 Moderate NPDR
        this.activeTab = 'dashboard';
        
        // Canvas Options State
        this.viewState = {
            mode: 'original', // 'original', 'clahe', 'gradcam', 'lesions'
            claheClip: 2.5,
            greenOnly: false,
            heatmapOpacity: 0.65,
            palette: 'jet',
            segToggles: { showOD: true, showMA: true, showExudates: true, showHM: true }
        };

        // Telemedicine Simulator Instance
        this.simulator = new TelemedicinePipelineSimulator();
    }

    init() {
        this.setupNavigation();
        this.renderCaseList();
        this.updateCurrentCase();
        this.setupEventListeners();
        this.runSimulinkSimulator();
    }

    setupNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.nav-tab[data-tab="${tabId}"]`)?.classList.add('active');

        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${tabId}`)?.classList.add('active');

        // Re-render tab specific canvas displays
        if (tabId === 'iqa') this.renderIQAView();
        if (tabId === 'segmentation') this.renderSegmentationView();
        if (tabId === 'grading') this.renderGradingView();
        if (tabId === 'report') this.renderReportView();
        if (tabId === 'simulink') this.runSimulinkSimulator();
    }

    renderCaseList() {
        const container = document.getElementById('case-list-container');
        if (!container) return;

        container.innerHTML = SAMPLE_CASES.map((c, idx) => {
            const isSelected = idx === this.selectedCaseIndex;
            const gradeClass = c.isUngradeable ? 'grade-u' : `grade-${c.grade}`;

            return `
                <div class="case-item-card ${isSelected ? 'selected' : ''}" data-index="${idx}">
                    <div class="case-header">
                        <span class="case-id">${c.id} (${c.patientId})</span>
                        <span class="grade-badge ${gradeClass}">${c.isUngradeable ? 'UNGRADEABLE' : `Grade ${c.grade}`}</span>
                    </div>
                    <p class="case-desc">${c.description}</p>
                </div>
            `;
        }).join('');

        // Add Click Handlers
        container.querySelectorAll('.case-item-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                this.selectedCaseIndex = idx;
                
                container.querySelectorAll('.case-item-card').forEach(c => c.classList.remove('selected'));
                e.currentTarget.classList.add('selected');

                this.updateCurrentCase();
            });
        });
    }

    updateCurrentCase() {
        const currentCase = SAMPLE_CASES[this.selectedCaseIndex];
        
        // Update Titles & Badges
        const titleEl = document.getElementById('selected-case-title');
        const badgeEl = document.getElementById('selected-case-badge');

        if (titleEl) titleEl.innerText = `${currentCase.id} - ${currentCase.location}`;
        if (badgeEl) {
            badgeEl.innerText = currentCase.gradeName;
            badgeEl.className = `grade-badge ${currentCase.isUngradeable ? 'grade-u' : `grade-${currentCase.grade}`}`;
        }

        // Run Processing Pipeline
        this.runPipeline(currentCase);
    }

    runPipeline(currentCase) {
        const mainCanvas = document.getElementById('main-fundus-canvas');
        if (!mainCanvas) return;

        // 1. Draw base fundus
        drawFundusImage(mainCanvas, currentCase);

        // 2. Assess Quality & CLAHE
        this.quality = assessImageQuality(mainCanvas);

        // 3. Segment Structures & Lesions
        this.segResult = segmentRetinalStructures(mainCanvas, currentCase);

        // 4. DR Severity Grading & Grad-CAM
        this.grading = classifyDRSeverity(currentCase, this.segResult);

        // 5. Render Main Dashboard Overlay based on viewState.mode
        this.renderMainDashboardCanvas();
    }

    renderMainDashboardCanvas() {
        const mainCanvas = document.getElementById('main-fundus-canvas');
        const currentCase = SAMPLE_CASES[this.selectedCaseIndex];
        
        // Reset base fundus image
        drawFundusImage(mainCanvas, currentCase);

        if (this.viewState.mode === 'clahe') {
            applyCLAHEEnhancement(mainCanvas, mainCanvas, { clipLimit: this.viewState.claheClip, greenOnly: this.viewState.greenOnly });
        } else if (this.viewState.mode === 'gradcam') {
            generateGradCAMHeatmap(mainCanvas, this.segResult, { opacity: this.viewState.heatmapOpacity, palette: this.viewState.palette });
        } else if (this.viewState.mode === 'lesions') {
            renderSegmentationOverlay(mainCanvas, this.segResult, this.viewState.segToggles);
        }
    }

    renderIQAView() {
        const previewCanvas = document.getElementById('clahe-preview-canvas');
        const currentCase = SAMPLE_CASES[this.selectedCaseIndex];
        
        if (previewCanvas) {
            drawFundusImage(previewCanvas, currentCase);
            applyCLAHEEnhancement(previewCanvas, previewCanvas, {
                clipLimit: this.viewState.claheClip,
                greenOnly: this.viewState.greenOnly
            });
        }

        const metricsBox = document.getElementById('iqa-metrics-box');
        if (metricsBox && this.quality) {
            metricsBox.innerHTML = `
                <div class="metric-tile">
                    <div class="metric-label">Overall Quality Rating</div>
                    <div class="metric-val" style="color: ${this.quality.status === 'ADEQUATE' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">
                        ${this.quality.status} (${this.quality.overallScore}/100)
                    </div>
                </div>

                <div class="metric-tile-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
                    <div class="metric-tile">
                        <div class="metric-label">Focus Metric (Laplacian Var)</div>
                        <div class="metric-val" style="font-size: 1.1rem;">${this.quality.focusScore}/100</div>
                    </div>
                    <div class="metric-tile">
                        <div class="metric-label">Illumination Uniformity</div>
                        <div class="metric-val" style="font-size: 1.1rem;">${this.quality.illuminationScore}/100</div>
                    </div>
                </div>

                <div style="background: rgba(30, 41, 59, 0.6); padding: 1rem; border-radius: 8px;">
                    <strong style="color: var(--primary-cyan); font-size: 0.85rem;">Field Technician Recapture Feedback:</strong>
                    <ul style="font-size: 0.8rem; margin-top: 0.4rem; padding-left: 1.2rem; color: var(--text-muted);">
                        ${this.quality.feedback.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    renderSegmentationView() {
        const segCanvas = document.getElementById('seg-overlay-canvas');
        const currentCase = SAMPLE_CASES[this.selectedCaseIndex];

        if (segCanvas) {
            drawFundusImage(segCanvas, currentCase);
            renderSegmentationOverlay(segCanvas, this.segResult, this.viewState.segToggles);
        }

        const statsBox = document.getElementById('segmentation-stats-box');
        if (statsBox && this.segResult) {
            const { lesions, opticDisc, quadrantBreakdown } = this.segResult;

            statsBox.innerHTML = `
                <div class="metric-tile-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
                    <div class="metric-tile">
                        <div class="metric-label">Microaneurysms (MA)</div>
                        <div class="metric-val" style="color: var(--accent-magenta);">${lesions.counts.ma}</div>
                    </div>
                    <div class="metric-tile">
                        <div class="metric-label">Hard Exudates (HE)</div>
                        <div class="metric-val" style="color: var(--accent-amber);">${lesions.counts.exudates}</div>
                    </div>
                    <div class="metric-tile">
                        <div class="metric-label">Hemorrhages (Dot/Flame)</div>
                        <div class="metric-val" style="color: var(--accent-rose);">${lesions.counts.hemorrhages}</div>
                    </div>
                    <div class="metric-tile">
                        <div class="metric-label">Neovascularization (NV)</div>
                        <div class="metric-val" style="font-size: 1.1rem; color: ${lesions.neovascularization ? 'var(--accent-rose)' : 'var(--accent-emerald)'}">
                            ${lesions.neovascularization ? 'DETECTED (PDR)' : 'None'}
                        </div>
                    </div>
                </div>

                <div style="background: rgba(30, 41, 59, 0.6); padding: 1rem; border-radius: 8px; font-size: 0.85rem;">
                    <p><strong>Cup-to-Disc Ratio (CDR):</strong> ${opticDisc.cupToDiscRatio} (${opticDisc.status})</p>
                    <p style="margin-top: 0.3rem;"><strong>4-2-1 Severity Rule Check:</strong> ${quadrantBreakdown.meets421Rule ? 'Rule Triggered (>20 hemorrhages in 4 quadrants)' : 'Not Met'}</p>
                </div>
            `;
        }
    }

    renderGradingView() {
        const gradcamCanvas = document.getElementById('gradcam-canvas');
        const currentCase = SAMPLE_CASES[this.selectedCaseIndex];

        if (gradcamCanvas) {
            drawFundusImage(gradcamCanvas, currentCase);
            generateGradCAMHeatmap(gradcamCanvas, this.segResult, {
                opacity: this.viewState.heatmapOpacity,
                palette: this.viewState.palette
            });
        }

        const detailsBox = document.getElementById('grading-details-box');
        if (detailsBox && this.grading) {
            detailsBox.innerHTML = `
                <div class="report-diagnosis-banner ${this.grading.referable ? 'badge-referable' : 'badge-normal'}">
                    <div>
                        <span class="icdr-grade">${this.grading.icdrTitle}</span>
                        <span class="confidence-tag">AI Softmax Confidence: ${(this.grading.confidence * 100).toFixed(0)}%</span>
                    </div>
                </div>

                <div style="background: rgba(30, 41, 59, 0.6); padding: 1rem; border-radius: 8px; font-size: 0.85rem;">
                    <p><strong>Recommended Referral Triage:</strong> ${this.grading.referralAction}</p>
                    <p style="margin-top: 0.4rem; color: var(--text-muted);">${this.grading.recommendation}</p>
                </div>
            `;
        }

        // Render ROC Chart Canvas
        const rocCanvas = document.getElementById('roc-chart-canvas');
        if (rocCanvas) drawROCChart(rocCanvas);
    }

    renderReportView() {
        const target = document.getElementById('report-card-render-target');
        const currentCase = SAMPLE_CASES[this.selectedCaseIndex];
        
        if (target && this.quality && this.segResult && this.grading) {
            target.innerHTML = generateClinicalReportHTML(currentCase, this.quality, this.segResult, this.grading);
        }
    }

    runSimulinkSimulator() {
        const results = this.simulator.runSimulation();

        const tatEl = document.getElementById('sim-out-tat');
        const utilEl = document.getElementById('sim-out-util');
        const bottleneckEl = document.getElementById('sim-bottleneck-banner');

        if (tatEl) tatEl.innerText = `${results.avgTurnaroundHours} Hours`;
        if (utilEl) utilEl.innerText = `${results.doctorUtilizationPercent}%`;

        if (bottleneckEl) {
            bottleneckEl.innerHTML = `<strong>System Bottleneck Status:</strong> ${results.primaryBottleneck}`;
            if (results.doctorUtilizationPercent > 90) {
                bottleneckEl.style.borderColor = 'var(--accent-rose)';
                bottleneckEl.style.background = 'rgba(244, 63, 94, 0.1)';
            } else {
                bottleneckEl.style.borderColor = 'var(--accent-emerald)';
                bottleneckEl.style.background = 'rgba(16, 185, 129, 0.1)';
            }
        }

        // Render Latency Chart
        const latCanvas = document.getElementById('sim-latency-canvas');
        if (latCanvas) drawQueueLatencyChart(latCanvas, results.latencyHistoryHours);
    }

    setupEventListeners() {
        // Toggle Buttons in Dashboard
        const setupModeBtn = (btnId, modeName) => {
            document.getElementById(btnId)?.addEventListener('click', (e) => {
                document.querySelectorAll('.controls-bar .btn-toggle').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.viewState.mode = modeName;
                this.renderMainDashboardCanvas();
            });
        };

        setupModeBtn('btn-toggle-original', 'original');
        setupModeBtn('btn-toggle-clahe', 'clahe');
        setupModeBtn('btn-toggle-gradcam', 'gradcam');
        setupModeBtn('btn-toggle-lesions', 'lesions');

        document.getElementById('btn-quick-report')?.addEventListener('click', () => {
            this.switchTab('report');
        });

        // CLAHE Controls
        document.getElementById('slider-clahe-clip')?.addEventListener('input', (e) => {
            this.viewState.claheClip = parseFloat(e.target.value);
            document.getElementById('val-clahe-clip').innerText = e.target.value;
            this.renderIQAView();
            if (this.viewState.mode === 'clahe') this.renderMainDashboardCanvas();
        });

        document.getElementById('btn-green-channel-toggle')?.addEventListener('click', (e) => {
            this.viewState.greenOnly = !this.viewState.greenOnly;
            e.currentTarget.classList.toggle('active', this.viewState.greenOnly);
            this.renderIQAView();
            if (this.viewState.mode === 'clahe') this.renderMainDashboardCanvas();
        });

        // Segmentation Toggles
        const setupSegToggle = (btnId, toggleKey) => {
            document.getElementById(btnId)?.addEventListener('click', (e) => {
                this.viewState.segToggles[toggleKey] = !this.viewState.segToggles[toggleKey];
                e.currentTarget.classList.toggle('active', this.viewState.segToggles[toggleKey]);
                this.renderSegmentationView();
                if (this.viewState.mode === 'lesions') this.renderMainDashboardCanvas();
            });
        };

        setupSegToggle('toggle-seg-od', 'showOD');
        setupSegToggle('toggle-seg-ma', 'showMA');
        setupSegToggle('toggle-seg-he', 'showExudates');
        setupSegToggle('toggle-seg-hm', 'showHM');

        // Grad-CAM Controls
        document.getElementById('slider-heatmap-opacity')?.addEventListener('input', (e) => {
            this.viewState.heatmapOpacity = parseFloat(e.target.value);
            document.getElementById('val-heatmap-opacity').innerText = e.target.value;
            this.renderGradingView();
            if (this.viewState.mode === 'gradcam') this.renderMainDashboardCanvas();
        });

        document.getElementById('select-palette')?.addEventListener('change', (e) => {
            this.viewState.palette = e.target.value;
            this.renderGradingView();
            if (this.viewState.mode === 'gradcam') this.renderMainDashboardCanvas();
        });

        // Simulink Simulator Controls
        const bindSimSlider = (sliderId, valId, unit, paramKey) => {
            document.getElementById(sliderId)?.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                document.getElementById(valId).innerText = `${val.toLocaleString()} ${unit}`;
                this.simulator.setParam(paramKey, val);
                this.runSimulinkSimulator();
            });
        };

        bindSimSlider('sim-slider-patients', 'sim-val-patients', 'Patients / Year', 'annualPatients');
        bindSimSlider('sim-slider-phcs', 'sim-val-phcs', 'PHCs', 'numPHCs');
        bindSimSlider('sim-slider-doctors', 'sim-val-doctors', 'Doctors on Duty', 'numOphthalmologists');

        document.getElementById('sim-select-bandwidth')?.addEventListener('change', (e) => {
            this.simulator.setParam('bandwidthType', e.target.value);
            this.runSimulinkSimulator();
        });

        document.getElementById('sim-check-edge')?.addEventListener('change', (e) => {
            this.simulator.setParam('useEdgeAITriage', e.target.checked);
            this.runSimulinkSimulator();
        });

        // Custom Fundus Image File Upload Handler
        const uploadBox = document.getElementById('fundus-upload-box');
        const fileInput = document.getElementById('custom-fundus-file-input');

        uploadBox?.addEventListener('click', () => fileInput?.click());

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    this.handleCustomUploadedImage(img, file.name);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    handleCustomUploadedImage(loadedImg, filename) {
        const customCase = {
            id: `CUSTOM-${Date.now().toString().slice(-4)}`,
            patientId: 'PAT-UPLOADED',
            age: 50,
            gender: 'Unknown',
            location: `User Upload (${filename})`,
            grade: 2,
            gradeName: 'Uploaded Scan Analysis',
            description: `Custom fundus image upload: ${filename}`,
            cameraType: 'Custom Field Camera',
            lesionSpecs: { ma: 14, exudates: 8, hemorrhages: 10, nv: false },
            isUngradeable: false,
            customImage: loadedImg
        };

        // Add to SAMPLE_CASES list
        SAMPLE_CASES.unshift(customCase);
        this.selectedCaseIndex = 0;

        // Re-render UI list & run pipeline
        this.renderCaseList();
        
        // Draw custom image onto canvas directly
        const mainCanvas = document.getElementById('main-fundus-canvas');
        if (mainCanvas) {
            const ctx = mainCanvas.getContext('2d');
            ctx.fillStyle = '#05070a';
            ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
            ctx.drawImage(loadedImg, 0, 0, mainCanvas.width, mainCanvas.height);
        }

        this.updateCurrentCase();
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.init();
});
