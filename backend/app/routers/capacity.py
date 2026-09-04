from fastapi import APIRouter, Depends, Query, Body
from backend.app.models.schemas import CapacitySimRequest, CapacitySimResponse, UserDB
from backend.app.routers.auth import require_auth
from backend.app.simulation.capacity_sim import capacity_simulator

router = APIRouter(prefix="/capacity", tags=["Capacity Simulator"])


@router.get("/simulate", response_model=CapacitySimResponse)
def simulate_capacity_get(
    daily_arrivals: int = Query(350, ge=50, le=2000),
    capture_devices: int = Query(6, ge=1, le=30),
    network_bandwidth_tier: str = Query("4G_Rural"),
    human_reviewers: int = Query(3, ge=1, le=20),
    review_time_per_case_sec: float = Query(25.0, ge=5.0, le=180.0),
    referral_rate_pct: float = Query(18.5, ge=5.0, le=50.0),
    operating_hours_per_day: float = Query(8.0, ge=4.0, le=16.0),
    current_user: UserDB = Depends(require_auth)
):
    """
    Runs district-level queueing simulation based on query parameters.
    """
    res = capacity_simulator.simulate(
        daily_arrivals=daily_arrivals,
        capture_devices=capture_devices,
        network_bandwidth_tier=network_bandwidth_tier,
        human_reviewers=human_reviewers,
        review_time_per_case_sec=review_time_per_case_sec,
        referral_rate_pct=referral_rate_pct,
        operating_hours_per_day=operating_hours_per_day
    )
    return res


@router.post("/simulate", response_model=CapacitySimResponse)
def simulate_capacity_post(
    req: CapacitySimRequest,
    current_user: UserDB = Depends(require_auth)
):
    """
    Runs district-level queueing simulation from JSON body.
    """
    res = capacity_simulator.simulate(
        daily_arrivals=req.daily_arrivals,
        capture_devices=req.capture_devices,
        network_bandwidth_tier=req.network_bandwidth_tier,
        human_reviewers=req.human_reviewers,
        review_time_per_case_sec=req.review_time_per_case_sec,
        referral_rate_pct=req.referral_rate_pct,
        operating_hours_per_day=req.operating_hours_per_day
    )
    return res
