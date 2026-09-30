/**
 * TemplateVariableFiller.tsx
 *
 * Handles the "Fill Variables" step inside UseTemplateModal.
 *
 * Two categories of variables are detected automatically:
 *
 *   MERGE VARS   — person-specific fields that come from the recipient's profile.
 *                  The server resolves these per-recipient at send time.
 *                  The admin sees them as read-only "Auto" badges, not inputs.
 *                  Examples: firstName, lastName, fullName, email, phone
 *
 *   CONTEXT VARS — broadcast-level values the admin fills once.
 *                  Same value goes to every recipient.
 *                  Examples: eventName, date, venue, amount, deadline
 *
 * Props:
 *   variables    — string[] of variable names found in the template body
 *   body         — raw template body (used for live preview)
 *   subject      — optional subject line (also previewed)
 *   onChange     — called whenever context var values change
 *   contextValues — controlled state from parent
 */

import { useState } from "react";
import { UserCheck, Settings2, Eye, EyeOff, Info } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

// Variables that are ALWAYS resolved from the recipient's profile on the server.
// Admin never needs to type these — mark them as Auto.
const MERGE_VAR_NAMES = new Set([
  "firstName", "lastName", "fullName",
  "email", "phone", "memberCode",
  "department", "role", "joinDate",
]);

// Friendly label for each known merge var so the UI is self-explanatory
const MERGE_VAR_LABELS: Record<string, string> = {
  firstName:  "Recipient's first name",
  lastName:   "Recipient's last name",
  fullName:   "Recipient's full name",
  email:      "Recipient's email address",
  phone:      "Recipient's phone number",
  memberCode: "Unique member code",
  department: "Recipient's department",
  role:       "Recipient's role",
  joinDate:   "Date they joined",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  variables:     string[];
  body:          string;
  subject?:      string;
  contextValues: Record<string, string>;
  onChange:      (values: Record<string, string>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TemplateVariableFiller({
  variables,
  body,
  subject,
  contextValues,
  onChange,
}: Props) {
  const [showPreview, setShowPreview] = useState(false);

  // Split variables into the two categories
  const mergeVars   = variables.filter((v) => MERGE_VAR_NAMES.has(v));
  const contextVars = variables.filter((v) => !MERGE_VAR_NAMES.has(v));

  const hasAnyVars    = variables.length > 0;
  const hasContextVars = contextVars.length > 0;

  // Build a live preview — merge vars shown as [firstName], context vars substituted
  const buildPreview = (text: string) =>
    variables.reduce((out, v) => {
      const replacement = MERGE_VAR_NAMES.has(v)
        ? `[${v}]`                            // placeholder — server fills per recipient
        : contextValues[v] || `{${v}}`;       // admin's typed value, or empty marker
      return out.split(`{{${v}}}`).join(replacement);
    }, text);

  const previewBody    = buildPreview(body);
  const previewSubject = subject ? buildPreview(subject) : undefined;

  const setVar = (key: string, value: string) =>
    onChange({ ...contextValues, [key]: value });

  // Nothing to fill at all
  if (!hasAnyVars) return null;

  return (
    <div className="space-y-4">

      {/* ── Merge vars (auto) ────────────────────────────────────────────── */}
      {mergeVars.length > 0 && (
        <div>
          <SectionHeading
            icon={<UserCheck size={13} className="text-green-400" />}
            title="Auto-filled from recipient profile"
            subtitle="Server resolves these per recipient at send time"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {mergeVars.map((v) => (
              <MergeVarBadge key={v} name={v} label={MERGE_VAR_LABELS[v]} />
            ))}
          </div>
        </div>
      )}

      {/* ── Context vars (admin fills) ───────────────────────────────────── */}
      {hasContextVars && (
        <div>
          <SectionHeading
            icon={<Settings2 size={13} className="text-gold" />}
            title="Fill in once — same for all recipients"
            subtitle="These are broadcast-level values you provide"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {contextVars.map((v) => (
              <ContextVarInput
                key={v}
                name={v}
                value={contextValues[v] ?? ""}
                onChange={(val) => setVar(v, val)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Live preview toggle ──────────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: showPreview ? "#DAA520" : "var(--text-muted)" }}
        >
          {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
          {showPreview ? "Hide preview" : "Preview message"}
        </button>

        {showPreview && (
          <div
            className="mt-2 rounded-xl p-4 space-y-2.5"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs pb-2 border-b border-white/5">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded" style={{ background: "rgba(52,211,153,0.25)" }} />
                <span style={{ color: "var(--text-muted)" }}>Auto (per recipient)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded" style={{ background: "rgba(218,165,32,0.2)" }} />
                <span style={{ color: "var(--text-muted)" }}>Your value</span>
              </span>
            </div>

            {previewSubject && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Subject:{" "}
                <HighlightedText
                  text={previewSubject}
                  mergeVars={mergeVars}
                  contextVars={contextVars}
                  contextValues={contextValues}
                />
              </p>
            )}

            <div
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-secondary)" }}
            >
              <HighlightedText
                text={previewBody}
                mergeVars={mergeVars}
                contextVars={contextVars}
                contextValues={contextValues}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function MergeVarBadge({ name, label }: { name: string; label?: string }) {
  const [tip, setTip] = useState(false);

  return (
    <div className="relative">
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
        style={{
          background: "rgba(52,211,153,0.10)",
          color: "#34d399",
          border: "1px solid rgba(52,211,153,0.25)",
        }}
      >
        {`{{${name}}}`}
        <span
          className="text-xs font-sans font-semibold px-1 rounded"
          style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
        >
          Auto
        </span>
        {label && (
          <button
            type="button"
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            <Info size={10} />
          </button>
        )}
      </div>
      {/* Tooltip */}
      {tip && label && (
        <div
          className="absolute bottom-full left-0 mb-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap z-50 shadow-xl"
          style={{
            background: "var(--bg-card, #1a1a2e)",
            border: "1px solid rgba(52,211,153,0.25)",
            color: "var(--text-secondary)",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function ContextVarInput({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Human-readable label from camelCase: "eventName" → "Event Name"
  const label = name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  // Guess input type from variable name
  const inputType =
    /date|at|on|time/i.test(name)   ? "date"   :
    /amount|price|cost|fee/i.test(name) ? "number" :
    "text";

  const isFilled = value.trim().length > 0;

  return (
    <div>
      <label
        className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        <span
          className="font-mono text-xs px-1.5 py-0.5 rounded"
          style={{ background: "rgba(218,165,32,0.1)", color: "#DAA520" }}
        >
          {`{{${name}}}`}
        </span>
        {label}
        {!isFilled && (
          <span className="text-red-400 text-xs font-normal ml-auto">Required</span>
        )}
      </label>
      <input
        type={inputType}
        className="w-full rounded-lg border text-sm px-3 py-2 transition-all focus:outline-none"
        placeholder={`Enter ${label.toLowerCase()}…`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          borderColor: isFilled ? "rgba(218,165,32,0.4)" : "var(--bg-border, #333)",
          background:  isFilled ? "rgba(218,165,32,0.04)" : "var(--bg-input, rgba(255,255,255,0.04))",
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
}

/**
 * Renders a string with merge-var placeholders highlighted green
 * and filled context-var values highlighted gold.
 * Unfilled context vars show the raw marker in red so the admin notices.
 */
function HighlightedText({
  text,
  mergeVars,
  contextVars,
  contextValues,
}: {
  text: string;
  mergeVars: string[];
  contextVars: string[];
  contextValues: Record<string, string>;
}) {
  // Build a regex that matches any substituted token
  const mergeTokens   = mergeVars.map((v) => `\\[${v}\\]`);
  const contextFilled = contextVars.filter((v) => contextValues[v]);
  const contextEmpty  = contextVars.filter((v) => !contextValues[v]);

  const filledTokens = contextFilled.map((v) =>
    contextValues[v].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const emptyTokens = contextEmpty.map((v) => `\\{${v}\\}`);

  const allPatterns = [...mergeTokens, ...filledTokens, ...emptyTokens];
  if (!allPatterns.length) return <span>{text}</span>;

  const regex = new RegExp(`(${allPatterns.join("|")})`, "g");
  const parts  = text.split(regex);

  const mergeSet   = new Set(mergeVars.map((v) => `[${v}]`));
  const emptySet   = new Set(contextEmpty.map((v) => `{${v}}`));

  return (
    <>
      {parts.map((part, i) => {
        if (mergeSet.has(part)) {
          return (
            <mark key={i} style={{ background: "rgba(52,211,153,0.18)", color: "#34d399", borderRadius: "3px", padding: "0 2px" }}>
              {part}
            </mark>
          );
        }
        if (emptySet.has(part)) {
          return (
            <mark key={i} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: "3px", padding: "0 2px" }}>
              {part}
            </mark>
          );
        }
        if (contextFilled.some((v) => contextValues[v] === part)) {
          return (
            <mark key={i} style={{ background: "rgba(218,165,32,0.18)", color: "#DAA520", borderRadius: "3px", padding: "0 2px" }}>
              {part}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}