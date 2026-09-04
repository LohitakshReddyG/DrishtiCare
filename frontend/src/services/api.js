/**
 * DrishtiCare - Central API & IndexedDB Offline Queue Management Service
 * Communicates with FastAPI backend with IndexedDB persistence fallback.
 * Uses environment variable VITE_API_URL (defaults to http://localhost:8000/api).
 */

import {
  saveOfflinePatient,
  saveOfflineScreening,
  saveOfflineReferral,
  getOfflineSyncQueue,
  removeSyncQueueItem,
  clearAllSyncQueue
} from './offlineDb';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Auth token storage helpers
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('drishticare_auth_token', token);
  } else {
    localStorage.removeItem('drishticare_auth_token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('drishticare_auth_token');
};

const getHeaders = (contentType = 'application/json') => {
  const headers = {};
  if (contentType) headers['Content-Type'] = contentType;
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const setOfflineMode = (offline) => {
  localStorage.setItem('drishticare_offline_mode', offline ? 'true' : 'false');
};

export const getOfflineMode = () => {
  return localStorage.getItem('drishticare_offline_mode') === 'true';
};

// 1. Dashboard Summary (real DB query)
export const fetchDashboardSummary = async () => {
  const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    headers: getHeaders(null)
  });
  if (res.status === 401) {
    setAuthToken(null);
    throw new Error('Authentication session expired');
  }
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
};

// 2. Patient Registration
export const registerPatient = async (patientData) => {
  if (getOfflineMode()) {
    const id = Date.now();
    const patientCode = `PAT-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`;
    const offlineRecord = {
      ...patientData,
      id,
      patient_code: patientCode,
      created_at: new Date().toISOString()
    };
    await saveOfflinePatient(offlineRecord);
    return offlineRecord;
  }

  const res = await fetch(`${API_BASE_URL}/patients`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(patientData)
  });
  if (!res.ok) throw new Error('Failed to register patient');
  return res.json();
};

// 3. List Patients
export const fetchPatients = async () => {
  const res = await fetch(`${API_BASE_URL}/patients`, {
    headers: getHeaders(null)
  });
  if (!res.ok) throw new Error('Failed to fetch patients');
  return res.json();
};

// 4. Sample Cases
export const fetchSampleCases = async () => {
  const res = await fetch(`${API_BASE_URL}/samples`, {
    headers: getHeaders(null)
  });
  if (!res.ok) throw new Error('Failed to fetch sample cases');
  return res.json();
};

// 5. Inline Image Quality Check (OpenCV computation)
export const checkImageQuality = async (fileOrBlob) => {
  const formData = new FormData();
  formData.append('file', fileOrBlob, 'fundus.jpg');
  const res = await fetch(`${API_BASE_URL}/screenings/check-quality`, {
    method: 'POST',
    headers: getHeaders(null),
    body: formData
  });
  if (!res.ok) throw new Error('Quality check failed');
  return res.json();
};

// 6. Live Upload & Screening Analysis (Real PyTorch inference + Grad-CAM)
export const uploadAndScreen = async (formData) => {
  if (getOfflineMode()) {
    const patientId = formData.get('patient_id');
    const eye = formData.get('eye') || 'both';
    const id = Date.now();
    const screeningCode = `SCR-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`;
    const offlineRecord = {
      id,
      screening_code: screeningCode,
      patient_id: parseInt(patientId, 10),
      patient_code: `PAT-${patientId}`,
      eye,
      quality_passed: true,
      quality_issues: [],
      quality_message: 'Captured offline. Awaiting central server sync.',
      dr_grade: 0,
      dr_grade_name: 'Pending Online Analysis',
      referable: false,
      confidence: 0,
      confidence_tier: 'Pending Sync',
      urgency_tier: 'Routine',
      suggested_timeframe: 'Sync required',
      explanation_text: 'Screening captured in offline mode. Sync to generate Grad-CAM and confirm triage.',
      status: 'Queued_Offline',
      created_at: new Date().toISOString()
    };
    await saveOfflineScreening(offlineRecord);
    return offlineRecord;
  }

  const res = await fetch(`${API_BASE_URL}/screenings/upload`, {
    method: 'POST',
    headers: getHeaders(null),
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze uploaded fundus image');
  }
  return res.json();
};

// 7. Create Referral
export const createReferral = async (referralData) => {
  if (getOfflineMode()) {
    const id = Date.now();
    const referralCode = `REF-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`;
    const offlineRef = {
      ...referralData,
      id,
      referral_code: referralCode,
      patient_code: `PAT-${referralData.patient_id}`,
      patient_name: 'Offline Patient',
      dr_grade: 2,
      dr_grade_name: 'Referable DR',
      urgency: referralData.urgency || 'Priority',
      suggested_timeframe: 'Within 30 days',
      referral_reason: 'Queued offline referral.',
      status: 'Pending_Sync',
      created_at: new Date().toISOString()
    };
    await saveOfflineReferral(offlineRef);
    return offlineRef;
  }

  const res = await fetch(`${API_BASE_URL}/referrals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(referralData)
  });
  if (!res.ok) throw new Error('Failed to create referral');
  return res.json();
};

// List Referrals
export const fetchReferrals = async () => {
  const res = await fetch(`${API_BASE_URL}/referrals`, {
    headers: getHeaders(null)
  });
  if (!res.ok) throw new Error('Failed to fetch referrals');
  return res.json();
};

// Update Referral Status
export const updateReferralStatus = async (referralId, status) => {
  const res = await fetch(`${API_BASE_URL}/referrals/${referralId}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update referral status');
  return res.json();
};

// 8. Fetch Single Screening by ID
export const fetchScreeningById = async (screeningId) => {
  const res = await fetch(`${API_BASE_URL}/screenings/${screeningId}`, {
    headers: getHeaders(null)
  });
  if (!res.ok) throw new Error('Failed to fetch screening record');
  return res.json();
};

// 9. Fetch Single Patient by ID
export const fetchPatientById = async (patientId) => {
  const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
    headers: getHeaders(null)
  });
  if (!res.ok) throw new Error('Failed to fetch patient profile');
  return res.json();
};

// 10. Sync Status & IndexedDB Flush
export const fetchSyncStatus = async () => {
  const localQueue = await getOfflineSyncQueue();
  const res = await fetch(`${API_BASE_URL}/sync/status`, {
    headers: getHeaders(null)
  });
  if (!res.ok) throw new Error('Failed to fetch sync status');
  const serverStatus = await res.json();

  return {
    ...serverStatus,
    local_indexeddb_pending_count: localQueue.length,
    local_indexeddb_queue: localQueue
  };
};

export const syncAllOfflineRecords = async () => {
  const localQueue = await getOfflineSyncQueue();
  let syncedCount = 0;

  for (const item of localQueue) {
    try {
      if (item.type === 'PATIENT_REGISTRATION') {
        await fetch(`${API_BASE_URL}/patients`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(item.payload)
        });
      } else if (item.type === 'REFERRAL_SLIP') {
        await fetch(`${API_BASE_URL}/referrals`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(item.payload)
        });
      }
      await removeSyncQueueItem(item.queue_id);
      syncedCount++;
    } catch (err) {
      console.warn('Sync failed for item:', item, err);
    }
  }

  // Also trigger server-side sync retry
  await fetch(`${API_BASE_URL}/sync/retry`, {
    method: 'POST',
    headers: getHeaders(null)
  });

  return {
    success: true,
    synced_count: syncedCount,
    message: `Synchronized ${syncedCount} offline record(s) to District Telemedicine Hub.`
  };
};

// 11. Capacity Simulation
export const runCapacitySimulation = async (params) => {
  const res = await fetch(`${API_BASE_URL}/capacity/simulate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Capacity simulation failed');
  return res.json();
};

// 12. Health Worker Authentication
export const loginUser = async (username, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }
  const data = await res.json();
  setAuthToken(data.access_token);
  return data;
};

export const registerUser = async (userData) => {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Registration failed');
  }
  return res.json();
};

export const fetchCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getHeaders(null)
  });
  if (!res.ok) {
    setAuthToken(null);
    return null;
  }
  return res.json();
};
