// Topic and persona colours are picked for marks (bars, dots), not for text.
// textTint mixes a colour with white so small text in that hue stays readable
// (4.5:1 or better) on the app's dark surfaces.
export function textTint(hex, amount = 0.35) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return 'var(--text)'
  const mix = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16)
    return Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')
  }
  return `#${mix(1)}${mix(3)}${mix(5)}`
}
