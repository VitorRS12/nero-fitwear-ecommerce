/** Caminho público (proxy) das fotos guardadas no bucket `product-images`. */
export const IMAGE_URL_PREFIX = "/api/public/img/";

export const PRODUCT_IMAGE_BUCKET = "product-images";

export function storagePathToUrl(path: string): string {
  return `${IMAGE_URL_PREFIX}${path}`;
}

export function urlToStoragePath(url: string): string | null {
  if (!url.startsWith(IMAGE_URL_PREFIX)) return null;
  return url.slice(IMAGE_URL_PREFIX.length);
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
