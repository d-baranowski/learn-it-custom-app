export const prettyPrintCurrency = (amount?: number) => {
  if (!amount) return ''
  return amount.toLocaleString('en-US', {style: 'currency', currency: 'EUR'})
}
