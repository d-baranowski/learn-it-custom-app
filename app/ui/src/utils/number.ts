

export const prettyPrintNumber = (amount?: number, dp: number = 8) => {
  if (!amount) return ''
  return amount.toFixed(dp).replace(/\.?0+$/, '')
}
