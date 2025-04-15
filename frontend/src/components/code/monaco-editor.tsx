"use client";

import React, { useRef, useEffect, useState } from "react";
import { loadMonaco, createDefaultEditorOptions } from "@/lib/monaco-config";
import type * as Monaco from "monaco-editor";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface MonacoEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  height?: string;
}

const SUPPORTED_LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "json", label: "JSON" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
];

export function MonacoEditor({
  value: initialValue,
  language = "typescript",
  onChange,
  readOnly = false,
  className,
  height = "300px",
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<typeof Monaco | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  // Initialize Monaco
  useEffect(() => {
    // Load Monaco using our singleton utility
    let mounted = true;
    
    const initMonaco = async () => {
      try {
        const monaco = await loadMonaco();
        if (monaco && mounted) {
          setMonacoInstance(monaco);
        }
      } catch (error) {
        console.error("Failed to load Monaco editor:", error);
      }
    };

    initMonaco();

    return () => {
      mounted = false;
    };
  }, []);

  // Effect to create the editor instance once
  useEffect(() => {
    if (monacoInstance && editorRef.current && !monacoEditorRef.current) {
      const editorOptions = createDefaultEditorOptions({
        value: initialValue,
        language: selectedLanguage,
        readOnly,
        theme: isDarkTheme ? "vs-dark" : "vs-light",
        roundedSelection: true,
        automaticLayout: false, // Keep disabled for now
      });

      try {
        const editor = monacoInstance.editor.create(editorRef.current, editorOptions);
        monacoEditorRef.current = editor;

        // Attach listener for changes
        const changeListener = editor.onDidChangeModelContent(() => {
          const currentValue = editor.getValue();
          onChange?.(currentValue);
        });

        // Initial theme set
        monacoInstance.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");

        // Cleanup function for this effect (disposes editor and listener)
        return () => {
          changeListener.dispose();
          if (monacoEditorRef.current) {
             // Defensive cleanup from previous attempts
             const editorToDispose = monacoEditorRef.current;
             monacoEditorRef.current = null; // Clear ref first
             try {
               const model = editorToDispose.getModel();
               if (model && typeof editorToDispose.setModel === 'function') {
                 editorToDispose.setModel(null);
               }
             } catch (modelError) {
               console.error("Error detaching model on final cleanup:", modelError);
             }
             try {
               if (typeof editorToDispose.dispose === 'function') {
                 editorToDispose.dispose();
               }
             } catch (disposeError) {
               console.error("Error disposing editor on final cleanup:", disposeError);
             }
          }
        };
      } catch (error) {
        console.error("Failed to create Monaco editor:", error);
      }
    }
    // Dependencies: only run when monacoInstance is loaded and ref is available
  }, [monacoInstance, onChange]); // onChange added as it's used in listener

  // Effect to update editor value when initialValue prop changes
  useEffect(() => {
    if (monacoEditorRef.current && monacoEditorRef.current.getValue() !== initialValue) {
      // Use pushEditOperations to preserve undo stack if needed, or setValue for simplicity
      monacoEditorRef.current.setValue(initialValue);
    }
  }, [initialValue]);

  // Effect to update editor language when selectedLanguage state changes
  useEffect(() => {
    if (monacoInstance && monacoEditorRef.current) {
      const model = monacoEditorRef.current.getModel();
      if (model && model.getLanguageId() !== selectedLanguage) {
        monacoInstance.editor.setModelLanguage(model, selectedLanguage);
      }
    }
  }, [monacoInstance, selectedLanguage]);

  // Effect to update editor theme when isDarkTheme changes
  useEffect(() => {
    if (monacoInstance && monacoEditorRef.current) {
      monacoInstance.editor.setTheme(isDarkTheme ? "vs-dark" : "vs-light");
    }
  }, [monacoInstance, isDarkTheme]);

  // Effect to update readOnly status
  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.updateOptions({ readOnly: readOnly });
    }
  }, [readOnly]);


  // Handle language change from Select component
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  // Copy code to clipboard
  const copyToClipboard = () => {
    if (monacoEditorRef.current) {
      const code = monacoEditorRef.current.getValue();
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className={cn("border border-border overflow-hidden", className)}>
      <div className="flex items-center justify-between bg-accent p-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <FileIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-7 w-[130px] text-xs border-0 bg-transparent">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div 
        ref={editorRef}
        style={{ height }}
        className="w-full"
      />
    </Card>
  );
}

export default MonacoEditor;
