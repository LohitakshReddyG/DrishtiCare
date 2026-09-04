import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  FileText, 
  RefreshCw, 
  HelpCircle, 
  Activity,
  Wifi, 
  WifiOff,
  Eye,
  ShieldCheck,
  Building2,
  Lock,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

export const Navigation = ({ currentView, setCurrentView, isOffline, setIsOffline, currentUser, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'register', label: 'New Registration', icon: UserPlus },
    { id: 'referrals', label: 'Referrals & Slips', icon: FileText },
    { id: 'sync', label: 'Sync Centre', icon: RefreshCw },
    { id: 'help', label: 'Help & Protocols', icon: HelpCircle },
  ];

  return (
    <div className="w-64 bg-espresso text-cream flex flex-col h-screen border-r border-border-soft/20 flex-shrink-0 select-none">
      {/* Brand Identity */}
      <div className="p-5 border-b border-border-soft/15 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-cream font-bold text-xl shadow-md border border-sage/30">
          <Eye className="w-6 h-6 text-cream" />
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight text-sand font-sans">DrishtiCare</div>
          <div className="text-xs text-cream/70 font-medium">Explainable DR Screening</div>
        </div>
      </div>

      {/* Primary Screening Workflow Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sand/60">
          Screening Clinic
        </div>
        <div className="relative flex flex-col space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`group relative w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all duration-300 ${
                  isActive
                    ? 'text-espresso font-semibold'
                    : 'text-cream/80 hover:text-cream'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    className="absolute inset-0 bg-sand rounded-xl shadow-sm"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-forest' : 'text-cream/70 group-hover:text-cream'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* District Administrator Section */}
        <div className="pt-5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sand/60">
          District Operations
        </div>
        <button
          onClick={() => setCurrentView('capacity')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            currentView === 'capacity'
              ? 'bg-sand text-espresso font-semibold shadow-sm'
              : 'text-cream/80 hover:bg-dark-brown/50 hover:text-cream'
          }`}
        >
          <Activity className={`w-4 h-4 ${currentView === 'capacity' ? 'text-terracotta' : 'text-cream/70'}`} />
          <div className="text-left">
            <div>Program Capacity</div>
            <div className="text-[10px] text-cream/60">Capacity Planning</div>
          </div>
        </button>

        {/* Staff Authentication Section */}
        <div className="pt-5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sand/60">
          Healthcare Staff
        </div>
        <button
          onClick={() => setCurrentView('auth')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            currentView === 'auth'
              ? 'bg-sand text-espresso font-semibold shadow-sm'
              : 'text-cream/80 hover:bg-dark-brown/50 hover:text-cream'
          }`}
        >
          {currentUser ? (
            <UserCheck className={`w-4 h-4 ${currentView === 'auth' ? 'text-forest' : 'text-sage'}`} />
          ) : (
            <Lock className={`w-4 h-4 ${currentView === 'auth' ? 'text-forest' : 'text-cream/70'}`} />
          )}
          <div className="text-left">
            <div>{currentUser ? currentUser.full_name : 'Staff Sign In / Register'}</div>
            <div className="text-[10px] text-cream/60">
              {currentUser ? `${currentUser.role} · Active` : 'DISHA Secure Auth'}
            </div>
          </div>
        </button>
      </div>

      {/* Offline Status & Clinic Badge Footer */}
      <div className="p-3.5 border-t border-border-soft/15 bg-dark-brown/40 space-y-2">
        <div className="flex items-center justify-between bg-espresso/60 px-3 py-2 rounded-lg border border-border-soft/10">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-terracotta animate-pulse' : 'bg-sage'}`}></span>
            <span className="text-xs font-medium text-cream/90">
              {isOffline ? 'Offline Queue Active' : 'District Tele-Hub Connected'}
            </span>
          </div>
          <button
            onClick={() => setIsOffline(!isOffline)}
            title="Toggle offline simulation mode"
            className="text-[11px] text-sand hover:underline font-mono"
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5 text-terracotta" /> : <Wifi className="w-3.5 h-3.5 text-sage" />}
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-cream/70">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
            <span className="truncate">{currentUser?.clinic_location || 'Clinic location not set'}</span>
          </div>
          {currentUser && (
            <button
              onClick={onLogout}
              className="text-[10px] text-terracotta hover:underline font-bold ml-2"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
