export interface PaletteColor {
  bg: string
  border: string
  text: string
  accent: string
}

export const WEEK_ROW_PALETTE: PaletteColor[] = [
  { bg: '#EEEDFE', border: '#CECBF6', text: '#3C3489', accent: '#534AB7' },
  { bg: '#E8ECFC', border: '#C2CCF3', text: '#2A3C82', accent: '#3F58B0' },
  { bg: '#E6F1FB', border: '#B5D4F4', text: '#0C447C', accent: '#185FA5' },
  { bg: '#EDEDF7', border: '#D0CFE5', text: '#3D3866', accent: '#5C5391' },
  { bg: '#F4ECF4', border: '#DCC5DD', text: '#5E2D5F', accent: '#864587' },
  { bg: '#FBEAF0', border: '#F4C0D1', text: '#72243E', accent: '#993556' },
]

export const STAT_CARDS = {
  streak: { bg: '#EEEDFE', border: '#CECBF6', label: '#3C3489', number: '#26215C', unit: '#534AB7' },
  month:  { bg: '#E6F1FB', border: '#B5D4F4', label: '#0C447C', number: '#042C53', unit: '#185FA5' },
  all:    { bg: '#FBEAF0', border: '#F4C0D1', label: '#72243E', number: '#4B1528', unit: '#993556' },
}

export function colorForUserId(userId: string): PaletteColor {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return WEEK_ROW_PALETTE[hash % WEEK_ROW_PALETTE.length]
}
