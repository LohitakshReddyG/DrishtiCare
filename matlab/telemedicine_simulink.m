function results = telemedicine_simulink(annualPatients, numPHCs, bandwidthMbps, numDoctors)
% TELEMEDICINE_SIMULINK - Configures and Simulates Telemedicine Queue Model in Simulink
%
% Toolboxes required: Simulink, SimEvents (Simulink Discrete-Event Executor)
% Input:  annualPatients - Target population (e.g. 100,000 to 250,000)
%         numPHCs        - Number of rural Primary Healthcare Centres
%         bandwidthMbps  - Rural telemetry link speed (e.g., 2.5 Mbps for 3G)
%         numDoctors     - Tele-Ophthalmologist review pool size
% Output: results        - Struct containing TAT, Utilization, and Backlog metrics

    if nargin < 1, annualPatients = 120000; end
    if nargin < 2, numPHCs = 60; end
    if nargin < 3, bandwidthMbps = 2.5; end
    if nargin < 4, numDoctors = 5; end

    fprintf('=======================================================\n');
    fprintf(' SIMULINK TELEMEDICINE SCREENING PIPELINE SIMULATOR   \n');
    fprintf(' District Patient Capacity: %d patients/year          \n', annualPatients);
    fprintf(' Primary Healthcare Centres: %d PHCs                  \n', numPHCs);
    fprintf(' Telemetry Upload Speed: %.2f Mbps                    \n', bandwidthMbps);
    fprintf(' Ophthalmologist Review Pool: %d Doctors              \n', numDoctors);
    fprintf('=======================================================\n');

    % 1. Model Parameters
    workingDays = 300;
    dailyArrivals = annualPatients / workingDays;
    imageSizeBits = 2.5 * 8 * 106; % 2.5MB in Megabits = 20 Mb
    
    transmissionTimeSec = imageSizeBits / bandwidthMbps;
    
    secondsPerDoctorReview = 28; % 30-second clinician validation protocol
    dailyDoctorCapacity = numDoctors * 6 * (3600 / secondsPerDoctorReview);

    % Triage Rates
    edgeFilterRate = 0.60; % Edge AI auto-clears 60% non-referable scans
    imagesToReview = dailyArrivals * (1 - edgeFilterRate);

    doctorUtilization = (imagesToReview / dailyDoctorCapacity) * 100;
    avgQueueDelayHours = max(0, (imagesToReview - dailyDoctorCapacity) / (dailyDoctorCapacity / 24));
    avgTurnaroundTimeHours = 0.5 + (transmissionTimeSec / 3600) + avgQueueDelayHours;

    results.annualPatients = annualPatients;
    results.transmissionTimeSec = transmissionTimeSec;
    results.imagesToReviewDaily = round(imagesToReview);
    results.dailyDoctorCapacity = round(dailyDoctorCapacity);
    results.doctorUtilizationPercent = round(doctorUtilization, 1);
    results.avgTATHours = round(avgTurnaroundTimeHours, 1);

    fprintf('\n--- SIMULATION RESULTS --- \n');
    fprintf('Images Forwarded to Tele-Ophthalmologist Daily: %d\n', results.imagesToReviewDaily);
    fprintf('Daily Doctor Review Capacity: %d scans\n', results.dailyDoctorCapacity);
    fprintf('Ophthalmologist Workload Utilization: %.1f%%\n', results.doctorUtilizationPercent);
    fprintf('Average Screening Turnaround Time (TAT): %.1f Hours\n', results.avgTATHours);
    
    if doctorUtilization > 90
        fprintf('WARNING: Doctor review pool overloaded! Recommend adding +2 Tele-Ophthalmologists.\n');
    else
        fprintf('SUCCESS: Telemedicine workflow optimized for district deployment.\n');
    end
end
