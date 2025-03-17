import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EditorPanel from './components/EditorPanel';
import CanvasPreviewPanel from './components/CanvasPreviewPanel';
import PreviewContainer from './components/PreviewContainer';
import ProjectManager from './components/ProjectManager';
import storageService from './services/StorageService';

function App() {
  // Global state for the application
  const [deviceType, setDeviceType] = useState('iphone');
  const [orientation, setOrientation] = useState('portrait');
  const [screenshots, setScreenshots] = useState([]);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(-1);
  const [previewSettings, setPreviewSettings] = useState([{
    screenshotIndex: -1,
    orientation: 'portrait',
    rotation: 0,
    scale: 90,
    positionX: 0,
    positionY: 0,
    cornerRadius: 24,
    useGradient: false,
    gradientDirection: 'to right',
    gradientColor1: '#4a6bff',
    gradientColor2: '#45caff',
    showText: false,
    textTitle: 'Your App Name',
    textDescription: 'The perfect solution for your needs',
    titleFontSize: 24,
    titleFontFamily: "'Segoe UI', sans-serif",
    descriptionFontSize: 16,
    descriptionFontFamily: "'Segoe UI', sans-serif",
    textColor: '#ffffff',
    textPosition: 'bottom',
    textPositionX: 50,
    textPositionY: 80,
    textSpacing: 20,
    showFrame: true,
    frameColor: 'black',
    titleFontWeight: 'bold',
    descriptionFontWeight: 'normal'
  }]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(null);

  // Add new state to the App component
  const [currentProject, setCurrentProject] = useState(null);

  // Add this state to track changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState(null);

  // Detect System Preference and User Preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userPreference = localStorage.getItem('theme');
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (userPreference === 'dark' || (!userPreference && systemPreference)) {
        document.documentElement.classList.add('dark');
        setDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setDarkMode(false);
      }
    }
  }, []);

  // Toggle dark mode and save preference
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  };

  // Device dimensions data
  const deviceDimensions = {
    iphone: {
      portrait: { width: 1320, height: 2868 },
      landscape: { width: 2868, height: 1320 }
    },
    ipad: {
      portrait: { width: 2048, height: 2732 },
      landscape: { width: 2732, height: 2048 }
    }
  };

  // Update settings for current preview
  const updatePreviewSetting = (key, value) => {
    console.log('Updating preview setting:', key, value);
    setPreviewSettings(prevSettings => {
      const newSettings = [...prevSettings];
      newSettings[activePreviewIndex] = {
        ...newSettings[activePreviewIndex],
        [key]: value
      };
      return newSettings;
    });
  };

  // Handle multiple settings updates at once
  const updateMultipleSettings = (settingsObject) => {
    setPreviewSettings(prevSettings => {
      const newSettings = [...prevSettings];
      newSettings[activePreviewIndex] = {
        ...newSettings[activePreviewIndex],
        ...settingsObject
      };
      return newSettings;
    });
  };

  // Add new preview
  const addPreview = () => {
    if (previewSettings.length >= 6) {
      alert('Maximum of 6 previews allowed');
      return;
    }
    
    setPreviewSettings(prev => [
      ...prev, 
      {...prev[activePreviewIndex]}
    ]);
    
    setActivePreviewIndex(previewSettings.length);
  };

  // Remove current preview
  const removePreview = () => {
    if (previewSettings.length <= 1) {
      alert('Cannot remove the last preview');
      return;
    }
    
    setPreviewSettings(prev => {
      const newSettings = [...prev];
      newSettings.splice(activePreviewIndex, 1);
      return newSettings;
    });
    
    setActivePreviewIndex(0);
  };

  // Switch between previews
  const switchPreview = (index) => {
    setActivePreviewIndex(index);
  };

  // Update the screenshot selection inside the App component
  const handleScreenshotSelect = (index) => {
    setCurrentScreenshotIndex(index);
    
    // Also update the current preview settings to use this screenshot
    setPreviewSettings(prevSettings => {
      const newSettings = [...prevSettings];
      newSettings[activePreviewIndex] = {
        ...newSettings[activePreviewIndex],
        screenshotIndex: index
      };
      return newSettings;
    });
  };

  // Update the autosave effect
  useEffect(() => {
    // Don't save if there are no screenshots or settings yet
    if (screenshots.length === 0 && previewSettings[0].screenshotIndex === -1) {
      return;
    }
    
    // Save state when relevant data changes
    const saveState = async () => {
      try {
        // Process screenshots to ensure we're storing data URLs, not blob URLs
        const processedScreenshots = screenshots.map(screenshot => {
          // If the src is a blob URL, we need to preserve the original data URL
          if (typeof screenshot.src === 'string' && screenshot.src.startsWith('blob:')) {
            // Try to find the original data URL if we have it stored
            return {
              ...screenshot,
              // Use the original data URL if available
              src: screenshot.originalDataURL || screenshot.src,
            };
          }
          return screenshot;
        });
        
        // Save settings first (these are small)
        const settingsToSave = {
          previewSettings,
          deviceType,
          orientation,
          currentScreenshotIndex,
          activePreviewIndex,
          lastSaved: new Date().toISOString()
        };
        
        // Save settings to localStorage (these are still small enough)
        localStorage.setItem('appScreenshotSettings', JSON.stringify(settingsToSave));
        
        setHasUnsavedChanges(false);
      } catch (error) {
        console.warn('Error saving state:', error);
        // Show a notification to the user
        alert('Some items may not have been saved due to storage limitations. Consider exporting your project.');
      }
    };
    
    saveState();
  }, [screenshots, previewSettings, deviceType, orientation, currentScreenshotIndex, activePreviewIndex]);

  // Update the load function
  useEffect(() => {
    // Load data on initial render
    const loadSavedState = async () => {
      try {
        // Load current project info first
        const currentProjectInfo = storageService.loadCurrentProjectInfo();
        setCurrentProject(currentProjectInfo);
        
        if (currentProjectInfo) {
          // If we have a current project, load its data
          const projectData = await storageService.loadProject(currentProjectInfo.id);
          console.log("Loaded project data:", projectData);
          if (projectData) {
            // Load screenshots from the project data itself
            console.log("Project screenshots:", projectData.screenshots?.length || 0);
            setScreenshots(projectData.screenshots || []);
            setPreviewSettings(projectData.previewSettings || [defaultPreviewSettings]);
            setDeviceType(projectData.deviceType || 'iphone');
            setOrientation(projectData.orientation || 'portrait');
            setCurrentScreenshotIndex(projectData.currentScreenshotIndex || 0);
            setActivePreviewIndex(projectData.activePreviewIndex || 0);
            return;
          }
        }
        
        // Fallback to loading settings from localStorage if no project
        const savedSettingsJSON = localStorage.getItem('appScreenshotSettings');
        if (savedSettingsJSON) {
          const savedSettings = JSON.parse(savedSettingsJSON);
          setPreviewSettings(savedSettings.previewSettings || [defaultPreviewSettings]);
          setDeviceType(savedSettings.deviceType || 'iphone');
          setOrientation(savedSettings.orientation || 'portrait');
          setCurrentScreenshotIndex(savedSettings.currentScreenshotIndex || 0);
          setActivePreviewIndex(savedSettings.activePreviewIndex || 0);
        }
        
        // Now try to load screenshots, first from project if available
        let loadedScreenshots = [];
        if (currentProjectInfo) {
          loadedScreenshots = await storageService.loadScreenshotsFromProject(currentProjectInfo.id);
        } else {
          // As a fallback, try loading from localStorage
          loadedScreenshots = await storageService._loadScreenshotsFromLocalStorage();
        }
        
        if (loadedScreenshots && loadedScreenshots.length > 0) {
          setScreenshots(loadedScreenshots);
        }
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    };
    
    loadSavedState();
  }, []);

  // Pass this to the loadProject function
  const loadProject = async (projectData) => {
    try {
      // Set current project info
      setCurrentProject({
        id: projectData.id,
        name: projectData.name
      });
      
      // Load saved screenshots
      if (projectData.screenshots && projectData.screenshots.length > 0) {
        // Convert image data URLs back to images
        const loadedScreenshots = projectData.screenshots.map(screenshot => {
          const img = new Image();
          img.src = screenshot.src;
          return { 
            src: screenshot.src, 
            name: screenshot.name,
            img: img
          };
        });
        setScreenshots(loadedScreenshots);
      }
      
      // Load saved preview settings
      if (projectData.previewSettings) {
        setPreviewSettings(projectData.previewSettings);
      }
      
      // Load other settings
      if (projectData.deviceType) setDeviceType(projectData.deviceType);
      if (projectData.orientation) setOrientation(projectData.orientation);
      if (projectData.currentScreenshotIndex >= 0) {
        setCurrentScreenshotIndex(projectData.currentScreenshotIndex);
      }
      if (projectData.activePreviewIndex >= 0) {
        setActivePreviewIndex(projectData.activePreviewIndex);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  // Add this to your component cleanup code
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      screenshots.forEach(screenshot => {
        if (screenshot.blobUrl) {
          URL.revokeObjectURL(screenshot.src);
        }
      });
    };
  }, [screenshots]);

  // Replace this effect that creates global functions:
  useEffect(() => {
    // Load current project info on initial render
    const currentProjectInfo = storageService.loadCurrentProjectInfo();
    if (currentProjectInfo) {
      setCurrentProject(currentProjectInfo);
    }
  }, []);

  // Replace this effect that saves current project info:
  useEffect(() => {
    if (currentProject) {
      storageService.saveCurrentProjectInfo(currentProject);
    }
  }, [currentProject]);

  // Update the saveCurrentProject function to properly include screenshots

  const saveCurrentProject = async (projectId, projectName) => {
    try {
      // Process screenshots to ensure we're storing data URLs, not blob URLs
      const processedScreenshots = screenshots.map(screenshot => {
        // If the src is a blob URL, we need to preserve the original data URL
        if (typeof screenshot.src === 'string' && screenshot.src.startsWith('blob:')) {
          // Use the original data URL if available
          return {
            ...screenshot,
            src: screenshot.originalDataURL || screenshot.src,
          };
        }
        return screenshot;
      });
      
      // Create project data that includes all necessary state
      const projectData = {
        screenshots: processedScreenshots,
        previewSettings,
        deviceType,
        orientation,
        currentScreenshotIndex,
        activePreviewIndex,
        lastSaved: new Date().toISOString()
      };
      
      // Save the project data
      await storageService.saveCurrentProject(projectId, projectData);
      
      // Update current project info
      const projectInfo = {
        id: projectId,
        name: projectName,
        lastSaved: new Date().toISOString()
      };
      
      setCurrentProject(projectInfo);
      storageService.saveCurrentProjectInfo(projectInfo);
      setHasUnsavedChanges(false);
      
      return true;
    } catch (error) {
      console.error('Error saving project:', error);
      return false;
    }
  };

  // Check for changes whenever relevant state changes
  useEffect(() => {
    if (!lastSavedState || !currentProject) {
      return;
    }
    
    const currentState = {
      screenshots: screenshots.map(s => s.id || s.name),
      previewSettings: JSON.stringify(previewSettings),
      deviceType,
      orientation,
      currentScreenshotIndex,
      activePreviewIndex
    };
    
    // Compare current state with last saved state
    const hasChanges = 
      currentState.screenshots.length !== lastSavedState.screenshots.length ||
      currentState.previewSettings !== lastSavedState.previewSettings ||
      currentState.deviceType !== lastSavedState.deviceType ||
      currentState.orientation !== lastSavedState.orientation ||
      currentState.currentScreenshotIndex !== lastSavedState.currentScreenshotIndex ||
      currentState.activePreviewIndex !== lastSavedState.activePreviewIndex;
    
    setHasUnsavedChanges(hasChanges);
  }, [screenshots, previewSettings, deviceType, orientation, currentScreenshotIndex, activePreviewIndex, lastSavedState, currentProject]);

  // Fix the exportAllPreviews function
  const exportAllPreviews = async () => {
    // If already exporting, don't start a new export
    if (window._isExporting) return;
    
    // Set the exporting flag
    window._isExporting = true;
    
    // Safety timeout to ensure the flag gets reset even if something goes wrong
    const safetyTimer = setTimeout(() => {
      window._isExporting = false;
      console.warn('Export timed out after 30 seconds');
    }, 30000); // 30 seconds max
    
    try {
      // Save the current active preview index
      const currentIndex = activePreviewIndex;
      
      // Simple loop through all previews
      for (let i = 0; i < previewSettings.length; i++) {
        console.log(`Exporting preview ${i+1} of ${previewSettings.length}`);
        
        // Switch to this preview
        switchPreview(i);
        
        // Give time to render
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Export using the existing exportCanvas method
        if (window.activePreviewCanvas && typeof window.activePreviewCanvas.exportCanvas === 'function') {
          try {
            await window.activePreviewCanvas.exportCanvas();
          } catch (exportError) {
            console.error(`Error exporting preview ${i+1}:`, exportError);
            // Continue with next preview
          }
        } else {
          console.warn('Export canvas not available, skipping');
        }
        
        // Small delay between exports
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Restore original preview
      switchPreview(currentIndex);
      console.log('All screenshots exported successfully');
    } catch (err) {
      console.error('Error in export all process:', err);
    } finally {
      // Clear the safety timer and reset the flag
      clearTimeout(safetyTimer);
      window._isExporting = false;
    }
  };

  return (
    <div className="app min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <Header 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        currentProject={currentProject}
      />
      
      <div className="container mx-auto p-5">
        <div className="flex justify-end mb-4">
          <ProjectManager
            screenshots={screenshots}
            previewSettings={previewSettings}
            deviceType={deviceType}
            orientation={orientation}
            currentScreenshotIndex={currentScreenshotIndex}
            activePreviewIndex={activePreviewIndex}
            loadProject={loadProject}
            currentProject={currentProject}
            setCurrentProject={setCurrentProject}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveCurrentProject={saveCurrentProject}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mt-6 max-w-full overflow-hidden">
          <div className="flex-2 min-w-[300px]">
            <EditorPanel 
              deviceType={deviceType}
              setDeviceType={setDeviceType}
              orientation={orientation}
              setOrientation={setOrientation}
              screenshots={screenshots}
              setScreenshots={setScreenshots}
              currentScreenshotIndex={currentScreenshotIndex}
              setCurrentScreenshotIndex={handleScreenshotSelect}
              previewSettings={previewSettings[activePreviewIndex]}
              updatePreviewSetting={updatePreviewSetting}
              updateMultipleSettings={updateMultipleSettings}
              deviceDimensions={deviceDimensions}
              darkMode={darkMode}
            />
          </div>
          
          <PreviewContainer
            title="Preview"
            className="flex-1 w-full xl:max-w-[calc(100%-380px)] 2xl:max-w-[calc(100%-350px)] 3xl:max-w-[calc(100%-320px)]"
            deviceType={deviceType}
            orientation={orientation}
            scale={(previewSettings[activePreviewIndex].scale / 100) * 1.5}
            previewSettings={previewSettings}
            activePreviewIndex={activePreviewIndex}
            switchPreview={switchPreview}
            addPreview={addPreview}
            removePreview={removePreview}
            deviceDimensions={deviceDimensions}
            screenshots={screenshots}
            currentScreenshotIndex={currentScreenshotIndex}
            exportButtons={
              <div className="flex gap-3 mt-6">
                <button 
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => window.activePreviewCanvas?.exportCanvas()}
                >
                  Export Current
                </button>
                
                {previewSettings.length > 1 && (
                  <button 
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={exportAllPreviews}
                    disabled={window._isExporting}
                  >
                    {window._isExporting ? 'Exporting...' : 'Export All'}
                  </button>
                )}
              </div>
            }
            darkMode={darkMode}
          >
            <CanvasPreviewPanel
              id="canvas-preview"
              deviceType={deviceType}
              orientation={orientation}
              screenshots={screenshots}
              currentScreenshotIndex={currentScreenshotIndex}
              previewSettings={previewSettings}
              activePreviewIndex={activePreviewIndex}
              deviceDimensions={deviceDimensions}
              switchPreview={switchPreview}
              ref={node => window.activePreviewCanvas = node}
            />
          </PreviewContainer>
        </div>
      </div>
    </div>
  );
}

export default App; 