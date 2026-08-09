type Pose = "wave" | "search" | "sad" | "sleep" | "cheer";

const ARMS: Record<Pose, { left: string; right: string }> = {
  wave: {
    left: "M38 78c-6 4-12 3-16-2",
    right: "M92 76c10-14 8-30-2-38",
  },
  search: {
    left: "M36 80c-4 6-2 13 4 17",
    right: "M94 78c8 2 15-3 17-11",
  },
  sad: {
    left: "M40 82c-8 2-14 8-15 16",
    right: "M90 82c8 2 14 8 15 16",
  },
  sleep: {
    left: "M40 84c-6 0-11 4-13 10",
    right: "M90 84c6 0 11 4 13 10",
  },
  cheer: {
    left: "M38 78c-8-10-8-24 0-34",
    right: "M92 78c8-10 8-24 0-34",
  },
};

const EYES: Record<Pose, React.ReactNode> = {
  wave: (
    <>
      <circle cx="54" cy="62" r="4.5" fill="#1B2560" />
      <circle cx="76" cy="62" r="4.5" fill="#1B2560" />
    </>
  ),
  search: (
    <>
      <circle cx="54" cy="62" r="4.5" fill="#1B2560" />
      <circle cx="76" cy="62" r="4.5" fill="#1B2560" />
    </>
  ),
  sad: (
    <>
      <path d="M49 60c2-3 7-3 9 0" stroke="#1B2560" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M71 60c2-3 7-3 9 0" stroke="#1B2560" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  sleep: (
    <>
      <path d="M49 63c2 2 7 2 9 0" stroke="#1B2560" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M71 63c2 2 7 2 9 0" stroke="#1B2560" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  cheer: (
    <>
      <path d="M49 63c2-3 7-3 9 0" stroke="#1B2560" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M71 63c2-3 7-3 9 0" stroke="#1B2560" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
};

const MOUTHS: Record<Pose, string> = {
  wave: "M56 78c4 5 14 5 18 0",
  search: "M58 79c3 3 11 3 14 0",
  sad: "M58 82c4-4 10-4 14 0",
  sleep: "M60 80c2 1 8 1 10 0",
  cheer: "M55 77c5 7 15 7 20 0",
};

const BODY_COLORS: Record<string, string> = {
  orange: "#F97316",
  purple: "#8B5CF6",
  turquoise: "#14B8A6",
};

export default function Mascot({
  pose = "wave",
  color = "orange",
  size = 140,
  className,
}: {
  pose?: Pose;
  color?: "orange" | "purple" | "turquoise";
  size?: number;
  className?: string;
}) {
  const arms = ARMS[pose];
  const body = BODY_COLORS[color];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 130 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* shadow */}
      <ellipse cx="65" cy="122" rx="30" ry="5" fill="#000000" opacity="0.08" />

      {/* arms (behind body) */}
      <path d={arms.left} stroke={body} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d={arms.right} stroke={body} strokeWidth="9" strokeLinecap="round" fill="none" />

      {/* body */}
      <path
        d="M65 18c24 0 40 18 40 42s-16 46-40 46-40-22-40-46 16-42 40-42z"
        fill={body}
      />
      <ellipse cx="50" cy="44" rx="9" ry="6" fill="#FFFFFF" opacity="0.25" />

      {/* chef hat */}
      <path
        d="M42 26c0-9 8-15 16-12 3-8 15-8 18 0 8-3 16 3 16 12 0 3-2 5-4 5H46c-2 0-4-2-4-5z"
        fill="#FFFFFF"
        stroke="#EDEDED"
        strokeWidth="1"
      />
      <rect x="44" y="27" width="42" height="7" rx="3.5" fill="#FFFFFF" />

      {/* cheeks */}
      <circle cx="46" cy="72" r="5" fill="#FF6B6B" opacity="0.45" />
      <circle cx="84" cy="72" r="5" fill="#FF6B6B" opacity="0.45" />

      {/* eyes + mouth */}
      {EYES[pose]}
      <path d={MOUTHS[pose]} stroke="#1B2560" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
