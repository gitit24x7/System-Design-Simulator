// The repeatable framework most system design courses teach for tackling
// ANY new problem, stated explicitly here rather than left implicit. The
// guided levels already walk this sequence through their objectives -- this
// is the name for what they're doing, so the habit transfers beyond this
// app's 66 levels to a real interview or a real problem.

export interface ApproachStep {
  step: number;
  title: string;
  summary: string;
  details: string[];
  inApp: string;
}

export const APPROACH_STEPS: ApproachStep[] = [
  {
    step: 1,
    title: "Clarify requirements",
    summary: "Before drawing anything, pin down what you're actually building -- and what you're explicitly not.",
    details: [
      "Functional requirements: what must the system do? (\"Users can post, follow, and see a feed\" -- not \"build Twitter.\")",
      "Non-functional requirements: how well must it do it? Latency targets, availability targets, consistency needs.",
      "Explicitly state what's out of scope. Skipping this is the single most common way interview candidates run out of time.",
    ],
    inApp: "Each level's objectives are this step already done for you -- read them as \"here are the requirements,\" not just a checklist.",
  },
  {
    step: 2,
    title: "Estimate scale",
    summary: "Turn the requirements into rough numbers: QPS, storage growth, bandwidth. This decides which components are even viable.",
    details: [
      "Daily active users -> requests/sec (usually via the 86,400-seconds-per-day conversion).",
      "Data size per record x record volume -> storage growth per day/year.",
      "Read:write ratio -- most systems are read-heavy by 10-100x, which shapes where you add caching and replicas.",
    ],
    inApp: "The Estimation Drills panel practices exactly this step in isolation, separate from drawing any design.",
  },
  {
    step: 3,
    title: "High-level design",
    summary: "Sketch the major components and how data flows between them, before diving into any one piece.",
    details: [
      "Start simple: client, server, database. Add components only as a specific requirement demands them.",
      "Name the data flow out loud: what happens, in order, from a request coming in to a response going out.",
      "Resist the urge to over-engineer early -- a load balancer or a message queue should answer a stated need, not appear by default.",
    ],
    inApp: "This is literally the canvas -- drag components from the sidebar and wire them together to match the flow you just described.",
  },
  {
    step: 4,
    title: "Deep-dive on the hard part",
    summary: "Every problem has one or two genuinely hard pieces. Spend most of your time there, not spreading effort evenly.",
    details: [
      "For a feed: fan-out on write vs fan-out on read. For a URL shortener: ID generation without collisions. For chat: message ordering and delivery guarantees.",
      "This is where trade-offs get concrete -- not \"NoSQL is more scalable\" in the abstract, but \"here's why NoSQL fits this specific access pattern.\"",
      "It's fine -- expected, even -- to say a piece is hard and reason through two possible approaches rather than presenting one as obviously correct.",
    ],
    inApp: "Node variants (SQL/NoSQL, monolith/microservices, consistency sliders) exist so this trade-off reasoning has something concrete to click through, not just describe.",
  },
  {
    step: 5,
    title: "Identify bottlenecks and failure modes",
    summary: "Stress-test the design you just drew: what breaks first under load, and what happens when a component dies?",
    details: [
      "Find the single points of failure -- any component with exactly one instance and no failover.",
      "Find the throughput bottleneck -- the one component whose capacity caps the whole system.",
      "State what happens to in-flight requests and data during a partial failure, not just whether the system \"survives.\"",
    ],
    inApp: "This is what the live Metrics HUD, bottleneck highlighting, Chaos Monkey, and Design Critique panel are all doing to your design in real time.",
  },
];
