import {
  Wallet,
  CreditCard,
  BadgeDollarSign,
  PiggyBank,
  Landmark,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { useI18n } from '../../utils/i18n';
import { useSettingStore } from '../../stores/useSettingStore';

interface FinancialSummaryGridProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  overallExpenses: number;
  monthlySavings: number;
  overallSavings: number;
  format: (amount: number) => string;
  dateRangeStr: string;
}

export const FinancialSummaryGrid: React.FC<FinancialSummaryGridProps> = ({
  monthlyIncome,
  monthlyExpenses,
  overallExpenses,
  monthlySavings,
  overallSavings,
  format,
  dateRangeStr,
}) => {
  const { t } = useI18n();
  const { hideFinancialBalances, toggleHideFinancialBalances } = useSettingStore();

  return (
    <section aria-label="Financial Snapshot" className="space-y-1.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Financial Snapshot
        </span>
        <button
          type="button"
          onClick={toggleHideFinancialBalances}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors"
          title={hideFinancialBalances ? 'Show Balances' : 'Privacy Mode: Hide Balances'}
        >
          {hideFinancialBalances ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
              <span>Hidden</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Privacy Mode</span>
            </>
          )}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {/* 1. Monthly Income */}
        <FinancialSummaryCard
          title={t('dash.income', 'Income')}
          period={dateRangeStr}
          value={monthlyIncome}
          formattedValue={`+${format(monthlyIncome)}`}
          icon={Wallet}
          contextLine={t('dash.monthlyIncome', 'Earned this month')}
          accent="emerald"
          delay={0}
        />

        {/* 2. Monthly Expenses */}
        <FinancialSummaryCard
          title={t('dash.spent', 'Spent')}
          period={dateRangeStr}
          value={monthlyExpenses}
          formattedValue={`-${format(monthlyExpenses)}`}
          icon={CreditCard}
          contextLine={t('dash.monthlyExpenses', "This month's total")}
          accent="rose"
          delay={30}
        />

        {/* 3. All-Time Spend */}
        <FinancialSummaryCard
          title={t('dash.allTimeSpend', 'All-Time Spend')}
          period="Cumulative"
          value={overallExpenses}
          formattedValue={`-${format(overallExpenses)}`}
          icon={BadgeDollarSign}
          contextLine="All logged expenses"
          accent="rose"
          delay={60}
        />

        {/* 4. Saved This Month */}
        <FinancialSummaryCard
          title={t('dash.saved', 'Saved')}
          period="Net Month"
          value={monthlySavings}
          formattedValue={monthlySavings >= 0 ? `+${format(monthlySavings)}` : format(monthlySavings)}
          icon={PiggyBank}
          contextLine={monthlySavings >= 0 ? 'Monthly surplus' : 'Monthly deficit'}
          accent={monthlySavings >= 0 ? 'teal' : 'rose'}
          delay={90}
        />

        {/* 5. Total Balance */}
        <FinancialSummaryCard
          title={t('dash.totalBalance', 'Total Balance')}
          period="Household Net"
          value={overallSavings}
          formattedValue={overallSavings >= 0 ? `+${format(overallSavings)}` : format(overallSavings)}
          icon={Landmark}
          contextLine="Cumulative net balance"
          accent={overallSavings >= 0 ? 'violet' : 'rose'}
          delay={120}
          isFullWidthOnMobile
        />
      </div>
    </section>
  );
};
