import { Link } from 'react-router-dom';

export default function GiveCtaBanner() {
  return (
    <section className="relative overflow-hidden bg-primary py-space-3xl text-center text-on-primary">
      <div className="mx-auto max-w-[1280px] px-margin">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-tertiary-fixed">
          <span className="material-symbols-outlined text-[32px]">volunteer_activism</span>
        </div>
        <h2 className="mx-auto mt-space-lg max-w-3xl font-headline-md text-headline-md font-bold leading-relaxed text-on-primary">
          Partner with God’s Work — Every Seed Sown Expands the Kingdom
        </h2>
        <p className="mx-auto mt-space-md max-w-2xl font-body-lg text-body-lg leading-relaxed text-primary-fixed">
          Your faithful generosity fuels community outreaches, empowers missions, and builds transformed lives across our city and beyond.
        </p>
        <div className="mt-space-xl">
          <Link to="/give" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-10 py-4 font-button-text text-button-text text-on-secondary shadow-lg transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
            <span>Give Now</span>
            <span className="material-symbols-outlined text-[20px]">favorite</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
