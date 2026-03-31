const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "public", "images");

const dishes = [
  {
    file: "recipe-kalguksu.svg",
    ko: "칼국수",
    en: "KALGUKSU",
    bg: ["#fff7ef", "#ffe0c3"],
    broth: "#e8c58d",
    vessel: "bowl",
    motifs: ["noodle", "zucchini", "scallion", "mushroom", "steam"]
  },
  {
    file: "recipe-ramyeon-bokkeumbap.svg",
    ko: "라면볶음밥",
    en: "RAMYEON BOKKEUMBAP",
    bg: ["#fff2ec", "#ffd4ba"],
    broth: "#cf5f2a",
    vessel: "plate",
    motifs: ["noodle", "rice", "egg", "scallion"]
  },
  {
    file: "recipe-soondae-guk.svg",
    ko: "순대국",
    en: "SOONDAE GUK",
    bg: ["#fff5ef", "#ffd9c6"],
    broth: "#d8c2a2",
    vessel: "bowl",
    motifs: ["sausage", "scallion", "sesame", "steam"]
  },
  {
    file: "recipe-eomuk-bokkeum.svg",
    ko: "어묵볶음",
    en: "EOMUK BOKKEUM",
    bg: ["#fff4ee", "#ffd3c0"],
    broth: "#b3542f",
    vessel: "plate",
    motifs: ["fishcake", "pepper", "scallion", "sesame"]
  },
  {
    file: "recipe-beoseot-bokkeum.svg",
    ko: "버섯볶음",
    en: "BEOSEOT BOKKEUM",
    bg: ["#f8f3ea", "#e8d8be"],
    broth: "#9a6c4a",
    vessel: "plate",
    motifs: ["mushroom", "mushroom", "scallion", "sesame"]
  },
  {
    file: "recipe-konchiim.svg",
    ko: "콩조림",
    en: "KONG JORIM",
    bg: ["#f7f4ea", "#e8dec2"],
    broth: "#8d5a36",
    vessel: "plate",
    motifs: ["bean", "bean", "bean", "sesame"]
  },
  {
    file: "recipe-kimchi-jeon.svg",
    ko: "김치전",
    en: "KIMCHI JEON",
    bg: ["#fff3ea", "#ffd7bf"],
    broth: "#ca5b3d",
    vessel: "flat",
    motifs: ["pancake", "kimchi", "kimchi"]
  },
  {
    file: "recipe-nakji-bokkeum.svg",
    ko: "낙지볶음",
    en: "NAKJI BOKKEUM",
    bg: ["#fff0ea", "#ffc7bb"],
    broth: "#c73636",
    vessel: "plate",
    motifs: ["octopus", "pepper", "scallion", "sesame"]
  },
  {
    file: "recipe-gopchang.svg",
    ko: "곱창구이",
    en: "GOPCHANG GUI",
    bg: ["#fff4ea", "#ffd9bd"],
    broth: "#b46f3d",
    vessel: "plate",
    motifs: ["ring", "ring", "ring", "scallion"]
  },
  {
    file: "recipe-dak-bokkeum-gochujang.svg",
    ko: "고추장 닭볶음",
    en: "DAK BOKKEUM",
    bg: ["#fff1ea", "#ffc9bb"],
    broth: "#c23e2d",
    vessel: "plate",
    motifs: ["chicken", "pepper", "potato", "scallion"]
  },
  {
    file: "recipe-kimchi-fried-rice.svg",
    ko: "김치계란밥",
    en: "KIMCHI EGG RICE",
    bg: ["#fff3ea", "#ffd7c2"],
    broth: "#c55a3a",
    vessel: "plate",
    motifs: ["rice", "kimchi", "egg", "sesame"]
  },
  {
    file: "recipe-sauce-gyeran.svg",
    ko: "소스 계란말이",
    en: "SAUCE GYERANMARI",
    bg: ["#fff7ee", "#ffe8cb"],
    broth: "#f2c56a",
    vessel: "plate",
    motifs: ["omelet", "sauce", "scallion"]
  },
  {
    file: "recipe-tteokbokki-rice.svg",
    ko: "떡볶이 덮밥",
    en: "TTEOKBOKKI RICE",
    bg: ["#fff0ea", "#ffc9ba"],
    broth: "#cb3f34",
    vessel: "bowl",
    motifs: ["tteok", "rice", "pepper", "egg"]
  },
  {
    file: "recipe-bossam.svg",
    ko: "보쌈",
    en: "BOSSAM",
    bg: ["#f5f8ed", "#d8efc5"],
    broth: "#d0a47a",
    vessel: "plate",
    motifs: ["porkslice", "porkslice", "lettuce", "kimchi"]
  },
  {
    file: "recipe-tteok-jorim.svg",
    ko: "떡조림",
    en: "TTEOK JORIM",
    bg: ["#fff4ec", "#ffd8bf"],
    broth: "#a8552f",
    vessel: "plate",
    motifs: ["tteok", "tteok", "sesame"]
  },
  {
    file: "recipe-galbijjim-simple.svg",
    ko: "간단 갈비찜",
    en: "GALBI JJIM",
    bg: ["#fff4ee", "#ffd8c4"],
    broth: "#8f5032",
    vessel: "plate",
    motifs: ["rib", "rib", "carrot", "scallion"]
  }
];

function drawVessel(vessel) {
  if (vessel === "bowl") {
    return `
  <ellipse cx="400" cy="372" rx="204" ry="58" fill="#2f221b" opacity="0.22"/>
  <ellipse cx="400" cy="350" rx="194" ry="76" fill="#4f372a"/>
  <ellipse cx="400" cy="314" rx="184" ry="46" fill="#f7f2ea"/>
  <ellipse cx="400" cy="304" rx="168" ry="36" fill="{BROTH}"/>
`;
  }

  if (vessel === "flat") {
    return `
  <ellipse cx="400" cy="378" rx="226" ry="56" fill="#2f221b" opacity="0.18"/>
  <ellipse cx="400" cy="340" rx="218" ry="84" fill="#faf6f0"/>
  <ellipse cx="400" cy="332" rx="188" ry="66" fill="{BROTH}"/>
`;
  }

  return `
  <ellipse cx="400" cy="378" rx="232" ry="60" fill="#2f221b" opacity="0.2"/>
  <ellipse cx="400" cy="344" rx="222" ry="86" fill="#4d382e"/>
  <ellipse cx="400" cy="322" rx="196" ry="70" fill="#f7f2ea"/>
  <ellipse cx="400" cy="314" rx="176" ry="56" fill="{BROTH}"/>
`;
}

function motif(type, i) {
  const dx = [ -70, -20, 35, 85 ][i % 4];
  const dy = [ -4, 6, -8, 4 ][i % 4];
  const cx = 400 + dx;
  const cy = 312 + dy;

  switch (type) {
    case "noodle":
      return `<path d="M${cx - 34} ${cy} C ${cx - 10} ${cy - 16}, ${cx + 12} ${cy - 16}, ${cx + 36} ${cy + 2}" stroke="#f6e0ae" stroke-width="11" stroke-linecap="round" fill="none"/>`;
    case "zucchini":
      return `<ellipse cx="${cx}" cy="${cy}" rx="18" ry="7" fill="#8ab96a"/>`;
    case "scallion":
      return `<rect x="${cx - 12}" y="${cy - 4}" width="24" height="8" rx="4" fill="#6db06a"/>`;
    case "mushroom":
      return `<path d="M${cx - 14} ${cy} Q ${cx} ${cy - 14} ${cx + 14} ${cy} Z" fill="#cda983"/><rect x="${cx - 4}" y="${cy}" width="8" height="9" rx="2" fill="#f1dfc9"/>`;
    case "steam":
      return `<path d="M${cx} ${cy - 24} Q ${cx - 6} ${cy - 42} ${cx} ${cy - 58} Q ${cx + 6} ${cy - 74} ${cx} ${cy - 90}" stroke="#ff9b88" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.55"/>`;
    case "sausage":
      return `<ellipse cx="${cx}" cy="${cy}" rx="18" ry="10" fill="#7b4736"/>`;
    case "sesame":
      return `<circle cx="${cx - 8}" cy="${cy - 8}" r="2" fill="#f7e8cc"/><circle cx="${cx + 3}" cy="${cy - 4}" r="2" fill="#f7e8cc"/>`;
    case "fishcake":
      return `<rect x="${cx - 18}" y="${cy - 7}" width="36" height="14" rx="6" fill="#e7b37f"/>`;
    case "pepper":
      return `<path d="M${cx - 12} ${cy + 2} Q ${cx} ${cy - 12} ${cx + 12} ${cy + 2} Q ${cx} ${cy + 10} ${cx - 12} ${cy + 2}" fill="#dc5144"/>`;
    case "bean":
      return `<ellipse cx="${cx}" cy="${cy}" rx="9" ry="6" fill="#5f3e2f"/>`;
    case "pancake":
      return `<ellipse cx="${cx}" cy="${cy}" rx="62" ry="24" fill="#d77a52"/>`;
    case "kimchi":
      return `<path d="M${cx - 16} ${cy + 6} L${cx} ${cy - 12} L${cx + 16} ${cy + 6} Z" fill="#d83e3e"/>`;
    case "octopus":
      return `<circle cx="${cx}" cy="${cy - 4}" r="10" fill="#d46b67"/><path d="M${cx - 10} ${cy + 2} q -6 10 -12 14 M${cx - 3} ${cy + 4} q -2 10 -5 15 M${cx + 4} ${cy + 4} q 2 10 5 15 M${cx + 10} ${cy + 2} q 6 10 12 14" stroke="#d46b67" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case "ring":
      return `<circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#cf9a62" stroke-width="6"/>`;
    case "chicken":
      return `<ellipse cx="${cx}" cy="${cy}" rx="16" ry="10" fill="#d9a46f"/>`;
    case "potato":
      return `<ellipse cx="${cx}" cy="${cy}" rx="12" ry="8" fill="#e0bb7f"/>`;
    case "rice":
      return `<ellipse cx="${cx}" cy="${cy + 8}" rx="22" ry="12" fill="#f7f4ef"/>`;
    case "egg":
      return `<ellipse cx="${cx}" cy="${cy}" rx="16" ry="11" fill="#fff5e5"/><circle cx="${cx + 1}" cy="${cy}" r="5" fill="#f3ba2d"/>`;
    case "omelet":
      return `<rect x="${cx - 22}" y="${cy - 10}" width="44" height="20" rx="8" fill="#f0c86c"/>`;
    case "sauce":
      return `<path d="M${cx - 24} ${cy - 2} C ${cx - 8} ${cy - 14}, ${cx + 8} ${cy + 8}, ${cx + 24} ${cy - 2}" stroke="#b5442f" stroke-width="6" stroke-linecap="round" fill="none"/>`;
    case "tteok":
      return `<rect x="${cx - 16}" y="${cy - 8}" width="32" height="16" rx="8" fill="#f7ede3"/><path d="M${cx - 14} ${cy} H ${cx + 14}" stroke="#da4c43" stroke-width="3"/>`;
    case "porkslice":
      return `<ellipse cx="${cx}" cy="${cy}" rx="18" ry="11" fill="#efc6a3"/><path d="M${cx - 14} ${cy + 1} Q ${cx} ${cy - 8} ${cx + 14} ${cy + 1}" stroke="#d79b74" stroke-width="2" fill="none"/>`;
    case "lettuce":
      return `<path d="M${cx - 18} ${cy + 8} Q ${cx - 4} ${cy - 18} ${cx + 16} ${cy + 2} Q ${cx} ${cy + 14} ${cx - 18} ${cy + 8}" fill="#7fbf64"/>`;
    case "rib":
      return `<rect x="${cx - 18}" y="${cy - 9}" width="36" height="18" rx="8" fill="#9e5c3a"/><rect x="${cx - 4}" y="${cy - 12}" width="8" height="24" rx="4" fill="#f2dfc5"/>`;
    case "carrot":
      return `<rect x="${cx - 14}" y="${cy - 5}" width="28" height="10" rx="5" fill="#ea8f44"/>`;
    default:
      return "";
  }
}

function render(d) {
  const gradId = `bg-${d.file.replace(/[^a-z0-9]/gi, "")}`;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">\n`;
  svg += `  <defs>\n`;
  svg += `    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">\n`;
  svg += `      <stop offset="0%" stop-color="${d.bg[0]}"/>\n`;
  svg += `      <stop offset="100%" stop-color="${d.bg[1]}"/>\n`;
  svg += `    </linearGradient>\n`;
  svg += `  </defs>\n`;
  svg += `  <rect width="800" height="520" rx="36" fill="url(#${gradId})"/>\n`;
  svg += drawVessel(d.vessel).replace("{BROTH}", d.broth);

  d.motifs.forEach((m, i) => {
    svg += `  ${motif(m, i)}\n`;
  });

  svg += `  <text x="64" y="108" font-size="44" font-weight="700" fill="#7f3b2b" font-family="sans-serif">${d.ko}</text>\n`;
  svg += `  <text x="64" y="154" font-size="23" fill="#7a6056" font-family="sans-serif">${d.en}</text>\n`;
  svg += `</svg>\n`;
  return svg;
}

for (const dish of dishes) {
  const out = path.join(OUT_DIR, dish.file);
  fs.writeFileSync(out, render(dish), "utf8");
  console.log(`updated: ${dish.file}`);
}

console.log(`done: ${dishes.length} files`);
