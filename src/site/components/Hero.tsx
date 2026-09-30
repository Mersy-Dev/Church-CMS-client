import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const PHRASES = ["We are Strong", "We are Vigorous", "We are Victorious"];
const HOLD_MS = 3000;
const FADE_MS = 700;

function AnimatedHeroPhrase({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (reducedMotion.current) {
      const id = setInterval(
        () => setIndex((i) => (i + 1) % PHRASES.length),
        HOLD_MS,
      );
      return () => clearInterval(id);
    }

    const holdTimer = setTimeout(() => setVisible(false), HOLD_MS);
    return () => clearTimeout(holdTimer);
  }, [index]);

  const handleTransitionEnd = () => {
    if (!visible) {
      setIndex((i) => (i + 1) % PHRASES.length);
      setVisible(true);
    }
  };

  return (
    <>
      <span className="sr-only">We are Strong, Vigorous, and Victorious</span>
      <span
        aria-hidden="true"
        onTransitionEnd={handleTransitionEnd}
        style={{
          display: "inline-block",
          opacity: visible ? 1 : 0,
          transition: reducedMotion.current
            ? "none"
            : `opacity ${FADE_MS}ms ease-in-out`,
        }}
        className={className}
      >
        {PHRASES[index]}
      </span>
    </>
  );
}

export default function Hero() {
  return (
    <section className="relative w-full -mt-5 overflow-hidden bg-primary">
      <div
        className="absolute inset-0 bg-cover opacity-80"
        style={{
          backgroundImage:
            'url("https://res.cloudinary.com/mersy-dev/image/upload/f_auto,q_auto/v1790335504/churchos/church1_wenzkn.heic")',
          backgroundPosition: "center 20%",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/50 to-primary/30" />

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center px-margin-mobile pb-28 pt-24 text-center sm:pb-24 sm:px-margin sm:pt-28 lg:pb-36 lg:pt-44">
        <div className="mb-space-md inline-flex items-center gap-space-xs rounded-full border border-white/20 bg-surface-container-lowest/15 px-space-sm py-1 backdrop-blur-md shadow-sm sm:mb-space-lg sm:px-space-md">
          <span className="text-[13px] font-bold text-tertiary-fixed">★</span>
          <span className="font-label-badge text-label-badge text-tertiary-fixed uppercase tracking-wider font-semibold text-center">
            Welcome to Our Church
          </span>
        </div>

        <h1 className="mb-space-sm max-w-[90%] tracking-tight text-on-primary drop-shadow-sm sm:mb-space-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
          <AnimatedHeroPhrase className="block whitespace-nowrap text-[2rem] font-black leading-[0.95] tracking-[-0.04em] text-on-primary sm:text-[3.25rem] md:text-[4rem] lg:text-[5rem]" />
        </h1>

        <p className="font-body-md text-body-md sm:font-body-lg sm:text-body-lg text-primary-fixed max-w-[90%] sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto leading-relaxed mb-space-lg sm:mb-space-xl">
          Experience faith, hope, and authentic community in the power of His
          Word. Step into the fullness of purpose designed for your life.
        </p>

        <div className="flex w-full flex-col items-center gap-space-sm sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-space-md">
          <Link
            to="/im-new"
            className="inline-flex w-full items-center justify-center rounded-lg bg-secondary px-8 py-3.5 font-button-text text-button-text text-on-secondary shadow-md transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:w-auto"
          >
            Plan a Visit
          </Link>
          <Link
            to="/radio"
            className="inline-flex w-full items-center justify-center rounded-lg bg-tertiary-container px-8 py-3.5 font-button-text text-button-text text-on-primary shadow-md transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:w-auto"
          >
            Watch Sermon
          </Link>
        </div>
      </div>
    </section>
  );
}