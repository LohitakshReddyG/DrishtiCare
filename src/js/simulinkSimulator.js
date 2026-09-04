/**
 * simulinkSimulator.js
 * Telemedicine Screening Pipeline Simulator (District Level: 100,000+ Patients/Year)
 * Simulates PHC Acquisition, Bandwidth, Edge AI Triage, Cloud GPU, and Doctor Capacity Bottlenecks.
 */

export class TelemedicinePipelineSimulator {
    constructor() {
        // Default Configuration Parameters
        this.params = {
            annualPatients: 120000,      // Total patients served in district per year
            numPHCs: 60,                 // Primary Healthcare Centres
            bandwidthType: '3G',         // '2G', '3G', '4G', 'Satellite'
            useEdgeAITriage: true,       // On-site edge screening filter
            cloudGPUNodes: 4,            // Cloud GPU batch inference nodes
            numOphthalmologists: 5,      // Tele-ophthalmologists on duty
            doctorHoursPerDay: 6,        // Doctor active review hours per day
            referableRate: 0.18          // ~18% DR population prevalence in India
        };
    }

    /**
     * Updates simulation parameter
     */
    setParam(key, val) {
        this.params[key] = val;
    }

    /**
     * Executes Discrete-Event Queue Simulation for 365 Days
     * @returns {Object} Simulation Results & Bottleneck Analytics
     */
    runSimulation() {
        const {
            annualPatients,
            numPHCs,
            bandwidthType,
            useEdgeAITriage,
            cloudGPUNodes,
            numOphthalmologists,
            doctorHoursPerDay,
            referableRate
        } = this.params;

        // Daily load
        const workingDaysPerYear = 300;
        const dailyPatientsTotal = Math.round(annualPatients / workingDaysPerYear); // e.g. 400 patients/day
        const dailyPerPHC = Math.max(1, Math.round(dailyPatientsTotal / numPHCs));

        // Bandwidth Speed (Upload speed in Mbps per image 2.5MB)
        const speedsMbps = { '2G': 0.15, '3G': 2.5, '4G': 15.0, 'Satellite': 1.0 };
        const uploadSpeed = speedsMbps[bandwidthType] || 2.5;
        const imageSizeMb = 20.0; // 2.5MB = 20 Megabits
        const transmissionTimeSec = imageSizeMb / uploadSpeed; // upload time per image in seconds

        // Edge AI Filtering Impact
        const ungradeableRate = 0.08; // 8% images rejected at edge
        const nonReferableAutoFilter = useEdgeAITriage ? 0.70 : 0.0; // Edge AI filters 70% normal cases without doctor review needed

        // Workloads
        const imagesAcquiredDaily = dailyPatientsTotal;
        const imagesRejectedAtEdge = Math.round(imagesAcquiredDaily * ungradeableRate);
        const validImages = imagesAcquiredDaily - imagesRejectedAtEdge;

        const referableImages = Math.round(validImages * referableRate);
        const nonReferableImages = validImages - referableImages;

        // Images requiring Doctor Review
        const imagesToDoctorReview = Math.round(referableImages + nonReferableImages * (1 - nonReferableAutoFilter));

        // Doctor Processing Capacity
        const secondsPerReview = 28; // 30-second protocol
        const reviewsPerDoctorPerHour = Math.floor(3600 / secondsPerReview); // ~128 reviews/hr
        const dailyDoctorCapacity = numOphthalmologists * doctorHoursPerDay * reviewsPerDoctorPerHour;

        // Queue Backlog & Latency
        let dailyBacklog = 0;
        const backlogHistory = [];
        const latencyHistoryHours = [];

        let currentBacklog = 0;
        for (let day = 1; day <= 30; day++) {
            const incoming = imagesToDoctorReview;
            const processed = Math.min(incoming + currentBacklog, dailyDoctorCapacity);
            currentBacklog = Math.max(0, (incoming + currentBacklog) - processed);
            
            backlogHistory.push(currentBacklog);
            
            // Average Turnaround Time (TAT) in hours
            const networkDelayHours = (transmissionTimeSec * (incoming / numPHCs)) / 3600;
            const queueDelayHours = (currentBacklog / Math.max(1, dailyDoctorCapacity)) * 24;
            const totalTATHours = Math.round((0.2 + networkDelayHours + queueDelayHours) * 10) / 10;
            latencyHistoryHours.push(totalTATHours);
        }

        const avgTAT = latencyHistoryHours[latencyHistoryHours.length - 1];
        const doctorUtilization = Math.min(100, Math.round((imagesToDoctorReview / Math.max(1, dailyDoctorCapacity)) * 100));

        // Financial Cost Estimation
        const totalProgramCostINR = (annualPatients * 120) + (numPHCs * 15000) + (numOphthalmologists * 600000);
        const costPerPatient = Math.round(totalProgramCostINR / annualPatients);

        // System Bottleneck Identification
        let primaryBottleneck = 'None (Optimal Resource Allocation)';
        if (transmissionTimeSec > 40) {
            primaryBottleneck = 'Network Bandwidth Constraint (2G Telemetry Delay)';
        } else if (doctorUtilization > 95) {
            primaryBottleneck = 'Doctor Review Overload (Insufficient Ophthalmologists)';
        } else if (cloudGPUNodes < Math.ceil(dailyPatientsTotal / 500)) {
            primaryBottleneck = 'Cloud GPU Compute Bottleneck';
        }

        return {
            annualPatients,
            dailyPatientsTotal,
            transmissionTimeSec: Math.round(transmissionTimeSec * 10) / 10,
            imagesToDoctorReview,
            dailyDoctorCapacity,
            doctorUtilizationPercent: doctorUtilization,
            finalBacklogCases: currentBacklog,
            avgTurnaroundHours: avgTAT,
            costPerPatientINR: costPerPatient,
            primaryBottleneck,
            backlogHistory,
            latencyHistoryHours,
            referralBreakdown: {
                totalScreened: dailyPatientsTotal,
                edgeRejected: imagesRejectedAtEdge,
                autoClearedNormal: Math.round(nonReferableImages * nonReferableAutoFilter),
                referredToDoctor: imagesToDoctorReview
            }
        };
    }
}
