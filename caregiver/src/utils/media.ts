const IMAGE_URL_PATTERN = /\.(?:jpe?g|png|webp|gif)(?:$|[?#])/i;

export function isImageMedia(source: string): boolean {
  return source.startsWith("image/") || IMAGE_URL_PATTERN.test(source);
}
