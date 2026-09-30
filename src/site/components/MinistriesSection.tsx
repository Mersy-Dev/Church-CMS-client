import { Link } from 'react-router-dom';

interface MinistryItem {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
}

const ministryImages = [
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3d5f1d5?auto=format&fit=crop&w=900&q=80',
];

export default function MinistriesSection({ ministries, loading }: { ministries: MinistryItem[]; loading: boolean }) {
  const items = ministries.length ? ministries : [
    { _id: 'signs-and-wonders', name: 'Signs & Wonders', description: 'Children’s faith ministry nurturing young disciples.', slug: 'signs-and-wonders' },
    { _id: 'metro-meet', name: 'Metro Meet', description: 'Young adult community sharing real conversations and purpose.', slug: 'metro-meet' },
    { _id: 'street-church', name: 'Street Church', description: 'Outreach evangelism taking Christ’s radical love beyond church walls.', slug: 'street-church' },
    { _id: 'acada-clinic', name: 'Acada Clinic', description: 'Academic & career excellence seminar series equipping students.', slug: 'acada-clinic' },
    { _id: 'shiftings-and-turnings', name: 'Shiftings & Turnings', description: 'Prophetic prayer furnace contending for supernatural spiritual shifts.', slug: 'shiftings-and-turnings' },
  ];

  return (
    <section className="w-full bg-primary-container py-space-3xl text-on-primary">
      <div className="mx-auto max-w-[1280px] px-margin">
        <div className="mb-space-lg text-center">
          <span className="font-label-badge text-label-badge text-primary-fixed uppercase font-semibold tracking-widest">Get Involved</span>
          <h2 className="mt-2 font-headline-lg text-headline-lg text-on-primary font-bold">Our Ministries</h2>
          <p className="mt-space-xs font-body-md text-body-md text-primary-fixed">Discover a vibrant place to serve, grow, and release your unique spiritual gifts into the world.</p>
        </div>

        <div className="grid gap-space-md md:grid-cols-2 xl:grid-cols-5">
          {items.map((ministry, index) => (
            <div key={ministry._id} className="group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-primary shadow-md transition-all duration-300 ease-out motion-safe:hover:-translate-y-1 hover:-translate-y-1 hover:shadow-xl">
              <div className="h-36 w-full">
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${ministry.imageUrl || ministryImages[index % ministryImages.length]})`,
                  }}
                />
              </div>
              <div className="flex flex-1 flex-col p-space-md">
                <h4 className="font-headline-xs text-headline-xs text-on-primary font-bold">{ministry.name}</h4>
                <p className="mt-space-sm font-body-sm text-body-sm leading-relaxed text-primary-fixed">{ministry.description || 'Join this vibrant community and grow in Christ.'}</p>
                <Link to={ministry.slug ? `/ministries/${ministry.slug}` : '/ministries'} className="mt-auto inline-flex items-center gap-1 pt-space-md font-label-badge text-label-badge uppercase tracking-wider text-tertiary-fixed transition-colors duration-200 ease-out hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                  <span>See More</span>
                  <span aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-safe:group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
