const STEPS = [
  {
    n: "01",
    title: "Pick a scenario",
    desc: "Start from a level with real requirements, or open a blank sandbox.",
  },
  {
    n: "02",
    title: "Build your architecture",
    desc: "Drag components from the library, connect them, tune their configs.",
  },
  {
    n: "03",
    title: "Simulate & survive",
    desc: "Run traffic, trigger chaos, and watch your metrics move.",
  },
];

export default function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="flex flex-col gap-10 border-t-[2.5px] border-[#0a0a0a] px-6 py-16 sm:px-[60px] sm:py-[76px]"
    >
      <h2 className="text-center text-2xl font-bold uppercase text-[#0a0a0a] sm:text-[27px]">
        From empty canvas to production-shaped, in minutes
      </h2>
      <div className="flex flex-col border-2 border-[#0a0a0a] sm:flex-row">
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className={`flex flex-1 flex-col gap-2.5 p-6 ${
              i < STEPS.length - 1 ? "border-b-2 sm:border-b-0 sm:border-r-2" : ""
            } border-[#0a0a0a]`}
          >
            <div className="text-[13px] font-bold text-[#4285F4]">{s.n}</div>
            <div className="text-[15.5px] font-bold uppercase text-[#0a0a0a]">{s.title}</div>
            <p className="text-xs leading-[1.55] text-[#3a3a3a]">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
