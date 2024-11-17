export function text_filter(
  text: string,
  whitelist: string[],
  blacklist: string[],
): boolean {
  const delimiters = /[\s\t\n\r!,-\.#?()]+/;

  const normalizedWhitelist = whitelist.map((word) =>
    word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );

  const normalizedBlacklist = blacklist.map((word) =>
    word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );

  const normalizedWords = new Set(
    text.normalize("NFD").replace(
      /[\u0300-\u036f]/g,
      "",
    ).toLowerCase().split(delimiters),
  );

  return passes_whitelist(normalizedWords, normalizedWhitelist) &&
    passes_blacklist(normalizedWords, normalizedBlacklist);
}

function passes_whitelist(words: Set<string>, whitelist: string[]): boolean {
  if (whitelist.length === 0) return true;

  // Check for at least one common element
  for (const word of words) {
    for (const allowed_word of whitelist) {
      if (word.startsWith(allowed_word)) {
        return true;
      }
    }
  }
  return false;
}

function passes_blacklist(words: Set<string>, blacklist: string[]): boolean {
  if (blacklist.length === 0) return true;

  for (const word of words) {
    for (const blocked_word of blacklist) {
      if (word.startsWith(blocked_word)) {
        return false;
      }
    }
  }
  return true;
}

export function passes_reply(
  tags: string[][],
  reply_allowed: boolean,
): boolean {
  if (reply_allowed) return true;
  else if (
    getTagValue(tags, "e").length === 0 && getTagValue(tags, "q").length === 0
  ) {
    {
      //console.log(tags);
      return true;
    }
  } else return false;
}

function getTagValue(tags: string[][], key: string): string[] {
  const result = tags.find((subList) => subList[0] === key);
  if (result != undefined) {
    if (result.length > 1) {
      return result.slice(1);
    }
  }
  return [];
}
