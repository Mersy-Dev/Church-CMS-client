import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../../lib/api";
import type { ContributionType, PaymentChannel, Currency } from "../../../types/finance.types";

interface Props { onSuccess: () => void; onCancel: () => void; }

interface FormData {
  memberId?:        string;
  donorName?:       string;
  donorEmail?:      string;
  donorPhone?:      string;
  isAnonymous:      boolean;
  contributionType: ContributionType;
  projectId?:       string;
  pledgeId?:        string;
  amount:           number;
  currency:         Currency;
  paymentChannel:   PaymentChannel;
  paymentReference?: string;
  bankName?:        string;
  chequeNumber?:    string;
  serviceDate:      string;
  eventId?:         string;
  notes?:           string;
}

const TYPES = [
  ["tithe","Tithe"],["sunday_offering","Sunday Offering"],
  ["midweek_offering","Midweek Offering"],["special_donation","Special Donation"],
  ["building_fund","Building Fund"],["partnership","Partnership"],
  ["covenant_seed","Covenant Seed"],["pledge_payment","Pledge Payment"],
  ["project_fund","Project Fund"],["missions","Missions"],
  ["benevolence","Benevolence"],["thanksgiving","Thanksgiving"],
  ["first_fruit","First Fruit"],["other","Other"],
];

const CHANNELS = [
  ["cash","Cash"],["bank_transfer","Bank Transfer"],["card","Card"],
  ["mobile_money","Mobile Money"],["paystack","Paystack"],
  ["ussd","USSD"],["cheque","Cheque"],["flutterwave","Flutterwave"],
];

const CURRENCIES = ["NGN","USD","GBP","EUR","CAD","GHS","KES","ZAR"];

export default function RecordContributionForm({ onSuccess, onCancel }: Props) {
  const [donorMode, setDonorMode] = useState<"member" | "nonmember" | "anonymous">("member");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberList, setShowMemberList] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      contributionType: "tithe",
      currency: "NGN",
      paymentChannel: "cash",
      serviceDate: new Date().toISOString().split("T")[0],
      isAnonymous: false,
    },
  });

  const paymentChannel = watch("paymentChannel");
  const contributionType = watch("contributionType");

  // Member search
  const { data: memberResults } = useQuery({
    queryKey: ["member-search-giving", memberSearch],
    enabled: memberSearch.length >= 2,
    queryFn: async () => {
      const res = await api.get(`/members?search=${memberSearch}&limit=8`);
      return res.data.data;
    },
  });

  // Projects list
  const { data: projects } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const res = await api.get("/finance/projects?status=active");
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: any = { ...data };
      if (donorMode === "member" && selectedMember) {
        payload.memberId  = selectedMember._id;
        payload.donorName = `${selectedMember.firstName} ${selectedMember.lastName}`;
        payload.donorEmail= selectedMember.email;
        payload.donorPhone= selectedMember.phone;
      }
      if (donorMode === "anonymous") payload.isAnonymous = true;
      if (!payload.projectId)  delete payload.projectId;
      if (!payload.pledgeId)   delete payload.pledgeId;
      if (!payload.bankName)   delete payload.bankName;
      if (!payload.chequeNumber) delete payload.chequeNumber;
      if (!payload.paymentReference) delete payload.paymentReference;
      return api.post("/finance/contributions", payload);
    },
    onSuccess: () => { toast.success("Contribution recorded!"); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to record"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <style>{`
        .form-field { transition: all 0.2s ease; }
        .form-field:focus-within { transform: translateY(-1px); }
        .member-result { transition: background 0.15s ease; }
        .member-result:hover { background: rgba(218,165,32,0.08); }
      `}</style>

      {/* Donor Mode Tabs */}
      <div>
        <label className="label">Donor Type</label>
        <div className="flex gap-2">
          {[
            { key: "member", label: "Church Member" },
            { key: "nonmember", label: "Non-Member / Guest" },
            { key: "anonymous", label: "Anonymous" },
          ].map(({ key, label }) => (
            <button
              key={key} type="button"
              onClick={() => setDonorMode(key as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: donorMode === key ? "rgba(218,165,32,0.15)" : "var(--bg-hover)",
                color: donorMode === key ? "#DAA520" : "var(--text-secondary)",
                border: `1px solid ${donorMode === key ? "rgba(218,165,32,0.35)" : "transparent"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Donor Fields */}
      {donorMode === "member" && (
        <div className="form-field relative">
          <label className="label">Search Member</label>
          {selectedMember ? (
            <div
              className="input flex items-center justify-between cursor-pointer"
              onClick={() => { setSelectedMember(null); setMemberSearch(""); }}
            >
              <span className="text-text-primary text-sm">
                {selectedMember.firstName} {selectedMember.lastName}
                <span className="text-gold font-mono text-xs ml-2">({selectedMember.membershipId})</span>
              </span>
              <span className="text-text-muted text-xs">× Change</span>
            </div>
          ) : (
            <>
              <input
                className="input"
                value={memberSearch}
                onChange={(e) => { setMemberSearch(e.target.value); setShowMemberList(true); }}
                placeholder="Search by name, phone, ID..."
              />
              {showMemberList && memberResults?.length > 0 && (
                <div
                  className="absolute z-50 w-full mt-1 rounded-lg border shadow-xl overflow-hidden"
                  style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}
                >
                  {memberResults.map((m: any) => (
                    <div
                      key={m._id}
                      className="member-result flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                      onClick={() => { setSelectedMember(m); setShowMemberList(false); setMemberSearch(""); }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(218,165,32,0.12)", color: "#DAA520" }}
                      >
                        {m.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-text-primary">{m.firstName} {m.lastName}</p>
                        <p className="text-xs text-text-muted font-mono">{m.membershipId} · {m.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {donorMode === "nonmember" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="form-field">
            <label className="label">Full Name</label>
            <input className="input" {...register("donorName")} placeholder="John Doe" />
          </div>
          <div className="form-field">
            <label className="label">Phone</label>
            <input className="input" {...register("donorPhone")} placeholder="08012345678" />
          </div>
          <div className="form-field col-span-2">
            <label className="label">Email</label>
            <input type="email" className="input" {...register("donorEmail")} placeholder="john@example.com" />
          </div>
        </div>
      )}

      {donorMode === "anonymous" && (
        <div
          className="rounded-xl p-3 text-sm"
          style={{ background: "rgba(218,165,32,0.06)", border: "1px solid rgba(218,165,32,0.15)" }}
        >
          <p className="text-gold text-xs font-medium">🔒 Contribution will be recorded anonymously</p>
        </div>
      )}

      {/* Contribution Type + Project */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="label">Contribution Type *</label>
          <select className="input" {...register("contributionType", { required: true })}>
            {TYPES.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        {(contributionType === "project_fund" || contributionType === "building_fund") && (
          <div className="form-field">
            <label className="label">Project / Fund</label>
            <select className="input" {...register("projectId")}>
              <option value="">Select project...</option>
              {projects?.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-3 gap-4">
        <div className="form-field col-span-2">
          <label className="label">Amount *</label>
          <input
            type="number" step="0.01" min="0.01"
            className="input"
            {...register("amount", { required: "Amount is required", min: { value: 0.01, message: "Must be > 0" } })}
            placeholder="0.00"
          />
          {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div className="form-field">
          <label className="label">Currency</label>
          <select className="input" {...register("currency")}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Channel */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="label">Payment Channel *</label>
          <select className="input" {...register("paymentChannel", { required: true })}>
            {CHANNELS.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="label">Service Date</label>
          <input type="date" className="input" {...register("serviceDate")} />
        </div>
      </div>

      {/* Channel-specific fields */}
      {(paymentChannel === "bank_transfer" || paymentChannel === "paystack" || paymentChannel === "flutterwave") && (
        <div className="grid grid-cols-2 gap-4">
          <div className="form-field">
            <label className="label">Reference / Teller No.</label>
            <input className="input" {...register("paymentReference")} placeholder="TXN123456" />
          </div>
          <div className="form-field">
            <label className="label">Bank Name</label>
            <input className="input" {...register("bankName")} placeholder="First Bank" />
          </div>
        </div>
      )}
      {paymentChannel === "cheque" && (
        <div className="form-field">
          <label className="label">Cheque Number</label>
          <input className="input" {...register("chequeNumber")} placeholder="CHQ-00123" />
        </div>
      )}

      {/* Notes */}
      <div className="form-field">
        <label className="label">Notes (optional)</label>
        <textarea className="input min-h-[70px] resize-none" {...register("notes")} placeholder="Any additional details..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : "Record Giving"}
        </button>
      </div>
    </form>
  );
}