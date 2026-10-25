import React from 'react';
import { ShieldCheck, Lock, Eye, Trash2, Smartphone, FileText, Bell, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
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
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy & Personal Data Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted">
            Last Updated: October 2026 • Version 1.0 (Review Draft)
          </p>
        </div>

        {/* Legal Disclaimer Alert */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Review Notice for Platform Operator:</p>
            <p>
              This Privacy Policy reflects the actual technical architecture, database models, and personal data flows
              implemented in HomeMind.AI. Specific legal entity placeholders ([TODO — OWNER INPUT REQUIRED]) must be
              populated and reviewed by qualified privacy counsel before commercial launch.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-sm leading-relaxed text-secondary">
          {/* 1. Entity Information */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              1. Platform Operator & Data Controller
            </h2>
            <p>
              HomeMind.AI is operated by <strong>[TODO — OWNER INPUT REQUIRED: Legal Entity Name]</strong> ("we", "us", or "our"),
              with its principal place of business at <strong>[TODO — OWNER INPUT REQUIRED: Business Address]</strong>.
            </p>
            <p>
              Contact Email: <strong>[TODO — OWNER INPUT REQUIRED: privacy@homemind.ai]</strong>
            </p>
            <p>
              Grievance Officer: <strong>[TODO — OWNER INPUT REQUIRED: Name and Designation of Grievance Officer, Address, Email]</strong>
            </p>
          </section>

          {/* 2. Personal Data We Collect */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              2. Personal Data Collected & Processed
            </h2>
            <p>
              We collect only data necessary to operate a collaborative household management platform. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-muted pl-2">
              <li>
                <strong className="text-primary">Identity & Authentication:</strong> Name, email address, mobile phone number,
                age (optional), profile avatar, and verified Google OAuth identifiers or cryptographic OTP verification records.
              </li>
              <li>
                <strong className="text-primary">Household Membership:</strong> Residence name, invite codes, and your role
                (Owner, Co-Owner, Admin, Member, or Guest).
              </li>
              <li>
                <strong className="text-primary">Financial Information:</strong> User-recorded shared expenses, income entries,
                and recurring bills. Note: We do not store raw credit card numbers or bank credentials.
              </li>
              <li>
                <strong className="text-primary">Chores, Pantry & Household Assets:</strong> Household tasks, grocery inventory,
                appliance purchase/service logs, and medicine reminder schedules.
              </li>
              <li>
                <strong className="text-primary">Device & Push Tokens:</strong> Push registration tokens, browser type, and operating
                system metadata for users who explicitly enable push notifications on desktop or mobile devices.
              </li>
              <li>
                <strong className="text-primary">Encrypted Family Messaging:</strong> Direct and household messages are transmitted
                with client-side End-to-End Encryption (E2EE). Our servers store only ciphertext and public keys, with zero access
                to message plaintext.
              </li>
            </ul>
          </section>

          {/* 3. Household Sharing and Visibility Controls */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              3. Household Data Isolation & Role Visibility
            </h2>
            <p>
              HomeMind.AI enforces strict tenant isolation on the server. Data belonging to your household is cryptographically
              and logically isolated from other households using server-side authorization:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted pl-2">
              <li>
                <strong>Owners & Co-Owners:</strong> Manage settings, household invitations, roles, and aggregate financial recaps.
              </li>
              <li>
                <strong>Members:</strong> Have full access to shared tasks, pantry items, appliances, and their own personal records.
              </li>
              <li>
                <strong>Leaving / Removal:</strong> When a user leaves or is removed from a household, their access is revoked
                immediately on the server, and their active session credentials are cycle-invalidated.
              </li>
            </ul>
          </section>

          {/* 4. Push Notifications & Lock-Screen Privacy */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              4. Push Notifications & Lock-Screen Privacy
            </h2>
            <p>
              Notifications can appear on shared screens or lock screens. Accordingly:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted pl-2">
              <li>Notifications never contain passwords, OTPs, financial account balances, or secret keys.</li>
              <li>Push notifications require explicit opt-in per device. You can manage or disable individual devices in Settings.</li>
              <li>Category preferences (Finance, Bills, Tasks, Groceries, Family, Security) allow granular control over alerts.</li>
            </ul>
          </section>

          {/* 5. Account Deletion & Data Retention */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              5. Account Deletion & Right to Erasure
            </h2>
            <p>
              You can permanently delete your account at any time via <strong>Settings &gt; Profile &gt; Delete Account</strong>.
              Upon confirmation:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted pl-2">
              <li>All active sessions, refresh tokens, and authentication cookies are permanently revoked.</li>
              <li>All registered push notification device tokens are deactivated.</li>
              <li>All cryptographic E2EE device identity keys are revoked.</li>
              <li>Your personal AI memory profile is permanently deleted.</li>
              <li>Your user account record is anonymized and personal identifiers (name, email, phone) are cleared.</li>
            </ul>
          </section>

          {/* 6. Legal & Grievance Contact */}
          <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-purple-400" />
              6. Grievance Redressal & Inquiries
            </h2>
            <p>
              For privacy requests, data export requests, or security concerns, contact our designated Grievance Officer:
            </p>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1">
              <div>Name: [TODO — OWNER INPUT REQUIRED: Grievance Officer Name]</div>
              <div>Email: [TODO — OWNER INPUT REQUIRED: grievance@homemind.ai]</div>
              <div>Response Time: Grievances are acknowledged within 48 hours and resolved within 30 days.</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
