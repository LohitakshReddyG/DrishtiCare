/**
 * explainabilityReport.js
 * 30-Second Ophthalmologist Validation Workflow & Clinical PDF Report Generator
 */

/**
 * Renders structured clinical summary report HTML inside a target modal/container
 * @param {Object} caseItem 
 * @param {Object} quality 
 * @param {Object} segResult 
 * @param {Object} grading 
 * @returns {String} HTML String for Report
 */
export function generateClinicalReportHTML(caseItem, quality, segResult, grading) {
    const dateStr = new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const isReferable = grading.referable;
    const badgeClass = isReferable ? 'badge-referable' : 'badge-normal';
    const badgeText = isReferable ? 'REFERABLE DR (LEVEL 2+)' : 'NON-REFERABLE DR';

    return `
        <div class="clinical-report-container" id="printable-report">
            <!-- Header -->
            <div class="report-header">
                <div class="report-title-group">
                    <h2>TELE-OPHTHALMOLOGY AI SCREENING REPORT</h2>
                    <p class="subtitle">National Health Mission - Rural Eye Care Infrastructure (India)</p>
                </div>
                <div class="report-meta">
                    <p><strong>Report Date:</strong> ${dateStr}</p>
                    <p><strong>Facility:</strong> ${caseItem.location}</p>
                    <p><strong>Camera Unit:</strong> ${caseItem.cameraType}</p>
                </div>
            </div>

            <!-- Patient Information Bar -->
            <div class="report-patient-bar">
                <div class="info-item"><span>Patient ID:</span> <strong>${caseItem.patientId}</strong></div>
                <div class="info-item"><span>Age / Gender:</span> <strong>${caseItem.age} Yrs / ${caseItem.gender}</strong></div>
                <div class="info-item"><span>Scan Case ID:</span> <strong>${caseItem.id}</strong></div>
                <div class="info-item"><span>Quality Status:</span> <strong class="status-${quality.status.toLowerCase()}">${quality.status} (${quality.overallScore}/100)</strong></div>
            </div>

            <!-- DR Diagnosis Banner -->
            <div class="report-diagnosis-banner ${badgeClass}">
                <div class="banner-left">
                    <span class="icdr-grade">${grading.icdrTitle}</span>
                    <span class="confidence-tag">AI Calibrated Confidence: ${(grading.confidence * 100).toFixed(0)}%</span>
                </div>
                <div class="banner-right">
                    <span class="triage-badge">${badgeText}</span>
                </div>
            </div>

            <!-- Main Findings Grid -->
            <div class="report-findings-grid">
                <!-- Lesion Quantification Table -->
                <div class="report-card">
                    <h3>Lesion Quantification & Structural Evidence</h3>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Clinical Feature</th>
                                <th>Count / Metric</th>
                                <th>Diagnostic Severity</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Microaneurysms (MA)</td>
                                <td><strong>${segResult.lesions.counts.ma}</strong></td>
                                <td>${segResult.lesions.counts.ma > 5 ? 'High (NPDR Marker)' : 'Mild / Absent'}</td>
                            </tr>
                            <tr>
                                <td>Hard Exudates (HE)</td>
                                <td><strong>${segResult.lesions.counts.exudates}</strong></td>
                                <td>${segResult.lesions.counts.exudates > 0 ? 'Macular Edema Risk' : 'None'}</td>
                            </tr>
                            <tr>
                                <td>Hemorrhages (Blot/Flame)</td>
                                <td><strong>${segResult.lesions.counts.hemorrhages}</strong></td>
                                <td>${segResult.quadrantBreakdown.affectedQuadrants} Quadrants Affected</td>
                            </tr>
                            <tr>
                                <td>Neovascularization (NV)</td>
                                <td><strong>${segResult.lesions.neovascularization ? 'PRESENT (PDR)' : 'Absent'}</strong></td>
                                <td>${segResult.lesions.neovascularization ? 'URGENT LASER/ANTI-VEGF' : 'Normal'}</td>
                            </tr>
                            <tr>
                                <td>Cup-to-Disc Ratio (CDR)</td>
                                <td><strong>${segResult.opticDisc.cupToDiscRatio}</strong></td>
                                <td>${segResult.opticDisc.status}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Explainability & Recommendation Card -->
                <div class="report-card">
                    <h3>Grad-CAM Attention & Referral Triage</h3>
                    <div class="triage-box">
                        <p class="action-title">Recommended Clinical Action:</p>
                        <p class="action-desc"><strong>${grading.referralAction}</strong></p>
                    </div>
                    <div class="recommendation-text">
                        <p><strong>Diagnostic Summary:</strong> ${grading.recommendation}</p>
                        <p class="note"><em>*Grad-CAM heatmaps highlight focal areas of lesion concentration driving the neural activation score. Validation completed under standard 30-second protocol.</em></p>
                    </div>
                </div>
            </div>

            <!-- Doctor Sign-Off & Verification Box -->
            <div class="report-doctor-signoff">
                <div class="signoff-inputs">
                    <label><strong>Ophthalmologist Decision:</strong></label>
                    <select id="doctor-decision-select" class="form-select">
                        <option value="APPROVE" selected>Approve AI Triage (${grading.icdrTitle})</option>
                        <option value="OVERRIDE_DOWN">Override: Downgrade (Lower Severity)</option>
                        <option value="OVERRIDE_UP">Override: Upgrade (Higher Severity / Maculopathy)</option>
                        <option value="REJECT">Reject Scan: Request Image Recapture</option>
                    </select>
                </div>
                <div class="signoff-notes">
                    <label><strong>Clinical Notes / Instructions for PHC Worker:</strong></label>
                    <input type="text" id="doctor-notes-input" class="form-input" placeholder="e.g. Advise patient HBA1c check; refer to District Hospital OP on Tuesday..." value="${isReferable ? 'Schedule OCT scan & fluorescein angiography at District Hospital.' : 'Continue annual PHC diabetic eye screening schedule.'}" />
                </div>
                <div class="signoff-signature">
                    <p class="sig-line">Dr. Retinal Specialist, MBBS, MS (Ophthal)</p>
                    <p class="sig-meta">Tele-Ophthalmology Network Verified Sign-Off</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Triggers browser window print preview for PDF saving
 */
export function exportReportToPDF() {
    window.print();
}
