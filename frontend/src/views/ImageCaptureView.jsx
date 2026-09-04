import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  Eye, 
  Sparkles, 
  HelpCircle,
  Video,
  VideoOff,
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react';
import { checkImageQuality, uploadAndScreen } from '../services/api';

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

export const ImageCaptureView = ({ activePatient, onScreeningComplete, onBack }) => {
  const [activeEye, setActiveEye] = useState('left');
  const [leftEyeData, setLeftEyeData] = useState({ file: null, previewUrl: null, quality: null });
  const [rightEyeData, setRightEyeData] = useState({ file: null, previewUrl: null, quality: null });
  
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setError(null);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access video camera. Please verify camera permissions or use file upload.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `capture_${activeEye}_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      await processImageFile(file, previewUrl);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "This file type isn't supported — please upload a JPG or PNG image.";
    }
    if (file.size > MAX_FILE_BYTES) {
      return 'File is too large — please upload an image under 15 MB.';
    }
    return null;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    await processImageFile(file, previewUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processImageFile = async (file, previewUrl) => {
    try {
      setError(null);
      const quality = await checkImageQuality(file);
      const updateData = { file, previewUrl, quality };

      if (activeEye === 'left') {
        setLeftEyeData(updateData);
      } else {
        setRightEyeData(updateData);
      }
    } catch (err) {
      console.error('Quality check error:', err);
      setError('Image quality evaluation service temporarily unavailable.');
    }
  };

  const clearEyeImage = (eye, e) => {
    e.stopPropagation();
    if (eye === 'left') {
      setLeftEyeData({ file: null, previewUrl: null, quality: null });
    } else {
      setRightEyeData({ file: null, previewUrl: null, quality: null });
    }
    if (activeEye === eye) stopCamera();
  };

  const selectEyeThumbnail = (eye) => {
    setActiveEye(eye);
    stopCamera();
  };

  const handleRunScreening = async () => {
    const hasLeft = Boolean(leftEyeData.previewUrl && leftEyeData.quality?.passed);
    const hasRight = Boolean(rightEyeData.previewUrl && rightEyeData.quality?.passed);

    if (!hasLeft && !hasRight) {
      setError('Please capture or load at least one retinal fundus image that passes quality verification.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      const formData = new FormData();
      formData.append('patient_id', activePatient.id);
      
      let eyeMode = 'both';
      if (hasLeft && !hasRight) eyeMode = 'left';
      else if (hasRight && !hasLeft) eyeMode = 'right';
      formData.append('eye', eyeMode);

      if (leftEyeData.file) formData.append('left_eye', leftEyeData.file);
      if (rightEyeData.file) formData.append('right_eye', rightEyeData.file);

      const result = await uploadAndScreen(formData);
      onScreeningComplete(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'AI Screening analysis failed. Please retry.');
    } finally {
      setAnalyzing(false);
    }
  };

  const currentEyeState = activeEye === 'left' ? leftEyeData : rightEyeData;

  const renderEyeThumbnail = (eye, data) => {
    const isActive = activeEye === eye;
    const label = eye === 'left' ? 'Left (OS)' : 'Right (OD)';

    return (
      <button
        type="button"
        onClick={() => selectEyeThumbnail(eye)}
        className={`relative w-24 h-20 rounded-xl border-2 overflow-hidden transition-all ${
          isActive ? 'border-forest ring-2 ring-forest/30' : 'border-border-soft hover:border-forest/50'
        }`}
        title={`Select ${label} for preview`}
      >
        {data.previewUrl ? (
          <>
            <img src={data.previewUrl} alt={`${label} thumbnail`} className="w-full h-full object-cover" />
            {data.quality?.passed && (
              <span className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-sage border border-cream" />
            )}
            <button
              type="button"
              onClick={(e) => clearEyeImage(eye, e)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-espresso/80 text-cream flex items-center justify-center hover:bg-terracotta transition-colors"
              title={`Remove ${label} image`}
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="w-full h-full bg-sand/60 flex flex-col items-center justify-center text-[10px] text-dark-brown/60">
            <ImageIcon className="w-4 h-4 mb-1" />
            <span>{label}</span>
          </div>
        )}
      </button>
    );
  };

  if (!activePatient) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-4 text-center mt-20">
        <AlertCircle className="w-10 h-10 text-terracotta mx-auto" />
        <h2 className="text-xl font-bold text-espresso">No patient selected</h2>
        <p className="text-sm text-dark-brown/70">
          Register a patient or select one from the dashboard before capturing retinal images.
        </p>
        <button onClick={onBack} className="mt-4 text-sm font-semibold text-forest hover:underline">
          Go to Registration
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-border-soft pb-4">
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-medium">
          <div className="flex items-center gap-2 text-forest">
            <Check className="w-4 h-4 text-forest" />
            <span>Registration</span>
          </div>
          <span className="text-border-soft">/</span>
          <div className="flex items-center gap-2 text-forest font-bold">
            <span className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs">2</span>
            <span>Capture &amp; Quality Gate</span>
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

        <div className="bg-sand px-3 py-1.5 rounded-lg border border-border-soft text-xs flex items-center gap-2">
          <span className="text-dark-brown/60">Patient:</span>
          <span className="font-bold text-espresso">{activePatient.full_name}</span>
          <span className="font-mono text-dark-brown/70">({activePatient.patient_code})</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveEye('left'); stopCamera(); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              activeEye === 'left'
                ? 'bg-espresso text-cream shadow-sm'
                : 'bg-sand/60 text-dark-brown hover:bg-sand'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Left Eye (OS)</span>
            {leftEyeData.quality?.passed && <span className="w-2 h-2 rounded-full bg-sage" />}
          </button>

          <button
            onClick={() => { setActiveEye('right'); stopCamera(); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              activeEye === 'right'
                ? 'bg-espresso text-cream shadow-sm'
                : 'bg-sand/60 text-dark-brown hover:bg-sand'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Right Eye (OD)</span>
            {rightEyeData.quality?.passed && <span className="w-2 h-2 rounded-full bg-sage" />}
          </button>
        </div>

        <div className="text-xs text-dark-brown/70 hidden sm:block">
          Dual-eye screening protocol (or proceed with single eye if ungradeable)
        </div>
      </div>

      {error && (
        <div className="p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta-dark rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-cream border border-border-soft rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border-soft/60 pb-3">
            <h2 className="font-bold text-espresso text-base flex items-center gap-2">
              <Camera className="w-4 h-4 text-forest" />
              <span>{activeEye === 'left' ? 'Left Eye (OS)' : 'Right Eye (OD)'} Retinal Viewport</span>
            </h2>
            <div className="flex items-center gap-2">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="bg-sand hover:bg-border-soft text-espresso px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Video className="w-3.5 h-3.5 text-forest" />
                  <span>Open Camera</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="bg-terracotta/10 hover:bg-terracotta/20 text-terracotta px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <VideoOff className="w-3.5 h-3.5" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>
          </div>

          <div className="aspect-video sm:aspect-[4/3] bg-espresso/90 rounded-xl overflow-hidden flex items-center justify-center relative border-2 border-dashed border-border-soft">
            {cameraActive ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full border-2 border-gold/70 border-dashed animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                  </div>
                </div>
                <div className="absolute bottom-4 inset-x-0 flex justify-center">
                  <button
                    onClick={captureFrame}
                    className="bg-forest hover:bg-forest-hover text-cream px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg border border-sage/50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Retinal Scan</span>
                  </button>
                </div>
              </div>
            ) : currentEyeState.previewUrl ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <img 
                  src={currentEyeState.previewUrl} 
                  alt="Fundus preview" 
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute top-3 right-3">
                  {currentEyeState.quality?.passed ? (
                    <div className="bg-forest text-cream px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cream" />
                      <span>Quality: Passed</span>
                    </div>
                  ) : (
                    <div className="bg-terracotta text-cream px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                      <AlertCircle className="w-3.5 h-3.5 text-cream" />
                      <span>Quality: Rejected</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-4 text-cream/70">
                <ImageIcon className="w-12 h-12 text-sand/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-cream">No Retinal Photo Captured Yet</p>
                  <p className="text-xs text-cream/50">Capture with camera or upload a file.</p>
                  <p className="text-xs text-cream/50 mt-1">Accepted formats: JPG, PNG &middot; Max size: 15 MB</p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-sand hover:bg-cream text-espresso px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-forest" />
                    <span>Upload Image File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <span className="text-[11px] font-semibold text-dark-brown/70 uppercase tracking-wider">Uploaded Eyes</span>
            {renderEyeThumbnail('left', leftEyeData)}
            {renderEyeThumbnail('right', rightEyeData)}
            <span className="text-[10px] text-dark-brown/50 ml-1">Click thumbnail to preview · use × to remove</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-cream border border-border-soft rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-espresso text-sm flex items-center gap-2 border-b border-border-soft/60 pb-2.5">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Image Quality Check</span>
            </h3>

            {currentEyeState.quality ? (
              <div className="space-y-3">
                <div className={`p-3.5 rounded-xl border ${
                  currentEyeState.quality.passed
                    ? 'bg-sage/20 border-sage/40 text-forest'
                    : 'bg-terracotta/10 border-terracotta/30 text-terracotta-dark'
                }`}>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    {currentEyeState.quality.passed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-forest" />
                        <span>Quality Validation: PASSED</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-terracotta" />
                        <span>Quality Validation: REJECTED</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed text-charcoal">{currentEyeState.quality.message}</p>
                  {currentEyeState.quality.recommendation && (
                    <p className="text-[11px] mt-1 font-semibold text-dark-brown">
                      Tip: {currentEyeState.quality.recommendation}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-sand/40 border border-border-soft">
                    <div className="text-dark-brown/60 text-[10px]">Laplacian Sharpness</div>
                    <div className="font-bold text-espresso">{currentEyeState.quality.laplacian_variance}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-sand/40 border border-border-soft">
                    <div className="text-dark-brown/60 text-[10px]">Mean Brightness</div>
                    <div className="font-bold text-espresso">{currentEyeState.quality.mean_brightness}</div>
                  </div>
                </div>

                {!currentEyeState.quality.passed && (
                  <button
                    onClick={() => {
                      if (activeEye === 'left') setLeftEyeData({ file: null, previewUrl: null, quality: null });
                      else setRightEyeData({ file: null, previewUrl: null, quality: null });
                    }}
                    className="w-full bg-sand hover:bg-border-soft text-espresso font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-dark-brown/70 leading-relaxed">
                Capture or upload a retinal fundus scan to run automatic sharpness, illumination, and framing checks.
              </p>
            )}
          </div>

          <div className="bg-sand/40 border border-border-soft rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-espresso text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-forest" />
              <span>Camera Positioning Protocol</span>
            </h3>
            <ul className="text-xs text-dark-brown/80 space-y-2 leading-relaxed list-disc list-inside">
              <li><strong className="text-espresso">Distance:</strong> Keep portable camera lens 2–3 cm from cornea.</li>
              <li><strong className="text-espresso">Centering:</strong> Align the yellow reticle over the optic disc and macula.</li>
              <li><strong className="text-espresso">Lighting:</strong> Dim room lights to promote natural pupil dilation.</li>
              <li><strong className="text-espresso">Stability:</strong> Hold steady during capture to avoid motion blur.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border-soft">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-dark-brown/70 hover:text-espresso"
        >
          Back to Intake
        </button>

        <button
          onClick={handleRunScreening}
          disabled={analyzing || (!leftEyeData.quality?.passed && !rightEyeData.quality?.passed)}
          className="bg-forest hover:bg-forest-hover disabled:opacity-50 text-cream font-bold px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-sage/40"
        >
          {analyzing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
              <span>Generating Explainable Grad-CAM...</span>
            </div>
          ) : (
            <>
              <span>Run Automated AI Screening</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
