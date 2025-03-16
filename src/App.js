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
        
        // Save screenshots using the storage service
        if (screenshots.length > 0) {
          await storageService.saveScreenshots(screenshots);
        }
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
        // First load settings
        const savedSettings = localStorage.getItem('appScreenshotSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          
          // Load saved preview settings
          if (parsedSettings.previewSettings) {
            setPreviewSettings(parsedSettings.previewSettings);
          }
          
          // Load other settings
          if (parsedSettings.deviceType) setDeviceType(parsedSettings.deviceType);
          if (parsedSettings.orientation) setOrientation(parsedSettings.orientation);
          if (parsedSettings.currentScreenshotIndex >= 0) {
            setCurrentScreenshotIndex(parsedSettings.currentScreenshotIndex);
          }
          if (parsedSettings.activePreviewIndex >= 0) {
            setActivePreviewIndex(parsedSettings.activePreviewIndex);
          }
        }
        
        // Then load screenshots using the storage service
        const loadedScreenshots = await storageService.loadScreenshots();
        if (loadedScreenshots.length > 0) {
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

  // Update the saveCurrentProject function:
  const saveCurrentProject = async () => {
    if (!currentProject) return;
    
    try {
      // Get the current project data
      const projectData = {
        id: currentProject.id,
        name: currentProject.name,
        date: new Date().toISOString(),
        deviceType,
        orientation,
        currentScreenshotIndex,
        activePreviewIndex,
        previewSettings,
        screenshots: await Promise.all(
          screenshots.map(async (screenshot) => {
            // Only include essential data (compress if needed)
            return {
              name: screenshot.name,
              src: screenshot.src,
            };
          })
        )
      };
      
      // Save using storage service
      await storageService.saveCurrentProject(currentProject.id, projectData);
      
      // Update project list if needed
      const allProjects = JSON.parse(localStorage.getItem('appScreenshotProjects') || '[]');
      const projectExists = allProjects.some(p => p.id === currentProject.id);
      
      if (!projectExists) {
        const updatedProjects = [
          ...allProjects, 
          {
            id: currentProject.id,
            name: currentProject.name,
            date: new Date().toISOString()
          }
        ];
        localStorage.setItem('appScreenshotProjects', JSON.stringify(updatedProjects));
      }
      
      // Record the current state as the last saved state
      const currentState = {
        screenshots: screenshots.map(s => s.id || s.name),
        previewSettings: JSON.stringify(previewSettings),
        deviceType,
        orientation,
        currentScreenshotIndex,
        activePreviewIndex
      };
      
      setLastSavedState(currentState);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving current project:', error);
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
        
        <div className="flex flex-col lg:flex-row gap-6">
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