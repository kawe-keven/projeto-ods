// ============================================================
//  data.js — Dados de risco cardíaco (Aracaju, SE)
//  Fonte simulada: vendas de anti-hipertensivos em farmácias
//  por bairro/rua → indica probabilidade de parada cardíaca.
// ============================================================

const APP_DATA = {

  // ── Pontos de risco cardíaco por farmácia ─────────────────
  // weight: volume de vendas de remédios p/ pressão (1–10)
  // Fonte: simulação baseada em dados demográficos de Aracaju
  pharmacyPoints: [
    // ── CENTRO (risco CRÍTICO – alta densidade, pop. idosa) ──
    { lat:-10.9110, lng:-37.0690, weight:10, bairro:"Centro" },
    { lat:-10.9125, lng:-37.0670, weight:10, bairro:"Centro" },
    { lat:-10.9138, lng:-37.0655, weight: 9, bairro:"Centro" },
    { lat:-10.9145, lng:-37.0680, weight:10, bairro:"Centro" },
    { lat:-10.9155, lng:-37.0660, weight: 9, bairro:"Centro" },
    { lat:-10.9162, lng:-37.0675, weight:10, bairro:"Centro" },
    { lat:-10.9170, lng:-37.0645, weight: 9, bairro:"Centro" },
    { lat:-10.9180, lng:-37.0660, weight: 9, bairro:"Centro" },
    { lat:-10.9190, lng:-37.0680, weight: 8, bairro:"Centro" },
    { lat:-10.9155, lng:-37.0705, weight: 9, bairro:"Centro" },
    { lat:-10.9140, lng:-37.0715, weight: 8, bairro:"Centro" },

    // ── SIQUEIRA CAMPOS (risco ALTO) ──────────────────────
    { lat:-10.9095, lng:-37.0620, weight: 9, bairro:"Siqueira Campos" },
    { lat:-10.9108, lng:-37.0605, weight: 9, bairro:"Siqueira Campos" },
    { lat:-10.9118, lng:-37.0618, weight: 8, bairro:"Siqueira Campos" },
    { lat:-10.9128, lng:-37.0595, weight: 8, bairro:"Siqueira Campos" },
    { lat:-10.9135, lng:-37.0610, weight: 7, bairro:"Siqueira Campos" },
    { lat:-10.9100, lng:-37.0640, weight: 8, bairro:"Siqueira Campos" },
    { lat:-10.9115, lng:-37.0630, weight: 7, bairro:"Siqueira Campos" },

    // ── GETÚLIO VARGAS / PEREIRA LOBO (risco ALTO) ────────
    { lat:-10.9162, lng:-37.0625, weight: 9, bairro:"Getúlio Vargas" },
    { lat:-10.9175, lng:-37.0612, weight: 8, bairro:"Getúlio Vargas" },
    { lat:-10.9185, lng:-37.0630, weight: 8, bairro:"Getúlio Vargas" },
    { lat:-10.9172, lng:-37.0598, weight: 7, bairro:"Pereira Lobo"   },
    { lat:-10.9182, lng:-37.0582, weight: 7, bairro:"Pereira Lobo"   },
    { lat:-10.9195, lng:-37.0595, weight: 6, bairro:"Pereira Lobo"   },

    // ── 18 DO FORTE / SANTO ANTÔNIO (risco ALTO) ─────────
    { lat:-10.9228, lng:-37.0590, weight: 8, bairro:"18 do Forte" },
    { lat:-10.9240, lng:-37.0575, weight: 8, bairro:"18 do Forte" },
    { lat:-10.9252, lng:-37.0560, weight: 7, bairro:"18 do Forte" },
    { lat:-10.9235, lng:-37.0610, weight: 8, bairro:"Santo Antônio" },
    { lat:-10.9248, lng:-37.0595, weight: 7, bairro:"Santo Antônio" },
    { lat:-10.9262, lng:-37.0580, weight: 7, bairro:"Santo Antônio" },
    { lat:-10.9270, lng:-37.0562, weight: 6, bairro:"Santo Antônio" },

    // ── INDUSTRIAL (risco ALTO – trabalhadores, pop. 40+) ─
    { lat:-10.9318, lng:-37.0748, weight: 9, bairro:"Industrial" },
    { lat:-10.9335, lng:-37.0730, weight: 8, bairro:"Industrial" },
    { lat:-10.9350, lng:-37.0718, weight: 9, bairro:"Industrial" },
    { lat:-10.9362, lng:-37.0735, weight: 8, bairro:"Industrial" },
    { lat:-10.9345, lng:-37.0760, weight: 7, bairro:"Industrial" },
    { lat:-10.9372, lng:-37.0715, weight: 7, bairro:"Industrial" },
    { lat:-10.9325, lng:-37.0770, weight: 8, bairro:"Industrial" },

    // ── SÃO CONRADO / CAPUCHO (risco MÉD-ALTO) ───────────
    { lat:-10.9410, lng:-37.0678, weight: 7, bairro:"São Conrado" },
    { lat:-10.9425, lng:-37.0660, weight: 6, bairro:"São Conrado" },
    { lat:-10.9440, lng:-37.0648, weight: 7, bairro:"São Conrado" },
    { lat:-10.9385, lng:-37.0692, weight: 6, bairro:"Capucho"     },
    { lat:-10.9398, lng:-37.0710, weight: 6, bairro:"Capucho"     },
    { lat:-10.9415, lng:-37.0698, weight: 5, bairro:"Capucho"     },

    // ── SANTOS DUMONT (risco MÉDIO) ───────────────────────
    { lat:-10.9340, lng:-37.0502, weight: 5, bairro:"Santos Dumont" },
    { lat:-10.9358, lng:-37.0488, weight: 5, bairro:"Santos Dumont" },
    { lat:-10.9372, lng:-37.0510, weight: 6, bairro:"Santos Dumont" },
    { lat:-10.9328, lng:-37.0520, weight: 5, bairro:"Santos Dumont" },
    { lat:-10.9385, lng:-37.0495, weight: 4, bairro:"Santos Dumont" },

    // ── GRAGERU (risco MÉDIO) ─────────────────────────────
    { lat:-10.9295, lng:-37.0468, weight: 4, bairro:"Grageru" },
    { lat:-10.9312, lng:-37.0452, weight: 5, bairro:"Grageru" },
    { lat:-10.9328, lng:-37.0475, weight: 4, bairro:"Grageru" },
    { lat:-10.9342, lng:-37.0458, weight: 4, bairro:"Grageru" },

    // ── JABOTIANA (risco MÉDIO) ───────────────────────────
    { lat:-10.9498, lng:-37.0855, weight: 5, bairro:"Jabotiana" },
    { lat:-10.9518, lng:-37.0840, weight: 5, bairro:"Jabotiana" },
    { lat:-10.9535, lng:-37.0862, weight: 4, bairro:"Jabotiana" },
    { lat:-10.9510, lng:-37.0878, weight: 5, bairro:"Jabotiana" },
    { lat:-10.9525, lng:-37.0820, weight: 4, bairro:"Jabotiana" },
    { lat:-10.9548, lng:-37.0845, weight: 4, bairro:"Jabotiana" },

    // ── FAROLÂNDIA (risco MÉDIO) ──────────────────────────
    { lat:-10.9682, lng:-37.0515, weight: 5, bairro:"Farolândia" },
    { lat:-10.9698, lng:-37.0500, weight: 5, bairro:"Farolândia" },
    { lat:-10.9714, lng:-37.0520, weight: 4, bairro:"Farolândia" },
    { lat:-10.9668, lng:-37.0535, weight: 4, bairro:"Farolândia" },
    { lat:-10.9718, lng:-37.0495, weight: 4, bairro:"Farolândia" },

    // ── LUZIA / PONTO NOVO (risco MÉDIO-BAIXO) ────────────
    { lat:-10.9198, lng:-37.0558, weight: 5, bairro:"Luzia"     },
    { lat:-10.9212, lng:-37.0540, weight: 4, bairro:"Luzia"     },
    { lat:-10.9225, lng:-37.0555, weight: 4, bairro:"Luzia"     },
    { lat:-10.9162, lng:-37.0545, weight: 5, bairro:"Ponto Novo" },
    { lat:-10.9178, lng:-37.0530, weight: 4, bairro:"Ponto Novo" },

    // ── JARDINS (risco BAIXO-MÉDIO – classe A/B) ──────────
    { lat:-10.9285, lng:-37.0495, weight: 3, bairro:"Jardins" },
    { lat:-10.9298, lng:-37.0510, weight: 3, bairro:"Jardins" },
    { lat:-10.9272, lng:-37.0478, weight: 3, bairro:"Jardins" },
    { lat:-10.9310, lng:-37.0488, weight: 2, bairro:"Jardins" },

    // ── ATALAIA (risco BAIXO – praia, pop. jovem) ─────────
    { lat:-10.9588, lng:-37.0368, weight: 2, bairro:"Atalaia" },
    { lat:-10.9608, lng:-37.0352, weight: 2, bairro:"Atalaia" },
    { lat:-10.9628, lng:-37.0370, weight: 2, bairro:"Atalaia" },
    { lat:-10.9618, lng:-37.0388, weight: 3, bairro:"Atalaia" },
    { lat:-10.9645, lng:-37.0358, weight: 2, bairro:"Atalaia" },

    // ── COROA DO MEIO (risco MÉDIO) ───────────────────────
    { lat:-10.9738, lng:-37.0528, weight: 4, bairro:"Coroa do Meio" },
    { lat:-10.9755, lng:-37.0512, weight: 4, bairro:"Coroa do Meio" },
    { lat:-10.9748, lng:-37.0548, weight: 3, bairro:"Coroa do Meio" },
    { lat:-10.9768, lng:-37.0528, weight: 3, bairro:"Coroa do Meio" },
  ],

  // ── Hospitais e UPAs de Aracaju ──────────────────────────
  // leitosCardiaco : leitos destinados a cardiologia / UTI cardíaca
  // ocupacaoCardiaco : % de ocupação desses leitos (0-100)
  // temHemodinamica : possui sala de hemodinâmica para cateterismo / angioplastia
  // tempResposta    : tempo médio de ativação da equipe cardíaca (minutos)
  // infarctosHoje   : casos de IAM registrados hoje
  // infarctos7d     : casos por dia nos últimos 7 dias [d-6 … d-0]
  hospitals: [
    {
      id:"HUSE",  label:"HUSE",             tipo:"Hospital",
      lat:-10.9262, lng:-37.0693,
      leitos:220, ocupacao:88,
      leitosCardiaco:18, ocupacaoCardiaco:94,
      temHemodinamica:true,  tempResposta:8,
      infarctosHoje:3, infarctos7d:[2,3,4,2,5,3,3],
    },
    {
      id:"HSL",   label:"Hosp. São Lucas",  tipo:"Hospital",
      lat:-10.9185, lng:-37.0507,
      leitos:180, ocupacao:72,
      leitosCardiaco:12, ocupacaoCardiaco:67,
      temHemodinamica:true,  tempResposta:12,
      infarctosHoje:1, infarctos7d:[1,2,1,2,1,1,2],
    },
    {
      id:"HPRIM", label:"Hosp. Primavera",  tipo:"Hospital",
      lat:-10.9344, lng:-37.0511,
      leitos:150, ocupacao:65,
      leitosCardiaco:8,  ocupacaoCardiaco:50,
      temHemodinamica:false, tempResposta:15,
      infarctosHoje:0, infarctos7d:[0,1,0,0,1,0,1],
    },
    {
      id:"UPA-N", label:"UPA Norte",        tipo:"UPA",
      lat:-10.9083, lng:-37.0654,
      leitos:30,  ocupacao:90,
      leitosCardiaco:4,  ocupacaoCardiaco:100,
      temHemodinamica:false, tempResposta:5,
      infarctosHoje:2, infarctos7d:[1,2,2,1,3,2,2],
    },
    {
      id:"UPA-S", label:"UPA Sul",          tipo:"UPA",
      lat:-10.9698, lng:-37.0504,
      leitos:30,  ocupacao:75,
      leitosCardiaco:4,  ocupacaoCardiaco:75,
      temHemodinamica:false, tempResposta:7,
      infarctosHoje:1, infarctos7d:[0,1,1,0,1,0,1],
    },
    {
      id:"HCC",   label:"Hosp. do Coração", tipo:"Hospital",
      lat:-10.9319, lng:-37.0567,
      leitos:120, ocupacao:60,
      leitosCardiaco:24, ocupacaoCardiaco:58,
      temHemodinamica:true,  tempResposta:10,
      infarctosHoje:2, infarctos7d:[2,2,3,2,1,2,2],
    },
  ],

  // ── Itens da sidebar ──────────────────────────────────────
  navItems: [
    { id: "map",       icon: "🗺️",  label: "Mapa de Risco"    },
    { id: "hospitals", icon: "🏥",  label: "Hospitais"        },
    { id: "zones",     icon: "🔥",  label: "Zonas Críticas"   },
    { id: "settings",  icon: "⚙️",  label: "Configurações"    },
  ],
};

