export const money = (value) => new Intl.NumberFormat('lt-LT', {
  style: 'currency', currency: 'EUR',
}).format(Number(value))

export const dateTime = (value) => new Date(value).toLocaleString('lt-LT', {
  timeZone: 'Europe/Vilnius',
})
