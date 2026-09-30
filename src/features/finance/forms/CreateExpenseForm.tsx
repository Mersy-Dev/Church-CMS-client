// src/features/finance/forms/CreateExpenseForm.tsx

import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../../lib/api";

interface Props { onSuccess: () => void; onCancel: () => void; }

interface ExpenseFormValues {
  title: string;
  category: string;
  paidTo: string;
  amount: number;
  currency: string;
  paymentChannel: string;
  expenseDate: string;
  projectId?: string;
  budgetId?: string;
  receiptUrl?: string;
  description?: string;
  isSalary: boolean;
}

const CATEGORIES = [
  ["salary","Salary / Disbursement"],["utilities","Utilities"],
  ["maintenance","Maintenance"],["office_supplies","Office Supplies"],
  ["ministry_activities","Ministry Activities"],["missions","Missions"],
  ["benevolence","Benevolence"],["equipment","Equipment"],
  ["media_production","Media & Production"],["transport","Transport"],
  ["catering","Catering"],["other","Other"],
];

const CHANNELS = [
  ["cash","Cash"],["bank_transfer","Bank Transfer"],
  ["card","Card"],["mobile_money","Mobile Money"],["cheque","Cheque"],
];

export default function CreateExpenseForm({ onSuccess, onCancel }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExpenseFormValues>({
    defaultValues: {
      title: "",
      category: CATEGORIES[0][0],
      paidTo: "",
      amount: 0,
      currency: "NGN",
      paymentChannel: CHANNELS[0][0],
      expenseDate: new Date().toISOString().split("T")[0],
      isSalary: false,
      description: "",
      receiptUrl: "",
      projectId: "",
      budgetId: "",
    },
  });

  const isSalary = watch("isSalary");

  const { data: projects } = useQuery({
    queryKey: ["projects-active"],
    queryFn: async () => (await api.get("/finance/projects?status=active")).data.data,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (!data.projectId)  delete data.projectId;
      if (!data.budgetId)   delete data.budgetId;
      if (!data.receiptUrl) delete data.receiptUrl;
      return api.post("/finance/expenses", data);
    },
    onSuccess: () => { toast.success("Expense submitted for approval!"); onSuccess(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div
        className="rounded-xl p-3 text-xs"
        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
      >
        <p className="text-yellow-400 font-medium">⚠️ Expenses require admin approval before disbursement</p>
      </div>

      <div>
        <label className="label">Expense Title *</label>
        <input className="input" {...register("title", { required: true })} placeholder="Office Printer Ink Cartridges" />
        {errors.title && <p className="text-red-400 text-xs mt-1">Required</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select className="input" {...register("category", { required: true })}>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Payable To *</label>
          <input className="input" {...register("paidTo", { required: true })} placeholder="Vendor / Beneficiary name" />
          {errors.paidTo && <p className="text-red-400 text-xs mt-1">Required</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="label">Amount *</label>
          <input type="number" step="0.01" className="input"
            {...register("amount", { required: true, min: 0.01 })} placeholder="0.00" />
          {errors.amount && <p className="text-red-400 text-xs mt-1">Required</p>}
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
          <label className="label">Payment Method *</label>
          <select className="input" {...register("paymentChannel", { required: true })}>
            {CHANNELS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Expense Date *</label>
          <input type="date" className="input" {...register("expenseDate", { required: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Linked Project (optional)</label>
          <select className="input" {...register("projectId")}>
            <option value="">None</option>
            {projects?.map((p: any) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Receipt URL (optional)</label>
          <input type="url" className="input" {...register("receiptUrl")} placeholder="https://..." />
        </div>
      </div>

      {/* Salary toggle */}
      <div className="flex items-center gap-3 py-1">
        <input type="checkbox" id="isSalary" className="w-4 h-4 accent-yellow-500" {...register("isSalary")} />
        <label htmlFor="isSalary" className="text-sm text-text-secondary cursor-pointer">
          This is a salary / staff disbursement
        </label>
      </div>

      <div>
        <label className="label">Description / Notes</label>
        <textarea className="input resize-none min-h-[70px]" {...register("description")} placeholder="Describe the expense..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-gold">
          {mutation.isPending ? "Submitting..." : "Submit for Approval"}
        </button>
      </div>
    </form>
  );
}