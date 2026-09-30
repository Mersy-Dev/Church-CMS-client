import React, { useState } from "react";
import { Link } from "react-router-dom";

const issacharTabs = [
  {
    key: "focus",
    label: "Our Focus",
    body: [
      "The Men Of Issachar Vision Inc. founded in 1989 under the leadership of Rev. Samson Ajetomobi is a Christian organization committed to awakening and missions.",
      "Our focus on these two themes emanates from our understanding of the times we are in and what the church should be doing in such a crucial time — just as the Issachar of old had understanding of the times and knew what Israel ought to do.",
    ],
    quote: '"...and of the Children of Issachar which were men that had the understanding of the times, to know what Israel ought to do…" — 1 Chronicles 12:32 (KJV)',
  },
  {
    key: "strategy",
    label: "Our Strategy",
    body: [
      "Our awakening effort is anchored on reawakening of the church to her responsibilities, especially through her leaders.",
      "Strategies presently being used to accomplish this include hosting and organization of Ministers Leadership Conferences, Alone With God prayer retreats, Family Life Conferences, Back To Bethel Retreats for women, and Campus Leaders Repositioning meetings.",
    ],
  },
  {
    key: "reach",
    label: "Our Reach",
    body: [
      "Our understanding of missions encompasses reaching the unreached at all cost. In addition to sending missionaries to the fields, we are involved with mobilization of people and resources, promotion of opportunities and happenings, recruitment and training of missionaries, research and survey of the remaining unreached people groups, and organisation of mission conferences.",
      "We also carry out literacy missions through the establishment of schools in needy communities, and medical missions.",
    ],
  },
  {
    key: "countries",
    label: "Where We Serve",
    body: [
      "We have missionary efforts ongoing across the following nations:",
    ],
    countries: [
      "Benin Republic", "Brazil", "Cameroon", "Cote D' Ivoire", "Egypt",
      "Ghana", "Liberia", "Morocco", "Nigeria", "Senegal", "South Africa",
      "The Gambia", "Tanzania", "Togo", "United Kingdom", "United States",
    ],
  },
];

function IssacharVisionSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const active = issacharTabs[activeIdx];

  function handleTabChange(idx: number) {
    if (idx === activeIdx) return;
    setVisible(false);
    window.setTimeout(() => {
      setActiveIdx(idx);
      setVisible(true);
    }, 180);
  }

  return (
    <section className="w-full py-space-3xl bg-surface">
      <div className="mx-auto max-w-[1280px] px-margin-mobile sm:px-margin grid grid-cols-1 lg:grid-cols-2 gap-space-2xl items-start">
        {/* Stacked photo pair — sticky on desktop so it stays put while tabs are browsed */}
        <div className="relative h-[340px] sm:h-[400px] lg:sticky lg:top-24">
          <div
            className="absolute left-0 top-0 h-[75%] w-[65%] rounded-xl bg-cover bg-center shadow-xl"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=800&q=80")',
            }}
          />
          <div
            className="absolute right-0 bottom-0 h-[60%] w-[55%] rounded-xl bg-cover bg-center shadow-xl border-4 border-surface"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80")',
            }}
          />
          <div className="absolute left-[8%] top-[8%] flex flex-col items-center justify-center rounded-full bg-primary px-6 py-6 text-center text-on-primary shadow-lg">
            <span className="font-caption text-caption uppercase tracking-wider opacity-80">Since</span>
            <span className="font-headline-md text-headline-md font-black leading-none">1989</span>
          </div>
        </div>

        {/* Copy + tab switcher */}
        <div>
          <span className="font-label-badge text-label-badge uppercase tracking-wider text-primary font-bold">
            Work of the Vision
          </span>
          <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface mt-space-xs mb-space-md">
            About Men of Issachar Vision Inc
          </h2>

          {/* Tab pills — scrollable row on mobile */}
          <div className="flex gap-space-xs overflow-x-auto pb-2 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
            {issacharTabs.map((tab, idx) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(idx)}
                className={`flex-shrink-0 rounded-full px-space-md py-2 font-label-badge text-label-badge uppercase tracking-wider transition-colors duration-200 whitespace-nowrap ${
                  idx === activeIdx
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content area — fades between tabs */}
          <div
            className="mt-space-lg min-h-[220px] transition-opacity duration-200 ease-out"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {active.body.map((para, i) => (
              <p
                key={i}
                className={`font-body-md text-body-md text-on-surface-variant leading-relaxed ${i > 0 ? "mt-space-sm" : ""}`}
              >
                {para}
              </p>
            ))}

            {active.quote && (
              <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant leading-relaxed border-l-2 border-primary/30 pl-space-md italic">
                {active.quote}
              </p>
            )}

            {active.countries && (
              <div className="mt-space-md flex flex-wrap gap-2">
                {active.countries.map((country) => (
                  <span
                    key={country}
                    className="rounded-full bg-surface-container px-space-sm py-1.5 font-caption text-caption text-on-surface-variant border border-outline-variant"
                  >
                    {country}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-space-lg flex items-center gap-space-sm">
            <Link
              to="/about/vision"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3 font-button-text text-button-text text-on-primary shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              About The Vision
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>

            {/* Progress dots — quick visual cue of position among the 4 tabs */}
            <div className="flex gap-1.5 ml-space-sm">
              {issacharTabs.map((tab, idx) => (
                <span
                  key={tab.key}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeIdx ? "w-6 bg-primary" : "w-1.5 bg-outline-variant"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default IssacharVisionSection;