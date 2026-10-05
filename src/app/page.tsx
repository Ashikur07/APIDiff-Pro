"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  ArrowLeftRight,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Loader2,
  FileCode2,
} from "lucide-react";
import { DiffEditor } from "@/components/DiffEditor";
import { DiffSummary } from "@/components/DiffSummary";
import { VisualTree } from "@/components/VisualTree";
import { validateJSON, deepDiff, DiffResult } from "@/lib/diffEngine";
import { SAMPLE_CASES } from "@/lib/sampleData";

export default function Home() {
  // Payloads (Start empty by default as requested)
  const [devInput, setDevInput] = useState<string>("");
  const [stageInput, setStageInput] = useState<string>("");

  // Configuration
  const [ignoreArrayOrder, setIgnoreArrayOrder] = useState<boolean>(true);
  const [endpointName, setEndpointName] = useState<string>("API Response Diff");

  // Comparison State
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [hasCompared, setHasCompared] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // When either input changes, immediately clear results so stale data disappears
  const handleDevInputChange = (val: string) => {
    setDevInput(val);
    setDiffResult(null);
    setHasCompared(false);
  };

  const handleStageInputChange = (val: string) => {
    setStageInput(val);
    setDiffResult(null);
    setHasCompared(false);
  };

  // Comparison execution with smooth circular spinner loading
  const handleCompare = useCallback(() => {
    if (!devInput.trim() || !stageInput.trim()) {
      setDiffResult(null);
      setHasCompared(false);
      return;
    }

    const devValidation = validateJSON(devInput);
    const stageValidation = validateJSON(stageInput);

    if (!devValidation.isValid || !stageValidation.isValid) {
      setHasCompared(true);
      setDiffResult(null);
      return;
    }

    setIsComparing(true);
    setHasCompared(false);

    // 800ms smooth circular loading animation before showing results
    setTimeout(() => {
      const result = deepDiff(devValidation.parsed, stageValidation.parsed, {
        ignoreArrayOrder,
      });

      setDiffResult(result);
      setHasCompared(true);
      setIsComparing(false);

      if (result.isMatch) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#10b981", "#3b82f6", "#14b8a6"],
          });
        } catch {}
      }
    }, 800);
  }, [devInput, stageInput, ignoreArrayOrder]);

  // Load sample case (loads data cleanly and lets user click Compare or auto compare with spinner)
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_CASES.find((s) => s.id === sampleId);
    if (!sample) return;

    setDevInput(JSON.stringify(sample.dev, null, 2));
    setStageInput(JSON.stringify(sample.stage, null, 2));
    setEndpointName(sample.name);
    setDiffResult(null);
    setHasCompared(false);
  };

  // Swap
  const handleSwap = () => {
    const temp = devInput;
    setDevInput(stageInput);
    setStageInput(temp);
    setDiffResult(null);
    setHasCompared(false);
  };

  // Format both
  const handleFormatBoth = () => {
    try {
      if (devInput.trim()) {
        setDevInput(JSON.stringify(JSON.parse(devInput), null, 2));
      }
    } catch {}
    try {
      if (stageInput.trim()) {
        setStageInput(JSON.stringify(JSON.parse(stageInput), null, 2));
      }
    } catch {}
  };

  // Clear all (resets everything cleanly)
  const handleClearAll = () => {
    setDevInput("");
    setStageInput("");
    setDiffResult(null);
    setHasCompared(false);
    setIsComparing(false);
  };

  // Keyboard shortcut Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleCompare();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCompare]);

  const devValidation = validateJSON(devInput);
  const stageValidation = validateJSON(stageInput);
  const hasBothInputs = devInput.trim().length > 0 && stageInput.trim().length > 0;
  const canCompare = hasBothInputs && devValidation.isValid && stageValidation.isValid;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Simple, Minimal Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg text-white font-bold shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                API Response Diff Checker
              </h1>
              <p className="text-xs text-slate-500">
                Compare Dev vs Stage responses & copy notes for Google Sheets QA tracking
              </p>
            </div>
          </div>

          {/* Quick Samples (Loads into boxes without forcing results) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1">Load Sample:</span>
            <button
              onClick={() => handleLoadSample("etds_tax_return")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors border border-slate-200"
            >
              Tax Return
            </button>
            <button
              onClick={() => handleLoadSample("etds_challan_verification")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors border border-slate-200"
            >
              Challan Leak
            </button>
            <button
              onClick={() => handleLoadSample("perfect_match")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors border border-slate-200"
            >
              100% Match
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Lightweight Controls Bar */}
        <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Ignore Array Ordering Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={ignoreArrayOrder}
              onChange={(e) => {
                setIgnoreArrayOrder(e.target.checked);
                if (hasCompared) setTimeout(handleCompare, 40);
              }}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span>Ignore Array Ordering</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-normal">
              ON
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleFormatBoth}
              disabled={!devInput.trim() && !stageInput.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              title="Prettify both payloads"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Format Both</span>
            </button>

            <button
              onClick={handleSwap}
              disabled={!devInput.trim() && !stageInput.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              title="Swap Dev and Stage"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Swap</span>
            </button>

            {(devInput || stageInput) && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors"
                title="Clear all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            {/* Compare Now Button with Loading Spinner */}
            <button
              onClick={handleCompare}
              disabled={!canCompare || isComparing}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all min-w-[125px] justify-center"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Compare Now</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Dual-Column Payload Editors */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DiffEditor
            title="Dev Environment Response"
            badgeText="DEV"
            badgeType="dev"
            value={devInput}
            onChange={handleDevInputChange}
            placeholder="Paste Dev API JSON response here..."
          />

          <DiffEditor
            title="Stage Environment Response"
            badgeText="STAGE"
            badgeType="stage"
            value={stageInput}
            onChange={handleStageInputChange}
            placeholder="Paste Stage API JSON response here..."
          />
        </section>

        {/* Loading Indicator Section */}
        {isComparing && (
          <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 animate-in fade-in duration-150">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold text-slate-600">
              Comparing API responses & analyzing deep structure...
            </p>
          </div>
        )}

        {/* Results Section (Only rendered after comparing and when diffResult exists) */}
        {!isComparing && hasCompared && diffResult && (
          <section className="space-y-4 pt-1 animate-in fade-in duration-200">
            {/* Status & Copyable QA Sheet Box */}
            <DiffSummary
              result={diffResult}
              endpointName={endpointName}
              onEndpointNameChange={setEndpointName}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />

            {/* Detailed Field Differences */}
            {diffResult.totalDifferences > 0 && (
              <VisualTree result={diffResult} />
            )}
          </section>
        )}

        {/* Validation Alert (Only shown if user pressed compare with actual invalid JSON syntax, NOT when empty) */}
        {!isComparing &&
          hasCompared &&
          hasBothInputs &&
          (!devValidation.isValid || !stageValidation.isValid) && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <p className="font-bold">Invalid JSON Syntax:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {!devValidation.isValid && devInput.trim() && (
                  <li>Dev Payload: {devValidation.error}</li>
                )}
                {!stageValidation.isValid && stageInput.trim() && (
                  <li>Stage Payload: {stageValidation.error}</li>
                )}
              </ul>
            </div>
          )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>API Response Diff Checker • QA Defect Reporting Tool</span>
          <span className="text-slate-400">100% Client-Side • Fast & Secure</span>
        </div>
      </footer>
    </div>
  );
}
