// Turns what was typed into a safe web address, or an empty string when it is not one. A bare address such as
// "github.com/me" or "www.linkedin.com/in/me" gets "https://"; anything that is not http or https
// (javascript:, data:, mailto:, plain words) is dropped, so a typo can never become a broken or unsafe link.
export function toWebUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || /\s/.test(text)) return '';

  if (/^https?:\/\//i.test(text)) {
    try {
      new URL(text);
      return text;
    } catch {
      return '';
    }
  }

  if (/^(www\.)?[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+(:\d+)?([/?#]\S*)?$/i.test(text)) return `https://${text}`;
  return '';
}
