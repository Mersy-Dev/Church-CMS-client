import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, DollarSign, Target,
  Clock, Layers, ArrowRight, Plus, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import api from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import type { FinanceDashboard, Contribution } from "../../types/finance.types";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function fmt(date?: string) {
  if (!date) return "—";
  try { return format(new Date(date), "dd MMM yyyy"); } catch { return "—"; }
}

const TYPE_LABELS: Record<string, string> = {
  tithe: "Tithe", sunday_offering: "Sunday Offering",
  midweek_offering: "Midweek Offering", special_donation: "Special Donation",
  building_fund: "Building Fund", partnership: "Partnership",
  covenant_seed: "Covenant Seed", pledge_payment: "Pledge Payment",
  project_fund: "Project Fund", missions: "Missions",
  benevolence: "Benevolence", thanksgiving: "Thanksgiving",
  first_fruit: "First Fruit", other: "Other",
};

const CHANNEL_COLORS: Record<string, string> = {
  cash: "#22c55e", bank_transfer: "#3b82f6", card: "#8b5cf6",
  mobile_money: "#f59e0b", paystack: "#06b6d4", ussd: "#ec4899",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, accent, trend,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary font-display">{value}</p>
        {sub && (
          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
            {trend === "up" && <TrendingUp size={11} className="text-emerald-400" />}
            {trend === "down" && <TrendingDown size={11} className="text-red-400" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Recent Contribution Row ───────────────────────────────────────────────────
function RecentRow({ c }: { c: Contribution }) {
  const donorName = c.memberId
    ? `${c.memberId.firstName} ${c.memberId.lastName}`
    : c.isAnonymous ? "Anonymous" : c.donorName || "Guest Donor";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-bg-border/50 last:border-0 group">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: "rgba(218,165,32,0.12)", color: "#DAA520" }}
      >
        {donorName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{donorName}</p>
        <p className="text-xs text-text-muted">{TYPE_LABELS[c.contributionType] || c.contributionType}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-emerald-400">{fmtCurrency(c.amount, c.currency)}</p>
        <p className="text-xs text-text-muted">{fmt(c.createdAt)}</p>
      </div>
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: CHANNEL_COLORS[c.paymentChannel] || "#888" }}
        title={c.paymentChannel}
      />
    </div>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
function QuickAction({
  label, desc, icon: Icon, color, onClick,
}: {
  label: string; desc: string; icon: React.ElementType; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-4 text-left flex items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 w-full group"
      style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={14} className="text-text-muted mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const navigate = useNavigate();

  const { data: dash, isLoading } = useQuery<FinanceDashboard>({
    queryKey: ["finance-dashboard"],
    queryFn: async () => {
      const res = await api.get("/finance/dashboard");
      return res.data.data;
    },
  });

  if (isLoading) return <PageLoader />;

  const net = dash?.netThisMonth ?? 0;

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fin-card { animation: slideUp 0.3s ease both; }
        .fin-card:nth-child(1) { animation-delay: 0.05s; }
        .fin-card:nth-child(2) { animation-delay: 0.10s; }
        .fin-card:nth-child(3) { animation-delay: 0.15s; }
        .fin-card:nth-child(4) { animation-delay: 0.20s; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Finance & Giving</h1>
          <p className="text-text-muted text-sm mt-0.5">Module 05 — Financial Overview</p>
        </div>
        <button
          onClick={() => navigate("/finance/contributions/new")}
          className="btn-gold flex items-center gap-2"
        >
          <Plus size={16} /> Record Giving
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fin-card">
          <StatCard
            label="Income This Month" icon={TrendingUp} accent="#22c55e"
            value={fmtCurrency(dash?.monthlyIncome ?? 0)}
            sub="Successful contributions" trend="up"
          />
        </div>
        <div className="fin-card">
          <StatCard
            label="Expenses This Month" icon={TrendingDown} accent="#ef4444"
            value={fmtCurrency(dash?.monthlyExpenses ?? 0)}
            sub={`${dash?.pendingExpenses ?? 0} pending approval`} trend="down"
          />
        </div>
        <div className="fin-card">
          <StatCard
            label="Net Balance" icon={DollarSign} accent={net >= 0 ? "#DAA520" : "#ef4444"}
            value={fmtCurrency(Math.abs(net))}
            sub={net >= 0 ? "Surplus this month" : "Deficit this month"}
            trend={net >= 0 ? "up" : "down"}
          />
        </div>
        <div className="fin-card">
          <StatCard
            label="Year-to-Date" icon={Target} accent="#8b5cf6"
            value={fmtCurrency(dash?.yearlyIncome ?? 0)}
            sub={`${dash?.activeProjects ?? 0} active projects`}
          />
        </div>
      </div>

      {/* Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Contributions */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Recent Giving</h2>
            <button
              onClick={() => navigate("/finance/contributions")}
              className="text-xs text-gold hover:opacity-80 flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </button>
          </div>
          {(dash?.recentContributions ?? []).length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">No contributions yet</p>
          ) : (
            <div>
              {(dash?.recentContributions ?? []).map((c) => (
                <RecentRow key={c._id} c={c} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + Badges */}
        <div className="space-y-4">
          {/* Badges */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Active Pledges",  value: dash?.activePledges  ?? 0, color: "#DAA520",  onClick: () => navigate("/finance/pledges") },
              { label: "Active Projects", value: dash?.activeProjects ?? 0, color: "#8b5cf6",  onClick: () => navigate("/finance/projects") },
              { label: "Pending Expenses",value: dash?.pendingExpenses?? 0, color: "#ef4444",  onClick: () => navigate("/finance/expenses") },
              { label: "This Month Txns", value: dash?.recentContributions?.length ?? 0, color: "#22c55e", onClick: () => navigate("/finance/contributions") },
            ].map((b) => (
              <button
                key={b.label}
                onClick={b.onClick}
                className="rounded-xl p-3 text-left hover:-translate-y-0.5 transition-transform"
                style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}
              >
                <p className="text-xl font-bold font-display" style={{ color: b.color }}>{b.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{b.label}</p>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}
          >
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Quick Actions</p>
            <QuickAction
              label="Record Giving" desc="Cash, transfer, cheque"
              icon={Plus} color="#DAA520"
              onClick={() => navigate("/finance/contributions/new")}
            />
            <QuickAction
              label="Online Giving" desc="Paystack payment link"
              icon={Layers} color="#06b6d4"
              onClick={() => navigate("/finance/giving/online")}
            />
            <QuickAction
              label="New Pledge" desc="Commitment + schedule"
              icon={Target} color="#8b5cf6"
              onClick={() => navigate("/finance/pledges/new")}
            />
            <QuickAction
              label="Submit Expense" desc="For approval workflow"
              icon={TrendingDown} color="#ef4444"
              onClick={() => navigate("/finance/expenses/new")}
            />
            <QuickAction
              label="View Reports" desc="Monthly & yearly"
              icon={TrendingUp} color="#22c55e"
              onClick={() => navigate("/finance/reports")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}