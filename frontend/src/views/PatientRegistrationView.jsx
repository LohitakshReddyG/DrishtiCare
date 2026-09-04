import React, { useState } from 'react';
import { UserCheck, Shield, ArrowRight, UserPlus, Info, CheckCircle } from 'lucide-react';
import { registerPatient } from '../services/api';

export const PatientRegistrationView = ({ onPatientRegistered, onCancel }) => {
  const [formData, setFormData] = useState({
    patient_code: `PAT-RURAL-${Math.floor(1000 + Math.random() * 9000)}`,
    full_name: '',
    age: '',
    gender: 'Female',
    village: '',
    diabetes_duration_years: '',
    phone: '',
    consent_given: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.consent_given) {
      setError('Patient informed consent is mandatory to proceed with retinal imaging.');
      return;
    }
    if (!formData.full_name.trim() || !formData.age || !formData.village.trim()) {
      setError('Please fill in all mandatory patient demographic fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        patient_code: formData.patient_code.trim(),
        full_name: formData.full_name.trim(),
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        village: formData.village.trim(),
        diabetes_duration_years: parseFloat(formData.diabetes_duration_years) || 0.0,
        phone: formData.phone.trim() || null,
        consent_given: formData.consent_given
      };

      const patient = await registerPatient(payload);
      onPatientRegistered(patient);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to register patient. Please check database connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Workflow Stepper */}
      <div className="flex items-center justify-between border-b border-border-soft pb-4">
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-medium">
          <div className="flex items-center gap-2 text-forest font-bold">
            <span className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs">1</span>
            <span>Registration</span>
          </div>
          <span className="text-border-soft">/</span>
          <div className="flex items-center gap-2 text-dark-brown/40">
            <span className="w-6 h-6 rounded-full bg-sand text-dark-brown flex items-center justify-center text-xs">2</span>
            <span>Capture</span>
          </div>
          <span className="text-border-soft">/</span>
          <div className="flex items-center gap-2 text-dark-brown/40">
            <span className="w-6 h-6 rounded-full bg-sand text-dark-brown flex items-center justify-center text-xs">3</span>
            <span>AI Result</span>
          </div>
          <span className="text-border-soft">/</span>
          <div className="flex items-center gap-2 text-dark-brown/40">
            <span className="w-6 h-6 rounded-full bg-sand text-dark-brown flex items-center justify-center text-xs">4</span>
            <span>Referral</span>
          </div>
        </div>

        <div className="text-xs text-dark-brown/70 font-medium">
          Clinical Intake Form
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-espresso">Patient Screening Intake</h1>
        <p className="text-sm text-dark-brown/80">
          Register rural diabetic individual before capturing fundus retinal scans.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta-dark rounded-xl text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-cream border border-border-soft rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Code / ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-brown/80">
              Patient Screening ID *
            </label>
            <input
              type="text"
              name="patient_code"
              value={formData.patient_code}
              onChange={handleChange}
              required
              className="w-full bg-sand/30 border border-border-soft rounded-xl px-4 py-2.5 text-sm text-espresso font-mono focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest"
            />
            <p className="text-[11px] text-dark-brown/60">Auto-generated unique clinical identifier.</p>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-brown/80">
              Full Legal Name *
            </label>
            <input
              type="text"
              name="full_name"
              placeholder="e.g. Rameshwar Patil"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full bg-sand/30 border border-border-soft rounded-xl px-4 py-2.5 text-sm text-espresso focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest placeholder:text-dark-brown/40"
            />
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-brown/80">
              Age (Years) *
            </label>
            <input
              type="number"
              name="age"
              placeholder="e.g. 54"
              min="1"
              max="120"
              value={formData.age}
              onChange={handleChange}
              required
              className="w-full bg-sand/30 border border-border-soft rounded-xl px-4 py-2.5 text-sm text-espresso focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest placeholder:text-dark-brown/40"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-brown/80">
              Gender *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full bg-sand/30 border border-border-soft rounded-xl px-4 py-2.5 text-sm text-espresso focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other / Non-Binary</option>
            </select>
          </div>

          {/* Village / Gram Panchayat */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-brown/80">
              Village / Gram Panchayat *
            </label>
            <input
              type="text"
              name="village"
              placeholder="e.g. Khadki Gram Panchayat, Washim"
              value={formData.village}
              onChange={handleChange}
              required
              className="w-full bg-sand/30 border border-border-soft rounded-xl px-4 py-2.5 text-sm text-espresso focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest placeholder:text-dark-brown/40"
            />
          </div>

          {/* Diabetes Duration */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-brown/80">
              Known Diabetes Duration (Years)
            </label>
            <input
              type="number"
              step="0.5"
              name="diabetes_duration_years"
              placeholder="e.g. 6.5 (leave blank if newly diagnosed)"
              value={formData.diabetes_duration_years}
              onChange={handleChange}
              className="w-full bg-sand/30 border border-border-soft rounded-xl px-4 py-2.5 text-sm text-espresso focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest placeholder:text-dark-brown/40"
            />
          </div>

          {/* Phone (Optional) */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-brown/80">
              Mobile Contact Number (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="e.g. +91 98450 12345 (for SMS referral notifications)"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-sand/30 border border-border-soft rounded-xl px-4 py-2.5 text-sm text-espresso focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest placeholder:text-dark-brown/40"
            />
          </div>
        </div>

        {/* Mandatory Informed Consent Checkbox */}
        <div className="pt-4 border-t border-border-soft/60">
          <label className="flex items-start gap-3.5 p-4 rounded-xl bg-sand/40 border border-border-soft cursor-pointer hover:bg-sand/60 transition-colors select-none">
            <input
              type="checkbox"
              name="consent_given"
              checked={formData.consent_given}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded border-border-soft text-forest focus:ring-forest cursor-pointer"
            />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-espresso flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-forest" />
                <span>Informed Patient Consent (Required)</span>
              </div>
              <p className="text-dark-brown/80 leading-relaxed">
                The patient has been verbally briefed in their local language regarding non-mydriatic fundus camera imaging 
                and automated AI screening for diabetic eye health, and agrees to telemedicine triage evaluation.
              </p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-dark-brown/70 hover:text-espresso px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || !formData.consent_given}
            className="bg-forest hover:bg-forest-hover disabled:opacity-50 text-cream font-bold px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            {loading ? (
              <span>Registering...</span>
            ) : (
              <>
                <span>Proceed to Image Capture</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
