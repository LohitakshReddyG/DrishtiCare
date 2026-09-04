import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Building,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useReducedMotion } from 'motion/react';
import { runCapacitySimulation } from '../services/api';
import { AnimatedNumber } from '../components/motion-primitives/animated-number';
import TeamSelector from '../components/ui/TeamSelector';

export const ProgramCapacityView = () => {
  const reduceMotion = useReducedMotion();
  const [params, setParams] = useState({
    daily_arrivals: 450,
    capture_devices: 8,
    network_bandwidth_tier: '4G_Rural',
    human_reviewers: 3,
    review_time_per_case_sec: 25.0,
    referral_rate_pct: 18.5,
    operating_hours_per_day: 8.0
  });

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runSim();
  }, [params]);

  const runSim = async () => {
    try {
      setLoading(true);
      const res = await runCapacitySimulation(params);
      setSimResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (name, val) => {
    setParams(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const isTargetAchieved = simResult && simResult.annual_projected_capacity >= 100000;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* District Operations Header (Clearly visually distinct from clinical flow) */}
      <div className="bg-espresso text-cream border border-border-soft/30 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sand/20 text-sand text-xs font-semibold uppercase tracking-wider border border-sand/30">
            <Building className="w-3.5 h-3.5" />
            District Health Administration · Program Capacity Model
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-cream">
            Telemedicine Workflow &amp; Capacity Simulation
          </h1>
          <p className="text-cream/80 text-xs md:text-sm max-w-2xl leading-relaxed">
            Estimate daily and annual screening throughput based on staffing, equipment, and network bandwidth.
          </p>
        </div>

        {/* Big 100k+ Headline Metric Counter */}
        <div className="bg-dark-brown/80 border border-sand/30 p-5 rounded-2xl text-center md:text-right flex-shrink-0 w-full md:w-auto">
          <div className="text-[11px] font-semibold text-sand/80 uppercase tracking-wider">
            Annual District Screening Capacity
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-cream font-sans mt-1">
            <AnimatedNumber value={simResult?.annual_projected_capacity ?? 0} />
          </div>
          <div className="mt-1 flex items-center justify-center md:justify-end gap-1.5 text-xs font-bold">
            {isTargetAchieved ? (
              <span className="text-sage flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>On track</span>
              </span>
            ) : (
              <span className="text-terracotta flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Below capacity target</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Parameter Sliders & Simulation Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Resource Control Sliders */}
        <div className="lg:col-span-1 bg-cream border border-border-soft rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border-soft/60 pb-3">
            <h2 className="font-bold text-espresso text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-forest" />
              <span>District Resource Allocation</span>
            </h2>
            <span className="text-[11px] font-mono text-dark-brown/60">Live Dynamic Sim</span>
          </div>

          {/* Slider 1: Daily Arrivals */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-espresso">Daily Patient Arrivals (λ)</label>
              <span className="font-mono font-bold text-forest">{params.daily_arrivals} / day</span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="25"
              value={params.daily_arrivals}
              onChange={(e) => handleSliderChange('daily_arrivals', parseInt(e.target.value))}
              className="w-full accent-forest cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-dark-brown/60">
              <span>100 patients</span>
              <span>1,500 patients</span>
            </div>
          </div>

          {/* Slider 2: Capture Devices */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-espresso">PHC Fundus Cameras (c_cap)</label>
              <span className="font-mono font-bold text-forest">{params.capture_devices} devices</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={params.capture_devices}
              onChange={(e) => handleSliderChange('capture_devices', parseInt(e.target.value))}
              className="w-full accent-forest cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-dark-brown/60">
              <span>1 camera</span>
              <span>20 cameras</span>
            </div>
          </div>

          {/* Slider 3: Network Bandwidth Tier */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-espresso">Network Bandwidth Uplink</label>
            <div className="grid grid-cols-2 gap-2">
              {['2G_Edge', '3G', '4G_Rural', 'Fiber'].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleSliderChange('network_bandwidth_tier', tier)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    params.network_bandwidth_tier === tier
                      ? 'bg-espresso text-cream border-espresso shadow-sm'
                      : 'bg-sand/40 border-border-soft text-dark-brown hover:bg-sand'
                  }`}
                >
                  {tier.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <TeamSelector
            maxTeamSize={10}
            value={params.human_reviewers}
            onChange={(val) => handleSliderChange('human_reviewers', val)}
            label="Tele-Ophthalmologists (c_rev)"
          />

          {/* Slider 5: Review Time Per Case */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-espresso">Avg Review Time per Referable Case</label>
              <span className="font-mono font-bold text-forest">{params.review_time_per_case_sec} sec</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={params.review_time_per_case_sec}
              onChange={(e) => handleSliderChange('review_time_per_case_sec', parseFloat(e.target.value))}
              className="w-full accent-forest cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-dark-brown/60">
              <span>10 sec (AI assisted)</span>
              <span>90 sec</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="pt-2 border-t border-border-soft/60 space-y-2">
            <div className="text-[11px] font-bold text-dark-brown uppercase tracking-wider">Operational Presets</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setParams({
                  daily_arrivals: 400,
                  capture_devices: 6,
                  network_bandwidth_tier: '4G_Rural',
                  human_reviewers: 2,
                  review_time_per_case_sec: 20.0,
                  referral_rate_pct: 18.5,
                  operating_hours_per_day: 8.0
                })}
                className="p-2 rounded-lg bg-sand/50 hover:bg-sand border border-border-soft text-xs text-left font-medium text-espresso"
              >
                Standard District
              </button>
              <button
                type="button"
                onClick={() => setParams({
                  daily_arrivals: 900,
                  capture_devices: 14,
                  network_bandwidth_tier: 'Fiber',
                  human_reviewers: 5,
                  review_time_per_case_sec: 15.0,
                  referral_rate_pct: 18.5,
                  operating_hours_per_day: 8.0
                })}
                className="p-2 rounded-lg bg-sand/50 hover:bg-sand border border-border-soft text-xs text-left font-medium text-espresso"
              >
                High Volume District
              </button>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Charts, Utilization Gauges & Bottleneck Diagnosis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-cream border border-border-soft rounded-xl p-4 shadow-sm">
              <div className="text-dark-brown/70 text-[11px] font-bold uppercase tracking-wider">
                Daily Throughput
              </div>
              <div className="text-2xl font-extrabold text-forest font-sans mt-1">
                <AnimatedNumber value={simResult?.daily_throughput ?? 0} />
                <span className="text-xs text-dark-brown/60 font-normal"> / day</span>
              </div>
              <div className="text-[11px] text-dark-brown/70 mt-0.5">
                Demand: {params.daily_arrivals} arrivals
              </div>
            </div>

            <div className="bg-cream border border-border-soft rounded-xl p-4 shadow-sm">
              <div className="text-dark-brown/70 text-[11px] font-bold uppercase tracking-wider">
                System Bottleneck
              </div>
              <div className="text-sm font-bold text-terracotta font-sans mt-1 truncate">
                {simResult?.bottleneck_stage || 'None'}
              </div>
              <div className="text-[11px] text-dark-brown/70 mt-0.5">
                Primary constraint on scale
              </div>
            </div>

            <div className="bg-cream border border-border-soft rounded-xl p-4 shadow-sm">
              <div className="text-dark-brown/70 text-[11px] font-bold uppercase tracking-wider">
                Reviewer Utilization
              </div>
              <div className="text-3xl font-extrabold text-espresso font-sans">
                <AnimatedNumber value={simResult?.reviewer_utilization_pct ?? 0} />%
              </div>
              <div className="text-[11px] text-dark-brown/70 mt-0.5">
                {simResult?.reviewer_utilization_pct > 80 ? 'High workload' : 'Balanced load'}
              </div>
            </div>
          </div>

          {/* Time-Stepped Hourly Queue Trajectory Chart */}
          <div className="bg-cream border border-border-soft rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-soft/60 pb-3">
              <div>
                <h3 className="font-bold text-espresso text-base">
                  12-Hour Clinic Day Queue Dynamic Trajectory
                </h3>
                <p className="text-xs text-dark-brown/70">
                  Patient arrivals vs. screening throughput vs. accumulated backlog over clinic hours
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-forest"></span>
                  <span>Processed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-terracotta"></span>
                  <span>Backlog</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simResult?.hourly_queue_trajectory || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBacklog" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B76E54" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#B76E54" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#315C4B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#315C4B" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9DDCC" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: '#533A2D', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#533A2D', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#3B2923', color: '#F8F3EA', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                  />
                  <Area isAnimationActive={!reduceMotion} type="monotone" dataKey="arrived" name="Arrivals" stroke="#C39A55" fillOpacity={0} strokeWidth={2} strokeDasharray="4 4" />
                  <Area isAnimationActive={!reduceMotion} type="monotone" dataKey="processed" name="Screened" stroke="#315C4B" fill="url(#colorProcessed)" strokeWidth={2} />
                  <Area isAnimationActive={!reduceMotion} type="monotone" dataKey="backlog" name="Queue Backlog" stroke="#B76E54" fill="url(#colorBacklog)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Utilization Gauges & Operational Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stage Utilization Breakdown */}
            <div className="bg-cream border border-border-soft rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-espresso text-xs uppercase tracking-wider border-b border-border-soft/60 pb-2">
                Sub-System Utilization Rates
              </h4>
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between font-medium text-dark-brown mb-1">
                    <span>PHC Cameras (Capture)</span>
                    <span className="font-mono font-bold">{simResult?.capture_utilization_pct}%</span>
                  </div>
                  <div className="w-full bg-sand h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-forest rounded-full" style={{ width: `${Math.min(100, simResult?.capture_utilization_pct || 0)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-dark-brown mb-1">
                    <span>Network Transmission</span>
                    <span className="font-mono font-bold">{simResult?.network_upload_utilization_pct}%</span>
                  </div>
                  <div className="w-full bg-sand h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-forest rounded-full" style={{ width: `${Math.min(100, simResult?.network_upload_utilization_pct || 0)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-dark-brown mb-1">
                    <span>AI Compute Server</span>
                    <span className="font-mono font-bold">{simResult?.ai_compute_utilization_pct}%</span>
                  </div>
                  <div className="w-full bg-sand h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-forest rounded-full" style={{ width: `${Math.min(100, simResult?.ai_compute_utilization_pct || 0)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-dark-brown mb-1">
                    <span>Ophthalmologist Reviewers</span>
                    <span className="font-mono font-bold">{simResult?.reviewer_utilization_pct}%</span>
                  </div>
                  <div className="w-full bg-sand h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-terracotta rounded-full" style={{ width: `${Math.min(100, simResult?.reviewer_utilization_pct || 0)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-sand/30 border border-border-soft rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-espresso text-xs uppercase tracking-wider border-b border-border-soft/60 pb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>Recommendations</span>
              </h4>
              <ul className="space-y-2 text-xs text-dark-brown/90">
                {simResult?.recommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest mt-1.5 flex-shrink-0"></span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
