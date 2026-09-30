import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pin, Trash2, Pencil, Eye, Clock } from "lucide-react";
import { format, isAfter } from "date-fns";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import api from "../../../lib/api";
import Modal from "../../../components/ui/Modal";
import { PageLoader } from "../../../components/ui/Spinner";
import EmptyState from "../../../components/ui/EmptyState";
import type { Announcement, AnnouncementFormData, AnnouncementAudience } from "../../../types/communication.types";
import type { Department } from "../../../types";

const AUDIENCES: { value: AnnouncementAudience; label: string }[] = [
  { value: "all",        label: "Everyone"    },
  { value: "department", label: "Department"  },
  { value: "workers",    label: "Workers Only"},
  { value: "custom",     label: "Custom"      },
];

// ── Announcement Form ──────────────────────────────────────────────────────────

function AnnouncementForm({ initial, onSuccess, onCancel }: {
  initial?: Announcement; onSuccess: () => void; onCancel: () => void;
}) {
  const [selectedDepts, setSelectedDepts] = useState<string[]>(initial?.departmentIds ?? []);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AnnouncementFormData>({
    defaultValues: {
      title:    initial?.title    ?? "",
      body:     initial?.body     ?? "",
      audience: initial?.audience ?? "all",
      isPinned: initial?.isPinned ?? false,
      publishAt: initial?.publishAt ? initial.publishAt.slice(0, 16) : new Date().toISOString().slice(0, 16),
      expiresAt: initial?.expiresAt ? initial.expiresAt.slice(0, 16) : "",
    },
  });

  const audience = watch("audience");

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const res = await api.get("/departments?limit=100");
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AnnouncementFormData) =>
      initial
        ? api.patch(`/communications/announcements/${initial._id}`, { ...data, departmentIds: selectedDepts })
        : api.post("/communications/announcements", { ...data, departmentIds: selectedDepts }),
    onSuccess: () => { toast.success(initial ? "Announcement updated" : "Announcement posted"); onSuccess(); },
    onError:   (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const toggleDept = (id: string) =>
    setSelectedDepts((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input className="input" {...register("title", { required: "Title is required" })} placeholder="Announcement title..." />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label">Body *</label>
        <textarea
          className="input min-h-[120px] resize-y"
          placeholder="Write the announcement..."
          {...register("body", { required: "Body is required" })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Audience</label>
          <select className="input" {...register("audience")}>
            {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-yellow-500" {...register("isPinned")} />
            <span className="text-sm text-text-secondary">Pin announcement</span>
          </label>
        </div>
      </div>

      {audience === "department" && (
        <div>
          <label className="label">Select Departments</label>
          <div className="flex flex-wrap gap-2">
            {departments?.map((d) => (
              <button
                key={d._id}
                type="button"
                onClick={() => toggleDept(d._id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  selectedDepts.includes(d._id)
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-bg-border text-text-muted"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Publish At</label>
          <input type="datetime-local" className="input" {...register("publishAt")} />
        </div>
        <div>
          <label className="label">Expires At (optional)</label>
          <input type="datetime-local" className="input" {...register("expiresAt")} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-bg-border">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? "Posting..." : initial ? "Update" : "Post Announcement"}
        </button>
      </div>
    </form>
  );
}

// ── Main Announcements Page ───────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing,    setEditing]    = useState<Announcement | null>(null);

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["comm-announcements"],
    queryFn: async () => {
      const res = await api.get("/communications/announcements");
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/communications/announcements/${id}`),
    onSuccess: () => { toast.success("Announcement removed"); qc.invalidateQueries({ queryKey: ["comm-announcements"] }); },
    onError:   () => toast.error("Failed to delete"),
  });

  const viewMutation = useMutation({
    mutationFn: (id: string) => api.post(`/communications/announcements/${id}/view`),
  });

  return (
    <div className="space-y-5">
      <style>{`
        .ann-card { transition: all 0.2s ease; }
        .ann-card:hover { border-color: rgba(218,165,32,0.25); transform: translateY(-1px); }
        @keyframes cardSlide { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        .ann-card { animation: cardSlide 0.3s ease both; }
        .pinned-card { border-color: rgba(218,165,32,0.3) !important; }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Announcements</h1>
          <p className="text-text-muted text-sm mt-0.5">In-app announcement board</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2">
          <Plus size={15} /> Post Announcement
        </button>
      </div>

      {isLoading ? <PageLoader /> : !announcements?.length ? (
        <EmptyState icon="📋" title="No announcements" description="Post your first announcement to the board"
          action={<button onClick={() => setShowCreate(true)} className="btn-gold">Post Announcement</button>}
        />
      ) : (
        <div className="space-y-3">
          {/* Pinned */}
          {announcements.filter((a) => a.isPinned).length > 0 && (
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest px-1">📌 Pinned</p>
          )}
          {[...announcements].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((ann, i) => {
            const isExpired = ann.expiresAt && isAfter(new Date(), new Date(ann.expiresAt));

            return (
              <div
                key={ann._id}
                className={`ann-card card p-4 space-y-3 ${ann.isPinned ? "pinned-card" : ""}`}
                style={{ animationDelay: `${i * 0.05}s`, opacity: isExpired ? 0.6 : 1 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {ann.isPinned && (
                        <span className="flex items-center gap-0.5 text-gold text-xs font-semibold">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
                      >
                        {ann.audience}
                      </span>
                      {!ann.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400">Inactive</span>
                      )}
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-bg-hover text-text-muted">Expired</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-text-primary">{ann.title}</h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditing(ann); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-gold hover:bg-gold/10 transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => { if (confirm("Remove this announcement?")) deleteMutation.mutate(ann._id); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed">{ann.body}</p>

                <div className="flex items-center gap-4 text-xs text-text-muted pt-1 border-t border-bg-border flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    Published {format(new Date(ann.publishAt), "dd MMM yyyy HH:mm")}
                  </span>
                  {ann.expiresAt && (
                    <span>Expires {format(new Date(ann.expiresAt), "dd MMM yyyy")}</span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <Eye size={10} /> {ann.viewCount} views
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Announcement" size="lg">
        <AnnouncementForm
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["comm-announcements"] }); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {editing && (
        <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Announcement" size="lg">
          <AnnouncementForm
            initial={editing}
            onSuccess={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["comm-announcements"] }); }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}