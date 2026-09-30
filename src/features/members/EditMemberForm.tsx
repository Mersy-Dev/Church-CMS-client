import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/api";
import type { Department, Member, MemberFormData } from "../../types";

interface Props {
  member: Member;
  departments: Department[];
  onSuccess: () => void;
  onCancel: () => void;
}

function extractDepartmentIds(depts?: (Department | string)[]): string[] {
  if (!depts || !Array.isArray(depts)) return [];
  return depts
    .map((d) => {
      if (typeof d === "string") return d;
      if (d && typeof d === "object" && "_id" in d) return d._id;
      return "";
    })
    .filter(Boolean);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="shrink-0 w-1 h-4 rounded-full"
        style={{ background: "var(--gold, #b8972e)" }}
      />
      <p
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color: "var(--gold, #b8972e)" }}
      >
        {children}
      </p>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

// A unified input class that ensures legibility in both light and dark modes
const inp =
  "w-full rounded-md border border-gray-300 dark:border-gray-600 " +
  "bg-white dark:bg-gray-800 " +
  "text-gray-900 dark:text-gray-100 " +
  "text-sm px-3 py-1.5 " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
  "focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500 " +
  "transition-colors duration-150";

// Shared label style
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 tracking-wide">
      {children}
    </label>
  );
}

// Error message helper
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 dark:text-red-400 text-xs mt-0.5">{message}</p>;
}

export default function EditMemberForm({ member, departments, onSuccess, onCancel }: Props) {
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(() =>
    extractDepartmentIds(member.departments)
  );
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);

  useEffect(() => {
    setSelectedDeptIds(extractDepartmentIds(member.departments));
  }, [member]);

  const toggleDept = (id: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MemberFormData>({
    defaultValues: {
      firstName:     member.firstName,
      lastName:      member.lastName,
      email:         member.email || "",
      phone:         member.phone || "",
      gender:        member.gender || "male",
      dateOfBirth:   member.dateOfBirth ? member.dateOfBirth.split("T")[0] : "",
      status:        member.status,
      maritalStatus: member.maritalStatus || "single",
      occupation:    member.occupation || "",
      address:       member.address || "",
      dateJoined:    member.dateJoined ? member.dateJoined.split("T")[0] : "",
    },
  });

  useEffect(() => {
    reset({
      firstName:     member.firstName,
      lastName:      member.lastName,
      email:         member.email || "",
      phone:         member.phone || "",
      gender:        member.gender || "male",
      dateOfBirth:   member.dateOfBirth ? member.dateOfBirth.split("T")[0] : "",
      status:        member.status,
      maritalStatus: member.maritalStatus || "single",
      occupation:    member.occupation || "",
      address:       member.address || "",
      dateJoined:    member.dateJoined ? member.dateJoined.split("T")[0] : "",
    });
  }, [member, reset]);

  const mutation = useMutation({
    mutationFn: (data: MemberFormData) =>
      api.patch(`/members/${member._id}`, { ...data, departmentIds: selectedDeptIds }),
    onSuccess: () => {
      toast.success("Member updated successfully!");
      onSuccess();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Failed to update member"),
  });

  const selectedDeptNames = departments
    .filter((d) => selectedDeptIds.includes(d._id))
    .map((d) => d.name);

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">

      {/* ── Personal ─────────────────────────────────────── */}
      <section>
        <SectionLabel>Personal</SectionLabel>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <FieldLabel>First Name *</FieldLabel>
            <input
              className={inp}
              {...register("firstName", { required: "Required" })}
              placeholder="John"
            />
            <FieldError message={errors.firstName?.message} />
          </div>
          <div>
            <FieldLabel>Last Name *</FieldLabel>
            <input
              className={inp}
              {...register("lastName", { required: "Required" })}
              placeholder="Doe"
            />
            <FieldError message={errors.lastName?.message} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <FieldLabel>Gender</FieldLabel>
            <select className={inp} {...register("gender")}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <FieldLabel>Date of Birth</FieldLabel>
            <input type="date" className={inp} {...register("dateOfBirth")} />
          </div>
          <div>
            <FieldLabel>Marital Status</FieldLabel>
            <select className={inp} {...register("maritalStatus")}>
              {["single", "married", "divorced", "widowed"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────── */}
      <section>
        <SectionLabel>Contact</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              type="email"
              className={inp}
              {...register("email")}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <input
              className={inp}
              {...register("phone")}
              placeholder="08012345678"
            />
          </div>
        </div>
      </section>

      {/* ── Church ───────────────────────────────────────── */}
      <section>
        <SectionLabel>Church</SectionLabel>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <FieldLabel>Status</FieldLabel>
            <select className={inp} {...register("status")}>
              {["member", "worker", "leader", "new_convert", "first_timer", "visitor", "archived"].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Date Joined</FieldLabel>
            <input type="date" className={inp} {...register("dateJoined")} />
          </div>
        </div>

        {/* Departments multi-select */}
        <div className="relative">
          <FieldLabel>Departments</FieldLabel>
          <button
            type="button"
            onClick={() => setDeptDropdownOpen((o) => !o)}
            className={`${inp} flex items-center justify-between cursor-pointer`}
          >
            <span
              className={
                selectedDeptIds.length === 0
                  ? "text-gray-400 dark:text-gray-500"
                  : "text-gray-900 dark:text-gray-100 truncate pr-2"
              }
            >
              {selectedDeptIds.length === 0
                ? "Select departments…"
                : selectedDeptNames.join(", ")}
            </span>
            <svg
              className={`w-3.5 h-3.5 shrink-0 text-gray-500 transition-transform duration-150 ${
                deptDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {deptDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 max-h-44 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
              {departments?.length === 0 && (
                <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  No departments available
                </p>
              )}
              {departments?.map((d) => {
                const checked = selectedDeptIds.includes(d._id);
                return (
                  <label
                    key={d._id}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDept(d._id)}
                      className="w-3.5 h-3.5 rounded accent-yellow-500"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">{d.name}</span>
                    {checked && (
                      <span className="ml-auto text-yellow-600 dark:text-yellow-400 text-xs font-semibold">
                        ✓
                      </span>
                    )}
                  </label>
                );
              })}
              <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setDeptDropdownOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Other ────────────────────────────────────────── */}
      <section>
        <SectionLabel>Other</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Occupation</FieldLabel>
            <input
              className={inp}
              {...register("occupation")}
              placeholder="Software Engineer"
            />
          </div>
          <div>
            <FieldLabel>Address</FieldLabel>
            <input
              className={inp}
              {...register("address")}
              placeholder="123 Church Street, Lagos"
            />
          </div>
        </div>
      </section>

      {/* ── Actions ──────────────────────────────────────── */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="
            px-4 py-1.5 text-sm font-medium rounded-md
            text-gray-600 dark:text-gray-300
            border border-gray-300 dark:border-gray-600
            bg-transparent
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors duration-150
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="
            flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md
            text-white
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors duration-150
          "
          style={{ background: "var(--gold, #b8972e)" }}
        >
          {mutation.isPending ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}