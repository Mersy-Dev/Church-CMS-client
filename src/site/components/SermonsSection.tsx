import { Link } from 'react-router-dom';

interface SermonItem {
  _id: string;
  title: string;
  speaker: string;
  series?: string;
  preachedDate?: string;
  thumbnailUrl?: string;
  media?: Array<{ url?: string; type?: 'audio' | 'video'; platform?: string }>;
}

export default function SermonsSection({ sermons, loading }: { sermons: SermonItem[]; loading: boolean }) {
  const fallbackSermons: SermonItem[] = [
    {
      _id: 'fallback-sermon-1',
      title: 'Living in the Light of Grace',
      speaker: 'Pastor Daniel Okafor',
      series: 'Discipleship',
      preachedDate: '2025-03-14T10:00:00.000Z',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=800&q=80',
    },
    {
      _id: 'fallback-sermon-2',
      title: 'The Power of Persistent Prayer',
      speaker: 'Rev. Mercy Adebayo',
      series: 'Prayer Life',
      preachedDate: '2025-03-07T10:00:00.000Z',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=800&q=80',
    },
    {
      _id: 'fallback-sermon-3',
      title: 'Fearless Faith in Uncertain Times',
      speaker: 'Pastor James Osei',
      series: 'Standing Strong',
      preachedDate: '2025-02-28T10:00:00.000Z',
      thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    },
    {
      _id: 'fallback-sermon-4',
      title: 'Walking in Kingdom Identity',
      speaker: 'Pastor Ope Rowland',
      series: 'Discipleship',
      preachedDate: '2025-02-21T10:00:00.000Z',
      thumbnailUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const sermonItems = sermons.length > 0 ? sermons : fallbackSermons;

  if (loading) {
    return (
      <section className="w-full bg-surface-container-low py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-8 xl:px-10">
          <div className="h-10 w-48 animate-pulse rounded bg-surface-container" />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-surface-container-low py-space-3xl">
      <div className="mx-auto max-w-[1280px] px-margin flex flex-col items-center">
        <div className="text-center max-w-2xl mb-space-2xl">
          <h2 className="font-headline-lg text-headline-xl text-primary font-bold">Sermons</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
            Current Series: <span className="font-semibold text-on-surface">Discipleship</span> · Last Sermon: <span className="font-semibold text-on-surface">{sermonItems[0]?.title ?? 'Latest sermon'}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg w-full">
          {sermonItems.map((sermon) => (
            <article key={sermon._id} className="group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 ease-out motion-safe:hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]">
              <div className="relative aspect-video w-full overflow-hidden">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-300 ease-out motion-safe:group-hover:scale-105 group-hover:scale-105"
                  style={{
                    backgroundImage: sermon.thumbnailUrl
                      ? `url(${sermon.thumbnailUrl})`
                      : 'url("https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=800&q=80")',
                  }}
                />
                {sermon.series && (
                  <span className="absolute left-3 top-3 rounded-full bg-primary-container px-2.5 py-0.5 text-label-badge font-label-badge text-on-primary uppercase font-semibold">
                    {sermon.series}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-space-lg">
                <span className="font-caption text-caption text-secondary font-semibold">Series: {sermon.series || 'Discipleship'}</span>
                <h3 className="font-headline-xs text-headline-xs text-on-surface font-bold mt-1 line-clamp-1">{sermon.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{sermon.speaker}</p>

                <div className="mt-auto flex items-center justify-between pt-space-md">
                  <span className="font-caption text-caption text-outline">{sermon.preachedDate ? new Date(sermon.preachedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                  <Link to="/radio" className="group inline-flex items-center gap-1 font-button-text text-caption text-primary font-bold transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest">
                    <span>Watch</span>
                    <span className="material-symbols-outlined text-[14px] transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-safe:group-hover:translate-x-0.5">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/sermons" className="inline-flex items-center justify-center rounded-lg bg-primary-container px-8 py-3.5 font-button-text text-button-text text-on-primary shadow-sm transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-lg hover:bg-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest">
            See More Sermons
          </Link>
        </div>
      </div>
    </section>
  );
}