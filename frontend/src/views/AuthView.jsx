import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Building2, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Stethoscope, 
  KeyRound,
  UserPlus,
  LogIn
} from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export const AuthView = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState('register'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Login Form State
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // Register Form State
  const [registerData, setRegisterData] = useState({
    full_name: '',
    username: '',
    email: '',
    clinic_location: '',
    role: 'health_worker',
    password: '',
    confirm_password: ''
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.username.trim() || !loginData.password) {
      setError('Please enter both your healthcare username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await loginUser(loginData.username.trim(), loginData.password);
      if (onAuthSuccess) {
        onAuthSuccess(res.user);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.full_name.trim() || !registerData.username.trim() || !registerData.email.trim() || !registerData.password) {
      setError('Please fill in all mandatory healthcare staff fields.');
      return;
    }
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (registerData.password !== registerData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await registerUser({
        full_name: registerData.full_name.trim(),
        username: registerData.username.trim(),
        email: registerData.email.trim(),
        clinic_location: registerData.clinic_location.trim(),
        role: registerData.role,
        password: registerData.password
      });

      // Auto login after successful registration
      const loginRes = await loginUser(registerData.username.trim(), registerData.password);
      setSuccessMsg('Registration successful! Redirecting to clinical station...');
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(loginRes.user);
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Username or email may already be in use.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 md:p-8 animate-fadeIn">
      <div className="w-full max-w-lg bg-cream border border-border-soft rounded-3xl shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-espresso p-6 text-cream text-center relative space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest mx-auto flex items-center justify-center text-cream shadow-md border border-sage/30">
            <Eye className="w-7 h-7 text-cream" />
          </div>
          <h1 className="text-2xl font-bold font-sans text-sand">DrishtiCare</h1>
          <p className="text-xs text-cream/70">
            Frontline Tele-Ophthalmology &amp; Explainable AI Diabetic Retinopathy Screening
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 border-b border-border-soft bg-sand/30 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`py-3.5 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'login'
                ? 'bg-cream text-espresso border-b-2 border-forest font-bold'
                : 'text-dark-brown/70 hover:text-espresso'
            }`}
          >
            <LogIn className="w-4 h-4 text-forest" />
            <span>Health Staff Login</span>
          </button>

          <button
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`py-3.5 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'register'
                ? 'bg-cream text-espresso border-b-2 border-forest font-bold'
                : 'text-dark-brown/70 hover:text-espresso'
            }`}
          >
            <UserPlus className="w-4 h-4 text-forest" />
            <span>New Staff Registration</span>
          </button>
        </div>

        {/* Alerts */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-terracotta/10 border border-terracotta/30 text-terracotta-dark rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-sage/20 border border-sage/60 text-forest rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
                  Healthcare Staff Username / ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-dark-brown/50 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    placeholder="Your staff username or ID"
                    className="w-full pl-10 pr-4 py-2.5 bg-sand/30 border border-border-soft rounded-xl text-xs text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-dark-brown/50 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-sand/30 border border-border-soft rounded-xl text-xs text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-dark-brown/50 hover:text-espresso"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest hover:bg-forest-hover disabled:opacity-50 text-cream font-bold py-3 rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-sage/40"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Telemedicine Station</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTRATION FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
                  Full Name &amp; Title
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-dark-brown/50 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                    placeholder="e.g. Staff Nurse Full Name"
                    className="w-full pl-10 pr-4 py-2.5 bg-sand/30 border border-border-soft rounded-xl text-xs text-charcoal focus:outline-none focus:border-forest"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
                    Staff Username / ID
                  </label>
                  <input
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    placeholder="Choose a unique username"
                    className="w-full px-3.5 py-2.5 bg-sand/30 border border-border-soft rounded-xl text-xs text-charcoal focus:outline-none focus:border-forest"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="you@clinic.example"
                    className="w-full px-3.5 py-2.5 bg-sand/30 border border-border-soft rounded-xl text-xs text-charcoal focus:outline-none focus:border-forest"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
                  Primary Health Centre / Facility Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-dark-brown/50 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={registerData.clinic_location}
                    onChange={(e) => setRegisterData({ ...registerData, clinic_location: e.target.value })}
                    placeholder="Your clinic or PHC name"
                    className="w-full pl-10 pr-4 py-2.5 bg-sand/30 border border-border-soft rounded-xl text-xs text-charcoal focus:outline-none focus:border-forest"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
                  Clinical Role
                </label>
                <select
                  value={registerData.role}
                  onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-sand/30 border border-border-soft rounded-xl text-xs text-charcoal focus:outline-none focus:border-forest"
                >
                  <option value="health_worker">Frontline Health Worker / Nurse (PHC)</option>
                  <option value="ophthalmologist">District Tele-Ophthalmologist / Specialist</option>
                  <option value="admin">District Health Administrator</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Min 6 chars"
                    className="w-full px-3.5 py-2.5 bg-sand/30 border border-border-soft rounded-xl text-xs text-charcoal focus:outline-none focus:border-forest"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-espresso uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={registerData.confirm_password}
                    onChange={(e) => setRegisterData({ ...registerData, confirm_password: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 bg-sand/30 border border-border-soft rounded-xl text-xs text-charcoal focus:outline-none focus:border-forest"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest hover:bg-forest-hover disabled:opacity-50 text-cream font-bold py-3 rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-sage/40 mt-2"
              >
                {loading ? (
                  <span>Registering Staff...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Healthcare Staff Account</span>
                  </>
                )}
              </button>
            </form>
          )}



          {/* Statutory Security Footnote */}
          <div className="bg-sand/30 p-3 rounded-xl border border-border-soft flex items-start gap-2.5 text-[11px] text-dark-brown/80">
            <ShieldCheck className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
            <span>
              DISHA Compliant: Passwords protected via bcrypt hashing with 8-hour shift session tokens. All retinal imaging is tied to authenticated health workers.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

