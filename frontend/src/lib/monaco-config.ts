/**
 * Monaco Editor configuration for Next.js
 * This file configures Monaco to work in a Next.js environment
 */

import type * as Monaco from 'monaco-editor';

// Global monaco instance
let monacoInstance: typeof Monaco | null = null;

/**
 * Simple configuration that disables workers and runs everything in the main thread.
 * This is more reliable in Next.js than trying to use web workers.
 */
export function setupMonacoEnvironment(): void {
  if (typeof window !== 'undefined') {
    // Simple configuration that disables workers
    window.MonacoEnvironment = {
      getWorkerUrl: function() {
        return 'data:text/javascript;charset=utf-8,';
      }
    };
  }
}

/**
 * Loads Monaco Editor with proper configuration
 * This creates a singleton instance to avoid multiple loads
 */
export async function loadMonaco(): Promise<typeof Monaco | null> {
  if (monacoInstance) return monacoInstance;
  
  try {
    // Set up environment
    setupMonacoEnvironment();
    
    // Configure Monaco global settings
    const monaco = await import('monaco-editor');
    
    // Store the instance for reuse
    monacoInstance = monaco;
    
    return monaco;
  } catch (error) {
    console.error('Failed to load Monaco Editor:', error);
    return null;
  }
}

/**
 * Creates editor options with sensible defaults
 */
export function createDefaultEditorOptions(options: Partial<Monaco.editor.IStandaloneEditorConstructionOptions> = {}): Monaco.editor.IStandaloneEditorConstructionOptions {
  // Get theme dynamically if possible
  let theme = 'vs-light';
  if (typeof window !== 'undefined') {
    // Check if we're in dark mode
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    // or document.documentElement.classList.contains('dark')
    if (isDarkMode) {
      theme = 'vs-dark';
    }
  }

  return {
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: "'Geist Mono', monospace",
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
    },
    theme,
    ...options
  };
}

/**
 * Creates diff editor options with sensible defaults
 */
export function createDefaultDiffEditorOptions(options: Partial<Monaco.editor.IDiffEditorConstructionOptions> = {}): Monaco.editor.IDiffEditorConstructionOptions {
  return {
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderSideBySide: true,
    fontSize: 14,
    fontFamily: "'Geist Mono', monospace",
    lineNumbers: 'on',
    renderOverviewRuler: false,
    ...options
  };
}
