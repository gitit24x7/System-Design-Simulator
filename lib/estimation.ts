// Back-of-envelope estimation drills: the "clarify requirements -> estimate
// scale" step every real system design interview runs through before any
// architecture gets drawn. Deliberately separate from the campaign levels --
// this is a fast, numeric warm-up, not a full design exercise.
//
// Answers are checked with a generous multiplicative tolerance rather than
// exact matching, because that's genuinely how this skill is graded in
// practice: being within the right order of magnitude (and showing your
// work) is the actual bar, not hitting a number to three significant figures.

export type EstimationCategory = "Throughput" | "Storage" | "Bandwidth" | "Memory" | "Capacity";

export interface EstimationDrill {
  id: string;
  category: EstimationCategory;
  prompt: string;
  question: string;
  givens: string[];
  answer: number;
  unit: string;
  /** Accept any answer within [answer / tolerance, answer * tolerance]. */
  tolerance: number;
  steps: string[];
  tip: string;
}

export const ESTIMATION_DRILLS: EstimationDrill[] = [
  {
    id: "feed-write-throughput",
    category: "Throughput",
    prompt:
      "500M daily active users, each posts an average of 2 times a day, and the average post is 1KB (text + metadata).",
    question: "What's the average write throughput, in posts per second?",
    givens: ["500,000,000 DAU", "2 posts/user/day", "~86,400 seconds/day"],
    answer: 11574,
    unit: "posts/sec",
    tolerance: 2,
    steps: [
      "Total posts/day = 500,000,000 x 2 = 1,000,000,000 posts/day",
      "Seconds/day = 24 x 60 x 60 = 86,400",
      "Average throughput = 1,000,000,000 / 86,400 ≈ 11,574 posts/sec",
    ],
    tip: "The 86,400-seconds-per-day conversion is worth memorizing cold -- it's the single most common step in these problems.",
  },
  {
    id: "feed-storage-growth",
    category: "Storage",
    prompt:
      "Same platform: 500M DAU, 2 posts/user/day, average post is 1KB. Assume every post is kept forever.",
    question: "Roughly how much storage does raw post data grow by per year (in TB)?",
    givens: ["1,000,000,000 posts/day (from the throughput drill)", "1KB/post", "365 days/year"],
    answer: 365,
    unit: "TB/year",
    tolerance: 2,
    steps: [
      "Daily data = 1,000,000,000 posts x 1KB = 1,000,000,000 KB/day",
      "1,000,000,000 KB ≈ 1TB (using 1KB = 10^3 B, 1TB = 10^12 B)",
      "Yearly growth = 1TB/day x 365 ≈ 365TB/year",
    ],
    tip: "Interviewers care that you can chain a throughput estimate into a storage estimate -- they're rarely two unrelated questions.",
  },
  {
    id: "chat-message-volume",
    category: "Throughput",
    prompt: "A chat app has 50M daily active users, each sending an average of 40 messages per day, averaging 100 bytes each.",
    question: "What's the average write throughput, in messages per second?",
    givens: ["50,000,000 DAU", "40 messages/user/day", "100 bytes/message"],
    answer: 23148,
    unit: "messages/sec",
    tolerance: 2,
    steps: [
      "Total messages/day = 50,000,000 x 40 = 2,000,000,000 messages/day",
      "Average throughput = 2,000,000,000 / 86,400 ≈ 23,148 messages/sec",
    ],
    tip: "Always compute the average first -- peak load (often 2-3x average) is a separate, follow-up estimate, not the same number.",
  },
  {
    id: "chat-storage-year",
    category: "Storage",
    prompt: "Same chat app: 2,000,000,000 messages/day, averaging 100 bytes each, kept for a year before archival.",
    question: "Roughly how much storage does one year of messages take (in TB)?",
    givens: ["2,000,000,000 messages/day", "100 bytes/message", "365 days/year"],
    answer: 73,
    unit: "TB/year",
    tolerance: 2,
    steps: [
      "Daily data = 2,000,000,000 x 100 bytes = 200,000,000,000 bytes = 200GB/day",
      "Yearly = 200GB/day x 365 = 73,000GB ≈ 73TB/year",
    ],
    tip: "Round aggressively as you go (200,000,000,000 bytes -> \"200GB\") -- carrying exact digits through several steps is where most arithmetic mistakes happen.",
  },
  {
    id: "video-egress-bandwidth",
    category: "Bandwidth",
    prompt: "A live video platform has 10M concurrent viewers, each streaming at an average bitrate of 5 Mbps.",
    question: "What's the total outbound (egress) bandwidth needed, in Gbps?",
    givens: ["10,000,000 concurrent viewers", "5 Mbps/viewer"],
    answer: 50000,
    unit: "Gbps",
    tolerance: 2,
    steps: [
      "Total bandwidth = 10,000,000 x 5 Mbps = 50,000,000 Mbps",
      "Convert to Gbps: 50,000,000 Mbps / 1,000 = 50,000 Gbps",
    ],
    tip: "This is exactly the number that forces a CDN into the design -- no single origin fleet serves 50Tbps from one region.",
  },
  {
    id: "photo-storage-year",
    category: "Storage",
    prompt: "A photo-sharing app has 100M photos uploaded per day, averaging 2MB per photo (original + a couple of resized copies).",
    question: "Roughly how much storage does one year of uploads take (in PB)?",
    givens: ["100,000,000 photos/day", "2MB/photo", "365 days/year"],
    answer: 73,
    unit: "PB/year",
    tolerance: 2,
    steps: [
      "Daily data = 100,000,000 x 2MB = 200,000,000MB = 200TB/day",
      "Yearly = 200TB/day x 365 = 73,000TB = 73PB/year",
    ],
    tip: "Once daily growth crosses ~100TB/day, object storage (not a database or plain disk) is the only realistic answer -- the number itself makes the design decision for you.",
  },
  {
    id: "session-cache-memory",
    category: "Memory",
    prompt: "10M daily active users, of whom about 20% are concurrently active at peak, and each active session needs 10KB cached (session state + hot profile data).",
    question: "How much total cache memory is needed at peak, in GB?",
    givens: ["10,000,000 DAU", "20% concurrently active at peak", "10KB cached/session"],
    answer: 20,
    unit: "GB",
    tolerance: 2,
    steps: [
      "Concurrent sessions at peak = 10,000,000 x 0.20 = 2,000,000",
      "Total cache = 2,000,000 x 10KB = 20,000,000KB ≈ 20GB",
    ],
    tip: "20GB fits comfortably on a single well-specced cache node -- this is the calculation that tells you whether you need a distributed cache cluster or not.",
  },
  {
    id: "read-write-split",
    category: "Capacity",
    prompt: "An API serves 100,000 requests/sec in total, with a read:write ratio of roughly 100:1.",
    question: "Roughly how many writes/sec is that (rounded to the nearest hundred)?",
    givens: ["100,000 requests/sec total", "100:1 read:write ratio"],
    answer: 990,
    unit: "writes/sec",
    tolerance: 1.5,
    steps: [
      "Let writes = w, then reads ≈ 100w, so total ≈ 101w",
      "101w = 100,000 -> w ≈ 990 writes/sec",
      "Reads ≈ 100,000 - 990 ≈ 99,010 reads/sec",
    ],
    tip: "Most real systems are heavily read-skewed -- this is the arithmetic behind \"add a cache and read replicas before you touch write capacity.\"",
  },
];

export function checkEstimationAnswer(drill: EstimationDrill, userAnswer: number): boolean {
  if (!Number.isFinite(userAnswer) || userAnswer <= 0) return false;
  return userAnswer >= drill.answer / drill.tolerance && userAnswer <= drill.answer * drill.tolerance;
}
