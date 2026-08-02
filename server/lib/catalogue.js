/* ============================================================
   SKU lookup. This is the only place a price is ever decided.
   The browser sends a SKU and nothing about money.
   ============================================================ */

import { getArtworks, getMerch } from './db.js';

/**
 * Resolve a SKU to a priced, describable line item.
 * Returns null when the SKU is unknown — callers must treat that as a
 * rejection, never as a default price.
 *
 * Merch SKUs carry the chosen size: TESS01-MERCH-hoodie-L
 */
export async function lookupSku(sku) {
  if (typeof sku !== 'string' || !sku || sku.length > 64) return null;

  const artworks = await getArtworks();

  for (const art of artworks) {
    const name = art.title || art.workingTitle || 'Untitled';

    if (art.original?.sku === sku) {
      if (art.original.available === false) return { sku, soldOut: true };
      return {
        sku,
        kind: 'original',
        unique: true,
        artworkId: art.id,
        priceMinor: art.original.priceMinor,
        description: `${name} — original, one of one`
      };
    }

    for (const print of art.prints ?? []) {
      if (print.sku !== sku) continue;
      if (print.available === false) return { sku, soldOut: true };
      return {
        sku,
        kind: 'print',
        unique: false,
        artworkId: art.id,
        priceMinor: print.priceMinor,
        description: `${name} — ${print.size} signed print`
      };
    }
  }

  // Merch: <artworkSku>-MERCH-<productId>-<size>
  const merchMatch = /^(.+)-MERCH-([a-z]+)-(.+)$/.exec(sku);
  if (merchMatch) {
    const [, artPrefix, productId, size] = merchMatch;
    const products = await getMerch();
    const product = products.find((p) => p.id === productId);
    if (!product || product.available === false) return null;
    if (!(product.sizes ?? []).includes(size)) return null;

    const art = artworks.find((a) => a.original?.sku?.startsWith(artPrefix));
    const name = art ? (art.title || art.workingTitle || 'Untitled') : 'Artwork';
    return {
      sku,
      kind: 'merch',
      unique: false,
      artworkId: art?.id ?? null,
      priceMinor: product.priceMinor,
      description: `${product.name} (${size}) — ${name}`
    };
  }

  return null;
}

/** Mollie wants a decimal string, not minor units. */
export function toMollieAmount(priceMinor, currency = 'GBP') {
  if (!Number.isInteger(priceMinor) || priceMinor <= 0) {
    throw new Error('That item has no valid price set.');
  }
  return { currency, value: (priceMinor / 100).toFixed(2) };
}
