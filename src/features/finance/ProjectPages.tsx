import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Calendar } from "lucide-react";
import { format } from "date-fns";
import api from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import CreateProjectForm from "./forms/CreateProjectForm";
import type { Project } from "../../types/finance.types";

function fmtCurrency(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e", completed: "#DAA520", paused: "#f59e0b", cancelled: "#ef4444",
};

function ProjectCard({ project }: { project: Project }) {
  const s = STATUS_COLORS[project.status] || "#888";
  const progressColor = project.progressPercent >= 100 ? "#22c55e"
    : project.progressPercent >= 60 ? "#DAA520" : "#3b82f6";

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200 cursor-pointer"
      style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(218,165,32,0.1)", color: "#DAA520" }}>
              {project.code}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: `${s}15`, color: s, border: `1px solid ${s}30` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s }} />
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
          <h3 className="font-semibold text-text-primary">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>
        {project.isPublic && (
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}>
            Public
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Raised</span>
          <span className="font-semibold" style={{ color: progressColor }}>{project.progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-bg-hover overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(project.progressPercent, 100)}%`, background: progressColor }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400 text-sm font-semibold">
            {fmtCurrency(project.raisedAmount, project.currency)}
          </span>
          <span className="text-text-muted text-xs">
            of {fmtCurrency(project.targetAmount, project.currency)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2 border-t border-bg-border/50">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Calendar size={11} />
          {project.startDate ? format(new Date(project.startDate), "MMM yyyy") : "—"}
          {project.endDate ? ` → ${format(new Date(project.endDate), "MMM yyyy")}` : ""}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-lg bg-bg-hover text-text-muted capitalize">
          {project.category.replace(/_/g, " ")}
        </span>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", statusFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (statusFilter) p.set("status", statusFilter);
      const res = await api.get(`/finance/projects?${p}`);
      return res.data.data as Project[];
    },
  });

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .proj-card { animation: slideUp 0.3s ease both; }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Projects & Funds</h1>
          <p className="text-text-muted text-sm mt-0.5">{projects?.length ?? 0} designated fund{projects?.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All Status</option>
          {["active","completed","paused","cancelled"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {isLoading ? <PageLoader /> : projects?.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No projects yet"
          description="Create your first fund project"
          action={<button onClick={() => setShowAdd(true)} className="btn-gold">New Project</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects?.map((p, i) => (
            <div key={p._id} className="proj-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create Project / Fund" size="lg">
        <CreateProjectForm
          onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ["projects"] }); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  );
}