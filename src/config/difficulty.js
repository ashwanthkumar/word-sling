export const DIFFICULTY = {
  easy:   { rainSpeed: 30,  density: [8, 14],  correctInterval: 2.5, correctChance: 0.15, hintLevel: 'subtle', powerUpChance: 0.05 },
  medium: { rainSpeed: 45,  density: [12, 18], correctInterval: 3.5, correctChance: 0.10, hintLevel: 'subtle', powerUpChance: 0.035 },
  hard:   { rainSpeed: 55,  density: [15, 22], correctInterval: 4.0, correctChance: 0.08, hintLevel: 'subtle', powerUpChance: 0.03 },
};

// Fun UTF-8 decoy characters — mix of scripts, symbols, math, and lookalikes
const UTF8_DECOYS = [
  // Greek
  'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Λ', 'Μ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω',
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'π', 'σ', 'φ', 'ψ', 'ω',
  // Cyrillic
  'Д', 'Ж', 'И', 'Л', 'Ф', 'Ц', 'Ч', 'Ш', 'Щ', 'Э', 'Ю', 'Я',
  'д', 'ж', 'з', 'и', 'к', 'л', 'м', 'н', 'п', 'т', 'ф', 'ц', 'ч', 'ш', 'щ', 'э', 'ю', 'я',
  // Japanese Katakana
  'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ', 'ソ',
  'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン',
  // Korean Jamo
  'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
  // Math / Symbols
  '∀', '∃', '∇', '∞', '∑', '∏', '√', '∂', '∫', '≈', '≠', '≤', '≥', '±', '×', '÷',
  '⊕', '⊗', '⊥', '∠', '∴', '∵', '⊂', '⊃', '∩', '∪',
  // Misc symbols
  '☆', '★', '♠', '♣', '♥', '♦', '♪', '♫', '☀', '☁', '☂', '⚡', '⚙', '⚛',
  '✦', '✧', '◆', '◇', '○', '●', '□', '■', '△', '▽', '◎', '◉',
  // Currency & misc
  '¥', '€', '£', '¢', '₹', '₿', '§', '¶', '©', '®', '™',
  // Arrows
  '↑', '↓', '←', '→', '↗', '↘', '↙', '↖', '⇒', '⇐', '⇑', '⇓',
  // Box drawing / blocks
  '░', '▒', '▓', '█', '▀', '▄', '▌', '▐',
  // Devanagari
  'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ', 'क', 'ख', 'ग', 'घ',
  'च', 'छ', 'ज', 'झ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह',
  // Thai
  'ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ด', 'ต', 'ถ', 'ท', 'น', 'บ', 'ป', 'พ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ส', 'ห', 'อ',
  // Arabic
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
  // Runic
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛗ', 'ᛚ', 'ᛞ', 'ᛟ',
  // Georgian
  'ა', 'ბ', 'გ', 'დ', 'ე', 'ვ', 'ზ', 'თ', 'ი', 'კ', 'ლ', 'მ', 'ნ', 'ო', 'პ',
  // Emoji-like symbols
  '⌘', '⌥', '⌫', '⏎', '⎋', '⏏', '⏩', '⏪', '⏫', '⏬',
];

// Also keep regular A-Z for some English letter noise
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function getDecoyLetter(word) {
  const wordLetters = new Set(word.split(''));

  // 70% chance of UTF-8 character, 30% chance of English letter
  if (Math.random() < 0.7) {
    return UTF8_DECOYS[Math.floor(Math.random() * UTF8_DECOYS.length)];
  }

  // English decoy
  let letter;
  do {
    letter = ALPHABET[Math.floor(Math.random() * 26)];
  } while (wordLetters.has(letter));
  return letter;
}
