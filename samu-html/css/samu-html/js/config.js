// ============================================================
//  config.js — Configuração de mapa e sistema
//  ► Mapbox GL JS + deck.gl: mapa 3D dark com heatmap de risco
// ============================================================

const MAP_CONFIG = {

  // ── Provedor ────────────────────────────────────────────
  // Opções: "mapbox" | "leaflet" | "mock"
  // "mapbox" = Mapbox GL JS como base + deck.gl para as camadas
  provider: "mapbox",

  // ── Mapbox ───────────────────────────────────────────────
  // 🔑 Insira seu token em: https://account.mapbox.com/
  mapbox: {
    accessToken: 'pk.eyJ1Ijoia2F3ZTEyMTAiLCJhIjoiY21tY2FjdnNwMDQ4azJ5bzk1ajB2cTU1cyJ9.PzVnEwg-IUoxdlaiLOuztQ',
    style:       "mapbox://styles/mapbox/dark-v11",
  },

  // ── Parâmetros da câmera 3D (compartilhados) ─────────────
  deckgl: {
    longitude: -37.0731,
    latitude:  -10.9472,   // centro de Aracaju
    zoom:      13,
    pitch:     52,          // inclinação 3D
    bearing:   -14,         // rotação inicial
  },

  // ── Leaflet (fallback — gratuito, sem API key) ───────────
  leaflet: {
    tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank">CARTO</a>',
    center: [-10.9472, -37.0731],
    zoom: 13, minZoom: 11, maxZoom: 19,
  },
};

