import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  User, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Clock,
  ShieldCheck,
  Eye,
  Check
} from 'lucide-react';
import { updateReferralStatus } from '../services/api';

export const ReferralDetailModal = ({ referral, onClose, onStatusChanged }) => {
  if (!referral) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAttended = async () => {
    try {
      await updateReferralStatus(referral.id, 'Attended');
      if (onStatusChanged) onStatusChanged(referral.id, 'Attended');
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const isUrgent = referral.urgency === 'Urgent';
  const isPriority = referral.urgency === 'Priority';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream w-full max-w-2xl rounded-3xl border border-border-soft shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-espresso text-cream p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-cream">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-sand">Clinical Tele-Ophthalmology Referral Slip</h2>
                <span className="bg-sand/20 text-sand px-2 py-0.5 rounded text-[10px] font-mono">
                  {referral.referral_code}
                </span>
              </div>
              <p className="text-xs text-cream/70">
                Referral details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-sand/10 hover:bg-sand/20 text-cream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-charcoal">
          {/* Urgency Alert Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isUrgent 
              ? 'bg-terracotta/10 border-terracotta/40 text-terracotta-dark' 
              : isPriority 
              ? 'bg-gold/15 border-gold/40 text-espresso' 
              : 'bg-sage/20 border-sage/50 text-forest'
          }`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-xs uppercase tracking-wider">
                {referral.urgency} Clinical Referral · Suggested Timeframe: {referral.suggested_timeframe}
              </div>
              <div className="text-xs opacity-90">
                AI Grade: <span className="font-bold">{referral.dr_grade_name}</span> (Grade {referral.dr_grade})
              </div>
            </div>
          </div>

          {/* Patient Profile Card */}
          <div className="bg-sand/40 border border-border-soft rounded-2xl p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-dark-brown/70 flex items-center gap-2">
              <User className="w-4 h-4 text-forest" />
              <span>Patient Demographic Profile</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-dark-brown/60 block text-[10px] uppercase">Full Name</span>
                <span className="font-bold text-espresso text-sm">{referral.patient_name}</span>
              </div>
              <div>
                <span className="text-dark-brown/60 block text-[10px] uppercase">Patient Code</span>
                <span className="font-mono font-bold text-espresso">{referral.patient_code}</span>
              </div>
              <div>
                <span className="text-dark-brown/60 block text-[10px] uppercase">Referral Status</span>
                <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                  referral.status === 'Attended' ? 'bg-sage/30 text-forest' : 'bg-sand text-espresso'
                }`}>
                  {referral.status}
                </span>
              </div>
            </div>
          </div>

          {/* Target Facility & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-cream border border-border-soft rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-espresso">
                <Building2 className="w-4 h-4 text-forest" />
                <span>Target Specialist Facility</span>
              </div>
              <p className="text-xs text-dark-brown font-semibold">{referral.target_facility}</p>
            </div>

            <div className="bg-cream border border-border-soft rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-espresso">
                <Clock className="w-4 h-4 text-forest" />
                <span>Issuance Timestamp</span>
              </div>
              <p className="text-xs text-dark-brown">
                {new Date(referral.created_at).toLocaleDateString()} at {new Date(referral.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Clinical Reason for Referral */}
          <div className="bg-sand/30 border border-border-soft rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-espresso uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-forest" />
              <span>Clinical Triage Findings &amp; Rationale</span>
            </div>
            <p className="text-xs text-dark-brown leading-relaxed">
              {referral.referral_reason}
            </p>
            {referral.notes && (
              <div className="pt-2 border-t border-border-soft/60">
                <span className="text-[10px] uppercase text-dark-brown/60 font-bold block">Staff Nurse Notes:</span>
                <span className="text-xs text-espresso font-medium">{referral.notes}</span>
              </div>
            )}
          </div>

          {/* Compliance Disclaimer */}
          <div className="bg-sand/20 border border-border-soft rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-dark-brown/80">
            <ShieldCheck className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
            <span>
              This is a digital triage referral issued under the National Telemedicine Guidelines. All referable grades require in-person dilated fundus examination and OCT confirmation by an ophthalmologist.
            </span>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-sand/40 border-t border-border-soft p-4 px-6 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cream hover:bg-border-soft border border-border-soft rounded-xl text-xs font-bold text-espresso transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {referral.status !== 'Attended' && (
              <button
                onClick={handleMarkAttended}
                className="px-4 py-2 bg-sage/30 hover:bg-sage/40 border border-sage/60 text-forest rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Attended</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-forest hover:bg-forest-hover text-cream rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

