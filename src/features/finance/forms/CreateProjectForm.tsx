// src/features/finance/forms/CreateProjectForm.tsx

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../../lib/api";

interface Props { onSuccess: () => void; onCancel: () => void; }

interface ProjectFormData {
  name: string;
  code: string;
  description?: string;
  category: string;
  status?: string;
  targetAmount: number;
  currency: string;
  startDate: string;
  endDate?: string;
  isPublic: boolean;
}

export default function CreateProjectForm({ onSuccess, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormData>({
    defaultValues: {
      currency: "NGN",
      isPublic: true,
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      data.code = data.code?.toUpperCase();
      if (!data.endDate) delete data.endDate;
      return api.post("/finance/projects", data);
    },
    onSuccess: () => { toast.success("Project created!"); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Project Name *</label>
          <input className="input" {...register("name", { required: true })} placeholder="Building Expansion Fund" />
          {errors.name && <p className="text-red-400 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="label">Project Code *</label>
          <input className="input uppercase" {...register("code", { required: true })} placeholder="BLD-001" />
          {errors.code && <p className="text-red-400 text-xs mt-1">Required</p>}
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none min-h-[70px]" {...register("description")} placeholder="What is this fund for?" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select className="input" {...register("category", { required: true })}>
            {[
              ["building_fund","Building Fund"],["missions","Missions"],
              ["benevolence","Benevolence"],["equipment","Equipment"],
              ["media","Media & Production"],["other","Other"],
            ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register("status")}>
            {["active","paused","completed","cancelled"].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="label">Target Amount *</label>
          <input type="number" step="0.01" className="input" {...register("targetAmount", { required: true, min: 1 })} placeholder="5000000" />
          {errors.targetAmount && <p className="text-red-400 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" {...register("currency")}>
            {["NGN","USD","GBP","EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date *</label>
          <input type="date" className="input" {...register("startDate", { required: true })} />
        </div>
        <div>
          <label className="label">End Date (optional)</label>
          <input type="date" className="input" {...register("endDate")} />
        </div>
      </div>

      <div className="flex items-center gap-3 py-1">
        <input type="checkbox" id="isPublic" className="w-4 h-4 accent-yellow-500" {...register("isPublic")} />
        <label htmlFor="isPublic" className="text-sm text-text-secondary cursor-pointer">
          Show on public online giving page
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}