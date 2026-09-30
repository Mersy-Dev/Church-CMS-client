import React, { useRef, useState } from "react";
import {
  ArrowRight,
  Baby,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  HeartHandshake,
  MapPin,
  Music4,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const expectCards = [
  {
    icon: HeartHandshake,
    title: "Warm Welcome",
    description: "Friendly greeters will help you find your way and welcome you in.",
  },
  {
    icon: Music4,
    title: "Engaging Worship",
    description: "Expect heartfelt worship, a practical message, and a genuine sense of community.",
  },
  {
    icon: Users,
    title: "For All Ages",
    description: "There is a place for children and families to participate and feel included.",
  },
  {
    icon: Sparkles,
    title: "Come As You Are",
    description: "You do not need to dress a certain way or have everything figured out before you come.",
  },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
];

const faqs = [
  {
    question: "What time are the services?",
    answer:
      "Our Sunday services start at 08:30AM. We also have gatherings and special events throughout the week.",
  },
  {
    question: "Where is the church located?",
    answer:
      "We are located behind Accord Building, Obadeyi Estate, Samonda Ibadan.",
  },
  {
    question: "What kind of music do you play?",
    answer:
      "Our worship is energetic and passionate, with a mix of contemporary Christian music and original songs.",
  },
  {
    question: "Can I bring my friends?",
    answer:
      "Absolutely! We encourage you to invite your friends to experience church with you. The more, the better!",
  },
  {
    question: "Is there a way to meet people before or after the service?",
    answer:
      "Yes! We'd love for you to meet people before or after the service! We encourage you to arrive a little early or stay after the service to connect with others. Our friendly welcome team is always available to greet you and answer any questions.",
  },
  {
    question: "Do I need to know a lot about the Bible to attend?",
    answer:
      "Not at all! Whether you've been in church for years or are just starting to explore faith, you are welcome here.",
  },
  {
    question: "Can I meet the pastor or leaders?",
    answer:
      "Definitely! Our leaders love connecting with new people. Feel free to introduce yourself after service or reach out to set up a time to chat.",
  },
];

function GallerySection() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-gallery-card]");
    const cardWidth = card ? card.offsetWidth + 20 : el.clientWidth * 0.85;
    el.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  }

  return (
    <section className="w-full bg-surface-container-low py-space-3xl">
      <div className="mx-auto max-w-[1280px] px-margin-mobile sm:px-margin">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-label-badge text-label-badge uppercase tracking-wider text-primary font-bold">
            A glimpse inside
          </span>
          <h2 className="mt-space-xs font-headline-lg text-headline-lg text-on-surface">
            Explore Our Gallery
          </h2>
        </div>

        <div className="relative mt-space-xl">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-space-lg overflow-x-auto scroll-smooth pb-space-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {galleryImages.map((src, idx) => (
              <div
                key={src}
                data-gallery-card
                className="group relative aspect-[4/3] w-[78%] flex-shrink-0 snap-start overflow-hidden rounded-2xl shadow-md sm:w-[46%] lg:w-[31%]"
              >
                <img
                  src={src}
                  alt={`Church gathering ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ))}
          </div>

          {/* Arrow controls */}
          <button
            type="button"
            aria-label="Previous images"
            onClick={() => scrollByCard(-1)}
            className="absolute left-0 top-1/2 hidden -translate-y-1/2 -translate-x-4 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-lg transition-transform duration-200 hover:scale-105 sm:flex h-11 w-11"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next images"
            onClick={() => scrollByCard(1)}
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-4 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform duration-200 hover:scale-105 sm:flex h-11 w-11"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Mobile-only inline controls, since off-canvas arrows don't fit on small screens */}
        <div className="mt-space-md flex justify-center gap-space-sm sm:hidden">
          <button
            type="button"
            aria-label="Previous images"
            onClick={() => scrollByCard(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next images"
            onClick={() => scrollByCard(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ImNewPage(): JSX.Element {
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div className="w-full bg-surface">
      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-inverse-surface">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-inverse-surface/75 via-inverse-surface/55 to-inverse-surface/85" />

        <div className="relative mx-auto flex min-h-[420px] max-w-[1100px] flex-col items-center justify-center px-margin-mobile py-space-4xl text-center sm:min-h-[500px] sm:py-[6rem]">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-label-badge text-label-badge uppercase tracking-[0.2em] text-white font-bold backdrop-blur-sm">
            New Here?
          </span>

          <h1 className="mt-space-md max-w-2xl font-headline-xl text-headline-lg text-on-primary sm:text-[2.75rem] font-extrabold tracking-tight">
            We&apos;re Glad You&apos;re Here
          </h1>

          <p className="mt-space-sm max-w-xl font-body-md text-body-md text-on-primary/85">
            Whether you&apos;re visiting for the first time or looking for a church family to call home,
            we would love to welcome you with open arms.
          </p>

          <Link
            to="/contact"
            className="mt-space-lg inline-flex items-center justify-center gap-2 rounded-md bg-secondary px-8 py-3.5 font-button-text text-button-text text-on-secondary shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg"
          >
            Plan Your Visit
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

{/* WHAT TO EXPECT */}
<section className="w-full bg-surface py-space-3xl">
  <div className="mx-auto max-w-[1100px] px-margin-mobile sm:px-margin">
    <div className="mx-auto max-w-2xl text-center">
      <span className="font-label-badge text-label-badge uppercase tracking-wider text-primary font-bold">
        What to expect
      </span>
      <h2 className="mt-space-xs font-headline-lg text-headline-lg text-on-surface">
        A relaxed, welcoming church experience
      </h2>
    </div>

    <p className="mx-auto mt-space-lg max-w-3xl text-center font-body-md text-body-md text-on-surface-variant leading-relaxed">
      A typical Sunday service is warm, Christ-centered, and easy to follow. You can expect a
      60–90 minute gathering with worship, a Bible-based message, prayer, and time to connect
      with people after the service. There is no pressure, no awkwardness, and no expectation to
      dress a certain way — just come as you are.
    </p>

    <div className="mt-space-xl grid gap-space-lg sm:grid-cols-2 xl:grid-cols-4">
      {expectCards.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="group flex flex-col items-center rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-space-lg pb-space-lg pt-0 text-center shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:border-primary/25"
        >
          {/* Arch-shaped icon frame — a quiet nod to church architecture */}
          <div className="relative -mt-px flex h-20 w-16 flex-shrink-0 items-end justify-center rounded-t-full bg-primary-container/40 pb-space-sm transition-colors duration-300 group-hover:bg-primary-container/60">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
              <Icon size={20} strokeWidth={2} />
            </div>
          </div>

          <h3 className="mt-space-md font-headline-sm text-headline-sm font-bold text-on-surface">
            {title}
          </h3>
          <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {description}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
      {/* GALLERY */}
      <GallerySection />

      {/* SERVICE TIMES & LOCATION */}
      <section className="w-full bg-surface py-space-3xl">
        <div className="mx-auto max-w-[1100px] px-margin-mobile sm:px-margin">
          <div className="grid gap-space-xl lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl bg-surface-container-low p-space-xl shadow-sm">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-primary font-bold">
                Service times
              </span>

              <div className="mt-space-lg space-y-space-md">
                <div className="flex items-start gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-container text-primary">
                    <CalendarIcon />
                  </div>
                  <div>
                    <div className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant font-semibold">
                      Midweek Service
                    </div>
                    <div className="mt-1 font-body-md text-body-md font-semibold text-on-surface">
                      Wednesday, 6:00 PM WAT
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-container text-primary">
                    <Clock3 size={22} />
                  </div>
                  <div>
                    <div className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant font-semibold">
                      Sunday Celebration
                    </div>
                    <div className="mt-1 font-body-md text-body-md font-semibold text-on-surface">
                      Sunday, 8:30 AM WAT
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-space-xl shadow-sm">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-primary font-bold">
                Location
              </span>

              <h3 className="mt-space-sm font-headline-md text-headline-md text-on-surface">
                MIV Word House
              </h3>

              <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant leading-relaxed">
                12 Faith Avenue, Samonda, Ibadan, Oyo State
              </p>

              <div className="mt-space-lg flex items-start gap-space-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-space-md">
                <MapPin className="mt-0.5 text-primary flex-shrink-0" size={22} />
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  We are easy to find, and a parking team is always available to help as you arrive.
                </p>
              </div>

              <a
                href="https://maps.google.com/?q=MIV+Word+House+Ibadan"
                target="_blank"
                rel="noreferrer"
                className="mt-space-lg inline-flex items-center justify-center gap-2 rounded-md bg-secondary px-6 py-3 font-button-text text-button-text text-on-secondary shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg"
              >
                Get Directions
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT ABOUT MY KIDS */}
      <section className="w-full bg-surface-container-low py-space-3xl">
        <div className="mx-auto max-w-[1100px] px-margin-mobile sm:px-margin">
          <div className="grid gap-space-xl lg:grid-cols-2 lg:items-center">
            <div className="overflow-hidden rounded-2xl shadow-md">
              <img
                src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80"
                alt="Children participating in church activities"
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>

            <div>
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-primary font-bold">
                For families
              </span>
              <h2 className="mt-space-xs font-headline-lg text-headline-lg text-on-surface">
                What about my kids?
              </h2>
              <p className="mt-space-md font-body-md text-body-md text-on-surface-variant leading-relaxed">
                We believe children are an important part of the church family. During service, there is
                a children's ministry with age-appropriate activities, Bible lessons, and caring leaders
                who help children feel safe and welcome.
              </p>

              <ul className="mt-space-lg space-y-space-sm">
                <li className="flex items-start gap-space-sm">
                  <ShieldCheck className="mt-0.5 text-primary flex-shrink-0" size={20} />
                  <span className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Safe and supervised care with friendly volunteers and check-in support.
                  </span>
                </li>
                <li className="flex items-start gap-space-sm">
                  <Baby className="mt-0.5 text-primary flex-shrink-0" size={20} />
                  <span className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Ministry activities designed for different age groups and stages of development.
                  </span>
                </li>
                <li className="flex items-start gap-space-sm">
                  <Car className="mt-0.5 text-primary flex-shrink-0" size={20} />
                  <span className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Parking and family-friendly support are available to make your first visit easier.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="w-full bg-surface py-space-3xl">
        <div className="mx-auto max-w-[900px] px-margin-mobile sm:px-margin">
          <div className="text-center">
            <span className="font-label-badge text-label-badge uppercase tracking-wider text-primary font-bold">
              FAQ
            </span>
            <h2 className="mt-space-xs font-headline-lg text-headline-lg text-on-surface">
              Questions new visitors often ask
            </h2>
          </div>

          <div className="mt-space-xl space-y-space-sm">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={item.question}
                  className={`overflow-hidden rounded-xl border bg-surface-container-lowest shadow-sm transition-colors duration-200 ${
                    isOpen ? "border-primary/30" : "border-outline-variant"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-space-md px-space-lg py-space-md text-left"
                  >
                    <span className="font-body-md text-body-md font-semibold text-on-surface">
                      {item.question}
                    </span>
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                        isOpen ? "bg-primary text-on-primary" : "bg-surface-container-low text-primary"
                      }`}
                    >
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-outline-variant px-space-lg py-space-md">
                      <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEXT STEPS / CONNECT CARD */}
      <section className="w-full bg-surface-container-low py-space-3xl">
        <div className="mx-auto max-w-[1000px] px-margin-mobile sm:px-margin">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container px-space-xl py-space-xl text-on-primary shadow-lg">
            <div className="text-center">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-primary/80 font-bold">
                Ready to visit?
              </span>
              <h2 className="mt-space-xs font-headline-lg text-headline-lg text-on-primary">
                Take the next step
              </h2>
            </div>

            <div className="mt-space-lg grid gap-space-md sm:grid-cols-2">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3.5 font-button-text text-button-text text-primary shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg"
              >
                Plan My Visit
                <ArrowRight size={18} />
              </Link>

              <a
                href="mailto:hello@wordhouse.org"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/40 bg-white/5 px-6 py-3.5 font-button-text text-button-text text-on-primary transition-all duration-200 ease-out hover:bg-white/10"
              >
                Have Questions? Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="calendar icon">
      <path
        d="M7 3.75V6m10-2.25V6M4.5 9.5h15M6 5.25h12A1.75 1.75 0 0 1 19.75 7v11A1.75 1.75 0 0 1 18 19.75H6A1.75 1.75 0 0 1 4.25 18V7A1.75 1.75 0 0 1 6 5.25Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}