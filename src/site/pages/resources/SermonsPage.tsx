import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import publicApi from "../../lib/public.api";
import Spinner from "../../../components/ui/Spinner";
import EmptyState from "../../../components/ui/EmptyState";

type Sermon = {
  _id: string;
  title: string;
  speaker?: string;
  series?: string;
  programme?: string;
  preachedDate?: string;
  datePreached?: string;
  youtubePublishedAt?: string;
  thumbnailUrl?: string;
  youtubeThumbnailUrl?: string;
  audioUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: "audio" | "video" | "both" | "none";
};

const DEFAULT_LIMIT = 9;

// Placeholder sermons shown ONLY when the backend returns an empty list.
// Shaped exactly like the real Sermon type from /online-ministry/sermons/public,
// so this has zero effect once real data starts coming through —
// items.length > 0 will always be preferred, this array just sits unused.
const fallbackSermons: Sermon[] = [
  {
    _id: "fallback-sermon-1",
    title: "Walking in Faith: Trusting God in Uncertain Times",
    speaker: "Pastor Ope Rowland",
    series: "Discipleship",
    programme: "Sunday Service",
    preachedDate: "2025-03-14T10:00:00.000Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80",
    videoUrl: "#",
    audioUrl: "#",
    mediaType: "both",
  },
  {
    _id: "fallback-sermon-2",
    title: "Welcome to the Family of God",
    speaker: "Rev. Mercy Adebayo",
    series: "New Believers",
    programme: "Midweek Service",
    preachedDate: "2025-03-07T10:00:00.000Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=800&q=80",
    videoUrl: "#",
    mediaType: "video",
  },
  {
    _id: "fallback-sermon-3",
    title: "The Power of Prayer: Connecting with God Daily",
    speaker: "Pastor Daniel Okafor",
    series: "Prayer Life",
    programme: "Sunday Service",
    preachedDate: "2025-02-28T10:00:00.000Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
    audioUrl: "#",
    mediaType: "audio",
  },
  {
    _id: "fallback-sermon-4",
    title: "Living with Purpose: God's Plan for Your Life",
    speaker: "Pastor James Osei",
    series: "Standing Strong",
    programme: "Sunday Service",
    preachedDate: "2025-02-21T10:00:00.000Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
    videoUrl: "#",
    audioUrl: "#",
    mediaType: "both",
  },
  {
    _id: "fallback-sermon-5",
    title: "Love of God and Love of Neighbour",
    speaker: "Pastor Ope Rowland",
    series: "Discipleship",
    programme: "Midweek Service",
    preachedDate: "2025-02-14T10:00:00.000Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=800&q=80",
    videoUrl: "#",
    mediaType: "video",
  },
  {
    _id: "fallback-sermon-6",
    title: "The Creation Waits with Eager Longing",
    speaker: "Rev. Mercy Adebayo",
    series: "Standing Strong",
    programme: "Sunday Service",
    preachedDate: "2025-02-09T10:00:00.000Z",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1665397858118-1a66a692407c?auto=format&fit=crop&w=800&q=80",
    audioUrl: "#",
    mediaType: "audio",
  },
];

function formatDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d || "";
  }
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function SermonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Sermon[]>([]);
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [limit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    series: "",
    speaker: "",
    programme: "",
    mediaType: "all",
    period: "all",
  });

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      series: searchParams.get("series") || "",
      speaker: searchParams.get("speaker") || "",
      programme: searchParams.get("programme") || "",
      mediaType: searchParams.get("mediaType") || "all",
      period: searchParams.get("period") || "all",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchList();
  }, [page, filters]);
  useEffect(() => {
    setSearchParams(buildQueryParams({ page, limit, filters }) as any);
  }, [page, filters, setSearchParams]);

  function buildQueryParams({
    page,
    limit,
    filters,
  }: {
    page: number;
    limit: number;
    filters: any;
  }) {
    const q: any = { page: String(page), limit: String(limit) };
    if (filters.series) q.series = filters.series;
    if (filters.speaker) q.speaker = filters.speaker;
    if (filters.programme) q.programme = filters.programme;
    if (filters.mediaType && filters.mediaType !== "all")
      q.mediaType = filters.mediaType;
    if (filters.period && filters.period !== "all") {
      const now = new Date();
      let from: Date | null = null;
      if (filters.period === "this_month")
        from = new Date(now.getFullYear(), now.getMonth(), 1);
      if (filters.period === "last_3")
        from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      if (filters.period === "this_year")
        from = new Date(now.getFullYear(), 0, 1);
      if (from) {
        q.dateFrom = from.toISOString();
        q.dateTo = now.toISOString();
      }
    }
    return q;
  }

  async function fetchList() {
    setLoading(true);
    try {
      const q = buildQueryParams({ page, limit, filters });
      const res = await publicApi.get("/online-ministry/sermons/public", {
        params: q,
      });
      const json = res.data;
      setItems(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch (err) {
      console.error("list fetch", err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  // Use real API data whenever it's present; otherwise show placeholder
  // sermons so the page has something to preview while the backend is
  // still empty. This line is the ONLY integration point — nothing else
  // about the fetch logic changes.
  const displayItems = items.length > 0 ? items : fallbackSermons;
  const usingFallback = items.length === 0;

  const seriesOptions = useMemo(
    () =>
      Array.from(
        new Set(displayItems.map((i) => i.series || "").filter(Boolean)),
      ),
    [displayItems],
  );
  const speakerOptions = useMemo(
    () =>
      Array.from(
        new Set(displayItems.map((i) => i.speaker || "").filter(Boolean)),
      ),
    [displayItems],
  );
  const programmeOptions = useMemo(
    () =>
      Array.from(
        new Set(displayItems.map((i) => i.programme || "").filter(Boolean)),
      ),
    [displayItems],
  );

  function updateFilter(key: string, value: string) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function onPageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  return (
    <div>
      {/* HERO */}
      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-inverse-surface">
        <div
          className="absolute inset-0 bg-cover opacity-60"
          style={{
            backgroundImage:
              'url("https://res.cloudinary.com/mersy-dev/image/upload/f_auto,q_auto/v1790335495/churchos/pastor2_iu13b8.heic")',
            backgroundPosition: "center 20%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-inverse-surface/60 to-inverse-surface/20" />

        <div className="relative mx-auto flex min-h-[280px] sm:min-h-[360px] lg:min-h-[440px] max-w-[1280px] flex-col justify-center px-margin-mobile py-space-4xl sm:px-margin sm:py-space-5xl lg:py-space-6xl">
          <h1 className="font-headline-xl text-headline-xl sm:text-[3.25rem] font-black uppercase tracking-tight text-on-primary leading-none">
            Latest Sermons
          </h1>
          <div className="mt-space-sm flex items-center gap-2 font-label-badge text-label-badge uppercase tracking-wider text-on-primary/70">
            <span>Home</span>
            <span className="opacity-60">|</span>
            <span>Latest Sermons</span>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="w-full bg-surface-container-low py-space-md">
        <div className="mx-auto max-w-[1280px] px-margin-mobile sm:px-margin flex flex-wrap items-center gap-3">
          <select
            value={filters.series}
            onChange={(e) => updateFilter("series", e.target.value)}
            className="rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-surface-container-lowest"
          >
            <option value="">All Series</option>
            {seriesOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.speaker}
            onChange={(e) => updateFilter("speaker", e.target.value)}
            className="rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-surface-container-lowest"
          >
            <option value="">All Preachers</option>
            {speakerOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.programme}
            onChange={(e) => updateFilter("programme", e.target.value)}
            className="rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-surface-container-lowest"
          >
            <option value="">All Programmes</option>
            {programmeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.period}
            onChange={(e) => updateFilter("period", e.target.value)}
            className="rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-surface-container-lowest"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_3">Last 3 Months</option>
            <option value="this_year">This Year</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <label className="font-caption text-caption text-on-surface-variant">
              Media:
            </label>
            <button
              onClick={() => updateFilter("mediaType", "all")}
              className={`rounded-lg px-3 py-2 text-body-sm ${filters.mediaType === "all" ? "bg-primary-container text-on-primary" : "bg-surface-container"}`}
            >
              All
            </button>
            <button
              onClick={() => updateFilter("mediaType", "video")}
              className={`rounded-lg px-3 py-2 text-body-sm ${filters.mediaType === "video" ? "bg-primary-container text-on-primary" : "bg-surface-container"}`}
            >
              Video
            </button>
            <button
              onClick={() => updateFilter("mediaType", "audio")}
              className={`rounded-lg px-3 py-2 text-body-sm ${filters.mediaType === "audio" ? "bg-primary-container text-on-primary" : "bg-surface-container"}`}
            >
              Audio
            </button>
          </div>
        </div>
      </section>

      {/* SERMON GRID */}
      <section className="w-full py-space-2xl bg-surface">
        <div className="mx-auto max-w-[1280px] px-margin-mobile sm:px-margin">
          {usingFallback && (
            <div className="mb-space-md rounded-lg bg-tertiary-container/20 px-4 py-2 text-body-sm text-on-surface-variant">
              Showing sample sermons — connect the backend to display real
              content here.
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-space-xl">
              <Spinner size="lg" />
            </div>
          ) : null}
          {!loading && displayItems.length === 0 ? (
            <EmptyState
              title="No sermons match these filters yet."
              description="Try adjusting the filters above."
            />
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-xl">
            {displayItems.map((s) => (
              <article key={s._id} className="group flex flex-col">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-sm">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${s.youtubeThumbnailUrl || s.thumbnailUrl || "/assets/sermon-fallback.jpg"})`,
                    }}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary shadow-md">
                      <span className="material-symbols-outlined text-[18px]">
                        music_note
                      </span>
                    </span>
                    {(s.mediaType === "video" || s.mediaType === "both") &&
                    s.videoUrl ? (
                      <a
                        href={s.videoUrl}
                        title="Watch video"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary shadow-md"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          videocam
                        </span>
                      </a>
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary-container/60 text-on-tertiary shadow-md">
                        <span className="material-symbols-outlined text-[18px]">
                          videocam
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-space-sm">
                  <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant">
                    {formatDate(
                      s.preachedDate || s.datePreached || s.youtubePublishedAt,
                    )}
                  </span>
                  <Link to={`/sermons/${s._id}`}>
                    <h3 className="font-headline-xs text-headline-xs font-bold text-on-surface mt-1 line-clamp-2 hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                  </Link>
                  <div className="mt-space-sm flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary text-[10px] font-bold">
                      {initials(s.speaker)}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {s.speaker}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-space-2xl flex justify-center items-center gap-3">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-outline-variant px-4 py-2 bg-surface-container disabled:opacity-40"
            >
              Prev
            </button>
            <div className="font-caption text-caption">Page {page}</div>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={usingFallback || page * limit >= total}
              className="rounded-lg border border-outline-variant px-4 py-2 bg-surface-container disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
