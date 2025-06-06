export function slugify(text: string): string {
  return text
      .toLowerCase()
      .replace(/ /g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word characters
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
}