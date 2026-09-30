/**
 * ChurchOS — src/pages/members/ImportMembersModal.tsx
 * Bulk import members from XLSX / CSV.
 */

import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

interface ImportError {
  row: number;
  reason: string;
  data: Record<string, any>;
}

interface ImportResult {
  totalRows: number;
  created: number;
  skipped: number;
  alreadyExists: number; // ← ad  d
  errors: ImportError[];
  skippedHeaders: string[];
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportMembersModal({ onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const downloadTemplate = async () => {
    try {
      const res = await api.get("/members/import/template", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "churchos_member_import_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleFile = useCallback((f: File) => {
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (![".xlsx", ".xls", ".csv"].includes(ext)) {
      toast.error("Only .xlsx, .xls, or .csv files are accepted");
      return;
    }
    setFile(f);
    setResult(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const importMutation = useMutation({
    mutationFn: async (f: File) => {
      const form = new FormData();
      form.append("file", f);
      const res = await api.post("/members/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // ← 2 minutes for bulk imports
      });
      return res.data.data as ImportResult;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.created > 0) {
        toast.success(
          `${data.created} member${data.created !== 1 ? "s" : ""} imported!`,
        );
        onSuccess();
      } else {
        toast.error("No members were created. Check errors below.");
      }
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Import failed"),
  });

  const reset = () => {
    setFile(null);
    setResult(null);
    setShowErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Step 1: Download template ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderRadius: 12,
          background: "var(--bg-hover)",
          border: "1px solid var(--bg-border)",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
            }}
          >
            <FileSpreadsheet size={17} style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 2px",
              }}
            >
              Step 1 — Download the template
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              Fill it in with your member data, then upload below
            </p>
          </div>
        </div>
        <button
          onClick={downloadTemplate}
          className="btn-ghost"
          style={{ flexShrink: 0, padding: "5px 12px", fontSize: 12 }}
        >
          <Download size={13} /> Template
        </button>
      </div>

      {/* ── Step 2: Upload ─────────────────────────────────────────────────── */}
      <div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Step 2 — Upload your filled file
        </p>

        {!file ? (
          /* Drop zone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "36px 20px",
              borderRadius: 12,
              cursor: "pointer",
              border: `2px dashed ${dragOver ? "var(--gold)" : "var(--bg-border)"}`,
              background: dragOver ? "rgba(212,160,23,0.04)" : "transparent",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-hover)",
                border: "1px solid var(--bg-border)",
              }}
            >
              <Upload size={20} style={{ color: "var(--text-muted)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  margin: "0 0 4px",
                }}
              >
                Drag & drop your file here
              </p>
              <p
                style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}
              >
                or click to browse — .xlsx, .xls, .csv accepted
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          /* File selected */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--bg-hover)",
              border: "1px solid var(--bg-border)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-card)",
                border: "1px solid var(--bg-border)",
              }}
            >
              <FileSpreadsheet
                size={18}
                style={{ color: "var(--text-secondary)" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  margin: "0 0 2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </p>
              <p
                style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}
              >
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={reset}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Result summary ─────────────────────────────────────────────────── */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            {/* Total */}
            <div
              style={{
                padding: "12px 10px",
                borderRadius: 10,
                textAlign: "center",
                background: "var(--bg-hover)",
                border: "1px solid var(--bg-border)",
              }}
            >
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: "0 0 2px",
                }}
              >
                {result.totalRows}
              </p>
              <p
                style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}
              >
                Total Rows
              </p>
            </div>

            {/* Created — gold tint on success */}
            <div
              style={{
                padding: "12px 10px",
                borderRadius: 10,
                textAlign: "center",
                background:
                  result.created > 0
                    ? "rgba(212,160,23,0.06)"
                    : "var(--bg-hover)",
                border: `1px solid ${result.created > 0 ? "rgba(212,160,23,0.25)" : "var(--bg-border)"}`,
              }}
            >
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  margin: "0 0 2px",
                  color:
                    result.created > 0 ? "var(--gold)" : "var(--text-primary)",
                }}
              >
                {result.created}
              </p>
              <p
                style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}
              >
                Created
              </p>
            </div>

            {/* Skipped */}
            <div
              style={{
                padding: "12px 10px",
                borderRadius: 10,
                textAlign: "center",
                background:
                  result.skipped > 0
                    ? "rgba(239,68,68,0.05)"
                    : "var(--bg-hover)",
                border: `1px solid ${result.skipped > 0 ? "rgba(239,68,68,0.2)" : "var(--bg-border)"}`,
              }}
            >
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  margin: "0 0 2px",
                  color: result.skipped > 0 ? "#f87171" : "var(--text-primary)",
                }}
              >
                {result.skipped}
              </p>
              <p
                style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}
              >
                Skipped
              </p>
            </div>

            {/* Already Exists */}
            <div
              style={{
                padding: "12px 10px",
                borderRadius: 10,
                textAlign: "center",
                background:
                  result.alreadyExists > 0
                    ? "rgba(99,102,241,0.05)"
                    : "var(--bg-hover)",
                border: `1px solid ${result.alreadyExists > 0 ? "rgba(99,102,241,0.2)" : "var(--bg-border)"}`,
              }}
            >
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  margin: "0 0 2px",
                  color:
                    result.alreadyExists > 0
                      ? "#818cf8"
                      : "var(--text-primary)",
                }}
              >
                {result.alreadyExists ?? 0}
              </p>
              <p
                style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}
              >
                Already Exist
              </p>
            </div>
          </div>

          {/* Unrecognised headers warning */}
          {result.skippedHeaders.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--bg-hover)",
                border: "1px solid var(--bg-border)",
              }}
            >
              <AlertTriangle
                size={13}
                style={{
                  color: "var(--text-muted)",
                  marginTop: 1,
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                <span style={{ fontWeight: 600 }}>Ignored columns: </span>
                {result.skippedHeaders.join(", ")}
              </p>
            </div>
          )}

          {/* Per-row errors collapsible */}
          {result.errors.length > 0 && (
            <div
              style={{
                borderRadius: 10,
                border: "1px solid var(--bg-border)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setShowErrors((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--bg-hover)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#f87171",
                  }}
                >
                  <XCircle size={13} />
                  {result.errors.length} row
                  {result.errors.length !== 1 ? "s" : ""} had errors
                </span>
                {showErrors ? (
                  <ChevronUp size={13} style={{ color: "var(--text-muted)" }} />
                ) : (
                  <ChevronDown
                    size={13}
                    style={{ color: "var(--text-muted)" }}
                  />
                )}
              </button>

              {showErrors && (
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {result.errors.map((err, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 14px",
                        borderTop: "1px solid var(--bg-border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            padding: "1px 6px",
                            borderRadius: 4,
                            flexShrink: 0,
                            background: "rgba(239,68,68,0.1)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.2)",
                          }}
                        >
                          Row {err.row}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {err.reason}
                        </span>
                      </div>
                      {(err.data.firstName || err.data.lastName) && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            margin: "4px 0 0 54px",
                          }}
                        >
                          {[err.data.firstName, err.data.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All good */}
          {result.errors.length === 0 && result.created > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(212,160,23,0.06)",
                border: "1px solid rgba(212,160,23,0.2)",
              }}
            >
              <CheckCircle2
                size={13}
                style={{ color: "var(--gold)", flexShrink: 0 }}
              />
              <p
                style={{
                  fontSize: 12,
                  color: "var(--gold)",
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                All rows imported successfully!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          paddingTop: 4,
        }}
      >
        <button onClick={onClose} className="btn-ghost">
          {result ? "Close" : "Cancel"}
        </button>
        {!result && (
          <button
            onClick={() => file && importMutation.mutate(file)}
            disabled={!file || importMutation.isPending}
            className="btn-gold"
            style={{
              opacity: !file || importMutation.isPending ? 0.5 : 1,
              cursor:
                !file || importMutation.isPending ? "not-allowed" : "pointer",
            }}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Upload size={14} /> Import Members
              </>
            )}
          </button>
        )}
        {result && result.skipped > 0 && (
          <button onClick={reset} className="btn-gold">
            <Upload size={14} /> Import Another File
          </button>
        )}
      </div>
    </div>
  );
}
