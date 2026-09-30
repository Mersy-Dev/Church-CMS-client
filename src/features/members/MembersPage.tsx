import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  Shield,
  Star,
  Users,
  UserCheck,
  UserPlus,
  User,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../../lib/api";
import SearchInput from "../../components/ui/SearchInput";
import Modal from "../../components/ui/Modal";
import { PageLoader } from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import type { Member, Department } from "../../types";
import AddMemberForm from "./AddMemberForm";
import EditMemberForm from "./EditMemberForm";
import ImportMembersModal from "./ImportMembersModal";

/* ── Constants ───────────────────────────────────────────────────────────── */

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const STATUSES = [
  "member",
  "worker",
  "leader",
  "new_convert",
  "first_timer",
  "visitor",
  "archived",
];

const CHURCH_ROLES: {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    value: "pastorate",
    label: "Pastorate",
    icon: <Crown size={12} />,
    color: "#b45309",
    bg: "rgba(180,83,9,0.09)",
    border: "rgba(180,83,9,0.25)",
  },
  {
    value: "elder",
    label: "Elder",
    icon: <Shield size={12} />,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.09)",
    border: "rgba(124,58,237,0.25)",
  },
  {
    value: "deacon",
    label: "Deacon",
    icon: <Star size={12} />,
    color: "#0369a1",
    bg: "rgba(3,105,161,0.09)",
    border: "rgba(3,105,161,0.25)",
  },
  {
    value: "unit_head",
    label: "Unit Head",
    icon: <UserCheck size={12} />,
    color: "#065f46",
    bg: "rgba(6,95,70,0.09)",
    border: "rgba(6,95,70,0.25)",
  },
  {
    value: "worker",
    label: "Worker",
    icon: <Users size={12} />,
    color: "#4338ca",
    bg: "rgba(67,56,202,0.09)",
    border: "rgba(67,56,202,0.25)",
  },
  {
    value: "member",
    label: "Member",
    icon: <User size={12} />,
    color: "var(--text-secondary)",
    bg: "var(--bg-hover)",
    border: "var(--bg-border)",
  },
  {
    value: "new_convert",
    label: "New Convert",
    icon: <UserPlus size={12} />,
    color: "#0891b2",
    bg: "rgba(8,145,178,0.09)",
    border: "rgba(8,145,178,0.25)",
  },
  {
    value: "first_timer",
    label: "First Timer",
    icon: <UserPlus size={12} />,
    color: "#d97706",
    bg: "rgba(217,119,6,0.09)",
    border: "rgba(217,119,6,0.25)",
  },
  {
    value: "visitor",
    label: "Visitor",
    icon: <User size={12} />,
    color: "var(--text-muted)",
    bg: "var(--bg-hover)",
    border: "var(--bg-border)",
  },
];

const ROLE_MAP = Object.fromEntries(CHURCH_ROLES.map((r) => [r.value, r]));

const TABLE_HEADS = [
  "Member",
  "ID",
  "Phone",
  "Department",
  "Role",
  "Status",
  "Joined",
  "Actions",
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getDepartmentNames(member: Member, allDepts?: Department[]): string[] {
  try {
    const src = member.departmentIds?.length
      ? member.departmentIds
      : (member.departments ?? []);
    return src
      .map((d: any) => {
        if (typeof d === "object" && d?.name) return d.name;
        const id = typeof d === "object" ? d?._id : d;
        return allDepts?.find((dep) => dep._id === id)?.name || id || "";
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function labelify(str: string) {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Monogram({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-hover)",
        border: "1px solid var(--bg-border)",
        color: "var(--text-secondary)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      {initials.toUpperCase()}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        background: "var(--bg-hover)",
        color: "var(--text-secondary)",
        border: "1px solid var(--bg-border)",
        whiteSpace: "nowrap",
      }}
    >
      {labelify(status)}
    </span>
  );
}

function DeptChip({ name }: { name: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        background: "var(--bg-hover)",
        color: "var(--text-secondary)",
        border: "1px solid var(--bg-border)",
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  );
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const cfg = ROLE_MAP[role];
  if (!cfg)
    return <span style={{ color: "var(--text-muted)" }}>{labelify(role)}</span>;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 9px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function ActionBtn({
  children,
  onClick,
  title,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s, color 0.15s",
        background: hov
          ? danger
            ? "rgba(220,38,38,0.1)"
            : "var(--bg-hover)"
          : "transparent",
        color: hov
          ? danger
            ? "#ef4444"
            : "var(--text-primary)"
          : "var(--text-muted)",
      }}
    >
      {children}
    </button>
  );
}

/* ── Role Quick-Filter Bar ────────────────────────────────────────────────── */

function RoleFilterBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const all = {
    value: "",
    label: "All Roles",
    icon: <Users size={12} />,
    color: "var(--text-secondary)",
    bg: "var(--bg-hover)",
    border: "var(--bg-border)",
  };
  const options = [all, ...CHURCH_ROLES];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        padding: "4px 0",
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: `1px solid ${active ? opt.border : "var(--bg-border)"}`,
              background: active ? opt.bg : "transparent",
              color: active ? opt.color : "var(--text-muted)",
              transition: "all 0.15s",
              outline: "none",
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Pagination Controls ──────────────────────────────────────────────────── */

function Pagination({
  page,
  totalPages,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  if (total === 0) return null;

  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase: React.CSSProperties = {
    minWidth: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid var(--bg-border)",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    transition: "all 0.12s",
    padding: "0 6px",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        padding: "14px 16px",
        borderTop: "1px solid var(--bg-border)",
      }}
    >
      {/* Left: count + page size */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {from}–{to} of{" "}
          <strong style={{ color: "var(--text-secondary)" }}>{total}</strong>{" "}
          members
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSize(Number(e.target.value));
              onPage(1);
            }}
            className="input"
            style={{ width: "auto", padding: "4px 8px", fontSize: 13 }}
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            per page
          </span>
        </div>
      </div>

      {/* Right: page buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          style={{ ...btnBase, opacity: page === 1 ? 0.35 : 1 }}
          disabled={page === 1}
          onClick={() => onPage(1)}
          title="First page"
        >
          <ChevronsLeft size={14} />
        </button>

        <button
          style={{ ...btnBase, opacity: page === 1 ? 0.35 : 1 }}
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              style={{
                ...btnBase,
                border: "none",
                cursor: "default",
                color: "var(--text-muted)",
              }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              style={{
                ...btnBase,
                background:
                  p === page ? "var(--color-gold, #ca8a04)" : "transparent",
                color: p === page ? "#fff" : "var(--text-secondary)",
                border:
                  p === page
                    ? "1px solid transparent"
                    : "1px solid var(--bg-border)",
                fontWeight: p === page ? 700 : 500,
              }}
            >
              {p}
            </button>
          ),
        )}

        <button
          style={{ ...btnBase, opacity: page === totalPages ? 0.35 : 1 }}
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>

        <button
          style={{ ...btnBase, opacity: page === totalPages ? 0.35 : 1 }}
          disabled={page === totalPages}
          onClick={() => onPage(totalPages)}
          title="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function MembersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  /* Filters */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  /* Pagination — client-side */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  /* Modals */
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  /* Reset to page 1 whenever a filter changes */
  const applyFilter = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  /**
   * Fetch ALL members matching the active filters in one request.
   * We pass a large limit so the server returns everything at once,
   * then paginate purely on the client — this guarantees the count
   * and page controls are always correct regardless of server behaviour.
   */
  const { data: allMembers = [], isLoading } = useQuery<Member[]>({
    queryKey: ["members-all", search, statusFilter, deptFilter, roleFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (statusFilter) p.set("status", statusFilter);
      if (deptFilter) p.set("departmentId", deptFilter);
      if (roleFilter) p.set("role", roleFilter);
      // Request a high limit so we get the full filtered set in one shot.
      // If your API caps at a lower number, chain multiple requests here instead.
      p.set("limit", "10000");
      p.set("page", "1");

      const res = await api.get(`/members?${p}`);

      // Handle common response shapes:
      //   { data: [...] }
      //   { data: { data: [...], pagination: {...} } }
      //   [...] (array at root)
      const raw = res.data;
      if (Array.isArray(raw)) return raw as Member[];
      if (Array.isArray(raw?.data)) return raw.data as Member[];
      if (Array.isArray(raw?.data?.data)) return raw.data.data as Member[];
      return [];
    },
    placeholderData: (prev) => prev,
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
      qc.invalidateQueries({ queryKey: ["members-all"] });
      setDeleting(null);
    },
    onError: () => toast.error("Failed to delete member"),
  });

  /* ── Client-side pagination ─────────────────────────────────────────── */
  const total = allMembers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Clamp current page if filters reduced the result set
  const safePage = Math.min(page, totalPages);

  const members = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return allMembers.slice(start, start + pageSize);
  }, [allMembers, safePage, pageSize]);

  const openEdit = (m: Member) => {
    setSelected(m);
    setShowEdit(true);
  };
  const closeEdit = () => {
    setShowEdit(false);
    setSelected(null);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-display font-bold text-3xl"
            style={{ color: "var(--text-primary)" }}
          >
            Members
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {total} registered member{total !== 1 ? "s" : ""}
            {roleFilter && (
              <span style={{ marginLeft: 6, color: "var(--text-secondary)" }}>
                · showing{" "}
                <strong>{ROLE_MAP[roleFilter]?.label ?? roleFilter}</strong>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)} className="btn-ghost">
            <Upload size={15} /> Import
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-gold">
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      {/* ── Role Quick-Filter ── */}
      <RoleFilterBar value={roleFilter} onChange={applyFilter(setRoleFilter)} />

      {/* ── Standard Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={search}
          onChange={applyFilter(setSearch)}
          placeholder="Search by name, phone, ID…"
        />

        <select
          value={statusFilter}
          onChange={(e) => applyFilter(setStatusFilter)(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {labelify(s)}
            </option>
          ))}
        </select>

        <select
          value={deptFilter}
          onChange={(e) => applyFilter(setDeptFilter)(e.target.value)}
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

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : members.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No members found"
            description="Try adjusting your filters or add a new member"
            action={
              <button onClick={() => setShowAdd(true)} className="btn-gold">
                Add Member
              </button>
            }
          />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full">
                <thead className="border-b border-bg-border">
                  <tr className="bg-bg-hover">
                    {TABLE_HEADS.map((h) => (
                      <th key={h} className="table-header text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const deptNames = getDepartmentNames(m, departments);
                    return (
                      <tr key={m._id} className="table-row">
                        {/* Member */}
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <Monogram name={`${m.firstName} ${m.lastName}`} />
                            <div>
                              <p
                                className="font-medium text-sm"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {m.firstName} {m.lastName}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {m.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="table-cell">
                          <span
                            className="font-mono text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {m.membershipId}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="table-cell">
                          <span style={{ color: "var(--text-secondary)" }}>
                            {m.phone || "—"}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="table-cell">
                          {deptNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {deptNames.map((name, i) => (
                                <DeptChip key={i} name={name} />
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* Role */}
                        <td className="table-cell">
                          <RoleBadge role={(m as any).role} />
                        </td>

                        {/* Status */}
                        <td className="table-cell">
                          <StatusPill status={m.status} />
                        </td>

                        {/* Joined */}
                        <td className="table-cell">
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {m.dateJoined
                              ? format(new Date(m.dateJoined), "yyyy-MM-dd")
                              : "—"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <ActionBtn
                              onClick={() => navigate(`/members/${m._id}`)}
                              title="View"
                            >
                              <Eye size={15} strokeWidth={1.8} />
                            </ActionBtn>
                            <ActionBtn onClick={() => openEdit(m)} title="Edit">
                              <Pencil size={15} strokeWidth={1.8} />
                            </ActionBtn>
                            <ActionBtn
                              onClick={() => setDeleting(m._id)}
                              title="Delete"
                              danger
                            >
                              <Trash2 size={15} strokeWidth={1.8} />
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <Pagination
              page={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPage={setPage}
              onPageSize={(s) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Member"
        size="lg"
      >
        <AddMemberForm
          departments={departments ?? []}
          onSuccess={() => {
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ["members-all"] });
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Import Members"
        size="lg"
      >
        <ImportMembersModal
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            setPage(1);
            qc.invalidateQueries({ queryKey: ["members-all"] });
          }}
        />
      </Modal>

      {selected && (
        <Modal
          isOpen={showEdit}
          onClose={closeEdit}
          title="Edit Member"
          size="lg"
        >
          <EditMemberForm
            member={selected}
            departments={departments ?? []}
            onSuccess={() => {
              closeEdit();
              qc.invalidateQueries({ queryKey: ["members-all"] });
            }}
            onCancel={closeEdit}
          />
        </Modal>
      )}

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Member"
        size="sm"
      >
        <p className="text-text-secondary mb-5">
          Are you sure you want to delete this member? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleting(null)} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={() => deleting && deleteMutation.mutate(deleting)}
            className="btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}