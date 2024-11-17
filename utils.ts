export function getTagsMultiple(tags: string[][], key: string): string[][] {
  const output: string[][] = [];
  for (const sublist of tags) {
    if (sublist.find((item) => item === key)) {
      output.push(sublist.slice(1));
    }
  }
  return output;
}
