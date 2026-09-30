import { Link } from 'react-router-dom';

interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  category?: string;
  author?: string;
  readTimeMinutes?: number;
}

const fallbackPosts = [
  {
    _id: '1',
    title: 'Marks of the Mighty IV',
    slug: 'marks-of-the-mighty-iv',
    excerpt: 'Examining the foundational spiritual postures that separate ordinary believers from warriors who overcome trials through unwavering devotion and steadfast obedience.',
    category: 'Spiritual Growth',
    readTimeMinutes: 5,
  },
  {
    _id: '2',
    title: 'Marks of the Mighty',
    slug: 'marks-of-the-mighty',
    excerpt: 'The journey of surrender that builds unbreakable inner fortitude and godly discernment amidst the moral compromise of contemporary culture.',
    category: 'Faith & Character',
    readTimeMinutes: 4,
  },
  {
    _id: '3',
    title: 'Oh Darling II',
    slug: 'oh-darling-ii',
    excerpt: 'Navigating intentional romantic relationships grounded in Christ-like honor, emotional purity, and holy alignment for a lifetime of fruitful fellowship.',
    category: 'Relationships & Grace',
    readTimeMinutes: 6,
  },
];

export default function BlogsSection({ posts, loading }: { posts: BlogItem[]; loading: boolean }) {
  const items = posts.length ? posts : fallbackPosts;

  return (
    <section className="w-full bg-surface-container-low py-space-3xl">
      <div className="mx-auto max-w-[1280px] px-margin">
        <div className="mb-space-lg flex flex-col gap-space-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-label-badge text-label-badge text-primary uppercase font-bold tracking-wider">Articles</span>
            <h2 className="mt-1 font-headline-lg text-headline-lg text-on-surface">Blogs</h2>
          </div>
          <Link to="/blog" className="group inline-flex items-center gap-1 font-button-text text-button-text text-primary transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest">
            <span>See More Articles</span>
            <span className="material-symbols-outlined text-[18px] transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-safe:group-hover:translate-x-0.5">arrow_forward</span>
          </Link>
        </div>

        <div className="grid gap-space-lg md:grid-cols-3">
          {items.map((post) => (
            <article key={post._id} className="group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 ease-out motion-safe:hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]">
              <div className="h-52 w-full">
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${post.coverImageUrl || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80'})`,
                  }}
                />
              </div>
              <div className="flex flex-1 flex-col p-space-lg">
                <span className="font-caption text-caption text-on-surface-variant">{post.category || 'Spiritual Growth'} · {post.readTimeMinutes || 5} min read</span>
                <h3 className="mt-space-sm font-headline-sm text-headline-sm text-on-surface">{post.title}</h3>
                <p className="mt-space-sm font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{post.excerpt || 'Read more from our latest reflections and teaching notes.'}</p>
                <div className="mt-auto pt-space-md">
                  <Link to={`/blog/${post.slug}`} className="inline-flex items-center justify-center rounded-lg bg-primary-container px-4 py-2 font-button-text text-button-text text-on-primary transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:bg-primary hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest">
                    Read More
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
