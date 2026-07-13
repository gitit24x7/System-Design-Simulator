const TESTIMONIALS = [
  {
    quote:
      "I finally understand why load balancers matter — I watched mine fail without one.",
    name: "Priya",
    role: "CS senior, interview prep",
  },
  {
    quote:
      "Chaos Monkey killing my only API server mid-demo taught me more than any lecture.",
    name: "Marcus",
    role: "Bootcamp grad",
  },
  {
    quote:
      "The levels ramp perfectly — URL shortener to a sharded, cached, queued mess by level 10.",
    name: "Dana",
    role: "Self-taught engineer",
  },
];

export default function LandingTestimonials() {
  return (
    <section
      id="reviews"
      className="flex flex-col gap-10 border-t-[2.5px] border-[#0a0a0a] px-6 py-16 sm:px-[60px] sm:py-[76px]"
    >
      <h2 className="text-center text-2xl font-bold uppercase text-[#0a0a0a] sm:text-[27px]">
        Built for people learning to build
      </h2>
      <div className="flex flex-col border-2 border-[#0a0a0a] sm:flex-row">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={t.name}
            className={`flex flex-1 flex-col gap-4 p-6 ${
              i < TESTIMONIALS.length - 1 ? "border-b-2 sm:border-b-0 sm:border-r-2" : ""
            } border-[#0a0a0a]`}
          >
            <p className="text-[13px] leading-[1.6] text-[#0a0a0a]">&ldquo;{t.quote}&rdquo;</p>
            <div>
              <div className="text-[12.5px] font-bold text-[#0a0a0a]">{t.name}</div>
              <div className="text-[11.5px] text-[#3a3a3a]">{t.role}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
