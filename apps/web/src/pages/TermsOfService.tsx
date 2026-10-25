import React from 'react';
import { FileText, ShieldAlert, Users, Scale, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-primary py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to HomeMind.AI</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <Scale className="w-4 h-4" />
            <span>Platform Agreement & License</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-muted">
            Last Updated: October 2026 • Version 1.0 (Review Draft)
          </p>
        </div>

        {/* Review Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Review Notice for Platform Operator:</p>
            <p>
              These Terms of Service govern user access to the HomeMind.AI application. Specific business terms,
              subscription tiers, and jurisdiction placeholders ([TODO — OWNER INPUT REQUIRED]) must be ratified
              by legal counsel prior to commercial launch.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-sm leading-relaxed text-secondary">
          {/* 1. Acceptance */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or creating an account on HomeMind.AI ("the Service"), operated by{' '}
              <strong>[TODO — OWNER INPUT REQUIRED: Legal Entity Name]</strong> ("Company", "we", "us"), you agree
              to be bound by these Terms of Service. If you do not agree to these terms, do not access the Service.
            </p>
          </section>

          {/* 2. Collaborative Family Workspace */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              2. Household Workspaces & Member Conduct
            </h2>
            <p>
              HomeMind.AI is designed for household coordination. Each household is administered by designated
              Owners and Administrators:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted pl-2">
              <li>
                <strong>Invite Codes:</strong> You are responsible for safeguarding household invite codes. Do not share
                invite codes publicly.
              </li>
              <li>
                <strong>Shared Responsibility:</strong> Data added to shared areas (expenses, groceries, tasks) will be visible
                to authorized household members according to configured roles.
              </li>
              <li>
                <strong>Acceptable Use:</strong> You agree not to upload malicious software, engage in automated scraping,
                or attempt unauthorized access to other households.
              </li>
            </ul>
          </section>

          {/* 3. Financial & Advisory Disclaimer */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              3. Financial Information Disclaimer
            </h2>
            <p>
              HomeMind.AI provides software tools for personal budgeting, expense aggregation, and bill tracking.
              HomeMind.AI is <strong>NOT</strong> a bank, financial institution, registered investment advisor, or tax authority.
              All financial entries and AI assistant summaries are for informational purposes only.
            </p>
          </section>

          {/* 4. Limitation of Liability */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              4. Service Availability & Limitation of Liability
            </h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted by applicable
              law, the Company disclaims all warranties, express or implied. The Company shall not be liable for any indirect,
              incidental, consequential, or punitive damages resulting from your use of the Service.
            </p>
          </section>

          {/* 5. Governing Law */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              5. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of{' '}
              <strong>[TODO — OWNER INPUT REQUIRED: State / Country, e.g., India]</strong>, without regard to its conflict
              of law provisions. Any dispute arising out of or relating to these terms shall be subject to the exclusive
              jurisdiction of the courts located in <strong>[TODO — OWNER INPUT REQUIRED: City, State]</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
