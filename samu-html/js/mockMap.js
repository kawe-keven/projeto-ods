// ============================================================
//  mockMap.js — Mapa visual simulado
//  Exibido quando MAP_CONFIG.provider === "mock"
// ============================================================

const MockMap = (() => {

  let _tickInterval = null;
  let _tick = 0;

  // Blocos urbanos para o fundo SVG
  const BLOCKS = [
    { x: 20, y: 20, w: 8,  h: 6  }, { x: 34, y: 20, w: 10, h: 5  },
    { x: 48, y: 20, w: 7,  h: 7  }, { x: 62, y: 20, w: 9,  h: 5  },
    { x: 76, y: 20, w: 8,  h: 6  }, { x: 20, y: 40, w: 9,  h: 5  },
    { x: 34, y: 40, w: 8,  h: 7  }, { x: 48, y: 40, w: 10, h: 5  },
    { x: 62, y: 40, w: 7,  h: 6  }, { x: 76, y: 40, w: 9,  h: 5  },
    { x: 20, y: 60, w: 8,  h: 6  }, { x: 34, y: 60, w: 10, h: 5  },
    { x: 48, y: 60, w: 7,  h: 7  }, { x: 62, y: 60, w: 8,  h: 5  },
    { x: 76, y: 60, w: 9,  h: 6  },
  ];

  function render(container) {
    container.innerHTML = `
      <div class="mock-map" id="mockMapInner">

        <!-- SVG de fundo (estradas, água, blocos) -->
        <svg class="map-svg-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <!-- Água -->
          <ellipse cx="12" cy="55" rx="10" ry="18" fill="#1a4a6b" opacity="0.55"/>
          <ellipse cx="85" cy="18" rx="12" ry="7"  fill="#1a4a6b" opacity="0.35"/>
          <!-- Estradas -->
          <path d="M0,50 Q25,45 50,52 Q75,58 100,50" stroke="#667" stroke-width="0.5" fill="none" opacity="0.5"/>
          <path d="M30,0 Q35,30 32,55 Q28,78 30,100" stroke="#667" stroke-width="0.35" fill="none" opacity="0.45"/>
          <path d="M0,30 L100,34"       stroke="#556" stroke-width="0.3" fill="none" opacity="0.4"/>
          <path d="M50,0 L53,100"       stroke="#556" stroke-width="0.25" fill="none" opacity="0.4"/>
          <path d="M0,70 Q50,66 100,72" stroke="#667" stroke-width="0.35" fill="none" opacity="0.45"/>
          <!-- Blocos urbanos -->
          ${BLOCKS.map((b, i) =>
            `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"
              fill="hsl(210,22%,${14 + i * 1.2}%)" opacity="0.48"/>`
          ).join("")}
        </svg>

        <!-- Incidentes -->
        ${(APP_DATA.incidents || []).map(inc => {
          const sev = inc.gravidade === "Alta" ? "high" : inc.gravidade === "Média" ? "med" : "low";
          return `
            <div class="inc-marker sev-${sev}"
                 style="left:${inc.x}%;top:${inc.y}%"
                 title="Incidente #${inc.id} — ${inc.local}">
              <div class="inc-pulse"></div>
              <div class="inc-icon">✚</div>
            </div>`;
        }).join("")}

        <!-- Bases -->
        ${(APP_DATA.bases || []).map(b => `
          <div class="base-marker" style="left:${b.x}%;top:${b.y}%" title="${b.label}">
            <div class="base-icon">🏥</div>
            <span class="base-label">${b.label}</span>
          </div>`
        ).join("")}

        <div class="mock-badge">MODO SIMULADO — Troque para "leaflet" em js/config.js para o mapa real</div>
      </div>
    `;

  }

  function destroy() {
    if (_tickInterval) clearInterval(_tickInterval);
  }

  return { render, destroy };
})();
