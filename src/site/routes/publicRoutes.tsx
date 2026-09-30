import { RouteObject } from 'react-router-dom';
import PublicLayout from '../layout/PublicLayout';
import HomePage from '../pages/HomePage';
import ImNewPage from '../pages/ImNewPage';
import AboutPage from '../pages/AboutPage';
import MinistriesIndexPage from '../pages/ministries/MinistriesIndexPage';
import SignsAndWondersPage from '../pages/ministries/SignsAndWondersPage';
import MetroMeetPage from '../pages/ministries/MetroMeetPage';
import StreetChurchPage from '../pages/ministries/StreetChurchPage';
import AcadaClinicPage from '../pages/ministries/AcadaClinicPage';
import ShiftingsAndTurningsPage from '../pages/ministries/ShiftingsAndTurningsPage';
import SermonsPage from '../pages/resources/SermonsPage';
import SermonVideoPage from '../pages/resources/SermonVideoPage';
import BlogPage from '../pages/resources/BlogPage';
import BlogPostPage from '../pages/resources/BlogPostPage';
import EventPage from '../pages/resources/EventPage';
import DevotionalPage from '../pages/resources/DevotionalPage';
import TestimoniesPage from '../pages/resources/TestimoniesPage';
import RadioPage from '../pages/stream/RadioPage';
import TvPage from '../pages/stream/TvPage';
import FellowshipPage from '../pages/FellowshipPage';
import ContactUsPage from '../pages/contact/ContactUsPage';
import PrayForMePage from '../pages/contact/PrayForMePage';
import StorePage from '../pages/StorePage';
import GivePage from '../pages/GivePage';

const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'im-new', element: <ImNewPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'ministries', element: <MinistriesIndexPage /> },
      { path: 'ministries/signs-and-wonders', element: <SignsAndWondersPage /> },
      { path: 'ministries/metro-meet', element: <MetroMeetPage /> },
      { path: 'ministries/street-church', element: <StreetChurchPage /> },
      { path: 'ministries/acada-clinic', element: <AcadaClinicPage /> },
      { path: 'ministries/shiftings-and-turnings', element: <ShiftingsAndTurningsPage /> },
      { path: 'sermons', element: <SermonsPage /> },
      { path: 'sermons/video', element: <SermonVideoPage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'blog/:slug', element: <BlogPostPage /> },
      { path: 'events', element: <EventPage /> },
      { path: 'devotional', element: <DevotionalPage /> },
      { path: 'testimonies', element: <TestimoniesPage /> },
      { path: 'radio', element: <RadioPage /> },
      { path: 'tv', element: <TvPage /> },
      { path: 'fellowship', element: <FellowshipPage /> },
      { path: 'contact', element: <ContactUsPage /> },
      { path: 'pray-for-me', element: <PrayForMePage /> },
      { path: 'store', element: <StorePage /> },
      { path: 'give', element: <GivePage /> },
    ],
  },
];

export default publicRoutes;
