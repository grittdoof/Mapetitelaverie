const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');

// ── Palette couleurs ──────────────────────────────────────────────────────────
const BLUE_DARK   = "0B5ED7";
const BLUE_LIGHT  = "D6E8FF";
const BLUE_MID    = "2563EB";
const GREEN_BG    = "DCFCE7";
const GREEN_DARK  = "16A34A";
const ORANGE_BG   = "FFF7ED";
const ORANGE_DARK = "EA580C";
const RED_BG      = "FEE2E2";
const RED_DARK    = "DC2626";
const GREY_BG     = "F1F5F9";
const GREY_BORDER = "CBD5E1";
const WHITE       = "FFFFFF";

// ── Helpers ───────────────────────────────────────────────────────────────────
const cellBorder = (color = GREY_BORDER) => ({
  style: BorderStyle.SINGLE, size: 1, color
});
const borders = (color = GREY_BORDER) => ({
  top: cellBorder(color), bottom: cellBorder(color),
  left: cellBorder(color), right: cellBorder(color)
});
const noBorder = () => ({
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
});

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 36, color: BLUE_DARK, font: "Arial" })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 140 },
    children: [new TextRun({ text, bold: true, size: 28, color: BLUE_MID, font: "Arial" })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: "1E3A5F", font: "Arial" })]
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
  });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
  });
}
function bullet2(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "bullets2", level: 0 },
    spacing: { before: 30, after: 30 },
    children: [new TextRun({ text, size: 20, font: "Arial", color: "475569", ...opts })]
  });
}
function numbered(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
  });
}
function space(before = 120) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun("")] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// Badge coloré pleine largeur
function badge(text, fillColor, textColor = WHITE) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: noBorder(),
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: fillColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text, bold: true, size: 24, color: textColor, font: "Arial" })]
        })]
      })
    ]})]
  });
}

// Ligne de tableau à 2 colonnes (label / valeur)
function twoCol(label, value, labelW = 3200, valueW = 6160, headerRow = false) {
  const total = labelW + valueW;
  const fill = headerRow ? BLUE_DARK : WHITE;
  const txtColor = headerRow ? WHITE : "1E293B";
  const txtColorVal = headerRow ? WHITE : "334155";
  return new TableRow({ children: [
    new TableCell({
      borders: borders(),
      width: { size: labelW, type: WidthType.DXA },
      shading: { fill: headerRow ? BLUE_DARK : GREY_BG, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: txtColor, font: "Arial" })] })]
    }),
    new TableCell({
      borders: borders(),
      width: { size: valueW, type: WidthType.DXA },
      shading: { fill: headerRow ? BLUE_MID : WHITE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, color: txtColorVal, font: "Arial" })] })]
    })
  ]});
}

// Tableau simple à 2 colonnes
function simpleTable(rows, labelW = 3200, valueW = 6160) {
  return new Table({
    width: { size: labelW + valueW, type: WidthType.DXA },
    columnWidths: [labelW, valueW],
    rows: rows.map(([l, v], i) => twoCol(l, v, labelW, valueW, i === 0))
  });
}

// Alerte / encadré coloré
function alertBox(title, lines, fillColor, borderColor, textColor = "1E293B") {
  const content = [
    new Paragraph({ spacing: { before: 0, after: 100 }, children: [new TextRun({ text: title, bold: true, size: 22, color: borderColor, font: "Arial" })] }),
    ...lines.map(l => new Paragraph({
      numbering: { reference: "bullets2", level: 0 },
      spacing: { before: 30, after: 30 },
      children: [new TextRun({ text: l, size: 20, color: textColor, font: "Arial" })]
    }))
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: {
          top: cellBorder(borderColor), bottom: cellBorder(borderColor),
          left: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
          right: cellBorder(borderColor)
        },
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: fillColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: content
      })
    ]})]
  });
}

// ── DOCUMENT ──────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 300 } } } }] },
      { reference: "bullets2",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 480, hanging: 280 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 300 } } } }] }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: "1E293B" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: BLUE_DARK },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE_MID },
        paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "1E3A5F" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } // 2 cm
      }
    },
    headers: {
      default: new Header({ children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({ text: "Ma Petite Laverie \u2014 Feuille de route Google Ads & GTM", size: 18, color: "94A3B8", font: "Arial" }),
            new TextRun({ text: "  |  Confidentiel", size: 18, color: "CBD5E1", font: "Arial" })
          ]
        })
      ]})
    },
    footers: {
      default: new Footer({ children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18, color: "94A3B8", font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "94A3B8", font: "Arial" }),
            new TextRun({ text: " / ", size: 18, color: "94A3B8", font: "Arial" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "94A3B8", font: "Arial" })
          ]
        })
      ]})
    },
    children: [

      // ═══════════════════════════════════════════════════════════════════════
      // PAGE DE TITRE
      // ═══════════════════════════════════════════════════════════════════════
      space(600),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "MA PETITE LAVERIE", bold: true, size: 52, color: BLUE_DARK, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 300 },
        children: [new TextRun({ text: "Feuille de route Google Ads & GTM", size: 36, color: BLUE_MID, font: "Arial" })]
      }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [
          new TableCell({
            borders: noBorder(),
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: BLUE_DARK, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 300, right: 300 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Plan d\u2019action op\u00e9rationnel \u2022 Budget 36\u20ac/jour \u2022 Objectif : leads B2B qualifi\u00e9s", size: 24, color: WHITE, font: "Arial" })]
              })
            ]
          })
        ]})]
      }),
      space(300),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [
            new TableCell({
              borders: borders(BLUE_LIGHT),
              width: { size: 4680, type: WidthType.DXA },
              shading: { fill: BLUE_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [
                new TextRun({ text: "Budget publicitaire : ", bold: true, size: 22, font: "Arial", color: BLUE_DARK }),
                new TextRun({ text: "36\u20ac / jour", size: 22, font: "Arial", color: BLUE_DARK })
              ]})]
            }),
            new TableCell({
              borders: borders(BLUE_LIGHT),
              width: { size: 4680, type: WidthType.DXA },
              shading: { fill: BLUE_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [
                new TextRun({ text: "Cycle de vente : ", bold: true, size: 22, font: "Arial", color: BLUE_DARK }),
                new TextRun({ text: "B2B \u2014 fen\u00eatre 90 jours", size: 22, font: "Arial", color: BLUE_DARK })
              ]})]
            })
          ]}),
          new TableRow({ children: [
            new TableCell({
              borders: borders(BLUE_LIGHT),
              width: { size: 4680, type: WidthType.DXA },
              shading: { fill: BLUE_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [
                new TextRun({ text: "Objectif primaire : ", bold: true, size: 22, font: "Arial", color: BLUE_DARK }),
                new TextRun({ text: "Soumission formulaire (6 \u00e9tapes)", size: 22, font: "Arial", color: BLUE_DARK })
              ]})]
            }),
            new TableCell({
              borders: borders(BLUE_LIGHT),
              width: { size: 4680, type: WidthType.DXA },
              shading: { fill: BLUE_LIGHT, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [
                new TextRun({ text: "Taux de conv. cible : ", bold: true, size: 22, font: "Arial", color: BLUE_DARK }),
                new TextRun({ text: "2\u20133 %", size: 22, font: "Arial", color: BLUE_DARK })
              ]})]
            })
          ]})
        ]
      }),
      space(400),

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 0 — DIAGNOSTIC
      // ═══════════════════════════════════════════════════════════════════════
      pageBreak(),
      h1("0. Diagnostic de l\u2019existant"),
      body("Avant tout param\u00e9trage, voici les anomalies d\u00e9tect\u00e9es directement dans le code source (index.html / index2.js) \u2014 \u00e0 corriger en priorit\u00e9 absolue."),
      space(80),
      alertBox(
        "\u26a0\ufe0f BLOCKERS \u2014 \u00e0 corriger AVANT le lancement",
        [
          "GA_MEASUREMENT_ID non remplac\u00e9 \u2192 aucune donn\u00e9e collect\u00e9e dans GA4",
          "AW-CONVERSION_ID/LABEL fictif \u2192 z\u00e9ro conversion remontant dans Google Ads",
          "Tag Google Analytics charg\u00e9 AVANT le consentement cookie \u2192 non-conformit\u00e9 RGPD",
          "Balise gtag en dur dans index.html sans passer par GTM \u2192 double tagging \u00e0 \u00e9viter",
        ],
        RED_BG, RED_DARK
      ),
      space(120),
      alertBox(
        "\u2705 Points positifs d\u00e9j\u00e0 en place",
        [
          "Gestion consentement cookies pr\u00e9sente (acceptCookies / refuseCookies avec gtag consent update)",
          "Tracking \u00e9tapes formulaire : form_step_completed envoy\u00e9 \u00e0 chaque nextStep()",
          "Tracking soumission : form_submission + conversion \u00e9mission cod\u00e9s, \u00e0 connecter",
          "Token CSRF g\u00e9n\u00e9r\u00e9 c\u00f4t\u00e9 client (s\u00e9curit\u00e9 formulaire)",
          "Donn\u00e9es de qualification riches : type projet, budget, emplacement, timing, surface \u2192 parfait pour attribution bas\u00e9e sur les donn\u00e9es",
        ],
        GREEN_BG, GREEN_DARK
      ),
      space(200),

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 1 — GTM
      // ═══════════════════════════════════════════════════════════════════════
      h1("1. Google Tag Manager \u2014 Architecture compl\u00e8te"),
      body("GTM est le pivot central. Toutes les balises passent par lui. On supprime le gtag en dur dans index.html et on centralise."),
      space(100),

      h2("1.1 Installation du conteneur GTM"),
      simpleTable([
        ["Param\u00e8tre", "Valeur / Action"],
        ["Cr\u00e9er le compte", "GTM > Nouveau compte > \u00abMa Petite Laverie\u00bb > Conteneur \u00abWeb\u00bb"],
        ["ID conteneur", "GTM-XXXXXXX (obtenu \u00e0 la cr\u00e9ation)"],
        ["Snippet <head>", "Coller JUSTE apr\u00e8s <head> dans index.html, AVANT toute balise script"],
        ["Snippet <body>", "Coller JUSTE apr\u00e8s <body> (balise noscript)"],
        ["Supprimer", "Les lignes 30\u201338 de index.html (gtag.js en dur) \u2014 GTM s\u2019en charge"],
      ]),
      space(120),
      alertBox(
        "\ud83d\udca1 Pourquoi enlever le gtag en dur ?",
        [
          "Double tagging = donn\u00e9es dupliqu\u00e9es dans GA4",
          "Le consentement mode ne peut pas \u00eatre g\u00e9r\u00e9 correctement si le tag se charge en dehors de GTM",
          "GTM permet le versioning, les tests et les rollbacks sans toucher au code"
        ],
        ORANGE_BG, ORANGE_DARK, "1E293B"
      ),
      space(160),

      h2("1.2 Configuration du Consent Mode v2 (obligatoire 2024)"),
      body("La fonction acceptCookies() dans index2.js appelle d\u00e9j\u00e0 gtag consent update. Voici la configuration GTM compl\u00e8te \u00e0 mettre en place pour \u00eatre 100 % conforme."),
      space(80),
      h3("Balise \u00ab Consent Initialization \u00bb (d\u00e9fault state)"),
      body("Type : Custom HTML \u2014 Priorit\u00e9 : 0 (se d\u00e9clenche en tout premier)"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [
          new TableCell({
            borders: borders("94A3B8"),
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "gtag('consent', 'default', {", size: 20, font: "Courier New", color: "1E293B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  analytics_storage: 'denied',", size: 20, font: "Courier New", color: "1E293B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  ad_storage: 'denied',", size: 20, font: "Courier New", color: "1E293B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  ad_user_data: 'denied',", size: 20, font: "Courier New", color: "1E293B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  ad_personalization: 'denied',", size: 20, font: "Courier New", color: "1E293B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  wait_for_update: 2000", size: 20, font: "Courier New", color: "1E293B" })] }),
              new Paragraph({ children: [new TextRun({ text: "});", size: 20, font: "Courier New", color: "1E293B" })] }),
            ]
          })
        ]})]
      }),
      space(100),
      body("Activer l\u2019option \u00abConsent Initialization\u00bb dans les param\u00e8tres avanc\u00e9s de la balise GTM."),
      space(100),
      h3("Balise \u00ab Consent Update \u00bb (d\u00e9clencheur : Data Layer Event \u00abcookie_consent\u00bb)"),
      body("La fonction acceptCookies() envoie d\u00e9j\u00e0 trackEvent('cookie_consent', {action: 'accepted'}). Il faut cr\u00e9er un d\u00e9clencheur GTM sur cet \u00e9v\u00e9nement."),
      space(60),
      simpleTable([
        ["El\u00e9ment GTM", "Configuration"],
        ["Type de d\u00e9clencheur", "Ev\u00e9nement personnalis\u00e9 \u2014 Nom de l\u2019\u00e9v\u00e9nement : cookie_consent"],
        ["Condition", "Variable dataLayer action = accepted"],
        ["Type de balise", "Custom HTML"],
        ["Code HTML", "gtag('consent','update',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'})"],
      ]),
      space(160),

      h2("1.3 Balises GA4"),
      simpleTable([
        ["Balise", "Configuration"],
        ["Nom", "GA4 \u2014 Configuration"],
        ["Type", "Balise Google Analytics : Configuration GA4"],
        ["ID de mesure", "G-XXXXXXXXXX (votre vrai ID GA4)"],
        ["D\u00e9clencheur", "Toutes les pages"],
        ["Param\u00e8tres personnalis\u00e9s", "send_page_view : false (GTM g\u00e8re)"],
      ], 3600, 5760),
      space(120),
      alertBox(
        "\ud83d\udd27 Param\u00e8tres avanc\u00e9s GA4 \u00e0 activer dans le compte GA4",
        [
          "Signaux Google : activer (retargeting + audiences cross-device)",
          "D\u00e9duplication des conversions : activer",
          "Dur\u00e9e de conservation des donn\u00e9es : 14 mois (par d\u00e9faut 2 mois \u2014 \u00e0 changer !)",
          "Mod\u00e9lisation des conversions : activer (crucial Consent Mode)",
          "D\u00e9finition du fuseau horaire et devise : France / EUR"
        ],
        BLUE_LIGHT, BLUE_DARK, "1E293B"
      ),
      space(160),

      h2("1.4 Balise Google Ads \u2014 Suivi des conversions"),
      body("C\u2019est le point le plus critique. Actuellement le code index2.js contient : trackEvent('conversion', { send_to: 'AW-CONVERSION_ID/LABEL' }) avec un ID fictif. Voici la configuration correcte."),
      space(80),
      simpleTable([
        ["Param\u00e8tre", "Valeur"],
        ["ID de conversion", "R\u00e9cup\u00e9rer dans Google Ads > Outils > Mesure des conversions"],
        ["Nom conversion", "Soumission formulaire devis"],
        ["Cat\u00e9gorie", "Envoi de formulaire"],
        ["Valeur", "0 (ou valeur moyenne d\u2019un lead si connue)"],
        ["Comptage", "1 par clic (B2B \u2014 pas le nombre de soumissions)"],
        ["Fen\u00eatre de conv. clic", "90 jours (cycle de vente B2B long)"],
        ["Fen\u00eatre de conv. vue", "30 jours"],
        ["Attribution", "Bas\u00e9 sur les donn\u00e9es (Data-Driven) \u2014 minimum 50 conversions/mois"],
        ["D\u00e9clencheur GTM", "\u00c9v\u00e9nement personnalis\u00e9 : form_submission"],
      ], 3600, 5760),
      space(100),

      h3("Variables dataLayer \u00e0 pousser lors de la soumission"),
      body("Dans index2.js, la ligne trackEvent('form_submission', ...) est d\u00e9j\u00e0 pr\u00e9sente. Il faut enrichir l\u2019\u00e9v\u00e9nement avec les donn\u00e9es de qualification collect\u00e9es par le formulaire :"),
      space(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [
          new TableCell({
            borders: borders("94A3B8"),
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "dataLayer.push({", size: 20, font: "Courier New" })] }),
              new Paragraph({ children: [new TextRun({ text: "  event: 'form_submission',", size: 20, font: "Courier New" })] }),
              new Paragraph({ children: [new TextRun({ text: "  lead_type: formData.get('type_projet'),   // premiere_acquisition | extension | remplacement", size: 20, font: "Courier New", color: "64748B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  lead_budget: formData.get('budget'),       // 15-20k | 20-30k | 30k+", size: 20, font: "Courier New", color: "64748B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  lead_timing: formData.get('timing'),       // immediat | 3_mois | 6_mois_plus", size: 20, font: "Courier New", color: "64748B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  lead_emplacement: formData.get('emplacement_disponible'), // oui | non", size: 20, font: "Courier New", color: "64748B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  lead_surface: formData.get('surface'),     // moins_10m2 | 10-20m2...", size: 20, font: "Courier New", color: "64748B" })] }),
              new Paragraph({ children: [new TextRun({ text: "  value: 1,", size: 20, font: "Courier New" })] }),
              new Paragraph({ children: [new TextRun({ text: "  currency: 'EUR'", size: 20, font: "Courier New" })] }),
              new Paragraph({ children: [new TextRun({ text: "});", size: 20, font: "Courier New" })] }),
            ]
          })
        ]})]
      }),
      space(160),

      h2("1.5 Micro-conversions \u2014 Parcours du formulaire"),
      body("Le formulaire 6 \u00e9tapes est une mine d\u2019or analytique. Chaque \u00e9tape est un signal d\u2019intention croissant. Ces micro-conversions permettent d\u2019identifier les points de friction et d\u2019optimiser la Smart Bidding."),
      space(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2200, 3360, 1600, 2200],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2200, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "\u00c9tape", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 3360, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Ev\u00e9nement GTM", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 1600, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Type conv.", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2200, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Valeur signal", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
          ]}),
          ...[
            ["1 \u2014 Type projet", "form_step_completed (step=1)", "Micro", "Faible"],
            ["2 \u2014 Budget", "form_step_completed (step=2)", "Micro", "Moyen \u2605"],
            ["3 \u2014 Emplacement", "form_step_completed (step=3)", "Micro", "Moyen"],
            ["4 \u2014 Timing", "form_step_completed (step=4)", "Micro", "Moyen \u2605"],
            ["5 \u2014 Surface", "form_step_completed (step=5)", "Micro", "Moyen"],
            ["6 \u2014 Coordonn\u00e9es", "form_step_6_reached", "Micro fort", "Tr\u00e8s fort \u2605\u2605"],
            ["Soumission", "form_submission", "Conversion principale", "\u2605\u2605\u2605 Macro"],
          ].map(([e, ev, t, v], i) => new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 2200, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: e, size: 19, font: "Arial", bold: t === "Conversion principale" })] })] }),
            new TableCell({ borders: borders(), width: { size: 3360, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: ev, size: 18, font: "Courier New", color: "334155" })] })] }),
            new TableCell({ borders: borders(), width: { size: 1600, type: WidthType.DXA }, shading: { fill: t === "Conversion principale" ? GREEN_BG : (i % 2 === 0 ? WHITE : GREY_BG), type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: t, size: 19, font: "Arial", color: t === "Conversion principale" ? GREEN_DARK : "475569", bold: t === "Conversion principale" })] })] }),
            new TableCell({ borders: borders(), width: { size: 2200, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: v, size: 19, font: "Arial", color: "475569" })] })] }),
          ]}))
        ]
      }),
      space(160),

      h2("1.6 Variables GTM \u00e0 cr\u00e9er"),
      simpleTable([
        ["Variable GTM", "Type / Source"],
        ["DL \u2014 Event", "Variable de couche de donn\u00e9es \u2014 Cl\u00e9 : event"],
        ["DL \u2014 Step", "Variable de couche de donn\u00e9es \u2014 Cl\u00e9 : step"],
        ["DL \u2014 Lead Budget", "Variable de couche de donn\u00e9es \u2014 Cl\u00e9 : lead_budget"],
        ["DL \u2014 Lead Timing", "Variable de couche de donn\u00e9es \u2014 Cl\u00e9 : lead_timing"],
        ["DL \u2014 Lead Type", "Variable de couche de donn\u00e9es \u2014 Cl\u00e9 : lead_type"],
        ["DL \u2014 Lead Emplacement", "Variable de couche de donn\u00e9es \u2014 Cl\u00e9 : lead_emplacement"],
        ["DL \u2014 Conversion Value", "Variable de couche de donn\u00e9es \u2014 Cl\u00e9 : value"],
        ["URL \u2014 Path", "Variable int\u00e9gr\u00e9e (Page Path)"],
        ["Gclid", "Custom JS : function(){return new URLSearchParams(location.search).get('gclid')||''}"],
      ]),
      space(200),

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 2 — STRUCTURE GOOGLE ADS
      // ═══════════════════════════════════════════════════════════════════════
      pageBreak(),
      h1("2. Structure Google Ads \u2014 Architecture granulaire"),
      body("Budget de 36\u20ac/jour \u2248 1\u2009080\u20ac/mois. Avec un CPC estim\u00e9 de 2\u20135\u20ac sur ce secteur et un objectif de 2\u20133 % de conversion, on cible 5 \u00e0 10 leads qualifi\u00e9s par mois. Voici comment maximiser chaque euro."),
      space(80),

      h2("2.1 R\u00e9partition budg\u00e9taire recommand\u00e9e"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3200, 2560, 1600, 2000],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 3200, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Campagne", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2560, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Type", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 1600, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Budget/j", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2000, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Priorit\u00e9", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
          ]}),
          ...[
            ["MPL \u2014 Achat Kiosque (haute intention)", "Search", "18\u20ac", "\ud83d\udd34 Priorit\u00e9 1"],
            ["MPL \u2014 Investissement Laverie", "Search", "10\u20ac", "\ud83d\udfe0 Priorit\u00e9 2"],
            ["MPL \u2014 Concurrents (Wash Me / Photomaton)", "Search", "5\u20ac", "\ud83d\udfe1 Priorit\u00e9 3"],
            ["MPL \u2014 Remarketing", "Display / RLSA", "3\u20ac", "\ud83d\udd35 Support"],
          ].map(([c, t, b, p], i) => new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 3200, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: c, size: 20, font: "Arial", bold: true })] })] }),
            new TableCell({ borders: borders(), width: { size: 2560, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: t, size: 20, font: "Arial" })] })] }),
            new TableCell({ borders: borders(), width: { size: 1600, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: b, bold: true, size: 20, font: "Arial", color: BLUE_DARK })] })] }),
            new TableCell({ borders: borders(), width: { size: 2000, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: p, size: 20, font: "Arial" })] })] }),
          ]}))
        ]
      }),
      space(160),

      h2("2.2 Groupe 1 \u2014 Achat Kiosque Laverie (haute intention)"),
      h3("Mots-cl\u00e9s \u2014 Correspondance exacte et expression"),
      body("Utiliser EXCLUSIVEMENT correspondance exacte et expression en phase de lancement pour contr\u00f4ler les d\u00e9penses. Passer au large apr\u00e8s 30 jours si les donn\u00e9es le justifient."),
      space(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4200, 2580, 2580],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 4200, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Mot-cl\u00e9", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2580, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Correspondance", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2580, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Intention", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
          ]}),
          ...[
            ["achat kiosque laverie", "[Exacte]", "\ud83d\udd34 Tr\u00e8s haute"],
            ["acheter kiosque laverie automatique", "[Exacte]", "\ud83d\udd34 Tr\u00e8s haute"],
            ["kiosque laverie cl\u00e9 en main", "[Exacte]", "\ud83d\udd34 Tr\u00e8s haute"],
            ["kiosque laverie prix", "\"Expression\"", "\ud83d\udfe0 Haute"],
            ["laverie automatique \u00e0 vendre", "[Exacte]", "\ud83d\udd34 Tr\u00e8s haute"],
            ["fournisseur kiosque laverie", "\"Expression\"", "\ud83d\udfe0 Haute"],
            ["machine laverie en libre service", "\"Expression\"", "\ud83d\udfe0 Haute"],
            ["fabricant laverie automatique france", "\"Expression\"", "\ud83d\udfe0 Haute"],
          ].map(([k, c, i], idx) => new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 4200, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: k, size: 20, font: "Arial" })] })] }),
            new TableCell({ borders: borders(), width: { size: 2580, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: c, size: 20, font: "Courier New", color: "334155" })] })] }),
            new TableCell({ borders: borders(), width: { size: 2580, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: i, size: 20, font: "Arial" })] })] }),
          ]}))
        ]
      }),
      space(160),

      h2("2.3 Groupe 2 \u2014 Investissement Laverie"),
      body("Cible les investisseurs en phase de r\u00e9flexion. CPC potentiellement plus bas, qualit\u00e9 du lead \u00e0 valider avec le client apr\u00e8s 30 jours."),
      space(80),
      simpleTable([
        ["Mot-cl\u00e9", "Correspondance"],
        ["investissement laverie automatique", "\"Expression\""],
        ["ouvrir une laverie automatique rentable", "\"Expression\""],
        ["rentabilit\u00e9 laverie automatique", "\"Expression\""],
        ["business laverie automatique", "\"Expression\""],
        ["franchise laverie automatique", "[Exacte]"],
        ["cr\u00e9er une laverie automatique", "\"Expression\""],
        ["opportunit\u00e9 investissement laverie", "\"Expression\""],
      ], 4200, 5160),
      space(160),

      h2("2.4 Groupe 3 \u2014 Concurrents (Wash Me / Photomaton)"),
      body("Strat\u00e9gie offensive sur les marques concurrentes. Ads positionnant les diff\u00e9renciateurs de MPL (fabrication fran\u00e7aise, SAV 7j/7, sur-mesure) face \u00e0 des solutions g\u00e9n\u00e9riques."),
      space(80),
      alertBox(
        "\u26a0\ufe0f R\u00e8gle Google Ads sur les marques concurrentes",
        [
          "On peut acheter le mot-cl\u00e9 de la marque concurrente, mais PAS l\u2019utiliser dans le texte de l\u2019annonce",
          "L\u2019annonce doit mettre en avant les avantages de Ma Petite Laverie, pas attaquer le concurrent",
          "Risque de plainte de marque : surveiller les notifications Google Ads"
        ],
        ORANGE_BG, ORANGE_DARK, "1E293B"
      ),
      space(80),
      simpleTable([
        ["Mot-cl\u00e9", "Correspondance"],
        ["wash me laverie", "[Exacte]"],
        ["kiosque wash me", "[Exacte]"],
        ["photomaton laverie", "[Exacte]"],
        ["alternative wash me laverie", "\"Expression\""],
        ["concurrent laverie automatique france", "\"Expression\""],
      ], 4200, 5160),
      space(160),

      h2("2.5 Mots-cl\u00e9s n\u00e9gatifs \u2014 Liste racine du compte"),
      body("Ces exclusions s\u2019appliquent \u00e0 toutes les campagnes. Elles \u00e9vitent de d\u00e9penser le budget sur des intentions d\u2019utilisation (particuliers qui cherchent une laverie pour laver leur linge), et non d\u2019achat."),
      space(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 4680, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "N\u00e9gatifs haute priorit\u00e9 (intentions utilisateur)", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 4680, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "N\u00e9gatifs secondaires", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 4680, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "laverie pr\u00e8s de chez moi", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "laverie ouverte", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "tarif laverie (pour laver)", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "machine \u00e0 laver gratuite", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "laverie 24h 24", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "laver couette laverie", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "temps de lavage en laverie", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "prix machine laverie (usage)", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "horaire laverie", size: 20, font: "Arial" })] }),
              ]
            }),
            new TableCell({ borders: borders(), width: { size: 4680, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "emploi laverie", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "travail laverie", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "nettoyage tapis", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "pressing", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "gratuit", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "occasion (machine d\u2019occasion)", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "seconde main", size: 20, font: "Arial" })] }),
                new Paragraph({ numbering: { reference: "bullets2", level: 0 }, children: [new TextRun({ text: "pas cher (chercheur de prix bas)", size: 20, font: "Arial" })] }),
              ]
            }),
          ]})
        ]
      }),
      space(160),

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 3 — ANNONCES
      // ═══════════════════════════════════════════════════════════════════════
      pageBreak(),
      h1("3. R\u00e9daction des annonces RSA"),
      body("Les annonces RSA (Responsive Search Ads) permettent \u00e0 Google de tester automatiquement les combinaisons. Fournir 15 titres et 4 descriptions distincts par groupe d\u2019annonces. Voici les \u00e9l\u00e9ments diff\u00e9renciateurs de MPL \u00e0 int\u00e9grer."),
      space(80),

      h2("3.1 Groupe \u00abAchat Kiosque\u00bb \u2014 15 titres + 4 descriptions"),
      h3("Titres (max 30 caract\u00e8res chacun)"),
      space(60),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [600, 4380, 4380],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 600, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true, size: 18, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 4380, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Titre", bold: true, size: 18, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 4380, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Angle", bold: true, size: 18, color: WHITE, font: "Arial" })] })] }),
          ]}),
          ...[
            ["1", "Kiosque Laverie Cl\u00e9 en Main", "Principal"],
            ["2", "Fabrication Fran\u00e7aise 100%", "Diff\u00e9renciateur"],
            ["3", "Devis Gratuit Sous 24h", "CTA"],
            ["4", "SAV 7j/7 Inclus", "Rassurance"],
            ["5", "30 Ans d\u2019Expertise Laverie", "Autorit\u00e9"],
            ["6", "ROI D\u00e8s 30\u20ac/Jour", "ROI"],
            ["7", "\u00c9tude Personnalis\u00e9e Offerte", "CTA premium"],
            ["8", "Kiosque Laverie Sur-Mesure", "Personnalisation"],
            ["9", "Machines Certifi\u00e9es A+++", "Qualit\u00e9 \u00e9co"],
            ["10", "Accompagnement Premium", "Service"],
            ["11", "Installation Cl\u00e9 en Main", "Simplicit\u00e9"],
            ["12", "Stock Permanent Pi\u00e8ces", "SAV"],
            ["13", "Rentable en [VILLE]", "Geo-insertion"],
            ["14", "500+ Kiosques Install\u00e9s", "Preuve sociale"],
            ["15", "Achetez Votre Laverie Ici", "Action directe"],
          ].map(([n, t, a], idx) => new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 600, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 50, bottom: 50, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: n, size: 18, font: "Arial", color: "64748B" })] })] }),
            new TableCell({ borders: borders(), width: { size: 4380, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 50, bottom: 50, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: t, size: 20, font: "Arial", bold: true, color: BLUE_DARK })] })] }),
            new TableCell({ borders: borders(), width: { size: 4380, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 50, bottom: 50, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: a, size: 18, font: "Arial", color: "475569" })] })] }),
          ]}))
        ]
      }),
      space(120),

      h3("Descriptions (max 90 caract\u00e8res chacune)"),
      space(60),
      simpleTable([
        ["#", "Description"],
        ["D1", "Kiosque laverie 100% fran\u00e7ais, sur-mesure. SAV 7j/7, pi\u00e8ces en stock. Devis gratuit 24h."],
        ["D2", "30 ans d\u2019expertise. Machines certifi\u00e9es A+++. \u00c9tude de rentabilit\u00e9 personnalis\u00e9e offerte."],
        ["D3", "De la conception \u00e0 l\u2019installation : un interlocuteur unique. ROI d\u00e8s 30\u20ac/jour."],
        ["D4", "Fabrication fran\u00e7aise, garantie longue dur\u00e9e. Accompagnement post-installation inclus."],
      ], 800, 8560),
      space(160),

      h2("3.2 Extensions d\u2019annonces \u00e0 activer"),
      body("Les extensions augmentent le taux de clic de 10 \u00e0 20 % sans surco\u00fbt. Toutes doivent \u00eatre activ\u00e9es."),
      space(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 3360, 3200],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2800, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Type d\u2019extension", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 3360, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Contenu recommand\u00e9", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 3200, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Impact attendu", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
          ]}),
          ...[
            ["Liens annexes", "Devis Gratuit | SAV Premium | Nos R\u00e9alisations | Financement", "+15% CTR"],
            ["Extraits de site", "Gammes : Kiosque Standard, Kiosque XXL, Bungalow, Sur-Mesure", "+10% CTR"],
            ["Accroches", "SAV 7j/7 \u2022 Fabrication France \u2022 30 ans d\u2019expertise \u2022 Machines A+++", "Rassurance"],
            ["Num\u00e9ro de t\u00e9l\u00e9phone", "02 40 31 66 00 (visible dans l\u2019annonce)", "Leads directs"],
            ["Lieu", "Adresse de l\u2019entreprise (si bureau physique)", "Confiance locale"],
            ["Image", "Photos des kiosques install\u00e9s (bord de mer, Super U, etc.)", "+20% visibilit\u00e9"],
            ["Prix", "Kiosque Standard : \u00e0 partir de 15\u2009000\u20ac", "Filtre naturel"],
          ].map(([t, c, i], idx) => new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 2800, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: t, size: 20, font: "Arial", bold: true })] })] }),
            new TableCell({ borders: borders(), width: { size: 3360, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: c, size: 19, font: "Arial", color: "334155" })] })] }),
            new TableCell({ borders: borders(), width: { size: 3200, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: i, size: 19, font: "Arial", color: GREEN_DARK, bold: true })] })] }),
          ]}))
        ]
      }),
      space(160),

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 4 — ENCHERES & CIBLAGE
      // ═══════════════════════════════════════════════════════════════════════
      pageBreak(),
      h1("4. Ench\u00e8res & Ciblage"),

      h2("4.1 Strat\u00e9gie d\u2019ench\u00e8res progressive"),
      body("Avec 36\u20ac/jour et un compte neuf (ou peu d\u2019historique), il faut construire les donn\u00e9es avant de passer au Smart Bidding. Voici la progression recommand\u00e9e :"),
      space(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1800, 2400, 2760, 2400],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 1800, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Phase", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2400, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "P\u00e9riode", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2760, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Strat\u00e9gie", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2400, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Condition de passage", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
          ]}),
          ...[
            ["Phase 1", "J0 \u2192 J21 (apprentissage)", "CPC Optimis\u00e9 (eCPC) ou CPC manuel", "Collecter 30+ clics par groupe"],
            ["Phase 2", "J21 \u2192 J60", "Max. conversions (pas de CPA cible)", "5+ conversions en 30 jours"],
            ["Phase 3", "J60+", "CPA cible ou ROAS cible", "15+ conversions / 30j, data stable"],
          ].map(([p, pe, s, c], idx) => new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 1800, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: p, size: 20, font: "Arial", bold: true, color: BLUE_DARK })] })] }),
            new TableCell({ borders: borders(), width: { size: 2400, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: pe, size: 19, font: "Arial" })] })] }),
            new TableCell({ borders: borders(), width: { size: 2760, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: s, size: 19, font: "Arial", bold: true })] })] }),
            new TableCell({ borders: borders(), width: { size: 2400, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: c, size: 18, font: "Arial", color: "475569" })] })] }),
          ]}))
        ]
      }),
      space(160),

      h2("4.2 Ciblage g\u00e9ographique"),
      body("Ma Petite Laverie est un fabricant national (livraison France enti\u00e8re). Le ciblage g\u00e9ographique doit \u00eatre large mais ma\u00eetris\u00e9."),
      space(80),
      simpleTable([
        ["Param\u00e8tre", "Recommandation"],
        ["Zone principale", "France m\u00e9tropolitaine"],
        ["Zones \u00e0 surench\u00e9rir (+20%)", "R\u00e9gions \u00e0 forte densit\u00e9 commerciale : \u00cele-de-France, PACA, Auvergne-Rh\u00f4ne-Alpes"],
        ["Zones \u00e0 tester apr\u00e8s 30j", "DOM-TOM (coils livraison potentiellement rentables)"],
        ["Option \u00abpr\u00e9sence\u00bb", "Cocher \u00abpr\u00e9sence dans la zone\u00bb uniquement (exclure \u00abint\u00e9r\u00eat pour la zone\u00bb)"],
        ["Ajustements horaires", "Surench\u00e8re +15% : Lundi\u2013Vendredi 9h\u201318h (d\u00e9cideurs B2B)"],
        ["R\u00e9duction horaire", "\u221220% : weekends, 20h\u20138h (trafic parasites)"],
        ["Appareils", "Ordinateur : +20% / Mobile : 0 (formulaire multi-\u00e9tapes, peu adapt\u00e9 mobile)"],
      ]),
      space(160),

      h2("4.3 Audiences \u2014 Mode observation (obligatoire d\u00e8s le lancement)"),
      body("Ne pas restreindre le ciblage, mais observer les performances par segment pour ajuster les ench\u00e8res plus tard."),
      space(80),
      simpleTable([
        ["Audience", "Source / Type"],
        ["Visiteurs de la landing page", "Remarketing GA4 \u2014 segment \u00abvisiteurs 30 derniers jours\u00bb"],
        ["Abandons formulaire \u00e9tape 3+", "Remarketing GA4 \u2014 segment \u00abstep >= 3 sans soumission\u00bb"],
        ["Investisseurs / entrepreneurs", "Audience Google Ads \u2014 \u00abInt\u00e9r\u00eat : investissement immobilier & franchise\u00bb"],
        ["D\u00e9cideurs PME", "Audience Google Ads \u2014 \u00abIndustrie : Commerce de d\u00e9tail & distribution\u00bb"],
        ["Clients similaires", "Audience similaire aux convertisseurs (activer apr\u00e8s 100 conversions)"],
        ["Liste clients existants", "Upload CSV des clients actuels dans Google Ads (Customer Match)"],
      ]),
      space(200),

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 5 — DASHBOARD
      // ═══════════════════════════════════════════════════════════════════════
      pageBreak(),
      h1("5. Dashboard & KPIs"),

      h2("5.1 KPIs principaux \u00e0 surveiller"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 2000, 2280, 2280],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2800, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "KPI", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2000, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Cible", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2280, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Alerte si...", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2280, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Source", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
          ]}),
          ...[
            ["Taux de conversion LP", "2 \u2013 3 %", "< 1,5 %", "GA4"],
            ["Co\u00fbt par lead (CPL)", "< 150\u20ac", "> 200\u20ac", "Google Ads"],
            ["CTR annonces", "> 5 %", "< 3 %", "Google Ads"],
            ["Quality Score mots-cl\u00e9s", "\u2265 7/10", "< 5/10", "Google Ads"],
            ["Taux de rebond LP", "< 60 %", "> 75 %", "GA4"],
            ["Taux completion formulaire", "> 50 % \u00e0 l\u2019\u00e9tape 6", "< 30 %", "GA4 (entonnoir)"],
            ["Impressions de part (IS)", "> 40 %", "< 25 %", "Google Ads"],
            ["Score optim. campagne", "> 80 %", "< 60 %", "Google Ads"],
          ].map(([k, t, a, s], idx) => new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 2800, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 65, bottom: 65, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: k, size: 20, font: "Arial", bold: true })] })] }),
            new TableCell({ borders: borders(), width: { size: 2000, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 65, bottom: 65, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: t, size: 20, font: "Arial", color: GREEN_DARK, bold: true })] })] }),
            new TableCell({ borders: borders(), width: { size: 2280, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 65, bottom: 65, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: a, size: 20, font: "Arial", color: RED_DARK })] })] }),
            new TableCell({ borders: borders(), width: { size: 2280, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 65, bottom: 65, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: s, size: 20, font: "Arial", color: "475569" })] })] }),
          ]}))
        ]
      }),
      space(160),

      h2("5.2 Entonnoir de conversion dans GA4"),
      body("Cr\u00e9er un entonnoir personnalis\u00e9 dans GA4 (Exploration > Entonnoir de conversion) avec les \u00e9tapes suivantes :"),
      space(80),
      simpleTable([
        ["\u00c9tape", "Ev\u00e9nement GA4 \u2014 Condition"],
        ["\u00c9tape 1 \u2014 Entr\u00e9e", "session_start sur la landing page"],
        ["\u00c9tape 2 \u2014 Engagement", "scroll > 50% OU time_on_page > 30s"],
        ["\u00c9tape 3 \u2014 Formulaire ouvert", "form_step_completed (step = 1)"],
        ["\u00c9tape 4 \u2014 Qualifi\u00e9 (budget renseign\u00e9)", "form_step_completed (step = 2)"],
        ["\u00c9tape 5 \u2014 Tr\u00e8s engag\u00e9 (\u00e9tape 5+)", "form_step_completed (step = 5)"],
        ["\u00c9tape 6 \u2014 Conversion", "form_submission"],
      ]),
      space(160),

      h2("5.3 Alertes automatiques \u00e0 configurer dans Google Ads"),
      simpleTable([
        ["Alerte", "Condition", "Action"],
        ["Budget \u00e9puis\u00e9 avant 18h", "Budget consomm\u00e9 > 90% avant 18h", "Analyser mots-cl\u00e9s gourmands"],
        ["CTR chute", "CTR < 3% sur 7 jours", "Revoir cr\u00e9atifs annonces"],
        ["CPA d\u00e9rive", "CPL > 200\u20ac sur 14 jours", "Ajuster ench\u00e8res / n\u00e9gatifs"],
        ["Quality Score bas", "QS < 5 sur un mot-cl\u00e9 important", "Optimiser landing page ou ad copy"],
        ["Z\u00e9ro impression", "Impressions = 0 sur 2 jours", "V\u00e9rifier refus annonces / budget"],
      ], 2800, 6560),
      space(200),

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 6 — PLANNING
      // ═══════════════════════════════════════════════════════════════════════
      pageBreak(),
      h1("6. Planning d\u2019ex\u00e9cution (Semaine 1)"),
      body("Voici les actions class\u00e9es par priorit\u00e9 absolue pour la premi\u00e8re semaine. Les BLOCKERS doivent \u00eatre r\u00e9solus AVANT l\u2019activation des campagnes."),
      space(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [800, 1400, 4360, 2800],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 800, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: "Prio.", bold: true, size: 18, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 1400, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: "Jour", bold: true, size: 18, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 4360, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Action", bold: true, size: 18, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2800, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Outil / Lieu", bold: true, size: 18, color: WHITE, font: "Arial" })] })] }),
          ]}),
          ...[
            ["\ud83d\udd34", "J1", "Remplacer GA_MEASUREMENT_ID et AW-CONVERSION_ID dans le code", "index.html / index2.js"],
            ["\ud83d\udd34", "J1", "Cr\u00e9er et installer le conteneur GTM sur la landing page", "Google Tag Manager"],
            ["\ud83d\udd34", "J1", "Supprimer le gtag en dur de index.html (lignes 30\u201338)", "index.html"],
            ["\ud83d\udd34", "J1", "Configurer Consent Mode v2 dans GTM (default deny)", "GTM > Balises"],
            ["\ud83d\udfe0", "J2", "Cr\u00e9er la conversion \u00abSoumission formulaire\u00bb dans Google Ads", "Google Ads > Outils"],
            ["\ud83d\udfe0", "J2", "Configurer balise Google Ads conversion dans GTM", "GTM > Balises"],
            ["\ud83d\udfe0", "J2", "Tester le tracking GTM avec Tag Assistant en preview", "Chrome Extension"],
            ["\ud83d\udfe0", "J2", "Cr\u00e9er les variables dataLayer (event, step, lead_budget...)", "GTM > Variables"],
            ["\ud83d\udfe0", "J3", "Cr\u00e9er la structure 3 campagnes + groupes d\u2019annonces", "Google Ads"],
            ["\ud83d\udfe0", "J3", "Int\u00e9grer les mots-cl\u00e9s (section 2) avec bonnes correspondances", "Google Ads"],
            ["\ud83d\udfe0", "J3", "Cr\u00e9er la liste de n\u00e9gatifs racine du compte (section 2.5)", "Google Ads > Listes"],
            ["\ud83d\udfe1", "J4", "R\u00e9diger les annonces RSA (15 titres / 4 descriptions par groupe)", "Google Ads"],
            ["\ud83d\udfe1", "J4", "Configurer toutes les extensions d\u2019annonces (section 3.2)", "Google Ads"],
            ["\ud83d\udfe1", "J4", "Param\u00e9trer ciblage g\u00e9ographique et ajustements horaires", "Google Ads"],
            ["\ud83d\udfe1", "J5", "Configurer audiences en mode observation", "Google Ads + GA4"],
            ["\ud83d\udfe1", "J5", "Cr\u00e9er entonnoir de conversion GA4 (section 5.2)", "GA4 > Exploration"],
            ["\ud83d\udfe1", "J5", "Lancer les campagnes + premi\u00e8re capture des donn\u00e9es", "Google Ads"],
            ["\ud83d\udd35", "J7", "V\u00e9rifier premi\u00e8res impressions, CTR, d\u00e9penses", "Google Ads Dashboard"],
          ].map(([p, j, a, o], idx) => new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 800, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 50, bottom: 50, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: p, size: 18, font: "Arial" })] })] }),
            new TableCell({ borders: borders(), width: { size: 1400, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 50, bottom: 50, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: j, size: 18, font: "Arial", bold: true, color: BLUE_DARK })] })] }),
            new TableCell({ borders: borders(), width: { size: 4360, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 50, bottom: 50, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: a, size: 19, font: "Arial" })] })] }),
            new TableCell({ borders: borders(), width: { size: 2800, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 50, bottom: 50, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: o, size: 18, font: "Arial", color: "475569" })] })] }),
          ]}))
        ]
      }),
      space(120),
      alertBox(
        "\ud83d\udca1 R\u00e8gle d\u2019or : ne jamais lancer les campagnes sans que le tracking soit valid\u00e9",
        [
          "Utiliser Google Tag Assistant (extension Chrome) en mode Preview pour tester chaque \u00e9v\u00e9nement",
          "V\u00e9rifier dans GA4 > Flux de donn\u00e9es > D\u00e9bogueur que les \u00e9v\u00e9nements arrivent bien",
          "V\u00e9rifier dans Google Ads > Conversions que le statut est \u00abEnregistrement de donn\u00e9es\u00bb",
          "Ne lancer J5 qu\u2019une fois J1 \u00e0 J4 confirm\u00e9s et valid\u00e9s"
        ],
        GREEN_BG, GREEN_DARK
      ),
      space(200),

      // ═══════════════════════════════════════════════════════════════════════
      // SECTION 7 — QUESTIONS OUVERTES
      // ═══════════════════════════════════════════════════════════════════════
      pageBreak(),
      h1("7. Questions \u00e0 \u00e9claircir avec le client"),
      body("Les points suivants sont n\u00e9cessaires pour finaliser la configuration optimale du compte. Ils conditionnent certains r\u00e9glages avanc\u00e9s."),
      space(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4280, 2240, 2840],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 4280, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Question", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2240, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Impact", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
            new TableCell({ borders: borders(BLUE_DARK), width: { size: 2840, type: WidthType.DXA }, shading: { fill: BLUE_DARK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: "Urgence", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
          ]}),
          ...[
            ["Avez-vous acc\u00e8s en admin au compte Google Ads existant ? Y a-t-il un historique de conversions ?", "Structure des campagnes et strat\u00e9gie d\u2019ench\u00e8res initiale", "\ud83d\udd34 Bloquant"],
            ["Quel est votre vrai ID GA4 (G-XXXXXXXXXX) et ID Google Ads (AW-XXXXXXXX) ?", "Aucun tracking ne fonctionnera sans ces IDs", "\ud83d\udd34 Bloquant"],
            ["Y a-t-il un CRM ou outil de gestion des leads en place ? (HubSpot, Pipedrive, email seul...)", "Param\u00e9trage des notifications et scoring des leads", "\ud83d\udfe0 Important"],
            ["Le client peut-il fournir une liste CSV de ses clients actuels ?", "Activation Customer Match pour audiences similaires", "\ud83d\udfe0 Important"],
            ["Quelle est la marge moyenne sur une vente de kiosque ? (pour calibrer le CPA cible)", "Calcul du CPA max acceptable et ROAS cible", "\ud83d\udfe0 Important"],
            ["La landing page est-elle en production sur un domaine propre ou en test ?", "Param\u00e9trage de la conversion et validation URL", "\ud83d\udfe1 Normal"],
            ["Y a-t-il des zones g\u00e9ographiques \u00e0 exclure (secteurs d\u00e9j\u00e0 couverts, revendeurs exclusifs...) ?", "Ciblage g\u00e9ographique et ench\u00e8res ajust\u00e9es", "\ud83d\udfe1 Normal"],
          ].map(([q, i, u], idx) => new TableRow({ children: [
            new TableCell({ borders: borders(), width: { size: 4280, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: q, size: 19, font: "Arial" })] })] }),
            new TableCell({ borders: borders(), width: { size: 2240, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: i, size: 18, font: "Arial", color: "475569" })] })] }),
            new TableCell({ borders: borders(), width: { size: 2840, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: u, size: 19, font: "Arial", bold: u.includes("\ud83d\udd34") })] })] }),
          ]}))
        ]
      }),
      space(160),

      // ═══════════════════════════════════════════════════════════════════════
      // FOOTER RECAP
      // ═══════════════════════════════════════════════════════════════════════
      pageBreak(),
      h1("R\u00e9capitulatif ex\u00e9cutif"),
      space(80),
      badge("Ce que ce plan va changer vs la situation actuelle", BLUE_DARK, WHITE),
      space(100),
      simpleTable([
        ["Avant (situation actuelle)", "Apr\u00e8s (ce plan)"],
        ["GA_MEASUREMENT_ID fictif \u2192 0 donn\u00e9e collect\u00e9e", "Tracking complet GA4 + Google Ads op\u00e9rationnel"],
        ["Pas de conformit\u00e9 RGPD / Consent Mode", "Consent Mode v2 GTM, donn\u00e9es mod\u00e9lis\u00e9es m\u00eame sans cookie"],
        ["Annonces g\u00e9n\u00e9riques non diff\u00e9renci\u00e9es", "15 titres / 4 desc. par groupe, extensions compl\u00e8tes"],
        ["Budget non ma\u00eetris\u00e9 (mots-cl\u00e9s parasites)", "N\u00e9gatifs racine + correspondance stricte en phase 1"],
        ["Pas de strat\u00e9gie d\u2019ench\u00e8res progressive", "3 phases d\u00e9finies (eCPC \u2192 Max Conv. \u2192 CPA cible)"],
        ["Attribution last-click court terme", "Attribution bas\u00e9e donn\u00e9es, fen\u00eatre 90 jours B2B"],
        ["0 micro-conversion tract\u00e9e", "7 points de mesure dans l\u2019entonnoir formulaire"],
      ]),
      space(160),

      badge("Objectifs J+60 \u2014 Indicateurs de succ\u00e8s", BLUE_MID, WHITE),
      space(100),
      bullet("Taux de conversion landing page atteint : 2 \u00e0 3 %"),
      bullet("Co\u00fbt par lead qualifi\u00e9 : < 150\u20ac (soit 7+ leads/mois pour 1\u2009080\u20ac de budget)"),
      bullet("Score d\u2019optimisation Google Ads : > 80 %"),
      bullet("Toutes les donn\u00e9es de qualification (budget, timing, emplacement) remontent dans GA4"),
      bullet("Phase 2 \u00abMax Conversions\u00bb activ\u00e9e si 5+ conversions valid\u00e9es en 30 jours"),
      space(200),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 0 },
        children: [new TextRun({ text: "Document pr\u00e9par\u00e9 pour Ma Petite Laverie \u2014 Confidentiel", size: 18, color: "94A3B8", font: "Arial" })]
      }),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/sessions/compassionate-sharp-cori/mnt/petitelaverie/Roadmap_GoogleAds_GTM_MaPetiteLaverie.docx', buffer);
  console.log('✅ Document créé avec succès');
}).catch(e => { console.error('❌', e); process.exit(1); });
