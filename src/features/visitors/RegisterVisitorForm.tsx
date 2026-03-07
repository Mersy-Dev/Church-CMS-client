import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/api";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

interface VisitorFormData {
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  ageGroup: string;
  source: string;
  visitDate: string;
  prayerRequest: string;
}

export default function RegisterVisitorForm({ onSuccess, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VisitorFormData>({
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      gender: "male",
      ageGroup: "adult",
      source: "walk_in",
      visitDate: new Date().toISOString().split("T")[0],
      prayerRequest: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: VisitorFormData) => api.post("/visitors", data),
    onSuccess: () => {
      toast.success("Visitor registered!");
      onSuccess();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to register visitor"),
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-4"
    >
      <div>
        <label className="label">Full Name *</label>
        <input
          className="input"
          {...register("fullName", { required: true })}
          placeholder="Blessing Okoro"
        />
        {errors.fullName && (
          <p className="text-red-400 text-xs mt-1">Required</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            {...register("phone")}
            placeholder="08012345678"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            {...register("email")}
            placeholder="blessing@email.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Gender</label>
          <select className="input" {...register("gender")}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="label">Age Group</label>
          <select className="input" {...register("ageGroup")}>
            {["child", "youth", "young_adult", "adult", "senior"].map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Source</label>
          <select className="input" {...register("source")}>
            <option value="walk_in">Walk-in</option>
            <option value="invited_by_member">Invited by Member</option>
            <option value="online">Online</option>
            <option value="outreach">Outreach</option>
            <option value="social_media">Social Media</option>
            <option value="flyer">Flyer</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Visit Date</label>
        <input
          type="date"
          className="input"
          {...register("visitDate")}
          defaultValue={new Date().toISOString().split("T")[0]}
        />
      </div>
      <div>
        <label className="label">Prayer Request / Notes</label>
        <textarea
          className="input h-20 resize-none"
          {...register("prayerRequest")}
          placeholder="Optional..."
        />
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-gold"
        >
          {mutation.isPending ? "Registering..." : "Register Visitor"}
        </button>
      </div>
    </form>
  );
}
