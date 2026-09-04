import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Globe, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Eye,
  MessageSquare
} from 'lucide-react';
import { AccordionApp } from '../components/ui/card-split-accordion';

export const HelpView = () => {
  const [selectedLang, setSelectedLang] = useState('en');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      q: "What should I do if an image is repeatedly rejected for blur?",
      a: "Ensure the patient is resting their chin comfortably on the stabilizer. Have the patient blink once, fixate their gaze on the internal target LED, and gently refocus the lens before capturing."
    },
    {
      q: "Can this AI replace an eye specialist's dilated examination?",
      a: "No. DrishtiCare is a clinical screening and triage support tool designed to filter referable pathology in rural communities. All referable cases (Grade 2–4) must undergo dilated examination by an ophthalmologist."
    },
    {
      q: "How does the Grad-CAM heatmap explain the DR prediction?",
      a: "Grad-CAM visualizes the specific convolutional features the neural network prioritized. Bright red/yellow zones highlight clinically significant lesions such as microaneurysms, hemorrhages, and lipid exudates."
    },
    {
      q: "How does offline mode operate during internet outages?",
      a: "Screenings and AI inference run entirely locally on the clinic computer. Records are encrypted and stored in local SQLite storage, automatically syncing to the district hub once connection is restored."
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header & Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-soft pb-6">
        <div>
          <h1 className="text-2xl font-bold text-espresso">Clinical Protocols &amp; User Manual</h1>
          <p className="text-sm text-dark-brown/80">
            Standard operating procedures for frontline health workers in rural tele-ophthalmology triage.
          </p>
        </div>

      </div>

      {/* Guide 1: How to Capture a Good Retinal Image */}
      <div className="bg-cream border border-border-soft rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-espresso text-base flex items-center gap-2 border-b border-border-soft/60 pb-3">
          <Camera className="w-5 h-5 text-forest" />
          <span>Protocol 1: Retinal Image Acquisition Workflow</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-sand/40 border border-border-soft space-y-2">
            <span className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-bold">1</span>
            <h3 className="font-bold text-espresso text-xs">Patient Positioning</h3>
            <p className="text-[11px] text-dark-brown/80 leading-relaxed">
              Dim examination room lights. Position patient upright and explain the non-invasive light flash.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sand/40 border border-border-soft space-y-2">
            <span className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-bold">2</span>
            <h3 className="font-bold text-espresso text-xs">Target Alignment</h3>
            <p className="text-[11px] text-dark-brown/80 leading-relaxed">
              Align camera reticle on the optic nerve head and central fovea. Maintain 2–3 cm lens distance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sand/40 border border-border-soft space-y-2">
            <span className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-bold">3</span>
            <h3 className="font-bold text-espresso text-xs">Automated Quality Gate</h3>
            <p className="text-[11px] text-dark-brown/80 leading-relaxed">
              The system checks image sharpness and illumination automatically. Retake immediately if rejected.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sand/40 border border-border-soft space-y-2">
            <span className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-bold">4</span>
            <h3 className="font-bold text-espresso text-xs">Explainable Inference</h3>
            <p className="text-[11px] text-dark-brown/80 leading-relaxed">
              The AI model classifies the image into DR severity grades (0–4) and generates a visual explanation. Referral is issued for Grade 2 or above.
            </p>
          </div>
        </div>
      </div>

      {/* Guide 2: Interpretation of Screening Statuses */}
      <div className="bg-cream border border-border-soft rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-espresso text-base flex items-center gap-2 border-b border-border-soft/60 pb-3">
          <Eye className="w-5 h-5 text-forest" />
          <span>Protocol 2: DR Severity Staging &amp; Referral Triage Matrix</span>
        </h2>

        <div className="space-y-3 pt-2">
          <div className="p-3.5 rounded-xl border border-sage/40 bg-sage/10 flex items-start justify-between gap-4">
            <div>
              <div className="font-bold text-forest text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Grade 0: No DR · Non-Referable</span>
              </div>
              <p className="text-[11px] text-dark-brown/80 mt-1">
                Normal retina. No microaneurysms. Protocol: Re-screen annually at routine PHC diabetic clinic.
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-forest bg-cream px-2 py-1 rounded border border-border-soft">Routine (12m)</span>
          </div>

          <div className="p-3.5 rounded-xl border border-sage/40 bg-sage/10 flex items-start justify-between gap-4">
            <div>
              <div className="font-bold text-forest text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Grade 1: Mild NPDR · Non-Referable</span>
              </div>
              <p className="text-[11px] text-dark-brown/80 mt-1">
                Isolated microaneurysms only. Protocol: Glycemic counseling and routine follow-up in 6 to 12 months.
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-forest bg-cream px-2 py-1 rounded border border-border-soft">Follow-up (6–12m)</span>
          </div>

          <div className="p-3.5 rounded-xl border border-terracotta/30 bg-terracotta/10 flex items-start justify-between gap-4">
            <div>
              <div className="font-bold text-terracotta-dark text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-terracotta" />
                <span>Grade 2: Moderate NPDR · REFERABLE</span>
              </div>
              <p className="text-[11px] text-dark-brown/80 mt-1">
                Multiple microaneurysms, dot hemorrhages, or hard exudates. Protocol: Generate referral slip for review within 30 days.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-terracotta-dark bg-cream px-2 py-1 rounded border border-border-soft">Priority (30d)</span>
          </div>

          <div className="p-3.5 rounded-xl border border-terracotta/40 bg-terracotta/15 flex items-start justify-between gap-4">
            <div>
              <div className="font-bold text-terracotta-dark text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-terracotta" />
                <span>Grade 3: Severe NPDR · REFERABLE</span>
              </div>
              <p className="text-[11px] text-dark-brown/80 mt-1">
                4-quadrant hemorrhages, venous beading, IRMA. Protocol: Urgent tele-ophthalmologist triage within 2 to 4 weeks.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-terracotta-dark bg-cream px-2 py-1 rounded border border-border-soft">Urgent (2–4w)</span>
          </div>

          <div className="p-3.5 rounded-xl border border-terracotta bg-terracotta/20 flex items-start justify-between gap-4">
            <div>
              <div className="font-bold text-terracotta-dark text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-terracotta-dark" />
                <span>Grade 4: Proliferative DR (PDR) · CRITICAL REFERABLE</span>
              </div>
              <p className="text-[11px] text-dark-brown/80 mt-1">
                Neovascularization, vitreous/preretinal hemorrhage. Protocol: Immediate hospital referral within 48–72 hours.
              </p>
            </div>
            <span className="text-[11px] font-mono font-extrabold text-terracotta-dark bg-cream px-2 py-1 rounded border border-border-soft">Emergency (48–72h)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-cream border border-border-soft rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-espresso mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-forest" />
            <span>Frequently Asked Questions</span>
          </h2>
          <AccordionApp items={faqs.map(f => ({ title: f.q, content: f.a }))} />
        </div>
      </div>

      {/* Emergency Tele-Ophthalmology Contact */}
      <div className="bg-sand/40 border border-border-soft rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta text-cream flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-espresso text-sm">District Tele-Ophthalmology Support Desk</div>
            <div className="text-xs text-dark-brown/80">Direct tele-consultation for emergency acute vision loss cases</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-base font-mono font-bold text-espresso">Contact your district health office</div>
        </div>
      </div>
    </div>
  );
};
