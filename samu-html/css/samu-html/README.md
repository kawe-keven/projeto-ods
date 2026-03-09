# SAMU Dashboard — HTML/CSS/JS

Dashboard operacional para monitoramento de frota e incidentes do SAMU.  
Funciona abrindo `index.html` direto no navegador — sem build, sem dependências.

---

## ▶ Como usar

Basta abrir `index.html` no navegador.  
Por padrão roda com mapa simulado (sem API key necessária).

---

## 🗺️ Configurar API de Mapa

Edite **`js/config.js`** e altere o campo `provider`:

| provider    | Requisito                      |
|-------------|-------------------------------|
| `"mock"`    | Nenhum — roda offline         |
| `"google"`  | Insira `apiKey`               |
| `"mapbox"`  | Insira `accessToken`          |
| `"leaflet"` | Nenhum — OpenStreetMap grátis |

### Exemplo — Google Maps
```js
provider: "google",
google: {
  apiKey: "AIzaSy...",
  center: { lat: -10.9472, lng: -37.0731 },
  zoom: 13,
}
```

### Exemplo — Mapbox
```js
provider: "mapbox",
mapbox: {
  accessToken: "pk.eyJ...",
  center: [-37.0731, -10.9472],
  zoom: 12,
}
```

### Exemplo — Leaflet (gratuito)
```js
provider: "leaflet"
```

---

## 📁 Estrutura de arquivos

```
index.html              ← Entrada principal

css/
  variables.css         ← Design tokens (cores, fontes)
  reset.css             ← Reset e utilitários globais
  layout.css            ← Estrutura / grid da página
  sidebar.css           ← Sidebar de navegação
  header.css            ← Barra de status superior
  map.css               ← Painel do mapa (real e mock)
  fleet.css             ← Painel da frota e incidentes
  performance.css       ← Painel de métricas

js/
  config.js             ← 🔑 API keys e configuração do mapa
  data.js               ← Dados de ambulâncias, incidentes, bases
  charts.js             ← Construtores de gráficos SVG
  sidebar.js            ← Componente sidebar
  header.js             ← Componente header
  mockMap.js            ← Mapa simulado (provider = "mock")
  map.js                ← Painel do mapa + integração SDKs
  fleet.js              ← Painel da frota
  performance.js        ← Painel de métricas
  app.js                ← Bootstrap (inicializa tudo)
```
