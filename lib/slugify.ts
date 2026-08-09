/**
 * Cleans up a manually-typed English slug (lowercases, strips invalid
 * characters, collapses whitespace/hyphens). Does not transliterate Korean —
 * the admin editor asks the owner to type an English slug themselves.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
