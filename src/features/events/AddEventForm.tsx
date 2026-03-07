import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/api";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

interface EventFormData {
  title: string;
  type: string;
  campus: string;
  startDatetime: string;
  endDatetime: string;
  location: string;
  description: string;
  capacity: number | "";
  isOnline: boolean;
  rsvpEnabled: boolean;
}

const EVENT_TYPES = [
  "sunday_service",
  "midweek_service",
  "conference",
  "crusade",
  "wedding",
  "naming_ceremony",
  "vigil",
  "retreat",
  "cell_group",
  "department_meeting",
  "outreach",
  "special_program",
  "other",
];

export default function AddEventForm({ onSuccess, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: {
      title: "",
      type: "sunday_service",
      campus: "Main Campus",
      startDatetime: "",
      endDatetime: "",
      location: "",
      description: "",
      capacity: "",
      isOnline: false,
      rsvpEnabled: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EventFormData) => api.post("/events", data),
    onSuccess: () => {
      toast.success("Event created!");
      onSuccess();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to create event"),
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-4"
    >
      <div>
        <label className="label">Event Title *</label>
        <input
          className="input"
          {...register("title", { required: true })}
          placeholder="Sunday Thanksgiving Service"
        />
        {errors.title && <p className="text-red-400 text-xs mt-1">Required</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Event Type *</label>
          <select className="input" {...register("type", { required: true })}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Campus</label>
          <input
            className="input"
            {...register("campus")}
            placeholder="Main Campus"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date & Time *</label>
          <input
            type="datetime-local"
            className="input"
            {...register("startDatetime", { required: true })}
          />
          {errors.startDatetime && (
            <p className="text-red-400 text-xs mt-1">Required</p>
          )}
        </div>
        <div>
          <label className="label">End Date & Time</label>
          <input
            type="datetime-local"
            className="input"
            {...register("endDatetime")}
          />
        </div>
      </div>

      <div>
        <label className="label">Location</label>
        <input
          className="input"
          {...register("location")}
          placeholder="Main Auditorium"
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input h-20 resize-none"
          {...register("description")}
          placeholder="Event details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Capacity</label>
          <input
            type="number"
            className="input"
            {...register("capacity")}
            placeholder="500"
          />
        </div>
        <div className="flex items-center gap-4 pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("isOnline")}
              className="w-4 h-4 accent-gold"
            />
            <span className="text-text-secondary text-sm">Online Event</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("rsvpEnabled")}
              className="w-4 h-4 accent-gold"
            />
            <span className="text-text-secondary text-sm">Enable RSVP</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-gold"
        >
          {mutation.isPending ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
}
