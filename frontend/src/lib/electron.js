// Wrapper for Electron IPC bridge
// Provides a consistent API whether running in Electron or browser

// Detect if running in Electron renderer process
const isElectronRenderer = () => {
  try {
    return (
      typeof window !== 'undefined' &&
      window.process &&
      window.process.type === 'renderer'
    );
  } catch {
    return false;
  }
};

let electronAPI = null;

// Initialize if running under Electron
if (isElectronRenderer()) {
  if (window.electronAPI) {
    electronAPI = window.electronAPI;
  }
}

// Exported functions - no-op if not in Electron
export const electron = {
  // File system
  saveFile: async (data) => {
    if (electronAPI?.saveFile) {
      return await electronAPI.saveFile(data);
    }
    console.warn('saveFile called but not running in Electron');
    return { success: false, error: 'Not running in Electron' };
  },
  openFile: async () => {
    if (electronAPI?.openFile) {
      return await electronAPI.openFile();
    }
    console.warn('openFile called but not running in Electron');
    return { success: false, error: 'Not running in Electron' };
  },

  // Window controls
  minimizeWindow: () => {
    if (electronAPI?.minimizeWindow) electronAPI.minimizeWindow();
  },
  maximizeWindow: () => {
    if (electronAPI?.maximizeWindow) electronAPI.maximizeWindow();
  },
  closeWindow: () => {
    if (electronAPI?.closeWindow) electronAPI.closeWindow();
  },

  // Notifications
  showNotification: async (title, options = {}) => {
    if (electronAPI?.showNotification) {
      return await electronAPI.showNotification({ title, options });
    }
    console.log(`Notification: ${title}`, options);
    return { success: true };
  },

  // App info
  getAppVersion: async () => {
    if (electronAPI?.getAppVersion) {
      return await electronAPI.getAppVersion();
    }
    return null;
  },
  isAppPackaged: async () => {
    if (electronAPI?.isAppPackaged) {
      return await electronAPI.isAppPackaged();
    }
    return false;
  },
};

// Event subscription helper (returns unsubscribe function)
export const electronEvents = {
  onNewSession: (callback) => {
    if (window.electronEvents?.onNewSession) {
      return window.electronEvents.onNewSession(callback);
    }
    return () => {};
  },
  onExportReport: (callback) => {
    if (window.electronEvents?.onExportReport) {
      return window.electronEvents.onExportReport(callback);
    }
    return () => {};
  },
  onNavigateSessions: (callback) => {
    if (window.electronEvents?.onNavigateSessions) {
      return window.electronEvents.onNavigateSessions(callback);
    }
    return () => {};
  },
  onNavigateSettings: (callback) => {
    if (window.electronEvents?.onNavigateSettings) {
      return window.electronEvents.onNavigateSettings(callback);
    }
    return () => {};
  },
  onNewSimulation: (callback) => {
    if (window.electronEvents?.onNewSimulation) {
      return window.electronEvents.onNewSimulation(callback);
    }
    return () => {};
  },
  onPauseResumeSimulation: (callback) => {
    if (window.electronEvents?.onPauseResumeSimulation) {
      return window.electronEvents.onPauseResumeSimulation(callback);
    }
    return () => {};
  },
  onStopSimulation: (callback) => {
    if (window.electronEvents?.onStopSimulation) {
      return window.electronEvents.onStopSimulation(callback);
    }
    return () => {};
  },
  onExportTranscript: (callback) => {
    if (window.electronEvents?.onExportTranscript) {
      return window.electronEvents.onExportTranscript(callback);
    }
    return () => {};
  },
  onOpenDocumentation: (callback) => {
    if (window.electronEvents?.onOpenDocumentation) {
      return window.electronEvents.onOpenDocumentation(callback);
    }
    return () => {};
  },
  onOpenTutorials: (callback) => {
    if (window.electronEvents?.onOpenTutorials) {
      return window.electronEvents.onOpenTutorials(callback);
    }
    return () => {};
  },
  onZoomIn: (callback) => {
    if (window.electronEvents?.onZoomIn) {
      return window.electronEvents.onZoomIn(callback);
    }
    return () => {};
  },
  onZoomOut: (callback) => {
    if (window.electronEvents?.onZoomOut) {
      return window.electronEvents.onZoomOut(callback);
    }
    return () => {};
  },
  onZoomReset: (callback) => {
    if (window.electronEvents?.onZoomReset) {
      return window.electronEvents.onZoomReset(callback);
    }
    return () => {};
  },
  onToggleSidebar: (callback) => {
    if (window.electronEvents?.onToggleSidebar) {
      return window.electronEvents.onToggleSidebar(callback);
    }
    return () => {};
  },
  onFind: (callback) => {
    if (window.electronEvents?.onFind) {
      return window.electronEvents.onFind(callback);
    }
    return () => {};
  },
  onUndo: (callback) => {
    if (window.electronEvents?.onUndo) {
      return window.electronEvents.onUndo(callback);
    }
    return () => {};
  },
  onRedo: (callback) => {
    if (window.electronEvents?.onRedo) {
      return window.electronEvents.onRedo(callback);
    }
    return () => {};
  },
  onSelectAll: (callback) => {
    if (window.electronEvents?.onSelectAll) {
      return window.electronEvents.onSelectAll(callback);
    }
    return () => {};
  },
  onCheckUpdates: (callback) => {
    if (window.electronEvents?.onCheckUpdates) {
      return window.electronEvents.onCheckUpdates(callback);
    }
    return () => {};
  },
  onResumeLastSession: (callback) => {
    if (window.electronEvents?.onResumeLastSession) {
      return window.electronEvents.onResumeLastSession(callback);
    }
    return () => {};
  },
};

// Helper to check if running in Electron
export const isElectron = isElectronRenderer;

// Helper to get Electron info
export const getElectronInfo = async () => {
  if (!isElectron()) return null;
  try {
    const version = await electron.getAppVersion?.();
    const isPackaged = await electron.isAppPackaged?.();
    return { version, isPackaged };
  } catch (e) {
    console.error('Failed to get Electron info:', e);
    return null;
  }
};