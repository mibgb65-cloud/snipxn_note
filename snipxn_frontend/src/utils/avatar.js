export function getAvatarLabel(source, maxLength = 2) {
  const rawValue = String(source || '').trim();

  if (!rawValue) {
    return '?';
  }

  const baseValue = rawValue.includes('@') ? rawValue.split('@')[0] : rawValue;
  const characters = Array.from(baseValue.replace(/\s+/g, ''));

  if (!characters.length) {
    return '?';
  }

  return characters.slice(0, Math.max(1, maxLength)).join('').toUpperCase();
}
