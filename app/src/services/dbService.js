/**
 * IndexedDB Service for storing Master/Reference Datasets:
 * 1. CMS Catalog (data_tt_gt_cms.xlsx / file-thuoctinh-giatri.xlsx)
 * 2. PIM Options Dictionary (option_pim.xlsx)
 * 3. PIM-CMS Mapping Reference (thuoc_tinh_pim_cms.xlsx)
 * 4. CMS Import Template (import_sp_cms.xlsx)
 */

const DB_NAME = 'PIM_CMS_DATA_STORE_V2';
const DB_VERSION = 1;
const STORE_NAME = 'master_files';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Save a master dataset into IndexedDB
 * @param {string} id - 'cmsCatalog' | 'pimOption' | 'mappingRef' | 'cmsTemplate'
 * @param {object} data - { id, fileName, updatedAt, rawBuffer, parsedData, summary }
 */
export async function saveMasterDataset(id, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item = {
      id,
      fileName: data.fileName || 'unknown.xlsx',
      updatedAt: data.updatedAt || new Date().toISOString(),
      summary: data.summary || {},
      parsedData: data.parsedData || null,
      rawBuffer: data.rawBuffer || null
    };
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get a master dataset from IndexedDB
 */
export async function getMasterDataset(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all master datasets summaries
 */
export async function getAllMasterDatasets() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const map = {};
      (req.result || []).forEach(item => {
        map[item.id] = {
          id: item.id,
          fileName: item.fileName,
          updatedAt: item.updatedAt,
          summary: item.summary,
          parsedData: item.parsedData,
          hasRawBuffer: Boolean(item.rawBuffer)
        };
      });
      resolve(map);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Remove a dataset
 */
export async function removeMasterDataset(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
