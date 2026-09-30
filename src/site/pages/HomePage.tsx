import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import VisitStrip from '../components/VisitStrip';
import MissionStatement from '../components/MissionStatement';
import AboutWelcome from '../components/AboutWelcome';
import SermonsSection from '../components/SermonsSection';
import UpcomingEventsSection from '../components/UpcomingEventsSection';
import MinistriesSection from '../components/MinistriesSection';
import BlogsSection from '../components/BlogsSection';
import GiveCtaBanner from '../components/GiveCtaBanner';
import publicApi from '../lib/public.api';

interface PublicSermon {
  _id: string;
  title: string;
  speaker: string;
  series?: string;
  description?: string;
  preachedDate: string;
  thumbnailUrl?: string;
  media?: Array<{ url?: string; type?: 'audio' | 'video'; platform?: string }>;
}

interface PublicEvent {
  _id: string;
  title: string;
  description?: string;
  startDatetime: string;
  location?: string;
  campus?: string;
  status?: string;
  type?: string;
}

interface PublicMinistry {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
}

interface PublicBlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  category?: string;
  author?: string;
  readTimeMinutes?: number;
  publishedAt?: string;
}

export default function HomePage() {
  const [sermons, setSermons] = useState<PublicSermon[]>([]);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [ministries, setMinistries] = useState<PublicMinistry[]>([]);
  const [posts, setPosts] = useState<PublicBlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [sermonsRes, eventsRes, ministriesRes, postsRes] = await Promise.all([
          publicApi.get('/online-ministry/sermons/public?limit=4'),
          publicApi.get('/events/public?limit=3'),
          publicApi.get('/ministries/public'),
          publicApi.get('/blog/public?limit=3'),
        ]);

        if (cancelled) return;

        setSermons((sermonsRes.data?.data ?? []) as PublicSermon[]);
        setEvents((eventsRes.data?.data ?? []) as PublicEvent[]);
        setMinistries((ministriesRes.data?.data ?? []) as PublicMinistry[]);
        setPosts((postsRes.data?.data ?? []) as PublicBlogPost[]);
      } catch {
        if (!cancelled) {
          setSermons([]);
          setEvents([]);
          setMinistries([]);
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  const heroSermons = useMemo(() => sermons.slice(0, 4), [sermons]);

  return (
    <div className="w-full bg-surface">
      <Hero />
      <div className="relative z-20 -mt-16">
        <VisitStrip />
      </div>
      <MissionStatement />
      <AboutWelcome />

      <SermonsSection sermons={heroSermons} loading={loading} />
      <UpcomingEventsSection events={events} loading={loading} />
      <MinistriesSection ministries={ministries} loading={loading} />
      <BlogsSection posts={posts} loading={loading} />
      <GiveCtaBanner />
    </div>
  );
}
