import React from "react";
import { Link } from "react-router-dom";
import IssacharVisionSection from "../components/IssacharVisionSection";

type Leader = {
  name: string;
  role: string;
  photoUrl?: string;
};

const leaders: Leader[] = [
  { name: "Samson & Stella Ajetomobi", role: "Oversight", photoUrl: "https://res.cloudinary.com/mersy-dev/image/upload/v1790496884/churchos/Daddy_o1ztqy.jpg" },
  { name: "Ope Rowland", role: "Lead Pastor", photoUrl: "https://res.cloudinary.com/mersy-dev/image/upload/v1790496883/churchos/Pastor_oerhp1.png" },
  { name: "Atinuke Rowland", role: "Care Pastor", photoUrl: "https://res.cloudinary.com/mersy-dev/image/upload/v1790496884/churchos/pastoratinuke_znzqag.png" }, // no photo yet — falls back to initials
  { name: "Mark Odock", role: "Spiritual Formation Pastor", photoUrl: "https://res.cloudinary.com/mersy-dev/image/upload/v1790496881/churchos/pastormark_bp98cj.png" },
  { name: "Philip Olaniyi", role: "Admin Pastor", photoUrl: "https://res.cloudinary.com/mersy-dev/image/upload/v1790496879/churchos/philitp_yjtzbi.jpg" },
  { name: "Olawumi Olalowo", role: "Outreach Pastor", photoUrl: "https://res.cloudinary.com/mersy-dev/image/upload/v1790496879/churchos/deacwumi_ejplcw.png" },
  { name: "Thompson Azuu", role: "Service Teams Pastor", photoUrl: "https://res.cloudinary.com/mersy-dev/image/upload/v1790496882/churchos/pastThomp_vnpycr.png" },
  { name: "Zephaniah Adediran", role: "Cluster Outreach Pastor", photoUrl: "https://res.cloudinary.com/mersy-dev/image/upload/v1790496883/churchos/pastorzeph_ahxst9.jpg" },
];

function initials(name?: string) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const hubItems = [
  { label: "Expression Hub", color: "bg-amber-400" },
  { label: "Worship Hub", color: "bg-yellow-700" },
  { label: "Training Hub", color: "bg-orange-600" },
  { label: "Care Hub", color: "bg-rose-500" },
  { label: "Peer Hub", color: "bg-indigo-900" },
  { label: "Broadcast Hub", color: "bg-teal-500" },
  { label: "Borderless Hub", color: "bg-lime-500" },
  { label: "Social Hub", color: "bg-green-800" },
  { label: "Accountability Hub", color: "bg-neutral-900" },
];


export default function AboutPage(): JSX.Element {
  return (
    <div className="w-full bg-surface">
      {/* HERO — photo background, eyebrow, heading, CTA */}
      <section className="relative w-full overflow-hidden bg-inverse-surface">
        <div
          className="absolute inset-0 bg-cover opacity-90"
          style={{
            backgroundImage:
              'url("https://res.cloudinary.com/mersy-dev/image/upload/f_auto,q_auto/v1790335495/churchos/pastor2_iu13b8.heic")',
            backgroundPosition: "center 15%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-inverse-surface/70 via-inverse-surface/40 to-inverse-surface/80" />

        <div className="relative mx-auto flex min-h-[420px] sm:min-h-[480px] lg:min-h-[560px] max-w-[1000px] flex-col items-center justify-center px-margin-mobile py-space-4xl sm:py-[6rem] text-center">
          {/* <span className="font-label-badge text-label-badge uppercase tracking-[0.2em] text-tertiary-fixed font-bold mb-space-sm">
            Welcome to Word House
          </span> */}
          <h1 className="font-headline-xl text-headline-lg sm:text-[2.75rem] font-extrabold tracking-tight text-on-primary leading-tight max-w-2xl">
           About MIV Word House
          </h1>
          <p className="mt-space-sm font-body-md text-body-md text-on-primary/80 max-w-xl">
            The story, vision, and people behind MIV Word House.
          </p>

          <a
            href="#leadership"
            className="mt-space-lg inline-flex items-center justify-center rounded-md bg-secondary px-8 py-3.5 font-button-text text-button-text text-on-secondary shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg"
          >
            Meet Our Leadership
          </a>
        </div>
      </section>

      {/* TAGLINE / SCRIPTURE */}
      <section className="w-full bg-surface-container-low py-space-2xl">
        <div className="mx-auto max-w-[900px] px-margin-mobile sm:px-margin text-center">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            We are Strong, We are Vigorous and We are Victorious
          </h2>
          <blockquote className="mt-space-md font-body-md text-body-md text-on-surface-variant italic leading-relaxed">
            "...I have written to you, young men, because you are strong and
            vigorous, and the word of God remains [always] in you, and you have
            been victorious over the evil one [by accepting Jesus as Savior]" —
            1John 2:14 (AMP)
          </blockquote>
        </div>
      </section>
      <IssacharVisionSection />

      {/* ABOUT WORD HOUSE + 9 HUBS ARC DIAGRAM */}

      {/* ABOUT WORD HOUSE + 9 HUBS */}
      <section className="w-full bg-[#f4f1fb] py-space-3xl">
        <div className="mx-auto max-w-[1280px] px-margin-mobile sm:px-margin">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#5b2a9e] to-[#3d1a75] px-space-lg py-space-xl sm:px-space-2xl sm:py-space-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-2xl items-center">
              {/* HEADER — left column, untouched */}
              <div className="relative z-10 text-white">
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#ffd21c]">
                  Our Identity
                </span>

                <h2 className="mt-3 text-[27px] sm:text-[32px] font-black leading-[1.1] tracking-tight">
                  About <span className="text-[#ffd21c]">Word House</span>
                </h2>

                <p className="mt-4 text-[16px] leading-[1.45] text-white/90">
                  WORD HOUSE is a Young People's Church of The Men of Issachar
                  Vision Inc.
                </p>

                <p className="mt-4 text-[16px] italic leading-[1.45] text-white/80 border-l-2 border-[#ffd21c]/50 pl-3">
                  "...I have written to you, young men, because you are strong
                  and vigorous, and the word of God remains [always] in you, and
                  you have been victorious over the evil one [by accepting Jesus
                  as Savior]"
                  <span className="not-italic"> - 1John 2:14 (AMP)</span>
                </p>

                <p className="mt-4 text-[16px] leading-[1.45] text-white/90">
                  Welcome to WORD HOUSE, where young people are strong, vigorous
                  and victorious!
                </p>
              </div>

              {/* IMAGE — right column, replaces the diagram */}
              <div className="relative mx-auto w-full max-w-[500px]">
                <img
                  src="https://res.cloudinary.com/mersy-dev/image/upload/v1790481735/churchos/descHub_uq5zwk.png"
                  alt="The 9 descriptions of the church"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

    {/* OUR LEADERSHIP — photo-card grid */}
<section id="leadership" className="w-full py-space-3xl bg-surface">
  <div className="mx-auto max-w-[1280px] px-margin-mobile sm:px-margin">
    <div className="max-w-xl mx-auto text-center mb-space-2xl">
      <span className="font-label-badge text-label-badge uppercase tracking-wider text-primary font-bold">
        Our People
      </span>
      <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface mt-space-xs">
        Our Leadership
      </h2>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-space-lg">
      {leaders.map((l) => (
        <div
          key={l.name}
          className="group overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-primary-container to-primary">
            {l.photoUrl ? (
              <img
                src={l.photoUrl}
                alt={l.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-headline-lg sm:text-[3rem] font-black text-on-primary tracking-tight transition-transform duration-300 group-hover:scale-105">
                  {initials(l.name)}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-tertiary-fixed opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="p-space-md text-center">
            <div className="font-body-md text-body-md font-bold text-on-surface">
              {l.name}
            </div>
            <div className="mt-1 font-caption text-caption uppercase tracking-wider text-primary">
              {l.role}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
    </div>
  );
}
