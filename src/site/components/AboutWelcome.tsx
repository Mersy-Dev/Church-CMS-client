import { Link } from "react-router-dom";

export default function AboutWelcome() {
  return (
    <section className="w-full py-space-3xl bg-surface">
      <div className="mx-auto grid max-w-[1280px] items-center gap-space-xl px-margin lg:grid-cols-12">
        {/* Left Content */}
        <div className="lg:col-span-6 flex flex-col items-start gap-space-sm">
          <span className="font-label-badge text-label-badge text-primary uppercase font-bold tracking-wider">
            About Our Church
          </span>

          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
            Welcome to MIV Word House
          </h2>

          <h4 className="font-headline-xs text-headline-xs text-primary-container font-semibold mt-space-xs">
            Greetings, I’m Ope Rowland — Lead Pastor
          </h4>

          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-space-xs max-w-xl">
            We are thrilled to welcome you to our growing spiritual family. At
            MIV Word House, our heartbeat is to unveil the uncompromised depth
            of God’s Word, establish believers firmly in their true identity,
            and unleash kingdom ambassadors into every sphere of society. You
            belong here.
          </p>

          <div className="mt-space-md flex items-center gap-space-lg">
            <Link
              to="/about"
              className="group inline-flex items-center gap-2 font-button-text text-button-text text-primary transition-colors duration-200 ease-out hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface font-bold"
            >
              <span>Learn more about us</span>

              <span className="material-symbols-outlined text-[18px] transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-safe:group-hover:translate-x-0.5">
                arrow_forward
              </span>
            </Link>

            <span className="text-outline-variant">•</span>

            <Link
              to="/fellowship"
              className="font-button-text text-button-text text-on-surface-variant transition-colors duration-200 ease-out hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Meet the Pastoral Team
            </Link>
          </div>
        </div>

        {/* Right Video Card */}
        <div className="lg:col-span-6">
          <div
            className="
              relative w-full aspect-video
              rounded-xl overflow-hidden
              shadow-xl bg-inverse-surface group
              transition-all duration-300 ease-out
              motion-safe:hover:-translate-y-1
              hover:shadow-2xl
            "
          >
            {/* Background Image */}
            <div
              className="
    absolute inset-0
    bg-cover bg-center
    scale-100
    transition-all duration-300 ease-out
    motion-safe:group-hover:scale-110
    group-hover:scale-110
  "
              style={{
                backgroundImage:
                  'url("https://res.cloudinary.com/mersy-dev/image/upload/f_auto,q_auto/v1790335495/churchos/pastor2_iu13b8.heic")',
                backgroundPosition: "center 25%",
              }}
            />

            {/* Dark Gradient Overlay */}
            <div
              className="
                absolute inset-0
                bg-gradient-to-t
                from-inverse-surface/90
                via-transparent
                to-inverse-surface/40
                transition-opacity duration-300 ease-out
                group-hover:opacity-90
              "
            />

            {/* Instagram / Church Handle */}
            <div
              className="
                absolute left-4 top-4
                inline-flex items-center gap-1.5
                rounded-full
                bg-surface-container-lowest/80
                px-3 py-1
                backdrop-blur-md
                transition-all duration-200 ease-out
                motion-safe:group-hover:scale-105
                group-hover:scale-105
              "
            >
              <span className="h-2 w-2 rounded-full bg-secondary" />

              <span className="font-caption text-caption font-semibold text-on-surface">
                @mivwordhouse
              </span>
            </div>

            {/* Play Button */}
            <button
              type="button"
              aria-label="Play Welcome Video"
              className="
                absolute inset-0 m-auto
                flex h-16 w-16
                items-center justify-center
                rounded-full
                bg-primary-container
                text-on-primary
                shadow-xl
                transition-all duration-200 ease-out
                motion-safe:hover:scale-110
                motion-safe:active:scale-[0.98]
                hover:scale-110
                hover:shadow-2xl
                active:scale-[0.98]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse-surface
              "
            >
              <span className="material-symbols-outlined translate-x-0.5 text-[32px]">
                play_arrow
              </span>
            </button>

            {/* Bottom Video Information */}
            <div
              className="
                absolute bottom-4 left-4 right-4
                flex items-center justify-between
                text-on-primary
                text-caption
                font-caption
                transition-all duration-200 ease-out
                motion-safe:group-hover:-translate-y-1
                group-hover:-translate-y-1
              "
            >
              <span
                className="
                  bg-inverse-surface/70
                  px-2.5 py-1
                  rounded
                  backdrop-blur-sm
                "
              >
                Welcome Experience (3:45)
              </span>

              <span className="flex items-center gap-1 opacity-90">
                <span className="material-symbols-outlined text-[16px]">
                  hd
                </span>
                1080p Ultra
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
