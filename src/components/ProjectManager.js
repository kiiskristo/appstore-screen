import React, { useState, useEffect } from 'react';
import { compressImage } from '../services/ImageUtils';
import StorageService from '../services/StorageService';

function ProjectManager({ 
  screenshots, 
  previewSettings, 
  deviceType, 
  orientation, 
  currentScreenshotIndex, 
  activePreviewIndex,
  loadProject,
  currentProject,
  setCurrentProject,
  hasUnsavedChanges,
  onSaveCurrentProject
}) {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Load saved projects list on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('appScreenshotProjects');
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (e) {
        console.error('Error loading projects:', e);
      }
    }
  }, []);
  
  // Updated save project function that uses the current project if available
  const saveProject = async (newProject = false) => {
    // If we're saving the current project and not creating a new one
    const projectToSave = !newProject && currentProject ? currentProject : null;
    const nameToUse = projectToSave ? projectToSave.name : projectName;
    
    if (!nameToUse.trim()) {
      alert('Please enter a project name');
      return;
    }
    
    try {
      // Use existing project ID or create a new one
      const projectId = projectToSave ? projectToSave.id : Date.now().toString();
      const isUpdate = !!projectToSave;
      
      // Compress screenshots when saving projects
      const compressedScreenshots = await Promise.all(
        screenshots.map(async (screenshot) => {
          // Only include essential data
          const compressedSrc = await compressImage(screenshot.src, 0.6); // 60% quality
          return {
            name: screenshot.name,
            src: compressedSrc,
          };
        })
      );
      
      const projectData = {
        id: projectId,
        name: nameToUse,
        date: new Date().toISOString(),
        deviceType,
        orientation,
        currentScreenshotIndex,
        activePreviewIndex,
        previewSettings,
        screenshots: compressedScreenshots
      };
      
      // First save/update the project list entry (small data)
      const allProjects = JSON.parse(localStorage.getItem('appScreenshotProjects') || '[]');
      let updatedProjects;
      
      if (isUpdate) {
        // Update existing project
        updatedProjects = allProjects.map(p => 
          p.id === projectId ? { ...p, name: nameToUse, date: new Date().toISOString() } : p
        );
      } else {
        // Add new project
        const projectEntry = {
          id: projectId,
          name: nameToUse,
          date: new Date().toISOString(),
        };
        updatedProjects = [...allProjects, projectEntry];
      }
      
      // Update projects list
      localStorage.setItem('appScreenshotProjects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      
      // Save the actual project data
      try {
        // Try to save to IndexedDB first
        await StorageService.saveCurrentProject(projectId, projectData);
        console.log(`Project ${isUpdate ? 'updated' : 'saved'} to IndexedDB successfully`);
      } catch (error) {
        // Fall back to trying localStorage with further compression
        console.warn('Error saving to IndexedDB, attempting localStorage fallback');
        
        try {
          // Further compress screenshots for localStorage fallback
          const highlyCompressedScreenshots = await Promise.all(
            screenshots.map(async (screenshot) => {
              const compressedSrc = await compressImage(screenshot.src, 0.4, 800); // 40% quality, max width 800px
              return {
                name: screenshot.name,
                src: compressedSrc,
              };
            })
          );
          
          // Create a smaller version of the project
          const compressedProject = {
            ...projectData,
            screenshots: highlyCompressedScreenshots
          };
          
          // Try to save the compressed version
          localStorage.setItem(`appScreenshotProject_${projectId}`, JSON.stringify(compressedProject));
          console.log('Project saved to localStorage with high compression');
        } catch (storageError) {
          // If that still fails, save without screenshots
          console.error('Storage quota exceeded even with compression:', storageError);
          
          const minimalProject = {
            ...projectData,
            screenshots: [], // Remove screenshots
            screenshotsError: 'Screenshots too large to save'
          };
          
          localStorage.setItem(`appScreenshotProject_${projectId}`, JSON.stringify(minimalProject));
          alert('Project saved, but screenshots were too large to save. Try exporting each screenshot separately.');
        }
      }
      
      // If it's a quick save of current project, no need to reset the form
      if (!newProject && projectToSave) {
        console.log('Project updated successfully');
      } else {
        // Reset form if it's a new project save
        setProjectName('');
        setIsOpen(false);
      }
      
      // Update the current project reference
      setCurrentProject({
        id: projectId,
        name: nameToUse
      });
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again or export your work manually.');
    }
  };
  
  // Add this to expose the save function globally
  useEffect(() => {
    window.saveCurrentProject = async () => {
      if (currentProject) {
        await saveProject(false); // Save current project
        return true;
      }
      return false;
    };
    
    return () => {
      delete window.saveCurrentProject;
    };
  }, [currentProject]);
  
  // Update the quick save function to use the passed callback
  const quickSave = async () => {
    // If no project exists yet, create one with default name
    const projectId = currentProject?.id || Date.now().toString();
    const projectName = currentProject?.name || "Untitled Project";
    
    console.log("Quick saving project with ID:", projectId, "Name:", projectName);
    
    // Save the project using the project ID and name
    await onSaveCurrentProject(projectId, projectName);
    
    // Close dropdown after saving
    setIsOpen(false);
  };
  
  // Load a saved project
  const handleLoadProject = async (projectId) => {
    try {
      // Load project using storage service
      const projectData = await StorageService.loadProject(projectId);
      
      if (projectData) {
        // If we saved without screenshots, show a message
        if (projectData.screenshotsError) {
          alert('This project was saved without screenshots due to storage limitations.');
        }
        
        // Load the project data
        loadProject(projectData);
        setIsOpen(false);
      } else {
        alert('Could not load project data.');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Failed to load project. The data may be corrupted.');
    }
  };
  
  // Delete a project
  const deleteProject = (projectId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      localStorage.removeItem(`appScreenshotProject_${projectId}`);
      localStorage.setItem('appScreenshotProjects', JSON.stringify(updatedProjects));
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Add a function to edit a project
  const editProject = (project, e) => {
    e.stopPropagation(); // Don't trigger the load function
    setCurrentProject(project);
    setProjectName(project.name);
    // Keep the panel open
  };
  
  return (
    <div className="relative flex gap-2">
      {/* Save button with dynamic color based on changes */}
      {currentProject && (
        <button 
          className={`${
            hasUnsavedChanges 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-gray-400 hover:bg-gray-500"
          } text-white py-2 px-4 rounded-lg transition-colors`}
          onClick={quickSave}
          title={hasUnsavedChanges ? "Save changes" : "No changes to save"}
        >
          Save
        </button>
      )}
      
      {/* "Save As" button that always creates a new project */}
      <button 
        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => {
          setCurrentProject(null); // Clear current project to force "new project" mode
          setProjectName('');
          setIsOpen(true);
        }}
        title="Save as new project"
      >
        Save As
      </button>
      
      {/* Existing Projects button */}
      <button 
        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        Projects
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-10">
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Projects</h3>
          
          <div className="mb-4">
            <input
              type="text"
              className="editor-input mb-2"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                className="bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700 transition-colors"
                onClick={() => saveProject(false)}
              >
                {currentProject ? 'Update Project' : 'Save New Project'}
              </button>
              
              {currentProject && (
                <button 
                  className="bg-gray-500 text-white py-1 px-3 rounded-lg hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setCurrentProject(null);
                    setProjectName('');
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {projects.length === 0 ? (
              <p className="p-3 dark:text-gray-300">No saved projects</p>
            ) : (
              <ul>
                {projects.map(project => (
                  <li 
                    key={project.id}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
                    onClick={() => handleLoadProject(project.id)}
                  >
                    <div>
                      <div className="font-medium dark:text-white">{project.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(project.date)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={(e) => editProject(project, e)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        onClick={(e) => deleteProject(project.id, e)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="mt-2 flex justify-end">
            <button 
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectManager; 