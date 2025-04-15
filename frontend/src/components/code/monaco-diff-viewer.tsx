"use client";

import React, { useRef, useEffect, useState } from "react";
import { loadMonaco, createDefaultDiffEditorOptions } from "@/lib/monaco-config";
import type * as Monaco from "monaco-editor";
import { Card } from "@/components/ui/card";
import { FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export interface MonacoDiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  language?: string;
  className?: string;
  height?: string;
  filename?: string;
}

export function MonacoDiffViewer({
  originalCode,
  modifiedCode,
  language = "typescript",
  className,
  height = "400px",
  filename = "Code Comparison",
}: MonacoDiffViewerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [monacoInstance, setMonacoInstance] = useState<typeof Monaco | null>(null);
  const [diffEditor, setDiffEditor] = useState<Monaco.editor.IStandaloneDiffEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  
  // Models refs to properly handle cleanup
  const originalModelRef = useRef<Monaco.editor.ITextModel | null>(null);
  const modifiedModelRef = useRef<Monaco.editor.ITextModel | null>(null);

  // Handle client-side only code
  useEffect(() => {
    setIsMounted(true);
    
    // Load Monaco singleton instance
    const initMonaco = async () => {
      try {
        const monaco = await loadMonaco();
        if (monaco) {
          setMonacoInstance(monaco);
        }
      } catch (err) {
        console.error("Failed to load Monaco:", err);
      }
    };
    
    initMonaco();
    
    // Cleanup on unmount
    return () => {
      // Cleanup models first
      if (originalModelRef.current) {
        originalModelRef.current.dispose();
        originalModelRef.current = null;
      }
      
      if (modifiedModelRef.current) {
        modifiedModelRef.current.dispose();
        modifiedModelRef.current = null;
      }
      
      // Then cleanup editor
      if (diffEditor) {
        diffEditor.dispose();
      }
    };
  }, []);

  // Set up Monaco diff editor when Monaco is loaded or props change
  useEffect(() => {
    if (!monacoInstance || !containerRef.current || !isMounted) return;
    
    // Create a variable to track if this effect instance is still active
    let isEffectActive = true;
    let localDiffEditor: Monaco.editor.IStandaloneDiffEditor | null = null;
    
    const setupDiffEditor = async () => {
      try {
        // Clean up previous models and editor instance if they exist
        if (originalModelRef.current) {
          originalModelRef.current.dispose();
          originalModelRef.current = null;
        }
        
        if (modifiedModelRef.current) {
          modifiedModelRef.current.dispose();
          modifiedModelRef.current = null;
        }
        
        if (diffEditor) {
          diffEditor.dispose();
        }
        
        // Double check container ref exists
        if (!containerRef.current || !isEffectActive) return;
        
        // Create models for original and modified code
        originalModelRef.current = monacoInstance.editor.createModel(originalCode, language);
        modifiedModelRef.current = monacoInstance.editor.createModel(modifiedCode, language);
        
        // Create options using our utility function
        const options = createDefaultDiffEditorOptions({
          readOnly: true,
          contextmenu: false,
          diffWordWrap: 'off',
          guides: {
            indentation: true
          }
        });
        
        // Create diff editor
        localDiffEditor = monacoInstance.editor.createDiffEditor(containerRef.current, options);
        
        // Check if effect is still active
        if (!isEffectActive) {
          if (localDiffEditor) localDiffEditor.dispose();
          if (originalModelRef.current) {
            originalModelRef.current.dispose();
            originalModelRef.current = null;
          }
          if (modifiedModelRef.current) {
            modifiedModelRef.current.dispose();
            modifiedModelRef.current = null;
          }
          return;
        }
        
        // Set the models
        localDiffEditor.setModel({
          original: originalModelRef.current,
          modified: modifiedModelRef.current,
        });
        
        // Update state
        if (isEffectActive) {
          setDiffEditor(localDiffEditor);
        }
      } catch (err) {
        console.error("Error creating Monaco diff editor:", err);
      }
    };
    
    setupDiffEditor();
    
    // Clean up function
    return () => {
      isEffectActive = false;
      
      // Use setTimeout to avoid race conditions
      setTimeout(() => {
        try {
          if (originalModelRef.current) {
            originalModelRef.current.dispose();
            originalModelRef.current = null;
          }
          
          if (modifiedModelRef.current) {
            modifiedModelRef.current.dispose();
            modifiedModelRef.current = null;
          }
          
          if (diffEditor) {
            diffEditor.dispose();
          }
        } catch (e) {
          console.error("Error during diff editor cleanup:", e);
        }
      }, 0);
    };
  }, [monacoInstance, isMounted, originalCode, modifiedCode, language, isDarkTheme, diffEditor]);

  // Update theme when it changes
  useEffect(() => {
    if (monacoInstance?.editor) {
      monacoInstance.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");
    }
  }, [isDarkTheme, monacoInstance]);

  // If we're in SSR or haven't loaded Monaco yet, return a placeholder
  if (!isMounted) {
    return (
      <Card className={cn("border border-border overflow-hidden", className)}>
        <div className="flex items-center justify-between bg-accent p-2 border-b border-border">
          <div className="flex items-center space-x-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{filename}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-muted-foreground">Original</span>
            <span className="text-xs text-muted-foreground">Modified</span>
          </div>
        </div>
        <div style={{ height }} className="w-full bg-muted/20 flex">
          <div className="flex-1 p-4 border-r border-border">
            <pre className="text-xs opacity-50 font-mono">
              {originalCode.substring(0, 100)}
              {originalCode.length > 100 ? '...' : ''}
            </pre>
          </div>
          <div className="flex-1 p-4">
            <pre className="text-xs opacity-50 font-mono">
              {modifiedCode.substring(0, 100)}
              {modifiedCode.length > 100 ? '...' : ''}
            </pre>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("border border-border overflow-hidden", className)}>
      <div className="flex items-center justify-between bg-accent p-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <FileIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{filename}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-muted-foreground">Original</span>
          <span className="text-xs text-muted-foreground">Modified</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        style={{ height }}
        className="w-full"
      />
    </Card>
  );
}

export default MonacoDiffViewer;
