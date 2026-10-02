import React, { useState } from 'react';
import { 
  Info, 
  ShieldCheck, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  ExternalLink, 
  Layers, 
  Check, 
  Heart,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SettingsSection } from '../primitives/SettingsSection';

export const AboutSettings: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const appVersion = 'v1.2.0-prod';
  const buildDate = 'October 2026';
  const environment = 'Production (Edge & Multi-Tenant)';

  const handleCopyDiagnostics = () => {
    const diagnosticInfo = `HomeMind Version: ${appVersion}\nEnvironment: ${environment}\nBuild: ${buildDate}\nAgent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}`;
    navigator.clipboard.writeText(diagnosticInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Brand & Overview */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center relative overflow-hidden">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">HomeMind AI</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          The intelligent household operating system. Seamless financial telemetry, automated inventory oversight, and proactive family coordination.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {appVersion}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {environment}
          </span>
        </div>
      </div>

      {/* System Specifications */}
      <SettingsSection
        title="Software Specifications"
        description="Core build and environment metadata for diagnostics"
        action={
          <button
            type="button"
            onClick={handleCopyDiagnostics}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Diagnostics'}
          </button>
        }
      >
        <div className="divide-y divide-slate-800/80 text-xs">
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-400">Release Channel</span>
            <span className="font-semibold text-white">Stable Production</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-400">Build Timestamp</span>
            <span className="font-mono text-slate-300">{buildDate}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-400">Client Runtime</span>
            <span className="text-slate-300">Vite React + Capacitor Core</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-400">Data Architecture</span>
            <span className="text-emerald-400 font-medium">Tenant Isolated Outbox & Redis Tier</span>
          </div>
        </div>
      </SettingsSection>

      {/* Legal & Documentation */}
      <SettingsSection
        title="Legal & Support Resources"
        description="Product documentation, compliance policies, and customer assistance"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Link
            to="/manual"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">User Manual & Guides</h4>
                <p className="text-xs text-slate-400">Interactive walkthroughs</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
          </Link>

          <a
            href="https://github.com/Kridha24/HomeMind-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Support & Feedback</h4>
                <p className="text-xs text-slate-400">Issue tracking and feature requests</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
          </a>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Privacy Policy</h4>
                <p className="text-xs text-slate-400">Zero data selling & encryption</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Compliant</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Terms of Service</h4>
                <p className="text-xs text-slate-400">Household license terms</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Active</span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};
