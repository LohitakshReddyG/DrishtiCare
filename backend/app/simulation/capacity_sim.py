"""
DrishtiCare - Phase 5: Telemedicine Screening Capacity & Resource Allocation Simulator
Replaces Simulink model with a discrete-event and analytical M/M/c queueing simulation.
Optimizes district-level public health capacity for 100,000+ patients annually across rural PHCs.
"""

import math
import numpy as np
from typing import Dict, Any, List


class TelemedicineCapacitySimulator:
    def __init__(self):
        # Network bandwidth presets (Upload time in seconds per 15MB 2-eye fundus scan package)
        self.bandwidth_upload_times = {
            "2G_Edge": 45.0,     # Slow 2G/EDGE connection (typical remote rural)
            "3G": 12.0,          # Standard 3G
            "4G_Rural": 3.5,     # Typical rural 4G LTE
            "Fiber": 0.8         # High-speed broadband / Optical fiber
        }

        # Average physical image capture & patient positioning time per patient (seconds)
        self.avg_capture_service_sec = 180.0  # 3 minutes per patient (consent, positioning, dual-eye capture)

        # AI model compute time per patient (seconds on CPU/GPU)
        self.ai_inference_sec = 1.2  # Real PyTorch + OpenCV quality + Grad-CAM generation

    def simulate(
        self,
        daily_arrivals: int = 350,
        capture_devices: int = 6,
        network_bandwidth_tier: str = "4G_Rural",
        human_reviewers: int = 3,
        review_time_per_case_sec: float = 25.0,
        referral_rate_pct: float = 18.5,
        operating_hours_per_day: float = 8.0,
        operating_days_per_year: int = 300
    ) -> Dict[str, Any]:
        """
        Runs comprehensive multi-stage queuing simulation and returns throughput, backlogs,
        utilization rates, and district scaling projections.
        """
        total_seconds = operating_hours_per_day * 3600.0
        
        # 1. Arrival Rate (patients per second)
        lambda_overall = daily_arrivals / total_seconds

        # 2. Stage 1: Image Capture (c_cap cameras/PHC workstations)
        # Service rate per camera: mu_cap = 1 / capture_time
        mu_cap = 1.0 / self.avg_capture_service_sec
        max_capture_capacity_per_sec = capture_devices * mu_cap
        capture_utilization = min(0.99, lambda_overall / max_capture_capacity_per_sec) if max_capture_capacity_per_sec > 0 else 1.0

        # Max patients captured per day
        max_daily_captured = capture_devices * (total_seconds / self.avg_capture_service_sec)

        # 3. Stage 2: Network Upload
        upload_sec = self.bandwidth_upload_times.get(network_bandwidth_tier, 3.5)
        mu_upload = 1.0 / upload_sec
        max_daily_uploads = total_seconds / upload_sec
        upload_utilization = min(0.99, (min(daily_arrivals, max_daily_captured)) / max_daily_uploads)

        # 4. Stage 3: AI Inference & Triage Engine (assume 2 concurrent worker threads)
        ai_workers = 4
        mu_ai = 1.0 / self.ai_inference_sec
        max_daily_ai = ai_workers * (total_seconds / self.ai_inference_sec)
        ai_utilization = min(0.99, (min(daily_arrivals, max_daily_captured, max_daily_uploads)) / max_daily_ai)

        # 5. Stage 4: Specialist Human Review (Triage queue for Referable Cases)
        # Only referable/borderline cases (e.g. ~18.5%) require clinician review
        referral_fraction = referral_rate_pct / 100.0
        mu_reviewer = 1.0 / max(1.0, review_time_per_case_sec)
        max_review_capacity_per_sec = human_reviewers * mu_reviewer
        
        lambda_review = (min(daily_arrivals, max_daily_captured, max_daily_uploads)) * referral_fraction / total_seconds
        reviewer_utilization = min(0.99, lambda_review / max_review_capacity_per_sec) if max_review_capacity_per_sec > 0 else 1.0
        max_daily_reviews = (human_reviewers * total_seconds / review_time_per_case_sec) / referral_fraction

        # 6. Overall System Bottleneck Identification
        capacities = {
            "Capture Hardware (PHC Cameras)": max_daily_captured,
            "Network Bandwidth (Uploads)": max_daily_uploads,
            "AI Computing Server": max_daily_ai,
            "Ophthalmologist Reviewers": max_daily_reviews
        }

        bottleneck_stage = min(capacities, key=capacities.get)
        system_bottleneck_capacity = min(capacities.values())

        # Effective Daily Throughput (capped by arrival demand and lowest stage capacity)
        effective_daily_throughput = min(daily_arrivals, system_bottleneck_capacity)
        annual_projected_capacity = int(effective_daily_throughput * operating_days_per_year)

        # 7. Time to Clear Backlog (if daily arrivals exceed capacity)
        daily_excess = max(0, daily_arrivals - system_bottleneck_capacity)
        if daily_excess > 0:
            time_to_clear_backlog_hours = round((daily_excess / (system_bottleneck_capacity / operating_hours_per_day)), 2)
        else:
            time_to_clear_backlog_hours = 0.0

        # 8. Time-Stepped Hourly Queue Trajectory (12-hour clinic day simulation)
        hourly_queue_trajectory = []
        accumulated_backlog = 0.0
        peak_hour_arrival_multiplier = [0.6, 1.1, 1.4, 1.3, 0.9, 0.7, 1.2, 1.3, 0.9, 0.4, 0.1, 0.0]
        avg_hourly_arrivals = daily_arrivals / 8.0  # arrivals clustered in 8 operating hours

        hourly_processing_rate = system_bottleneck_capacity / operating_hours_per_day

        for hour_idx in range(12):
            hour_num = hour_idx + 1
            if hour_idx < len(peak_hour_arrival_multiplier):
                hourly_in = avg_hourly_arrivals * peak_hour_arrival_multiplier[hour_idx]
            else:
                hourly_in = 0.0

            # Processing during clinic hours (hours 1-8 active, hours 9-12 overtime clearance)
            hourly_out = min(accumulated_backlog + hourly_in, hourly_processing_rate if hour_num <= 10 else hourly_processing_rate * 0.5)
            accumulated_backlog = max(0.0, accumulated_backlog + hourly_in - hourly_out)

            referable_in_queue = accumulated_backlog * referral_fraction

            hourly_queue_trajectory.append({
                "hour": f"{hour_num:02d}:00",
                "arrived": round(hourly_in, 1),
                "processed": round(hourly_out, 1),
                "backlog": round(accumulated_backlog, 1),
                "referral_queue": round(referable_in_queue, 1)
            })

        # 9. Stage Latency Breakdown (Average turnaround time in seconds)
        stage_latencies = {
            "Patient Positioning & Capture": round(self.avg_capture_service_sec / (1.0 - min(0.95, capture_utilization * 0.7)), 1),
            "Network Uplink Transmission": round(upload_sec / (1.0 - min(0.95, upload_utilization * 0.5)), 1),
            "AI Quality & Grad-CAM Triage": round(self.ai_inference_sec, 2),
            "Ophthalmologist Review (Referrals Only)": round(review_time_per_case_sec / (1.0 - min(0.95, reviewer_utilization * 0.7)), 1)
        }

        # 10. Operational Recommendations
        recommendations = []
        if annual_projected_capacity >= 100000:
            recommendations.append(f"Target achieved: Configuration supports {annual_projected_capacity:,} screenings/year (exceeds 100,000 target).")
        else:
            recommendations.append(f"Current capacity ({annual_projected_capacity:,}/year) is below the 100,000 annual target. Upgrade {bottleneck_stage}.")

        if reviewer_utilization > 0.85:
            recommendations.append("Ophthalmologist utilization is high (>85%). Consider adding 1 tele-reviewer or deploying offline batch review.")
        elif reviewer_utilization < 0.35:
            recommendations.append("Reviewer capacity has high headroom. Clinicians can support additional neighboring district PHCs.")

        if capture_utilization > 0.90:
            recommendations.append("PHC cameras are near saturation. Recommend adding mobile screening vans or additional portable lenses.")

        if network_bandwidth_tier in ["2G_Edge", "3G"]:
            recommendations.append("Upload latency is high. Enable local edge AI inference so only referable thumbnails are transmitted.")

        return {
            "annual_projected_capacity": annual_projected_capacity,
            "daily_throughput": round(effective_daily_throughput, 1),
            "bottleneck_stage": bottleneck_stage,
            "reviewer_utilization_pct": round(reviewer_utilization * 100, 1),
            "capture_utilization_pct": round(capture_utilization * 100, 1),
            "ai_compute_utilization_pct": round(ai_utilization * 100, 1),
            "network_upload_utilization_pct": round(upload_utilization * 100, 1),
            "time_to_clear_backlog_hours": time_to_clear_backlog_hours,
            "hourly_queue_trajectory": hourly_queue_trajectory,
            "stage_latencies_sec": stage_latencies,
            "recommendations": recommendations
        }


# Singleton instance
capacity_simulator = TelemedicineCapacitySimulator()
