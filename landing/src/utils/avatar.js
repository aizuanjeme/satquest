export function avatarSrc(gender, n) {
  return new URL(
    `../avatars/Size_XXL__2048px______Avatar_${gender}_${n}_____Round_no.webp`,
    import.meta.url,
  ).href;
}

export function avatarIdToSrc(avatarId) {
  if (!avatarId) return null;
  const m = avatarId.match(/^av([FM])(\d+)$/);
  if (!m) return null;
  const gender = m[1] === 'F' ? 'female' : 'male';
  const n = parseInt(m[2], 10);
  if (n < 1 || n > 19) return null;
  return avatarSrc(gender, n);
}
