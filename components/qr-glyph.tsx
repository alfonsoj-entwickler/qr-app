const SIZE = 21; // a version-1 QR grid

type Module = { x: number; y: number; finder: boolean };

// Small deterministic PRNG so server and client draw the same code.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const finderOrigins = [
  [0, 0],
  [SIZE - 7, 0],
  [0, SIZE - 7],
];

function finderCell(x: number, y: number): boolean | null {
  for (const [ox, oy] of finderOrigins) {
    const dx = x - ox;
    const dy = y - oy;
    // 7×7 pattern plus its 1-module white separator.
    if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
      const ring = Math.min(dx, dy, 6 - dx, 6 - dy);
      return ring !== 1;
    }
  }
  return null;
}

function buildModules(): Module[] {
  const random = mulberry32(0x9e3779b1);
  const modules: Module[] = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const finder = finderCell(x, y);
      if (finder !== null) {
        if (finder) modules.push({ x, y, finder: true });
        continue;
      }
      const timing = x === 6 || y === 6;
      const dark = timing ? (x + y) % 2 === 0 : random() < 0.48;
      if (dark) modules.push({ x, y, finder: false });
    }
  }
  return modules;
}

const modules = buildModules();

// The 404 code loses a jagged bottom-right corner, so it could never scan.
const tear = mulberry32(404);
const torn = modules.filter(({ x, y }) => x + y + tear() * 4 < SIZE + 9);

/**
 * Decorative QR-like mark (not a scannable code). `intact` prints itself
 * once on load; `torn` is the unreadable version used by the 404 page.
 */
export function QrGlyph({
  variant = "intact",
  className = "",
}: {
  variant?: "intact" | "torn";
  className?: string;
}) {
  const shown = variant === "torn" ? torn : modules;
  return (
    <div
      aria-hidden="true"
      className={`rounded-lg border border-line bg-surface p-[6%] ${className}`}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        shapeRendering="crispEdges"
        className={`block h-auto w-full ${variant === "intact" ? "qr-print" : ""}`}
      >
        {shown.map(({ x, y, finder }) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            className={finder ? "fill-accent" : "fill-foreground"}
            style={{ "--d": x + y } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
