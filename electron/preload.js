const { contextBridge, ipcRenderer } = require('electron');

// Expose protected IPC renderer methods to the frontend
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),

  // Window operations
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Notifications
  showNotification: (title, options) => ipcRenderer.invoke('show-notification', { title, options }),

  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isAppPackaged: () => ipcRenderer.invoke('is-app-packaged')
});

// Expose environment info
contextBridge.exposeInMainWorld('isDev', !process.env.NODE_ENV || process.env.NODE_ENV === 'development');
contextBridge.exposeInMainWorld('electronVersion', process.versions.electron);

// Helper to create a proper unsubscribe function for ipcRenderer.on
function createIpcListener(channel) {
  return (callback) => {
    ipcRenderer.on(channel, callback);
    // Return a proper cleanup function
    return () => ipcRenderer.off(channel, callback);
  };
}

// Listen for events from main process
contextBridge.exposeInMainWorld('electronEvents', {
  onNewSession: createIpcListener('new-session'),
  onExportReport: createIpcListener('export-report'),
  onNavigateSessions: createIpcListener('navigate-sessions'),
  onNavigateSettings: createIpcListener('navigate-settings'),
  onNewSimulation: createIpcListener('new-simulation'),
  onPauseResumeSimulation: createIpcListener('pause-resume-simulation'),
  onStopSimulation: createIpcListener('stop-simulation'),
  onExportTranscript: createIpcListener('export-transcript'),
  onOpenDocumentation: createIpcListener('open-documentation'),
  onOpenTutorials: createIpcListener('open-tutorials'),
  onZoomIn: createIpcListener('zoom-in'),
  onZoomOut: createIpcListener('zoom-out'),
  onZoomReset: createIpcListener('zoom-reset'),
  onToggleSidebar: createIpcListener('toggle-sidebar'),
  onFind: createIpcListener('find'),
  onUndo: createIpcListener('undo'),
  onRedo: createIpcListener('redo'),
  onSelectAll: createIpcListener('select-all'),
  onCheckUpdates: createIpcListener('check-updates'),
  onResumeLastSession: createIpcListener('resume-last-session')
});