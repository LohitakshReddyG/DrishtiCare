/**
 * DrishtiCare - IndexedDB Persistent Offline Storage Engine
 * Stores patient registrations, captured fundus images, screening results,
 * and referral slips locally in the browser when offline.
 */

const DB_NAME = 'DrishtiCareOfflineDB';
const DB_VERSION = 1;

export const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for offline-registered patients
      if (!db.objectStoreNames.contains('patients')) {
        db.createObjectStore('patients', { keyPath: 'id' });
      }

      // Store for offline screenings
      if (!db.objectStoreNames.contains('screenings')) {
        db.createObjectStore('screenings', { keyPath: 'id' });
      }

      // Store for offline referrals
      if (!db.objectStoreNames.contains('referrals')) {
        db.createObjectStore('referrals', { keyPath: 'id' });
      }

      // Sync queue tracking actions to sync to backend
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'queue_id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Generic Transaction Helper
const getStore = async (storeName, mode = 'readonly') => {
  const db = await initIndexedDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
};

// Save Patient to IndexedDB & Queue
export const saveOfflinePatient = async (patientData) => {
  const store = await getStore('patients', 'readwrite');
  const queueStore = await getStore('sync_queue', 'readwrite');

  const record = {
    ...patientData,
    offline_created_at: new Date().toISOString()
  };

  store.put(record);
  queueStore.add({
    type: 'PATIENT_REGISTRATION',
    entity_id: patientData.patient_code,
    payload: patientData,
    created_at: new Date().toISOString(),
    status: 'Pending'
  });

  return record;
};

// Save Screening to IndexedDB & Queue
export const saveOfflineScreening = async (screeningData) => {
  const store = await getStore('screenings', 'readwrite');
  const queueStore = await getStore('sync_queue', 'readwrite');

  const record = {
    ...screeningData,
    offline_created_at: new Date().toISOString()
  };

  store.put(record);
  queueStore.add({
    type: 'SCREENING_RESULT',
    entity_id: screeningData.screening_code,
    payload: screeningData,
    created_at: new Date().toISOString(),
    status: 'Pending'
  });

  return record;
};

// Save Referral to IndexedDB & Queue
export const saveOfflineReferral = async (referralData) => {
  const store = await getStore('referrals', 'readwrite');
  const queueStore = await getStore('sync_queue', 'readwrite');

  const record = {
    ...referralData,
    offline_created_at: new Date().toISOString()
  };

  store.put(record);
  queueStore.add({
    type: 'REFERRAL_SLIP',
    entity_id: referralData.referral_code,
    payload: referralData,
    created_at: new Date().toISOString(),
    status: 'Pending'
  });

  return record;
};

// Get All Queued Offline Items
export const getOfflineSyncQueue = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getStore('sync_queue', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      resolve([]);
    }
  });
};

// Clear Synced Item by Queue ID
export const removeSyncQueueItem = async (queueId) => {
  const store = await getStore('sync_queue', 'readwrite');
  store.delete(queueId);
};

// Clear All Synced Items
export const clearAllSyncQueue = async () => {
  const store = await getStore('sync_queue', 'readwrite');
  store.clear();
};
