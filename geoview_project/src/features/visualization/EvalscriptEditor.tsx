"use client";
/**
 * EvalscriptEditor — simple code editor for custom evalscripts.
 * Uses a plain <textarea> styled as a code editor.
 * A full integration could use CodeMirror or Monaco.
 */
import { useState, useRef } from "react";
import { Copy, RotateCcw, Check } from "lucide-react";
import { useAppStore } from "@/lib/store/appStore";
import { EVALSCRIPTS } from "@/features/visualization/constants/evalscripts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEMPLATE = EVALSCRIPTS["true-color"];

export default function EvalscriptEditor() {
  const { customEvalscript, setCustomEvalscript } = useAppStore();
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const value = customEvalscript || TEMPLATE;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    setCustomEvalscript(TEMPLATE);
  };

  // Handle tab key inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = value.slice(0, start) + "  " + value.slice(end);
      setCustomEvalscript(newVal);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-secondary">Custom Evalscript</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleCopy} title="Copy">
            {copied ? <Check className="h-3 w-3 text-accent-green" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleReset} title="Reset to template">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="relative rounded-md border border-panel-border overflow-hidden">
        {/* Line numbers strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 bg-surface border-r border-panel-border select-none pointer-events-none"
          aria-hidden
        >
          {value.split("\n").map((_, i) => (
            <div key={i} className="px-1 text-right text-[10px] font-mono text-text-muted leading-5">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setCustomEvalscript(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className={cn(
            "w-full min-h-48 pl-9 pr-3 py-2 font-mono text-[11px] leading-5",
            "bg-surface text-text-primary resize-none",
            "focus:outline-none focus:ring-1 focus:ring-accent-cyan/20",
            "placeholder:text-text-muted"
          )}
        />
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed">
        JavaScript (Sentinel Hub Evalscript v3). Changes apply to the WMS preview.{" "}
        <a
          href="https://docs.sentinel-hub.com/api/latest/evalscript/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-cyan/70 hover:text-accent-cyan transition-colors underline underline-offset-2"
        >
          Docs ↗
        </a>
      </p>
    </div>
  );
}
