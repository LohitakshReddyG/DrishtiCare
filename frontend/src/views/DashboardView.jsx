import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Users, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  FileText,
  Activity
} from 'lucide-react';
import Loader from '../components/ui/Loader';
import SlideTextButton from '../components/ui/SlideTextButton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useReducedMotion } from 'motion/react';
import { fetchDashboardSummary } from '../services/api';
import { InView } from '../components/motion-primitives/in-view';
import { AnimatedNumber } from '../components/motion-primitives/animated-number';

export const DashboardView = ({ onStartNewScreening, onSelectPatient, onViewReferrals }) => {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const summary = await fetchDashboardSummary();
      setData(summary);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load live dashboard metrics. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader title="Loading live clinic triage data..." subtitle="Please wait" size="md" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner & Hero Action */}
      <div className="bg-sand/60 border border-border-soft rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-forest"></span>
            Primary Health Centre Triage Live
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-espresso tracking-tight">
            Namaste, Health Officer
          </h1>
          <p className="text-dark-brown/80 text-sm md:text-base max-w-2xl leading-relaxed">
            Welcome to the <span className="font-semibold text-espresso">DrishtiCare Tele-Ophthalmology Station</span>. 
            Screen diabetic patients for vision-threatening retinopathy with instant Grad-CAM lesion explainability.
          </p>
        </div>

        {/* Primary Action Button - Forest Green */}
        <SlideTextButton
          onClick={onStartNewScreening}
          text="Start New Screening"
          hoverText="Capture Now"
          icon={PlusCircle}
          className="flex-shrink-0 px-7 py-4 text-base md:text-lg w-full sm:w-auto"
        />
      </div>

      {/* Metric Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <InView variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.2 }} once>
          <div className="bg-cream border border-border-soft rounded-xl p-5 shadow-sm space-y-2 h-full">
            <div className="flex items-center justify-between text-dark-brown/70 text-xs font-semibold uppercase tracking-wider">
              <span>Today's Screenings</span>
              <Users className="w-4 h-4 text-forest" />
            </div>
            <div className="text-3xl font-extrabold text-espresso font-sans">
              <AnimatedNumber value={data?.today_screenings ?? 0} />
            </div>
            <div className="text-xs text-forest font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active PHC Session</span>
            </div>
          </div>
        </InView>

        <InView variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.2, delay: 0.05 }} once>
          <div 
            onClick={onViewReferrals}
            className="bg-cream border border-border-soft hover:border-terracotta/60 rounded-xl p-5 shadow-sm space-y-2 cursor-pointer transition-all hover:shadow-md h-full"
          >
            <div className="flex items-center justify-between text-dark-brown/70 text-xs font-semibold uppercase tracking-wider">
              <span>Pending Referrals</span>
              <AlertTriangle className="w-4 h-4 text-terracotta" />
            </div>
            <div className="text-3xl font-extrabold text-terracotta font-sans">
              <AnimatedNumber value={data?.pending_referrals ?? 0} />
            </div>
            <div className="text-xs text-dark-brown/70 font-medium flex items-center justify-between">
              <span>Awaiting specialist review</span>
              <ArrowRight className="w-3.5 h-3.5 text-terracotta" />
            </div>
          </div>
        </InView>

        <InView variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.2, delay: 0.1 }} once>
          <div className="bg-cream border border-border-soft rounded-xl p-5 shadow-sm space-y-2 h-full">
            <div className="flex items-center justify-between text-dark-brown/70 text-xs font-semibold uppercase tracking-wider">
              <span>Screened This Week</span>
              <Calendar className="w-4 h-4 text-dark-brown" />
            </div>
            <div className="text-3xl font-extrabold text-espresso font-sans">
              <AnimatedNumber value={data?.screened_this_week ?? 0} />
            </div>
            <div className="text-xs text-dark-brown/70 font-medium">
              Weekly triage throughput
            </div>
          </div>
        </InView>

        <InView variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.2, delay: 0.15 }} once>
          <div className="bg-cream border border-border-soft rounded-xl p-5 shadow-sm space-y-2 h-full">
            <div className="flex items-center justify-between text-dark-brown/70 text-xs font-semibold uppercase tracking-wider">
              <span>Referable Case Rate</span>
              <TrendingUp className="w-4 h-4 text-gold" />
            </div>
            <div className="text-3xl font-extrabold text-espresso font-sans">
              <AnimatedNumber value={data?.referable_rate_pct ?? 0} />%
            </div>
            <div className="text-xs text-dark-brown/70 font-medium">
              Classes 2–4 (Moderate to PDR)
            </div>
          </div>
        </InView>
      </div>


      {/* Main Grid: Activity Chart & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 7-Day Activity Chart */}
        <div className="lg:col-span-1 bg-cream border border-border-soft rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border-soft/60 pb-3">
            <div>
              <h2 className="font-bold text-espresso text-base">7-Day Screening Volume</h2>
              <p className="text-xs text-dark-brown/70">Daily patient throughput</p>
            </div>
            <Activity className="w-4 h-4 text-forest" />
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.daily_trend_7d || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9DDCC" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#533A2D', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#533A2D', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#3B2923', color: '#F8F3EA', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                  itemStyle={{ color: '#E9DDCC' }}
                />
                <Bar isAnimationActive={!reduceMotion} dataKey="total_screenings" name="Screenings" fill="#315C4B" radius={[4, 4, 0, 0]} />
                <Bar isAnimationActive={!reduceMotion} dataKey="referrals" name="Referrals" fill="#B76E54" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-dark-brown/80 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-forest"></span>
              <span>Screenings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-terracotta"></span>
              <span>Referrals</span>
            </div>
          </div>
        </div>

        {/* Right: Recent Patient Screenings (Real DB data) */}
        <div className="lg:col-span-2 bg-cream border border-border-soft rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border-soft/60 pb-3">
            <div>
              <h2 className="font-bold text-espresso text-base">Recent Patient Triage Records</h2>
              <p className="text-xs text-dark-brown/70">Real-time database entries</p>
            </div>
            <button 
              onClick={onViewReferrals}
              className="text-xs text-forest hover:text-forest-hover font-semibold flex items-center gap-1"
            >
              <span>View All Referrals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-soft text-dark-brown/70 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Patient Code & Name</th>
                  <th className="py-2.5 px-3">Age / Village</th>
                  <th className="py-2.5 px-3">AI Finding</th>
                  <th className="py-2.5 px-3">Triage Urgency</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/40">
                {data?.recent_patients?.length > 0 ? (
                  data.recent_patients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-sand/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-espresso">{pat.full_name}</div>
                        <div className="text-[11px] font-mono text-dark-brown/60">{pat.patient_code}</div>
                      </td>
                      <td className="py-3 px-3 text-dark-brown">
                        <div>{pat.age} yrs · {pat.gender}</div>
                        <div className="text-[11px] text-dark-brown/70 truncate max-w-[140px]">{pat.village}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          pat.referable
                            ? 'bg-terracotta/15 text-terracotta-dark border border-terracotta/30'
                            : 'bg-sage/25 text-forest border border-sage/40'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pat.referable ? 'bg-terracotta' : 'bg-forest'}`}></span>
                          {pat.dr_grade_name}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${
                          pat.urgency === 'Urgent' ? 'text-terracotta-dark font-bold' :
                          pat.urgency === 'Priority' ? 'text-terracotta' : 'text-forest'
                        }`}>
                          {pat.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onSelectPatient(pat)}
                          className="bg-sand hover:bg-border-soft text-espresso px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-dark-brown/60">
                      No screenings recorded yet. Click "Start New Screening" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
