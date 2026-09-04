import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database,
  ArrowUpRight
} from 'lucide-react';
import { fetchSyncStatus, syncAllOfflineRecords } from '../services/api';
import { InView } from '../components/motion-primitives/in-view';

export const SyncCentreView = ({ isOffline, setIsOffline }) => {
  const [syncData, setSyncData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(null);

  useEffect(() => {
    loadSyncData();
  }, [isOffline]);

  const loadSyncData = async () => {
    try {
      const data = await fetchSyncStatus();
      setSyncData(data);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      const res = await syncAllOfflineRecords();
      setSyncSuccessMsg(res.message);
      await loadSyncData();
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const totalPending = (syncData?.pending_count || 0) + (syncData?.local_indexeddb_pending_count || 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-soft pb-6">
        <div>
          <h1 className="text-2xl font-bold text-espresso">Sync &amp; Offline Centre</h1>
          <p className="text-sm text-dark-brown/80">
            Resilient IndexedDB local storage and background synchronization for rural clinics with intermittent connectivity.
          </p>
        </div>

        {/* Offline Simulation Toggle */}
        <div className="flex items-center gap-3 bg-sand/60 p-2 rounded-xl border border-border-soft">
          <div className="flex items-center gap-2 text-xs font-semibold text-espresso">
            {isOffline ? <WifiOff className="w-4 h-4 text-terracotta" /> : <Wifi className="w-4 h-4 text-forest" />}
            <span>Mode: {isOffline ? 'Offline Queue' : 'Live Online'}</span>
          </div>
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isOffline
                ? 'bg-terracotta text-cream'
                : 'bg-forest text-cream'
            }`}
          >
            {isOffline ? 'Switch to Online' : 'Simulate Offline'}
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-4 bg-sage/20 border border-sage/60 text-forest rounded-xl text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-cream border border-border-soft rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-dark-brown/70 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Pending Sync Records</span>
            <Clock className="w-4 h-4 text-forest" />
          </div>
          <div className="text-3xl font-extrabold text-espresso font-sans">
            {totalPending}
          </div>
          <p className="text-[11px] text-dark-brown/70">
            {syncData?.local_indexeddb_pending_count || 0} in browser IndexedDB + {syncData?.pending_count || 0} in SQLite
          </p>
        </div>

        <div className="bg-cream border border-border-soft rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-dark-brown/70 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Last Successful Sync</span>
            <CheckCircle2 className="w-4 h-4 text-sage" />
          </div>
          <div className="text-lg font-bold text-espresso font-sans mt-1">
            {syncData?.last_sync_timestamp || 'Never'}
          </div>
          <p className="text-[11px] text-forest font-medium">Uplink to District Hub active</p>
        </div>

        <div className="bg-cream border border-border-soft rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-dark-brown/70 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Local Storage Cache</span>
            <HardDrive className="w-4 h-4 text-gold" />
          </div>
          <div className="text-3xl font-extrabold text-espresso font-sans">
            {syncData?.local_storage_usage_mb ?? 0} MB
          </div>
          <p className="text-[11px] text-dark-brown/70">IndexedDB + SQLite Data</p>
        </div>
      </div>

      {/* Sync Action & Queue Monitor */}
      <div className="bg-cream border border-border-soft rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border-soft/60 pb-4">
          <div>
            <h2 className="font-bold text-espresso text-base">District Telemedicine Cloud Sync Queue</h2>
            <p className="text-xs text-dark-brown/70">All patient intake and Grad-CAM results are persisted safely offline in IndexedDB</p>
          </div>
          <button
            onClick={handleTriggerSync}
            disabled={syncing || isOffline}
            className="bg-forest hover:bg-forest-hover disabled:opacity-50 text-cream font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync All Pending Now'}</span>
          </button>
        </div>

        {/* Queue Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-soft text-dark-brown/70 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Storage Layer</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Identifier</th>
                <th className="py-2.5 px-3">Queued Timestamp</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft/40">
              {syncData?.local_indexeddb_queue?.map((item, i) => (
                <InView key={`idb-${item.queue_id}`} as="tr" className="hover:bg-sand/30" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} transition={{ duration: 0.2, delay: i * 0.05 }} once>
                  <td className="py-3 px-3 font-semibold text-forest">Browser IndexedDB</td>
                  <td className="py-3 px-3 font-semibold text-espresso">{item.type}</td>
                  <td className="py-3 px-3 font-mono text-dark-brown">{item.entity_id}</td>
                  <td className="py-3 px-3 text-dark-brown/70">{new Date(item.created_at).toLocaleTimeString()}</td>
                  <td className="py-3 px-3">
                    <span className="bg-sand text-espresso px-2 py-0.5 rounded text-[11px] font-medium">
                      Queued (Offline)
                    </span>
                  </td>
                </InView>
              ))}

              {syncData?.pending_records?.map((item, i) => (
                <InView key={`srv-${item.id}`} as="tr" className="hover:bg-sand/30" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} transition={{ duration: 0.2, delay: i * 0.05 }} once>
                  <td className="py-3 px-3 font-semibold text-espresso">Server SQLite</td>
                  <td className="py-3 px-3 font-semibold text-espresso capitalize">{item.entity_type}</td>
                  <td className="py-3 px-3 font-mono text-dark-brown">{item.entity_id}</td>
                  <td className="py-3 px-3 text-dark-brown/70">{item.created_at}</td>
                  <td className="py-3 px-3">
                    <span className="bg-sand text-espresso px-2 py-0.5 rounded text-[11px] font-medium">
                      Queued (Server)
                    </span>
                  </td>
                </InView>
              ))}

              {totalPending === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-dark-brown/60">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest" />
                      <span>All patient records and screening scans are fully synchronized.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rural Data Privacy & Security Note */}
      <div className="bg-sand/40 border border-border-soft rounded-2xl p-6 flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-forest flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-espresso text-sm">
            Patient Data Privacy &amp; Offline Security Protocol
          </h3>
          <p className="text-dark-brown/80 leading-relaxed">
            DrishtiCare employs AES-256 encryption at rest on local clinic storage and IndexedDB containers. Retinal fundus imagery 
            and patient demographic records are transmitted exclusively via authenticated, TLS-encrypted channels 
            to your designated State Health Authority Tele-Ophthalmology Server in accordance with DISHA guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};
