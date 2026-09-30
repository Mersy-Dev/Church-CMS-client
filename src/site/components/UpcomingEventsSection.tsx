import { Link } from 'react-router-dom';

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  startDatetime: string;
  location?: string;
  campus?: string;
  type?: string;
}

export default function UpcomingEventsSection({ events, loading }: { events: EventItem[]; loading: boolean }) {
  const fallbackEvents: EventItem[] = [
    {
      _id: 'fallback-event-1',
      title: 'Community Prayer Night',
      description: 'A night of worship, prayer, and reflection for the entire church family.',
      startDatetime: '2025-04-18T18:00:00.000Z',
      location: 'Main Sanctuary',
      campus: 'City Campus',
      type: 'prayer',
    },
    {
      _id: 'fallback-event-2',
      title: 'Youth Revival Meeting',
      description: 'A dynamic revival gathering for young adults and teens.',
      startDatetime: '2025-04-25T18:30:00.000Z',
      location: 'Youth Hall',
      campus: 'North Campus',
      type: 'revival',
    },
    {
      _id: 'fallback-event-3',
      title: 'Family Care Outreach',
      description: 'Support, counselling, and encouragement for families in need.',
      startDatetime: '2025-05-02T09:00:00.000Z',
      location: 'Community Center',
      campus: 'Central Campus',
      type: 'outreach',
    },
  ];

  const eventItems = events.length > 0 ? events : fallbackEvents;

  if (loading) {
    return (
      <section className="w-full bg-surface py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-8 xl:px-10">
          <div className="h-10 w-48 animate-pulse rounded bg-surface-container" />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1280px] px-margin">
        <div className="mb-space-lg flex flex-col gap-space-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-label-badge text-label-badge text-primary uppercase font-bold tracking-wider">Calendar</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">Upcoming Events</h2>
          </div>
          <Link to="/events" className="group inline-flex items-center gap-1 font-button-text text-button-text text-primary transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
            <span>See More Events</span>
            <span className="material-symbols-outlined text-[18px] transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-safe:group-hover:translate-x-0.5">arrow_forward</span>
          </Link>
        </div>

        <div className="grid gap-space-lg lg:grid-cols-3">
          {eventItems.map((event) => {
            const date = new Date(event.startDatetime);
            const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const day = date.getDate();
            const badge = event.type?.replace('_', ' ') || 'All Church';

            return (
              <div
                key={event._id}
                className="group flex min-h-[260px] cursor-pointer flex-col justify-between rounded-xl border border-transparent bg-surface-container-lowest p-space-lg shadow-sm transition-all duration-300 ease-out motion-safe:hover:-translate-y-1 hover:border-primary/15 hover:shadow-xl"
              >
                <div>
                  <div className="mb-space-md flex items-center justify-between">
                    <div className="rounded-lg bg-surface-container px-3 py-2 text-center transition-colors duration-300 group-hover:bg-primary">
                      <span className="block text-label-badge font-label-badge uppercase text-primary transition-colors duration-300 group-hover:text-on-primary">{month}</span>
                      <span className="block text-headline-md font-black text-on-surface transition-colors duration-300 group-hover:text-on-primary">{day}</span>
                    </div>
                    <span className="rounded-full bg-surface-container-high px-3 py-1 text-label-badge font-label-badge uppercase tracking-wider text-on-surface-variant">
                      {badge}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface transition-colors duration-300 group-hover:text-primary">{event.title}</h3>
                  <p className="mt-space-sm flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {event.location || event.campus || 'Main Sanctuary'}
                  </p>
                </div>

                <div className="mt-space-lg">
                  <button type="button" className="w-full rounded-lg bg-surface-container px-4 py-2.5 font-button-text text-button-text text-on-surface transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:bg-primary-container hover:text-on-primary hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest">
                    Register Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}