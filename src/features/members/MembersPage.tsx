import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/api";
import Avatar from "../../components/ui/Avatar";
import StatusBadge from "../../components/ui/StatusBadge";
import SearchInput from "../../components/ui/SearchInput";
import Modal from "../../components/ui/Modal";
import { PageLoader } from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import type { Member, Department } from "../../types";
import AddMemberForm from "./AddMemberForm";
import EditMemberForm from "./EditMemberForm";

function getDepartmentNames(
  member: Member,
  allDepartments?: Department[],
): string[] {
  try {
    if (
      member.departmentIds &&
      Array.isArray(member.departmentIds) &&
      member.departmentIds.length > 0
    ) {
      return member.departmentIds
        .map((d: any) => {
          if (typeof d === "object" && d?.name) return d.name;
          if (typeof d === "object" && d?._id)
            return allDepartments?.find((dep) => dep._id === d._id)?.name || d._id;
          if (typeof d === "string")
            return allDepartments?.find((dep) => dep._id === d)?.name || d;
          return "";
        })
        .filter(Boolean);
    }

    if (
      member.departments &&
      Array.isArray(member.departments) &&
      member.departments.length > 0
    ) {
      return member.departments
        .map((d: any) => {
          if (typeof d === "object" && d?.name) return d.name;
          if (typeof d === "string")
            return allDepartments?.find((dep) => dep._id === d)?.name || d;
          return "";
        })
        .filter(Boolean);
    }

    return [];
  } catch {
    return [];
  }
}

export default function MembersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hoveringAction, setHoveringAction] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["members", search, statusFilter, deptFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (deptFilter) params.set("departmentId", deptFilter);
      params.set("limit", "50");
      const res = await api.get(`/members?${params}`);
      return {
        members: res.data.data as Member[],
        total: res.data.pagination?.total ?? res.data.data?.length,
      };
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const res = await api.get("/departments?limit=100");
      return res.data.data as Department[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => {
      toast.success("Member deleted");
      qc.invalidateQueries({ queryKey: ["members"] });
      setDeleting(null);
    },
    onError: () => toast.error("Failed to delete member"),
  });

  const members = data?.members ?? [];

  const STATUSES = [
    "member",
    "worker",
    "leader",
    "new_convert",
    "first_timer",
    "visitor",
    "archived",
  ];

  const handleEditClick = (member: Member) => {
    setSelectedMember(member);
    setShowEdit(true);
  };

  const handleEditSuccess = () => {
    setShowEdit(false);
    setSelectedMember(null);
    qc.invalidateQueries({ queryKey: ["members"] });
  };

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes eyePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }

        .action-btn {
          position: relative;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
        }

        .action-btn:hover {
          transform: translateY(-2px);
        }

        .eye-icon-btn:hover svg {
          animation: eyePulse 0.6s ease-in-out;
        }

        .edit-btn:hover {
          background-color: rgba(218, 165, 32, 0.1);
        }

        .delete-btn:hover {
          background-color: rgba(239, 68, 68, 0.1);
        }

        .table-row {
          transition: background-color 0.2s ease;
        }

        .table-row:hover {
          background-color: rgba(218, 165, 32, 0.03);
        }

        .fade-in {
          animation: fadeInRow 0.3s ease-out;
        }

        @keyframes fadeInRow {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Members
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            {data?.total ?? 0} registered member{data?.total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-gold flex items-center gap-2 hover:shadow-lg transition-shadow"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone, ID..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Departments</option>
          {departments?.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : members.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No members found"
            description="Add your first member to get started"
            action={
              <button onClick={() => setShowAdd(true)} className="btn-gold">
                Add Member
              </button>
            }
          />
        ) : (
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {["Member", "ID", "Phone", "Department", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const deptNames = getDepartmentNames(m, departments);
                return (
                  <tr key={m._id} className="table-row fade-in">

                    {/* Member */}
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={`${m.firstName} ${m.lastName}`}
                          photoUrl={m.photoUrl}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-text-primary">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className="text-text-muted text-xs">{m.email || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="table-cell">
                      <span className="font-mono text-gold text-xs">{m.membershipId}</span>
                    </td>

                    {/* Phone */}
                    <td className="table-cell text-text-secondary">
                      {m.phone || "—"}
                    </td>

                    {/* Department */}
                    <td className="table-cell">
                      {deptNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {deptNames.map((name, i) => (
                            <span
                              key={i}
                              className="bg-bg-hover text-text-secondary text-xs px-2 py-1 rounded-lg"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : "—"}
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      <StatusBadge status={m.status} />
                    </td>

                    {/* Joined */}
                    <td className="table-cell text-text-muted text-xs">
                      {m.dateJoined
                        ? format(new Date(m.dateJoined), "yyyy-MM-dd")
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <button
                          onMouseEnter={() => setHoveringAction(`view-${m._id}`)}
                          onMouseLeave={() => setHoveringAction(null)}
                          onClick={() => navigate(`/members/${m._id}`)}
                          className={`eye-icon-btn action-btn w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${
                            hoveringAction === `view-${m._id}`
                              ? "bg-blue-500/20 text-blue-400 shadow-md shadow-blue-500/20"
                              : "bg-transparent text-text-muted hover:text-blue-400"
                          }`}
                          title="View member details"
                        >
                          <Eye size={15} strokeWidth={2.2} />
                        </button>

                        {/* Edit */}
                        <button
                          onMouseEnter={() => setHoveringAction(`edit-${m._id}`)}
                          onMouseLeave={() => setHoveringAction(null)}
                          onClick={() => handleEditClick(m)}
                          className={`edit-btn action-btn w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${
                            hoveringAction === `edit-${m._id}`
                              ? "bg-gold/20 text-gold shadow-md shadow-gold/20"
                              : "bg-transparent text-text-muted hover:text-gold"
                          }`}
                          title="Edit member information"
                        >
                          <Pencil size={15} strokeWidth={2.2} />
                        </button>

                        {/* Delete */}
                        <button
                          onMouseEnter={() => setHoveringAction(`delete-${m._id}`)}
                          onMouseLeave={() => setHoveringAction(null)}
                          onClick={() => setDeleting(m._id)}
                          className={`delete-btn action-btn w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${
                            hoveringAction === `delete-${m._id}`
                              ? "bg-red-500/20 text-red-400 shadow-md shadow-red-500/20"
                              : "bg-transparent text-text-muted hover:text-red-400"
                          }`}
                          title="Delete member"
                        >
                          <Trash2 size={15} strokeWidth={2.2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Member" size="lg">
        <AddMemberForm
          departments={departments ?? []}
          onSuccess={() => {
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ["members"] });
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Edit Member Modal */}
      {selectedMember && (
        <Modal
          isOpen={showEdit}
          onClose={() => { setShowEdit(false); setSelectedMember(null); }}
          title="Edit Member"
          size="lg"
        >
          <EditMemberForm
            member={selectedMember}
            departments={departments ?? []}
            onSuccess={handleEditSuccess}
            onCancel={() => { setShowEdit(false); setSelectedMember(null); }}
          />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Member" size="sm">
        <p className="text-text-secondary mb-5">
          Are you sure you want to delete this member? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleting(null)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => deleting && deleteMutation.mutate(deleting)}
            className="btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}