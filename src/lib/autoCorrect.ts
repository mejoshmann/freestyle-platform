export function autoCorrectText(text: string): string {
  let result = text

  // Capitalize first character of text
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1)
  }

  // Capitalize after sentence-ending punctuation + space
  result = result.replace(/([.!?]\s+)([a-z])/g, (_, punct: string, letter: string) => punct + letter.toUpperCase())

  // Capitalize standalone "i"
  result = result.replace(/\bi\b/g, 'I')

  // Fix common contractions (whole words only)
  const contractions: Record<string, string> = {
    'dont': "don't",
    'cant': "can't",
    'wont': "won't",
    'didnt': "didn't",
    'doesnt': "doesn't",
    'isnt': "isn't",
    'wasnt': "wasn't",
    'werent': "weren't",
    'havent': "haven't",
    'hasnt': "hasn't",
    'hadnt': "hadn't",
    'wouldnt': "wouldn't",
    'shouldnt': "shouldn't",
    'couldnt': "couldn't",
    'theyre': "they're",
    'youre': "you're",
    'hes': "he's",
    'shes': "she's",
    'Im': "I'm",
    'Ive': "I've",
    'Ill': "I'll",
    'thats': "that's",
    'whats': "what's",
    'lets': "let's",
  }

  for (const [wrong, right] of Object.entries(contractions)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'g')
    result = result.replace(regex, right)
  }

  return result
}
