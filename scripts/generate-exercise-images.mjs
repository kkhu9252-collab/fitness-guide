import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const outputDir = join(process.cwd(), 'client', 'public', 'exercise-images')

const exercises = [
  ['seated-chest-press', '坐姿推胸', '胸部', '推胸机'],
  ['pec-deck-fly', '蝴蝶机夹胸', '胸部', '夹胸机'],
  ['incline-chest-press', '上斜推胸机', '胸部', '上斜推胸'],
  ['lat-pulldown', '高位下拉', '背部', '下拉器'],
  ['seated-row', '坐姿划船', '背部', '划船机'],
  ['assisted-pull-up', '辅助引体向上', '背部', '辅助引体'],
  ['leg-press', '腿举机', '腿部', '腿举'],
  ['leg-extension', '腿屈伸', '腿部', '屈伸机'],
  ['lying-leg-curl', '俯卧腿弯举', '腿部', '腿弯举'],
  ['seated-leg-curl', '坐姿腿弯举', '腿部', '坐姿弯举'],
  ['hip-abduction', '髋外展机', '腿部', '髋外展'],
  ['shoulder-press', '坐姿推肩', '肩部', '推肩机'],
  ['lateral-raise-machine', '坐姿侧平举机', '肩部', '侧平举'],
  ['reverse-pec-deck', '反向蝴蝶机', '肩部', '后束机'],
  ['cable-pushdown', '绳索下压', '手臂', '绳索下压'],
  ['preacher-curl-machine', '牧师椅弯举机', '手臂', '弯举机'],
  ['cable-curl', '绳索弯举', '手臂', '绳索弯举'],
  ['ab-crunch-machine', '器械卷腹', '核心', '卷腹机'],
  ['roman-chair-back-extension', '罗马椅背伸', '核心', '罗马椅'],
  ['cable-kneeling-crunch', '绳索跪姿卷腹', '核心', '跪姿卷腹'],
]

const palettes = {
  胸部: ['#123524', '#16a05d', '#a7f3c1'],
  背部: ['#142f3f', '#0f8aa6', '#a5f3fc'],
  腿部: ['#342915', '#b7791f', '#fde68a'],
  肩部: ['#2f2342', '#7c3aed', '#ddd6fe'],
  手臂: ['#3a1f2d', '#db2777', '#fbcfe8'],
  核心: ['#332312', '#ea580c', '#fed7aa'],
}

function svg([slug, name, bodyPart, equipment], index) {
  const [dark, accent, light] = palettes[bodyPart]
  const seatX = 112 + (index % 3) * 12
  const handleY = 86 + (index % 4) * 8
  const stackX = 286 + (index % 2) * 24
  const cable = bodyPart === '背部' || bodyPart === '手臂' || name.includes('绳索')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img" aria-labelledby="title desc">
  <title id="title">${name}</title>
  <desc id="desc">${name}的健身器械动作示意图</desc>
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity=".22"/>
    </filter>
  </defs>
  <rect width="960" height="640" rx="44" fill="url(#bg)"/>
  <circle cx="770" cy="120" r="110" fill="${light}" opacity=".18"/>
  <circle cx="160" cy="520" r="150" fill="${light}" opacity=".12"/>
  <g filter="url(#shadow)">
    <rect x="118" y="448" width="660" height="30" rx="15" fill="${light}"/>
    <rect x="${seatX}" y="338" width="190" height="56" rx="22" fill="${light}"/>
    <rect x="${seatX + 26}" y="210" width="34" height="170" rx="17" fill="${light}"/>
    <rect x="${seatX + 130}" y="254" width="34" height="126" rx="17" fill="${light}" opacity=".82"/>
    <rect x="${stackX}" y="174" width="104" height="228" rx="18" fill="${light}"/>
    <path d="M${stackX + 16} 216H${stackX + 88}M${stackX + 16} 258H${stackX + 88}M${stackX + 16} 300H${stackX + 88}M${stackX + 16} 342H${stackX + 88}" stroke="${dark}" stroke-width="10" stroke-linecap="round" opacity=".55"/>
    <rect x="430" y="${handleY}" width="188" height="24" rx="12" fill="${light}"/>
    <rect x="516" y="${handleY}" width="24" height="168" rx="12" fill="${light}"/>
    ${cable ? `<path d="M538 ${handleY + 8}C620 188 650 268 612 362" fill="none" stroke="${light}" stroke-width="14" stroke-linecap="round"/><circle cx="612" cy="362" r="28" fill="${light}"/>` : `<rect x="384" y="270" width="154" height="44" rx="22" fill="${light}"/>`}
  </g>
  <g>
    <rect x="62" y="54" width="172" height="44" rx="22" fill="#ffffff" opacity=".94"/>
    <text x="148" y="84" text-anchor="middle" font-family="Microsoft YaHei, Arial, sans-serif" font-size="24" font-weight="700" fill="${dark}">${bodyPart}</text>
    <text x="62" y="556" font-family="Microsoft YaHei, Arial, sans-serif" font-size="50" font-weight="800" fill="#ffffff">${name}</text>
    <text x="64" y="600" font-family="Microsoft YaHei, Arial, sans-serif" font-size="28" font-weight="700" fill="${light}">${equipment}</text>
  </g>
</svg>`
}

mkdirSync(outputDir, { recursive: true })
for (let index = 0; index < exercises.length; index += 1) {
  const exercise = exercises[index]
  writeFileSync(join(outputDir, `${exercise[0]}.svg`), svg(exercise, index), 'utf8')
}

console.log(`Generated ${exercises.length} exercise images in ${outputDir}`)
