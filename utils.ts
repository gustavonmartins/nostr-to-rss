export function getTagsMultiple(tags: string[][], key: string): string[][] {
  const output: string[][] = [];
  for (const sublist of tags) {
    if (sublist.find((item) => item === key)) {
      output.push(sublist.slice(1));
    }
  }
  return output;
}

export function mediafilter(text: string): { uri: string; mimeType: string }[] {
  const mediaLinks = [];

  const urlRegex = /https?:\/\/[^\s]+/g;
  const imageExtensions = [
    "jpeg",
    "jpg",
    "png",
    "gif",
    "bmp",
    "webp",
    "tiff",
    "svg",
  ];
  const videoExtensions = [
    "mov",
    "mp4",
    "avi",
    "mkv",
    "webm",
    "flv",
    "wmv",
    "m4v",
  ];

  const uris = text.match(urlRegex);

  if (uris) {
    for (const uri of uris) {
      const extension = uri.split(".").pop()?.toLowerCase();
      if (extension) {
        if (imageExtensions.includes(extension)) {
          mediaLinks.push({
            uri: uri,
            mimeType: `image/${extension}`,
          });
        } else if (videoExtensions.includes(extension)) {
          mediaLinks.push({
            uri: uri,
            mimeType: `video/${extension}`,
          });
        }
      }
    }
  }

  return mediaLinks;
}
