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
  const [importError, setImportError] = useState('');
  
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
      // Find the project info from the projects list
      const projectInfo = projects.find(p => p.id === projectId);
      if (!projectInfo) {
        console.error('Project info not found for ID:', projectId);
        return;
      }
      
      // Save the current project info
      StorageService.saveCurrentProjectInfo(projectInfo);
      
      // Update the current project in state
      setCurrentProject(projectInfo);
      
      // Load project data
      const projectData = await StorageService.loadProject(projectId);
      
      if (projectData) {
        // Use the App.js loadProject function
        loadProject(projectData);
        // Close dialog after loading
        setIsOpen(false);
      } else {
        console.error('Could not load project data for ID:', projectId);
      }
    } catch (error) {
      console.error('Error loading project:', error);
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
  
  // Function to export the current project as JSON
  const exportProjectAsJson = async () => {
    if (!currentProject) {
      alert('Please save your project before exporting.');
      return;
    }
    
    try {
      // Fetch the complete project data from storage
      const projectData = await StorageService.loadProject(currentProject.id);
      
      if (!projectData) {
        alert('Could not load project data for export.');
        return;
      }
      
      // Create a complete project object with metadata and content
      const exportData = {
        id: currentProject.id,
        name: currentProject.name,
        date: currentProject.lastSaved || new Date().toISOString(),
        data: projectData
      };
      
      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set download attributes
      link.href = url;
      link.download = `${currentProject.name.replace(/\s+/g, '_')}_export.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting project:', error);
      alert('Failed to export project: ' + error.message);
    }
  };
  
  // Function to import a project from JSON
  const importProjectFromJson = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setImportError('');
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // Parse the JSON data
          const importData = JSON.parse(e.target.result);
          
          // Validate the imported data has the required structure
          if (!importData.id || !importData.name || !importData.data) {
            setImportError('Invalid project file format.');
            return;
          }
          
          // Check if a project with the same ID already exists
          const existingProjects = projects.filter(p => p.id === importData.id);
          let projectId = importData.id;
          let projectName = importData.name;
          
          if (existingProjects.length > 0) {
            // Generate a new ID and modify the name to avoid conflicts
            projectId = Date.now().toString();
            projectName = `${importData.name} (Imported)`;
          }
          
          // Save the imported project with its data
          await StorageService.saveCurrentProject(projectId, importData.data);
          
          // Create project info
          const projectInfo = {
            id: projectId,
            name: projectName,
            lastSaved: new Date().toISOString() // Add lastSaved field to match expected format
          };
          
          // Save current project info to localStorage
          StorageService.saveCurrentProjectInfo(projectInfo);
          
          // Update state
          setCurrentProject(projectInfo);
          
          // Update projects list
          const updatedProjects = [...projects, projectInfo];
          setProjects(updatedProjects);
          localStorage.setItem('appScreenshotProjects', JSON.stringify(updatedProjects));
          
          // Load the imported project
          loadProject(projectId);
          
          // Close the modal
          setIsOpen(false);
          
          alert('Project imported successfully!');
        } catch (parseError) {
          console.error('Error parsing import data:', parseError);
          setImportError('Could not parse project file. It may be corrupted.');
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing project:', error);
      setImportError('Failed to import project: ' + error.message);
    }
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
          
          <div className="flex gap-2 mb-4">
            <button 
              className="bg-green-600 text-white py-1 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              onClick={exportProjectAsJson}
              disabled={!currentProject}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Project
            </button>
            
            <label className="bg-purple-600 text-white py-1 px-3 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              Import Project
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={importProjectFromJson} 
              />
            </label>
          </div>
          
          {importError && (
            <div className="text-red-500 text-sm mb-4">{importError}</div>
          )}
          
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