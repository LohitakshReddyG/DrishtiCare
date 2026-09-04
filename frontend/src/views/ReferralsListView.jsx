import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Eye, 
  Building2,
  Calendar,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { fetchReferrals } from '../services/api';
import { ReferralDetailModal } from '../components/ReferralDetailModal';
import Loader from '../components/ui/Loader';

export const ReferralsListView = ({ onSelectReferralSlip }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [selectedReferral, setSelectedReferral] = useState(null);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const data = await fetchReferrals();
      setReferrals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChanged = (referralId, newStatus) => {
    setReferrals(prev => prev.map(r => r.id === referralId ? { ...r, status: newStatus } : r));
  };

  const filtered = referrals.filter(r => {
    const matchesSearch = 
      r.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patient_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUrgency = filterUrgency === 'ALL' || r.urgency.toUpperCase() === filterUrgency;
    return matchesSearch && matchesUrgency;
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-soft pb-6">
        <div>
          <h1 className="text-2xl font-bold text-espresso">Tele-Ophthalmology Referrals Roster</h1>
          <p className="text-sm text-dark-brown/80">
            Track all dispatched and pending patient referrals across district eye hospitals. Click any referral to view full clinical details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-espresso bg-sand px-3 py-1.5 rounded-lg border border-border-soft">
            Total Referrals: {referrals.length}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-cream border border-border-soft rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-dark-brown/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, code, or referral ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-sand/30 border border-border-soft rounded-xl pl-9 pr-4 py-2 text-xs text-espresso focus:outline-none focus:border-forest"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-dark-brown/60" />
          <div className="flex items-center gap-1 bg-sand/40 p-1 rounded-xl border border-border-soft text-xs">
            {['ALL', 'URGENT', 'PRIORITY', 'ROUTINE'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterUrgency(tier)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  filterUrgency === tier
                    ? 'bg-espresso text-cream shadow-sm'
                    : 'text-dark-brown hover:text-espresso'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="bg-cream border border-border-soft rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-soft text-dark-brown/70 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Referral ID</th>
                <th className="py-3 px-3">Patient Code &amp; Name</th>
                <th className="py-3 px-3">DR Severity Finding</th>
                <th className="py-3 px-3">Urgency &amp; Window</th>
                <th className="py-3 px-3">Designated Hospital</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft/40">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12">
                    <Loader title="Loading referrals..." subtitle="Retrieving patient roster" size="md" />
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((ref) => (
                  <tr 
                    key={ref.id} 
                    onClick={() => setSelectedReferral(ref)}
                    className="hover:bg-sand/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-forest">
                      {ref.referral_code}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-espresso">{ref.patient_name}</div>
                      <div className="text-[11px] font-mono text-dark-brown/60">{ref.patient_code}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sand text-espresso border border-border-soft">
                        {ref.dr_grade_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className={`font-bold ${ref.urgency === 'Urgent' ? 'text-terracotta-dark' : 'text-terracotta'}`}>
                        {ref.urgency}
                      </div>
                      <div className="text-[11px] text-dark-brown/70">{ref.suggested_timeframe}</div>
                    </td>
                    <td className="py-3.5 px-3 text-dark-brown max-w-[180px] truncate">
                      {ref.target_facility}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                        ref.status === 'Attended' ? 'bg-sage/30 text-forest' : 'bg-sand text-espresso'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReferral(ref);
                        }}
                        className="bg-sand hover:bg-border-soft text-espresso px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 ml-auto transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-forest" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-dark-brown/60">
                    No referral slips recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral Detail Modal */}
      {selectedReferral && (
        <ReferralDetailModal
          referral={selectedReferral}
          onClose={() => setSelectedReferral(null)}
          onStatusChanged={handleStatusChanged}
        />
      )}
    </div>
  );
};
