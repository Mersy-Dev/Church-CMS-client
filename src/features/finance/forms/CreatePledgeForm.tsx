// ─── CreatePledgeForm.tsx ─────────────────────────────────────────────────────
// src/features/finance/forms/CreatePledgeForm.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../../lib/api";

interface Props { onSuccess: () => void; onCancel: () => void; }

interface PledgeFormValues {
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  pledgeType: string;
  projectId?: string;
  totalAmount?: number;
  currency: string;
  frequency: string;
  startDate: string;
  notes?: string;
  memberId?: string;
}

export function CreatePledgeForm({ onSuccess, onCancel }: Props) {
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberList, setShowMemberList] = useState(false);
  const [donorMode, setDonorMode] = useState<"member" | "nonmember">("member");

  const { register, handleSubmit, formState: { errors } } = useForm<PledgeFormValues>({
    defaultValues: {
      pledgeType: "tithe", currency: "NGN", frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const { data: memberResults } = useQuery({
    queryKey: ["member-search-pledge", memberSearch],
    enabled: memberSearch.length >= 2,
    queryFn: async () => (await api.get(`/members?search=${memberSearch}&limit=8`)).data.data,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-active"],
    queryFn: async () => (await api.get("/finance/projects?status=active")).data.data,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (donorMode === "member" && selectedMember) data.memberId = selectedMember._id;
      return api.post("/finance/pledges", data);
    },
    onSuccess: () => { toast.success("Pledge created!"); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      {/* Donor Mode */}
      <div>
        <label className="label">Donor Type</label>
        <div className="flex gap-2">
          {[["member","Church Member"],["nonmember","Non-Member"]].map(([k,l]) => (
            <button key={k} type="button" onClick={() => setDonorMode(k as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: donorMode === k ? "rgba(218,165,32,0.15)" : "var(--bg-hover)",
                color: donorMode === k ? "#DAA520" : "var(--text-secondary)",
                border: `1px solid ${donorMode === k ? "rgba(218,165,32,0.35)" : "transparent"}`,
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {donorMode === "member" ? (
        <div className="relative">
          <label className="label">Member</label>
          {selectedMember ? (
            <div className="input flex items-center justify-between cursor-pointer"
              onClick={() => { setSelectedMember(null); setMemberSearch(""); }}>
              <span className="text-sm text-text-primary">
                {selectedMember.firstName} {selectedMember.lastName}
                <span className="text-gold font-mono text-xs ml-2">({selectedMember.membershipId})</span>
              </span>
              <span className="text-text-muted text-xs">× Change</span>
            </div>
          ) : (
            <>
              <input className="input" value={memberSearch}
                onChange={(e) => { setMemberSearch(e.target.value); setShowMemberList(true); }}
                placeholder="Search member..." />
              {showMemberList && memberResults?.length > 0 && (
                <div className="absolute z-50 w-full mt-1 rounded-lg border shadow-xl overflow-hidden"
                  style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
                  {memberResults.map((m: any) => (
                    <div key={m._id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => { setSelectedMember(m); setShowMemberList(false); setMemberSearch(""); }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(218,165,32,0.12)", color: "#DAA520" }}>
                        {m.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-text-primary">{m.firstName} {m.lastName}</p>
                        <p className="text-xs text-text-muted font-mono">{m.membershipId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name</label>
            <input className="input" {...register("donorName")} placeholder="John Doe" /></div>
          <div><label className="label">Phone</label>
            <input className="input" {...register("donorPhone")} placeholder="08012345678" /></div>
          <div className="col-span-2"><label className="label">Email</label>
            <input type="email" className="input" {...register("donorEmail")} /></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Pledge Type *</label>
          <select className="input" {...register("pledgeType", { required: true })}>
            {[["tithe","Tithe"],["building_fund","Building Fund"],["missions","Missions"],
              ["partnership","Partnership"],["project_fund","Project Fund"],["other","Other"]].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div><label className="label">Project (optional)</label>
          <select className="input" {...register("projectId")}>
            <option value="">None</option>
            {projects?.map((p: any) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="label">Total Pledge Amount *</label>
          <input type="number" step="0.01" className="input" {...register("totalAmount", { required: true, min: 0.01 })} />
          {errors.totalAmount && <p className="text-red-400 text-xs mt-1">Required</p>}
        </div>
        <div><label className="label">Currency</label>
          <select className="input" {...register("currency")}>
            {["NGN","USD","GBP","EUR","CAD"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Payment Frequency</label>
          <select className="input" {...register("frequency")}>
            {[["one_time","One Time"],["weekly","Weekly"],["monthly","Monthly"],
              ["quarterly","Quarterly"],["yearly","Yearly"]].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div><label className="label">Start Date *</label>
          <input type="date" className="input" {...register("startDate", { required: true })} />
        </div>
      </div>

      <div><label className="label">Notes</label>
        <textarea className="input resize-none min-h-[60px]" {...register("notes")} placeholder="Any additional details..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? "Saving..." : "Create Pledge"}
        </button>
      </div>
    </form>
  );
}

export default CreatePledgeForm;