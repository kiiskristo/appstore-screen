import { compressImage } from './ImageUtils';

class StorageService {
  constructor() {
    this.dbName = 'AppScreenshotDB';
    this.version = 1;
    this.db = null;
    this.useLocalStorage = false;
    this.dbReady = false;
    
    // Initialize as a promise that resolves once the DB is ready
    this.dbReadyPromise = this.initDB().then(() => {
      this.dbReady = true;
      console.log("IndexedDB initialization complete");
    }).catch(err => {
      console.error("IndexedDB initialization failed:", err);
      this.useLocalStorage = true;
    });
  }
  
  async initDB() {
    return new Promise((resolve, reject) => {
      console.log("Opening IndexedDB:", this.dbName);
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onupgradeneeded = (event) => {
        console.log("Upgrading database schema");
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        console.log("Database opened successfully");
        this.db = event.target.result;
        
        // Add connection error handlers
        this.db.onerror = (event) => {
          console.error("Database error:", event.target.error);
        };
        
        // Check database connection is valid
        if (this.db.objectStoreNames.contains('projects')) {
          console.log("Projects store exists");
          resolve(true);
        } else {
          console.error("Projects store missing");
          this.useLocalStorage = true;
          reject(new Error("Required stores not found"));
        }
      };
      
      request.onerror = (event) => {
        console.error("Error opening database:", event);
        this.useLocalStorage = true;
        reject(event);
      };
      
      request.onblocked = (event) => {
        console.error("Database access blocked");
        this.useLocalStorage = true;
        reject(new Error("Database blocked"));
      };
    });
  }
  
  // Helper methods for blob handling
  _dataURLToBlob(dataURL) {
    // Check if it's already a blob URL (starts with 'blob:')
    if (dataURL.startsWith('blob:')) {
      // For blob URLs, we need to fetch the content and create a new blob
      return new Promise(async (resolve, reject) => {
        try {
          // Try to convert the blob URL back to a data URL
          const response = await fetch(dataURL);
          const blob = await response.blob();
          
          // Create a new FileReader to convert blob to data URL
          const reader = new FileReader();
          reader.onload = (e) => {
            // Now we have a data URL we can process
            const dataURL = e.target.result;
            // Process the data URL (extract data part after the comma)
            const parts = dataURL.split(',');
            const byteString = atob(parts[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            
            resolve(new Blob([ab], { type: 'image/png' }));
          };
          
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error("Error converting blob URL:", err);
          // If we can't fetch the blob URL, create a placeholder image
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, 200, 200);
          ctx.fillStyle = '#ff0000';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Image Not Available', 100, 100);
          canvas.toBlob(resolve, 'image/png');
        }
      });
    } else if (dataURL.startsWith('data:')) {
      // Regular data URL processing (existing code)
      return new Promise((resolve) => {
        const parts = dataURL.split(',');
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        resolve(new Blob([ab], { type: 'image/png' }));
      });
    } else {
      // Handle other URL types or invalid data
      return Promise.reject(new Error('Invalid URL format'));
    }
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

  // Save current project
  async saveCurrentProject(projectId, projectData) {
    try {
      console.log("Saving project:", projectId, projectData);
      
      if (!this.db) {
        console.log("IndexedDB not available, using localStorage");
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
        
        request.onsuccess = () => {
          console.log("Project saved successfully:", projectId);
          resolve();
        };
        
        request.onerror = (e) => {
          console.error("Error saving project:", e);
          reject(e);
        };
      });
    } catch (error) {
      console.error('Error saving project to IndexedDB:', error);
      
      // Fallback to localStorage
      try {
        console.log("Saving to localStorage instead:", projectId);
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
      // Wait for DB initialization
      await this.dbReadyPromise;
      
      if (!this.db || this.useLocalStorage) {
        console.log("IndexedDB not available, trying localStorage");
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
        
        request.onerror = (e) => {
          console.error("Error in loadProject request:", e);
          reject(e);
        };
      });
    } catch (error) {
      console.error('Error loading project from IndexedDB:', error);
      
      // Try localStorage as fallback
      try {
        console.log("Trying localStorage for project:", projectId);
        const projectData = localStorage.getItem(`appScreenshotProject_${projectId}`);
        return projectData ? JSON.parse(projectData) : null;
      } catch (err) {
        console.error("Error loading from localStorage:", err);
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

  // New method to load screenshots from current project
  async loadScreenshotsFromProject(projectId) {
    try {
      await this.dbReady;
      
      const tx = this.db.transaction(['projects'], 'readonly');
      const store = tx.objectStore('projects');
      
      return new Promise((resolve, reject) => {
        const request = store.get(projectId);
        
        request.onsuccess = () => {
          const project = request.result;
          if (!project || !project.data || !project.data.screenshots) {
            resolve([]);
            return;
          }
          
          // Use the screenshots from the project
          resolve(project.data.screenshots);
        };
        
        request.onerror = (e) => {
          console.error('Error loading project screenshots:', e);
          reject(e);
        };
      });
    } catch (error) {
      console.error('Error loading project screenshots:', error);
      return [];
    }
  }
}

export default new StorageService(); 