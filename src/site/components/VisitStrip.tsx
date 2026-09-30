export default function VisitStrip() {
  return (
    <section className="relative z-20 mx-auto -mt-6 w-full max-w-6xl px-margin-mobile sm:-mt-10 md:-mt-16 md:px-margin">
      <div className="grid items-center gap-gutter rounded-xl bg-surface-container-lowest p-space-md shadow-xl sm:p-space-lg md:grid-cols-12 md:p-space-xl">
        <div className="md:col-span-8 flex flex-col gap-space-sm">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="inline-flex items-center rounded-full bg-secondary-fixed px-3 py-1 text-label-badge font-label-badge text-on-secondary-fixed font-semibold tracking-wider">VISIT US</span>
            <span className="font-caption text-caption text-on-surface-variant flex items-center gap-1.5 font-medium"><span className="material-symbols-outlined text-[18px] text-secondary">location_on</span> Samonda, Ibadan</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm sm:font-headline-md sm:text-headline-md text-on-surface font-bold">Join us on Sundays &amp; Midweek</h3>
          <p className="font-body-sm text-body-sm sm:font-body-md sm:text-body-md text-on-surface-variant leading-relaxed">Encounter divine presence, fellowship, and prophetic teachings every single week.</p>

          <div className="grid grid-cols-1 gap-space-sm pt-space-xs sm:grid-cols-2">
            <div className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm sm:p-space-md">
              <span className="material-symbols-outlined mt-0.5 text-[22px] sm:text-[26px] text-primary">calendar_month</span>
              <div className="flex flex-col">
                <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant font-semibold">Midweek Service</span>
                <span className="font-body-sm sm:font-body-md text-body-sm sm:text-body-md font-semibold text-on-surface">Wednesday, 06:00 PM WAT</span>
              </div>
            </div>
            <div className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm sm:p-space-md">
              <span className="material-symbols-outlined mt-0.5 text-[22px] sm:text-[26px] text-primary">light_mode</span>
              <div className="flex flex-col">
                <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant font-semibold">Sunday Celebration</span>
                <span className="font-body-sm sm:font-body-md text-body-sm sm:text-body-md font-semibold text-on-surface">Sunday, 08:30 AM WAT</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-space-sm inline-flex w-full items-center justify-center gap-space-sm rounded-lg bg-secondary px-space-lg py-space-sm font-body-sm sm:font-body-md text-body-sm sm:text-body-md font-semibold text-on-secondary shadow-sm transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest sm:w-fit"
          >
            Get Directions
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">near_me</span>
          </button>
        </div>

        <div className="md:col-span-4">
          <div
            className="h-[160px] sm:h-[200px] md:h-[240px] rounded-lg bg-cover bg-center shadow-sm"
            style={{
              backgroundImage:
                'url("https://res.cloudinary.com/mersy-dev/image/upload/f_auto,q_auto/v1790335496/churchos/church4_r4ytl6.heic")',
            }}
          />
        </div>
      </div>
    </section>
  );
}