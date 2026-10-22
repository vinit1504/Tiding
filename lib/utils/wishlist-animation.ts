const HEART_SVG = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="#ef4444" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const notifyHeader = () =>
  window.dispatchEvent(new CustomEvent("wishlist:added"));

/** Quick squash and stretch on the button itself */
export function popElement(el: HTMLElement) {
  if (prefersReducedMotion()) return;
  el.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(0.7)", offset: 0.2 },
      { transform: "scale(1.4)", offset: 0.55 },
      { transform: "scale(0.95)", offset: 0.8 },
      { transform: "scale(1)" },
    ],
    { duration: 450, easing: "ease-out" }
  );
}

/** Small particles that shoot out around the heart */
export function burstHearts(from: HTMLElement) {
  if (typeof window === "undefined" || prefersReducedMotion()) return;
  const r = from.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const colors = ["#ef4444", "#f97316", "#f43f5e", "#fb7185", "#fbbf24", "#ef4444"];

  colors.forEach((color, i) => {
    const size = 6;
    const dot = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed",
      left: `${cx - size / 2}px`,
      top: `${cy - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "9999px",
      background: color,
      pointerEvents: "none",
      zIndex: "9999",
    });
    document.body.appendChild(dot);

    const angle = (i / colors.length) * Math.PI * 2;
    const dist = 22 + Math.random() * 8;
    dot
      .animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0.2)`,
            opacity: 0,
          },
        ],
        { duration: 500, easing: "cubic-bezier(.2,.8,.3,1)" }
      )
      .onfinish = () => dot.remove();
  });
}

/** A heart flies from the button to the header wishlist icon */
export function flyHeartToHeader(from: HTMLElement) {
  if (typeof window === "undefined") return;
  const target = document.getElementById("header-wishlist-target");

  if (!target || prefersReducedMotion()) {
    notifyHeader();
    return;
  }

  const s = from.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const size = 22;

  const el = document.createElement("div");
  el.innerHTML = HEART_SVG;
  Object.assign(el.style, {
    position: "fixed",
    left: `${s.left + s.width / 2 - size / 2}px`,
    top: `${s.top + s.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    pointerEvents: "none",
    zIndex: "9999",
    filter: "drop-shadow(0 4px 6px rgba(239,68,68,.35))",
  });
  document.body.appendChild(el);

  const dx = t.left + t.width / 2 - (s.left + s.width / 2);
  const dy = t.top + t.height / 2 - (s.top + s.height / 2);

  el.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1, offset: 0 },
      {
        transform: `translate(${dx * 0.25}px, ${dy * 0.25 - 50}px) scale(1.7)`,
        opacity: 1,
        offset: 0.3,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.5)`, opacity: 0.9, offset: 1 },
    ],
    { duration: 800, easing: "cubic-bezier(.5,0,.3,1)" }
  ).onfinish = () => {
    el.remove();
    notifyHeader();
  };
}