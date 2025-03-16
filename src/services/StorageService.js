import { compressImage } from './ImageUtils';

class StorageService {
  constructor() {
    this.dbName = 'AppScreenshotDB';
    this.version = 1;
    this.db = null;
    this.dbReady = this.initDB();
  }
  
  async initDB() {
    try {
      return new Promise((resolve, reject) => {
        // Check if IndexedDB is supported
        if (!window.indexedDB) {
          console.warn('IndexedDB not supported - falling back to localStorage');
          this.useLocalStorage = true;
          resolve(false);
          return;
        }
        
        const request = indexedDB.open(this.dbName, this.version);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('screenshots')) {
            db.createObjectStore('screenshots', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('projects')) {
            db.createObjectStore('projects', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error('Error opening IndexedDB:', event.target.error);
          this.useLocalStorage = true;
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Error initializing DB:', error);
      this.useLocalStorage = true;
      return false;
    }
  }
  
  async saveScreenshots(screenshots) {
    await this.dbReady;
    
    if (this.useLocalStorage) {
      return this._saveScreenshotsToLocalStorage(screenshots);
    }
    
    try {
      // First, prepare the blobs outside of any transaction
      const preparedScreenshots = [];
      for (let i = 0; i < screenshots.length; i++) {
        const screenshot = screenshots[i];
        try {
          // Convert and compress outside the transaction
          const blob = await this._dataURLToBlob(screenshot.src);
          preparedScreenshots.push({
            id: `screenshot_${i}`,
            blob: blob,
            name: screenshot.name,
            originalIndex: i
          });
        } catch (err) {
          console.error(`Error preparing screenshot ${i}:`, err);
        }
      }
      
      // Now that we have all blobs prepared, we can use a transaction
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(['screenshots', 'settings'], 'readwrite');
        const store = tx.objectStore('screenshots');
        const settingsStore = tx.objectStore('settings');
        
        // Clear existing screenshots first
        store.clear();
        
        // Add each prepared screenshot to the store
        preparedScreenshots.forEach(screenshot => {
          store.put(screenshot);
        });
        
        // Update the settings
        settingsStore.put({
          id: 'screenshotList',
          count: preparedScreenshots.length,
          lastUpdated: new Date().toISOString()
        });
        
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => {
          console.error("Transaction error:", e);
          reject(e);
        };
      });
    } catch (error) {
      console.error("Error in saveScreenshots:", error);
      throw error;
    }
  }
  
  async loadScreenshots() {
    await this.dbReady;
    
    if (this.useLocalStorage) {
      return this._loadScreenshotsFromLocalStorage();
    }
    
    try {
      // Load the list info first
      const tx = this.db.transaction(['screenshots', 'settings'], 'readonly');
      const store = tx.objectStore('screenshots');
      const settingsStore = tx.objectStore('settings');
      
      // Get the list info
      const listInfo = await new Promise((resolve, reject) => {
        const request = settingsStore.get('screenshotList');
        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
      });
      
      if (!listInfo || !listInfo.count) {
        return [];
      }
      
      const count = listInfo.count;
      const loadedScreenshots = [];
      
      // Load each screenshot
      for (let i = 0; i < count; i++) {
        try {
          const data = await new Promise((resolve, reject) => {
            const request = store.get(`screenshot_${i}`);
            request.onsuccess = () => resolve(request.result);
            request.onerror = reject;
          });
          
          if (data && data.blob) {
            // Convert blob to URL
            const url = URL.createObjectURL(data.blob);
            
            // Create image
            const img = new Image();
            img.src = url;
            
            // Wait for image to load
            await new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve; // Still resolve, even on error
            });
            
            loadedScreenshots.push({
              src: url,
              name: data.name || `Screenshot ${i+1}`,
              img: img,
              id: data.id,
              blobUrl: true // Mark this as a blob URL so we can revoke it later
            });
          }
        } catch (err) {
          console.error(`Error loading screenshot ${i}:`, err);
        }
      }
      
      // Sort by original index
      loadedScreenshots.sort((a, b) => {
        return parseInt(a.id.split('_')[1]) - parseInt(b.id.split('_')[1]);
      });
      
      return loadedScreenshots;
    } catch (error) {
      console.error("Error loading screenshots:", error);
      return [];
    }
  }
  
  // Fallback methods for localStorage
  _saveScreenshotsToLocalStorage(screenshots) {
    try {
      // Try to save screenshots if possible, but handle quota errors
      const screenshotsToSave = screenshots.map(screenshot => ({
        name: screenshot.name,
        wasSaved: true,
        id: screenshot.id || Date.now().toString()
      }));
      
      localStorage.setItem('appScreenshotList', JSON.stringify(screenshotsToSave));
      
      // Store each screenshot in its own storage key to avoid exceeding quota
      screenshots.forEach(async (screenshot, index) => {
        try {
          // Compress before saving to localStorage
          const compressedSrc = await compressImage(screenshot.src, 0.6); // 60% quality for localStorage
          localStorage.setItem(`appScreenshot_${index}`, compressedSrc);
        } catch (e) {
          console.warn(`Could not save screenshot ${index}. It may be too large for localStorage`, e);
        }
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return Promise.reject(error);
    }
  }
  
  _loadScreenshotsFromLocalStorage() {
    try {
      const savedScreenshotList = localStorage.getItem('appScreenshotList');
      if (!savedScreenshotList) {
        return Promise.resolve([]);
      }
      
      const parsedList = JSON.parse(savedScreenshotList);
      const loadedScreenshots = [];
      
      for (let i = 0; i < parsedList.length; i++) {
        const screenshotSrc = localStorage.getItem(`appScreenshot_${i}`);
        if (screenshotSrc) {
          const img = new Image();
          img.src = screenshotSrc;
          loadedScreenshots.push({
            src: screenshotSrc,
            name: parsedList[i].name || `Screenshot ${i+1}`,
            img: img,
            id: parsedList[i].id || `screenshot_${i}`
          });
        }
      }
      
      return Promise.resolve(loadedScreenshots);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return Promise.reject(error);
    }
  }
  
  // Helper methods for blob handling
  async _dataURLToBlob(dataURL) {
    return fetch(dataURL).then(r => r.blob());
  }
  
  async _compressBlob(blob, quality = 0.7) {
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Compress using our existing utility
    const compressedDataURL = await compressImage(url, quality);
    
    // Revoke the temporary URL
    URL.revokeObjectURL(url);
    
    // Convert back to blob
    return fetch(compressedDataURL).then(r => r.blob());
  }
  
  // Similar methods for saving/loading settings and projects
  // ...

  // Add these project management methods to StorageService

  // Save current project
  async saveCurrentProject(projectId, projectData) {
    try {
      if (!this.db) {
        throw new Error('IndexedDB not available');
      }
      
      const tx = this.db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      
      return new Promise((resolve, reject) => {
        const request = store.put({
          id: projectId,
          data: projectData,
          date: new Date().toISOString()
        });
        
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e);
      });
    } catch (error) {
      console.error('Error saving project to IndexedDB:', error);
      
      // Fallback to localStorage
      try {
        localStorage.setItem(`appScreenshotProject_${projectId}`, JSON.stringify(projectData));
        return Promise.resolve();
      } catch (localStorageError) {
        return Promise.reject(localStorageError);
      }
    }
  }

  // Load project
  async loadProject(projectId) {
    try {
      if (!this.db) {
        throw new Error('IndexedDB not available');
      }
      
      const tx = this.db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      
      return new Promise((resolve, reject) => {
        const request = store.get(projectId);
        
        request.onsuccess = () => {
          const result = request.result;
          resolve(result?.data || null);
        };
        
        request.onerror = (e) => reject(e);
      });
    } catch (error) {
      console.error('Error loading project from IndexedDB:', error);
      
      // Try localStorage as fallback
      try {
        const projectData = localStorage.getItem(`appScreenshotProject_${projectId}`);
        return projectData ? JSON.parse(projectData) : null;
      } catch (err) {
        return Promise.reject(err);
      }
    }
  }

  // Save current project info
  saveCurrentProjectInfo(project) {
    try {
      if (project) {
        localStorage.setItem('currentProject', JSON.stringify(project));
      } else {
        localStorage.removeItem('currentProject');
      }
      return true;
    } catch (error) {
      console.error('Error saving current project info:', error);
      return false;
    }
  }

  // Load current project info
  loadCurrentProjectInfo() {
    try {
      const savedCurrentProject = localStorage.getItem('currentProject');
      return savedCurrentProject ? JSON.parse(savedCurrentProject) : null;
    } catch (error) {
      console.error('Error loading current project info:', error);
      return null;
    }
  }
}

export default new StorageService(); 