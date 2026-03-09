// ============================================================
//  charts.js — Construtores de gráficos SVG
//  Cada função retorna um elemento SVGElement pronto para inserir.
// ============================================================

const Charts = (() => {

  // ── Donut Chart ─────────────────────────────────────────
  function donut({ available, busy, maintenance }) {
    const total = available + busy + maintenance;
    const size = 115, cx = size / 2, cy = size / 2, r = 40, sw = 20;
    const C  = 2 * Math.PI * r;
    const aA = (available   / total) * C;
    const aB = (busy        / total) * C;
    const aC = (maintenance / total) * C;

    const ns  = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

    const circles = [
      { stroke: "#1e2a3a", da: `${C} ${C}`,  offset: 0 },                                // track
      { stroke: "#3b82f6", da: `${aA} ${C}`, offset: C * 0.25 },                         // available
      { stroke: "#ef4444", da: `${aB} ${C}`, offset: C * 0.25 - aA },                    // busy
      { stroke: "#f59e0b", da: `${aC} ${C}`, offset: C * 0.25 - aA - aB },               // maintenance
    ];

    circles.forEach(({ stroke, da, offset }) => {
      const c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", stroke);
      c.setAttribute("stroke-width", sw);
      c.setAttribute("stroke-dasharray", da);
      c.setAttribute("stroke-dashoffset", offset);
      c.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
      svg.appendChild(c);
    });

    return svg;
  }

  // ── Line Chart ──────────────────────────────────────────
  function line({ data, maxValue = 20 }) {
    const W = 320, H = 82, px = 14, py = 6;
    const cw = W - px * 2;
    const ch = H - py - 16;
    const ns = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.style.overflow = "visible";

    // Grid + Y labels
    [0, 5, 10, 15, 20].forEach(v => {
      const y = py + ch - (v / maxValue) * ch;

      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", px); line.setAttribute("x2", W - px);
      line.setAttribute("y1", y);  line.setAttribute("y2", y);
      line.setAttribute("stroke", "#1e3a50"); line.setAttribute("stroke-width", "0.5");
      svg.appendChild(line);

      const txt = document.createElementNS(ns, "text");
      txt.setAttribute("x", px - 2); txt.setAttribute("y", y + 1.5);
      txt.setAttribute("text-anchor", "end"); txt.setAttribute("font-size", "5");
      txt.setAttribute("fill", "#5a7a95"); txt.textContent = v;
      svg.appendChild(txt);
    });

    // Points & path
    const pts = data.map((d, i) => ({
      x: px + (i / (data.length - 1)) * cw,
      y: py + ch - (d.v / maxValue) * ch,
    }));

    const pathEl = document.createElementNS(ns, "path");
    pathEl.setAttribute("d", pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" "));
    pathEl.setAttribute("fill", "none");
    pathEl.setAttribute("stroke", "#3b82f6");
    pathEl.setAttribute("stroke-width", "1.5");
    svg.appendChild(pathEl);

    pts.forEach((p, i) => {
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", p.x); circle.setAttribute("cy", p.y); circle.setAttribute("r", "2.5");
      circle.setAttribute("fill", "#3b82f6");
      svg.appendChild(circle);

      const txt = document.createElementNS(ns, "text");
      txt.setAttribute("x", p.x); txt.setAttribute("y", H - 2);
      txt.setAttribute("text-anchor", "middle"); txt.setAttribute("font-size", "5");
      txt.setAttribute("fill", "#5a7a95"); txt.textContent = data[i].bairro;
      svg.appendChild(txt);
    });

    return svg;
  }

  // ── Bar Chart ───────────────────────────────────────────
  function bar({ data, maxValue = 80 }) {
    const W = 170, H = 82, ox = 16, ch = 60;
    const bw = (W - ox - 10) / data.length - 4;
    const ns = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.style.overflow = "visible";

    [0, 20, 40, 60, 80].forEach(v => {
      const txt = document.createElementNS(ns, "text");
      txt.setAttribute("x", "2");
      txt.setAttribute("y", H - 14 - (v / maxValue) * ch + 2);
      txt.setAttribute("font-size", "4.5"); txt.setAttribute("fill", "#5a7a95");
      txt.textContent = v;
      svg.appendChild(txt);
    });

    data.forEach((d, i) => {
      const bh = (d.v / maxValue) * ch;
      const x  = ox + i * (bw + 4);

      const rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", x); rect.setAttribute("y", H - 14 - bh);
      rect.setAttribute("width", bw); rect.setAttribute("height", bh);
      rect.setAttribute("fill", "#1e4a8a"); rect.setAttribute("rx", "1.5");
      svg.appendChild(rect);

      const txt = document.createElementNS(ns, "text");
      txt.setAttribute("x", x + bw / 2); txt.setAttribute("y", H - 4);
      txt.setAttribute("text-anchor", "middle"); txt.setAttribute("font-size", "4.5");
      txt.setAttribute("fill", "#5a7a95"); txt.textContent = d.bairro;
      svg.appendChild(txt);
    });

    return svg;
  }

  // ── Gauge Chart ─────────────────────────────────────────
  function gauge({ value }) {
    const cx = 60, cy = 55, r = 40;
    const ns = "http://www.w3.org/2000/svg";

    const toXY = a => ({ x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) });
    const arcD = (sa, ea) => {
      const s = toXY(sa), e = toXY(ea);
      return `M${s.x} ${s.y} A${r} ${r} 0 0 0 ${e.x} ${e.y}`;
    };

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "120");
    svg.setAttribute("height", "70");
    svg.setAttribute("viewBox", "0 0 120 70");

    const arcs = [
      { d: arcD(Math.PI, Math.PI * 0.67), stroke: "#ef4444" },
      { d: arcD(Math.PI * 0.67, Math.PI * 0.33), stroke: "#f59e0b" },
      { d: arcD(Math.PI * 0.33, 0), stroke: "#22c55e" },
    ];

    arcs.forEach(({ d, stroke }) => {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d); path.setAttribute("stroke", stroke);
      path.setAttribute("stroke-width", "8"); path.setAttribute("fill", "none");
      svg.appendChild(path);
    });

    const angle = Math.PI + (value / 100) * Math.PI;
    const ne    = toXY(angle);

    const needle = document.createElementNS(ns, "line");
    needle.setAttribute("x1", cx); needle.setAttribute("y1", cy);
    needle.setAttribute("x2", ne.x); needle.setAttribute("y2", ne.y);
    needle.setAttribute("stroke", "#e5e7eb"); needle.setAttribute("stroke-width", "2");
    needle.setAttribute("stroke-linecap", "round");
    svg.appendChild(needle);

    const pivot = document.createElementNS(ns, "circle");
    pivot.setAttribute("cx", cx); pivot.setAttribute("cy", cy); pivot.setAttribute("r", "4");
    pivot.setAttribute("fill", "#374151"); pivot.setAttribute("stroke", "#e5e7eb");
    pivot.setAttribute("stroke-width", "1");
    svg.appendChild(pivot);

    const color = value > 70 ? "#22c55e" : value > 40 ? "#f59e0b" : "#ef4444";
    const label = document.createElementNS(ns, "text");
    label.setAttribute("x", cx); label.setAttribute("y", cy + 13);
    label.setAttribute("text-anchor", "middle"); label.setAttribute("font-size", "7");
    label.setAttribute("fill", color); label.setAttribute("font-weight", "bold");
    label.textContent = `${value}% - Bom`;
    svg.appendChild(label);

    return svg;
  }

  return { donut, line, bar, gauge };
})();
