import { useState, useEffect } from 'react';
import storageService from '../services/StorageService';

export default function useProjectManagement() {
  const [currentProject, setCurrentProject] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [projectData, setProjectData] = useState({
    screenshots: [],
    previewSettings: [{
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
    }],
    deviceType: 'iphone',
    orientation: 'portrait',
  });

  // Load current project on init
  useEffect(() => {
    // Add a reference flag to prevent double-loading
    let isLoading = false;
    
    const loadCurrentProject = async () => {
      // Skip if already loading
      if (isLoading) return;
      isLoading = true;
      
      const projectInfo = storageService.loadCurrentProjectInfo();
      if (projectInfo) {
        console.log("Loading project from useProjectManagement:", projectInfo.id);
        setCurrentProject(projectInfo);
        const data = await storageService.loadProject(projectInfo.id);
        if (data) {
          setProjectData(data);
          setHasUnsavedChanges(false);
        }
      }
      
      isLoading = false;
    };
    
    loadCurrentProject();
  }, []);

  // Save project info when it changes
  useEffect(() => {
    if (currentProject) {
      storageService.saveCurrentProjectInfo(currentProject);
    }
  }, [currentProject]);

  // Save project data
  const saveProject = async (projectId, projectName) => {
    try {
      // Process screenshots to handle blob URLs
      const processedScreenshots = projectData.screenshots.map(screenshot => {
        if (typeof screenshot.src === 'string' && screenshot.src.startsWith('blob:')) {
          return {
            ...screenshot,
            src: screenshot.originalDataURL || screenshot.src,
          };
        }
        return screenshot;
      });
      
      // Prepare project data
      const dataToSave = {
        ...projectData,
        screenshots: processedScreenshots
      };
      
      // Save to storage
      await storageService.saveCurrentProject(projectId, dataToSave);
      
      // Update project info
      const projectInfo = {
        id: projectId,
        name: projectName,
        lastSaved: new Date().toISOString()
      };
      
      setCurrentProject(projectInfo);
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Error saving project:', error);
      return false;
    }
  };

  useEffect(() => {
    // Skip initial render and empty state
    if (!projectData.screenshots.length) return;
    
    // Mark as having unsaved changes when any relevant data changes
    setHasUnsavedChanges(true);
    
    // Comment out auto-save functionality
    /*
    const timer = setTimeout(() => {
      if (currentProject) {
        saveProject(currentProject.id, currentProject.name);
      }
    }, 2000);  // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(timer);
    */
  }, [projectData]); // Depend on the entire projectData object

  return {
    currentProject,
    setCurrentProject,
    projectData,
    setProjectData,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    saveProject
  };
} 