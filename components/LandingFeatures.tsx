const FEATURES = [
  {
    label: "Drag-and-drop canvas",
    desc: "Place clients, load balancers, caches, and databases. Connect them and watch traffic flow in real time.",
    shape: "square" as const,
    color: "#4285F4",
    bg: "linear-gradient(120deg,#eaf2ff 0%,#ffffff 50%,#cfe0ff 100%)",
  },
  {
    label: "Live metrics",
    desc: "Every wire carries real throughput, latency, and cost — your architecture has consequences you can see.",
    shape: "ring" as const,
    color: "#EA4335",
    bg: "linear-gradient(120deg,#fdecea 0%,#ffffff 50%,#f9d3ce 100%)",
  },
  {
    label: "Chaos testing",
    desc: "Kill a node. Sever a link. Chaos Monkey finds the single points of failure you missed.",
    shape: "diamond" as const,
    color: "#FBBC05",
    bg: "linear-gradient(120deg,#fff8e1 0%,#ffffff 50%,#ffedb0 100%)",
  },
  {
    label: "Guided levels",
    desc: "27 scenarios from URL shorteners to distributed caches, each with real requirements to hit.",
    shape: "stack" as const,
    color: "#34A853",
    bg: "linear-gradient(120deg,#eaf7ee 0%,#ffffff 50%,#c8ead2 100%)",
  },
];

function FeatureIcon({ shape, color }: { shape: (typeof FEATURES)[number]["shape"]; color: string }) {
  if (shape === "square") return <div className="h-[13px] w-[13px]" style={{ background: color }} />;
  if (shape === "ring")
    return <div className="h-4 w-4 rounded-full border-[2.6px]" style={{ borderColor: color }} />;
  if (shape === "diamond")
    return <div className="h-3 w-3 rotate-45" style={{ background: color }} />;
  return (
    <div className="flex flex-col gap-[3px]">
      <div className="h-[2.4px] w-[15px]" style={{ background: color }} />
      <div className="h-[2.4px] w-[15px]" style={{ background: color }} />
      <div className="h-[2.4px] w-[15px]" style={{ background: color }} />
    </div>
  );
}

export default function LandingFeatures() {
  return (
    <section id="features" className="flex flex-col gap-10 border-t-[2.5px] border-[#0a0a0a] px-6 py-16 sm:px-[60px] sm:py-[76px]">
      <h2 className="text-center text-2xl font-bold uppercase text-[#0a0a0a] sm:text-[27px]">
        Everything you need to design like an engineer
      </h2>
      <div className="grid grid-cols-1 border-2 border-[#0a0a0a] sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div
            key={f.label}
            className="sds-card-in sds-gradient-move flex cursor-pointer flex-col gap-3 border-b-2 border-r-2 border-[#0a0a0a] p-5 transition-transform last:border-r-0 hover:-translate-y-1.5 hover:shadow-[6px_6px_0_#0a0a0a] sm:border-b-0 sm:p-6 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r-2 sm:[&:nth-child(3)]:border-b-0"
            style={{ backgroundImage: f.bg, animationDelay: `${i * 100}ms` }}
          >
            <div className="flex h-[38px] w-[38px] items-center justify-center border-2 border-[#0a0a0a] bg-white">
              <FeatureIcon shape={f.shape} color={f.color} />
            </div>
            <div className="text-[13.5px] font-bold uppercase text-[#0a0a0a]">{f.label}</div>
            <p className="text-xs leading-[1.55] text-[#3a3a3a]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
