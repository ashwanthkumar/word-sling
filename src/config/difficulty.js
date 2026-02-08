export const DIFFICULTY = {
  1: { rainSpeed: 60, density: [6, 8], decoySimilarity: 'random', hintLevel: 'strong' },
  2: { rainSpeed: 75, density: [8, 10], decoySimilarity: 'random', hintLevel: 'strong' },
  3: { rainSpeed: 90, density: [8, 12], decoySimilarity: 'some', hintLevel: 'subtle' },
  4: { rainSpeed: 100, density: [10, 12], decoySimilarity: 'similar', hintLevel: 'subtle' },
  5: { rainSpeed: 115, density: [10, 14], decoySimilarity: 'many', hintLevel: 'none' },
  6: { rainSpeed: 130, density: [12, 15], decoySimilarity: 'confusing', hintLevel: 'none' },
};

const SIMILAR_LETTERS = {
  B: ['D', 'P'],
  D: ['B', 'P'],
  P: ['B', 'D', 'Q'],
  Q: ['O', 'P'],
  M: ['N', 'W'],
  N: ['M', 'H'],
  V: ['W', 'U'],
  W: ['V', 'M'],
  I: ['L', 'T'],
  L: ['I', 'T'],
  E: ['F'],
  F: ['E', 'T'],
  C: ['G', 'O'],
  G: ['C', 'Q'],
  O: ['Q', 'C'],
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function getDecoyLetter(word, grade) {
  const config = DIFFICULTY[grade];
  const wordLetters = new Set(word.split(''));

  if (config.decoySimilarity === 'random') {
    let letter;
    do {
      letter = ALPHABET[Math.floor(Math.random() * 26)];
    } while (wordLetters.has(letter));
    return letter;
  }

  // For higher grades, bias toward similar-looking letters
  const similarChance = config.decoySimilarity === 'some' ? 0.3 :
    config.decoySimilarity === 'similar' ? 0.5 :
    config.decoySimilarity === 'many' ? 0.7 : 0.85;

  if (Math.random() < similarChance) {
    const wordArr = word.split('');
    const letter = wordArr[Math.floor(Math.random() * wordArr.length)];
    const similars = SIMILAR_LETTERS[letter];
    if (similars && similars.length > 0) {
      const pick = similars[Math.floor(Math.random() * similars.length)];
      if (!wordLetters.has(pick)) return pick;
    }
  }

  let letter;
  do {
    letter = ALPHABET[Math.floor(Math.random() * 26)];
  } while (wordLetters.has(letter));
  return letter;
}
