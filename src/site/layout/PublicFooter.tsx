import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="w-full bg-inverse-surface text-inverse-on-surface">
      <div className="mx-auto max-w-[1280px] px-margin pb-8 pt-12">
        <div className="grid gap-space-xl md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-xs text-headline-xs tracking-tight text-surface-container-lowest">MIV Word House</span>
            </div>
            <p className="font-body-sm text-body-sm leading-relaxed text-surface-variant/90">
              Behind Accord Building, Obadeyi Estate, Samonda, Ibadan
            </p>
            <div className="space-y-2 font-body-sm text-body-sm text-surface-variant">
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">mail</span><span>info@mivwordhouse.org</span></div>
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">call</span><span>+234 800 000 0000</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm">
            <h4 className="font-headline-xs text-headline-xs text-surface-container-lowest">Quick Links</h4>
            <nav className="flex flex-col gap-2 font-body-sm text-body-sm text-surface-variant">
              <Link to="/im-new" className="transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface">I'm New</Link>
              <Link to="/ministries" className="transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface">Ministries</Link>
              <Link to="/radio" className="transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface">Stream</Link>
              <Link to="/fellowship" className="transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface">Fellowship</Link>
              <Link to="/sermons" className="transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface">Sermons</Link>
            </nav>
          </div>

          <div className="flex flex-col gap-space-sm">
            <h4 className="font-headline-xs text-headline-xs text-surface-container-lowest">Resources</h4>
            <nav className="flex flex-col gap-2 font-body-sm text-body-sm text-surface-variant">
              <Link to="/about" className="transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface">About</Link>
              <Link to="/blog" className="transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface">Resources</Link>
              <Link to="/contact" className="transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface">Contact</Link>
              <Link to="/pray-for-me" className="transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface">Prayer Request</Link>
            </nav>
          </div>

          <div className="flex flex-col gap-space-sm">
            <h4 className="font-headline-xs text-headline-xs text-surface-container-lowest">Follow Us</h4>
            <p className="font-body-sm text-body-sm text-surface-variant">Connect with our global community across digital sanctuaries and channels.</p>
            <div className="flex items-center gap-2">
              {['live_tv', 'podcasts', 'groups', 'calendar_month'].map((icon) => (
                <a key={icon} href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high/10 text-surface-container-lowest transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface" aria-label={icon}>
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-space-2xl border-t border-white/10 pt-space-lg text-center font-body-sm text-body-sm text-surface-variant">
          © 2025 MIV Word House. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
