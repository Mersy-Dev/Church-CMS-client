import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const ministriesLinks = [
  { label: 'Signs & Wonders', to: '/ministries/signs-and-wonders' },
  { label: 'Metro Meet', to: '/ministries/metro-meet' },
  { label: 'Street Church', to: '/ministries/street-church' },
  { label: 'Acada Clinic', to: '/ministries/acada-clinic' },
  { label: 'Shiftings and Turnings', to: '/ministries/shiftings-and-turnings' },
];

const resourcesLinks = [
  { label: 'Sermon', to: '/sermons' },
  { label: 'Sermon Video', to: '/sermons/video' },
  { label: 'Blog', to: '/blog' },
  { label: 'Event', to: '/events' },
  { label: 'Devotional', to: '/devotional' },
  { label: 'Testimonies', to: '/testimonies' },
];

const streamLinks = [
  { label: 'Radio', to: '/radio' },
  { label: 'Tv', to: '/tv' },
];

const contactLinks = [
  { label: 'Contact us', to: '/contact' },
  { label: 'Pray for me', to: '/pray-for-me' },
];

const topLevelLinks: Array<{ label: string; to: string; dropdown?: { label: string; to: string }[] }> = [
  { label: "I'm New", to: '/im-new' },
  { label: 'About', to: '/about' },
  { label: 'Ministries', to: '/ministries', dropdown: ministriesLinks },
  { label: 'Resources', to: '/sermons', dropdown: resourcesLinks },
  { label: 'Stream', to: '/radio', dropdown: streamLinks },
  { label: 'Fellowship', to: '/fellowship' },
  { label: 'Contact', to: '/contact', dropdown: contactLinks },
  { label: 'Store', to: '/store' },
];

function NavDropdown({ label, to, links }: { label: string; to: string; links: { label: string; to: string }[] }) {
  return (
    <div className="group relative">
      <Link
        to={to}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 font-body-md text-body-md text-on-surface-variant transition-colors duration-200 ease-out hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest"
      >
        <span>{label}</span>
        <span className="material-symbols-outlined text-[18px] leading-none transition-transform duration-200 ease-out group-hover:rotate-180 motion-safe:group-hover:rotate-180 motion-reduce:transition-none">expand_more</span>
      </Link>

      <div
        className="pointer-events-none absolute left-0 top-full z-50 mt-2 min-w-[220px] origin-top-left scale-[0.98] translate-y-2 opacity-0 invisible transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 motion-reduce:transition-none motion-reduce:transform-none"
      >
        <div className="overflow-hidden rounded-xl border border-surface-container/70 bg-surface-container-lowest p-2 shadow-card">
          <div className={links.length > 4 ? 'grid grid-cols-2 gap-1' : 'space-y-1'}>
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface transition-all duration-200 ease-out hover:bg-primary-fixed hover:text-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicHeader() {
  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-surface-container/60 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-gutter px-margin">
        <Link to="/" className="flex shrink-0 items-center gap-space-sm">
          <img
            src={logo}
            alt="MIV Word House logo"
            className="h-20 w-auto max-w-[200px] rounded-md object-contain"
          />
          {/* <span className="font-headline-xs text-headline-xs text-on-surface tracking-tight font-semibold">MIV Word House</span> */}
        </Link>

        <nav className="hidden items-center gap-space-lg lg:flex">
          {topLevelLinks.map((item) =>
            item.dropdown ? (
              <NavDropdown key={item.to} label={item.label} to={item.to} links={item.dropdown} />
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className="font-body-md text-body-md text-on-surface-variant py-space-xs transition-colors duration-200 ease-out hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-space-md">
          <Link
            to="/give"
            className="inline-flex items-center justify-center rounded-lg bg-primary-container text-on-primary font-button-text text-button-text px-space-lg py-space-sm shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:bg-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest"
          >
            Give
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="material-symbols-outlined text-[18px] text-on-primary">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
