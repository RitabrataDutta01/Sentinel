/**
 * Initialize global keyboard shortcuts for the desktop application
 */
export async function initializeShortcuts() {
  // Check if we're running under Electron
  if (!window.electronAPI) {
    console.warn('Shortcut initialization skipped: Not running under Electron')
    return
  }

  console.log('Initializing Electron global keyboard shortcuts...')

  // In Electron, global shortcuts are managed by the main process
  // We'll send IPC messages to communicate shortcut actions or setup needs
  try {
    // For now, we'll log that shortcut initialization would happen
    // In a full implementation, we might send specific IPC messages
    // to the main process to register global shortcuts

    console.log('Global keyboard shortcuts initialization signal sent to main process')

    // Example of how we might communicate with main process:
    // if (window.electronAPI.setupGlobalShortcuts) {
    //   await window.electronAPI.setupGlobalShortcuts()
    // }

  } catch (error) {
    console.error('Failed to initialize global shortcuts:', error)
  }
}

/**
 * Clean up shortcuts when application is closing or when needed
 */
export async function cleanupShortcuts() {
  // Check if we're running under Electron
  if (!window.electronAPI) {
    console.warn('Shortcut cleanup skipped: Not running under Electron')
    return
  }

  console.log('Cleaning up Electron global keyboard shortcuts...')

  // In Electron, shortcut cleanup is handled by the main process
  // We'll send IPC messages to communicate cleanup needs
  try {
    // For now, we'll log that cleanup would happen
    // In a full implementation, we might send specific IPC messages
    // to the main process to unregister global shortcuts

    console.log('Global shortcuts cleanup signal sent to main process')

    // Example of how we might communicate with main process:
    // if (window.electronAPI.cleanupGlobalShortcuts) {
    //   await window.electronAPI.cleanupGlobalShortcuts()
    // }

  } catch (error) {
    console.error('Error cleaning up shortcuts:', error)
  }
}

/**
 * Context-aware shortcut enabler/disabler
 * These functions can be called to enable/disable shortcuts based on application state
 */
class ShortcutManager {
  constructor() {
    this.enabledShortcuts = new Set()
  }

  /**
   * Enable a specific shortcut
   * @param {string} shortcut - The shortcut identifier (e.g., 'edit-undo')
   */
  enable(shortcut) {
    this.enabledShortcuts.add(shortcut)
    // TODO: Implement actual enabling logic based on shortcut mapping
    // In Electron, this would likely involve sending a message to the main process
  }

  /**
   * Disable a specific shortcut
   * @param {string} shortcut - The shortcut identifier
   */
  disable(shortcut) {
    this.enabledShortcuts.delete(shortcut)
    // TODO: Implement actual disabling logic based on shortcut mapping
    // In Electron, this would likely involve sending a message to the main process
  }

  /**
   * Check if a shortcut is enabled
   * @param {string} shortcut - The shortcut identifier
   * @returns {boolean}
   */
  isEnabled(shortcut) {
    return this.enabledShortcuts.has(shortcut)
  }

  /**
   * Enable editing shortcuts (undo, redo, cut, copy, paste, select all)
   */
  enableEditingShortcuts() {
    const editingShortcuts = [
      'edit-undo', 'edit-redo', 'edit-cut', 'edit-copy', 'edit-paste', 'edit-select-all'
    ]
    editingShortcuts.forEach(shortcut => this.enable(shortcut))
  }

  /**
   * Disable editing shortcuts
   */
  disableEditingShortcuts() {
    const editingShortcuts = [
      'edit-undo', 'edit-redo', 'edit-cut', 'edit-copy', 'edit-paste', 'edit-select-all'
    ]
    editingShortcuts.forEach(shortcut => this.disable(shortcut))
  }

  /**
   * Enable session control shortcuts (pause, resume, stop)
   */
  enableSessionControlShortcuts() {
    const sessionShortcuts = [
      'session-pause-resume', 'session-stop-current'
    ]
    sessionShortcuts.forEach(shortcut => this.enable(shortcut))
  }

  /**
   * Disable session control shortcuts
   */
  disableSessionControlShortcuts() {
    const sessionShortcuts = [
      'session-pause-resume', 'session-stop-current'
    ]
    sessionShortcuts.forEach(shortcut => this.disable(shortcut))
  }
}

// Export a singleton instance
export const shortcutManager = new ShortcutManager()