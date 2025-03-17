import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EditorPanel from './components/EditorPanel';
import CanvasPreviewPanel from './components/CanvasPreviewPanel';
import PreviewContainer from './components/PreviewContainer';
import ProjectManager from './components/ProjectManager';
import storageService from './services/StorageService';
import useProjectManagement from './hooks/useProjectManagement';

function App() {
  // Use the custom hook to handle project logic
  const { 
    currentProject, 
    setCurrentProject,
    projectData,
    setProjectData,
    hasUnsavedChanges,
    saveProject
  } = useProjectManagement();
  
  // Extract most state from project data
  const { 
    screenshots, 
    previewSettings, 
    deviceType, 
    orientation
  } = projectData;
  
  // Keep activePreviewIndex as local UI state
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  
  // Create update methods
  const updateProjectData = (key, value) => {
    setProjectData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  // Effect to apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  
  // Handle UI updates
  const handleScreenshotSelect = (index) => {
    // Make sure index is treated as a number
    const indexValue = parseInt(index, 10);
    console.log("Setting screenshot index to:", indexValue, "Type:", typeof indexValue);
    
    // Get the currently active screenshot index
    const currentIndex = previewSettings[activePreviewIndex]?.screenshotIndex;
    
    // If clicking the same screenshot, toggle selection (deselect)
    if (currentIndex === indexValue) {
      updatePreviewSetting('screenshotIndex', -1); // Deselect
    }
    // Otherwise select the new screenshot if valid
    else if (indexValue >= 0 && indexValue < screenshots.length) {
      updatePreviewSetting('screenshotIndex', indexValue);
    } else {
      console.warn("Invalid screenshot index:", index);
    }
  };
  
  // Component cleanup
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
  
  // Quick save project handler
  const handleQuickSave = async () => {
    const projectId = currentProject?.id || Date.now().toString();
    const projectName = currentProject?.name || "Untitled Project";
    return await saveProject(projectId, projectName);
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
    setProjectData(prev => ({
      ...prev,
      previewSettings: prev.previewSettings.map((setting, index) =>
        index === activePreviewIndex ? { ...setting, [key]: value } : setting
      )
    }));
  };

  // Handle multiple settings updates at once
  const updateMultipleSettings = (settingsObject) => {
    setProjectData(prev => ({
      ...prev,
      previewSettings: prev.previewSettings.map((setting, index) =>
        index === activePreviewIndex ? { ...setting, ...settingsObject } : setting
      )
    }));
  };

  // Add new preview
  const addPreview = () => {
    if (previewSettings.length >= 6) {
      alert('Maximum of 6 previews allowed');
      return;
    }
    
    setProjectData(prev => ({
      ...prev,
      previewSettings: [...prev.previewSettings, previewSettings[activePreviewIndex]]
    }));
    
    updateProjectData('activePreviewIndex', previewSettings.length);
  };

  // Remove current preview
  const removePreview = () => {
    if (previewSettings.length <= 1) {
      alert('Cannot remove the last preview');
      return;
    }
    
    setProjectData(prev => ({
      ...prev,
      previewSettings: prev.previewSettings.filter((_, index) => index !== activePreviewIndex)
    }));
    
    updateProjectData('activePreviewIndex', 0);
  };

  // Update the switching function to use the local state
  const switchPreview = (index) => {
    setActivePreviewIndex(index);
  };

  // Update the load function
  useEffect(() => {
    // Load data on initial render
    const loadSavedState = async () => {
      try {
        // All this logic is now handled in useProjectManagement
        // ...
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    };
    
    loadSavedState();
  }, []);

  // Fix this function to properly load a project from ProjectManager
  const loadProject = async (projectData) => {
    try {
      if (!projectData) {
        console.error('Cannot load project: No project data provided');
        return;
      }
      
      // Set current project info
      setCurrentProject({
        id: projectData.id || Date.now().toString(),
        name: projectData.name || "Untitled Project"
      });
      
      // Set the project data directly
      setProjectData(projectData);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

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
        toggleDarkMode={() => setDarkMode(prev => !prev)} 
        currentProject={currentProject}
      />
      
      <div className="container mx-auto p-5">
        <div className="flex justify-end mb-4">
          <ProjectManager
            screenshots={screenshots}
            previewSettings={previewSettings}
            deviceType={deviceType}
            orientation={orientation}
            currentScreenshotIndex={previewSettings[activePreviewIndex]?.screenshotIndex === undefined ? -1 : previewSettings[activePreviewIndex]?.screenshotIndex}
            activePreviewIndex={activePreviewIndex}
            loadProject={loadProject}
            currentProject={currentProject}
            setCurrentProject={setCurrentProject}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveCurrentProject={handleQuickSave}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mt-6 max-w-full overflow-hidden">
          <div className="flex-2 min-w-[300px]">
            <EditorPanel 
              deviceType={deviceType}
              setDeviceType={(newType) => updateProjectData('deviceType', newType)}
              orientation={orientation}
              setOrientation={(newOrientation) => updateProjectData('orientation', newOrientation)}
              screenshots={screenshots}
              setScreenshots={(newScreenshots) => updateProjectData('screenshots', newScreenshots)}
              currentScreenshotIndex={previewSettings[activePreviewIndex]?.screenshotIndex === undefined ? -1 : previewSettings[activePreviewIndex]?.screenshotIndex}
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
            scale={((previewSettings?.[activePreviewIndex]?.scale || 90) / 100) * 1.5}
            previewSettings={previewSettings || []}
            activePreviewIndex={activePreviewIndex}
            switchPreview={switchPreview}
            addPreview={addPreview}
            removePreview={removePreview}
            deviceDimensions={deviceDimensions}
            screenshots={screenshots}
            currentScreenshotIndex={previewSettings[activePreviewIndex]?.screenshotIndex ?? -1}
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
              currentScreenshotIndex={previewSettings[activePreviewIndex]?.screenshotIndex ?? -1}
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