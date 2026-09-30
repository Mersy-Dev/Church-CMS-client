export default function MissionStatement() {
  return (
    <section className="w-full bg-primary py-space-3xl mt-space-2xl text-on-primary">
      <div className="mx-auto max-w-[1280px] px-margin text-center flex flex-col items-center">
        <div className="inline-flex items-center px-4 py-1 rounded-full bg-primary-container text-primary-fixed text-label-badge font-label-badge uppercase tracking-widest font-semibold mb-space-md">
          Our Mission
        </div>
        <blockquote className="font-headline-md text-headline-md font-bold max-w-4xl leading-relaxed text-on-primary">
          “To raise a victorious community grounded in the unwavering Word of God, transforming lives through Christ’s love, empowered worship, and purposeful discipleship across all nations.”
        </blockquote>
        <div className="w-16 h-1 bg-tertiary-fixed rounded-full mt-space-xl" />
      </div>
    </section>
  );
}
