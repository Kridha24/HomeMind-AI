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
  Globe,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SettingsCard } from '../primitives/SettingsCard';
import { SettingsStatusBadge } from '../primitives/SettingsStatusBadge';

export const AboutSettings: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const appVersion = 'v1.2.0-prod';
  const buildDate = 'October 2026';
  const environment = 'Production Multi-Tenant';

  const handleCopyDiagnostics = () => {
    const diagnosticInfo = `HomeMind.AI Version: ${appVersion}\nEnvironment: ${environment}\nBuild: ${buildDate}\nAgent: ${
      typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    }`;
    navigator.clipboard.writeText(diagnosticInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Brand & Overview Hero */}
      <div className="p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center relative overflow-hidden shadow-2xs">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 mb-3 shadow-sm">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          HomeMind.AI
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
          The intelligent household operating system. Seamless financial telemetry, automated inventory oversight, and proactive family coordination.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <SettingsStatusBadge label={appVersion} variant="admin" />
          <SettingsStatusBadge label={environment} variant="active" />
        </div>
      </div>

      {/* Software Specifications */}
      <SettingsCard
        id="software-specs"
        title="Software Specifications"
        description="Core build and environment metadata for system diagnostics."
        action={
          <button
            type="button"
            onClick={handleCopyDiagnostics}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy Diagnostics'}</span>
          </button>
        }
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Release Channel</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">Stable Production</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Build Timestamp</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{buildDate}</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Client Runtime</span>
            <span className="text-slate-700 dark:text-slate-300">Vite React + Capacitor Core</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Data Architecture</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Tenant-Isolated Outbox & Redis Tier
            </span>
          </div>
        </div>
      </SettingsCard>

      {/* Legal & Documentation */}
      <SettingsCard
        id="legal-docs"
        title="Legal & Support Resources"
        description="Documentation, compliance policies, and customer assistance channels."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Link
            to="/manual"
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  User Manual & Guides
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Interactive household walkthroughs
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </Link>

          <a
            href="https://github.com/Kridha24/HomeMind-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Support & Feedback
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  GitHub repository & issue tracking
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </a>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Privacy Policy
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Zero data selling & on-device encryption
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Compliant
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Terms of Service
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Household operating license
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active
            </span>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};

export default AboutSettings;
