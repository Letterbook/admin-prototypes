export function mediumDate(d) {
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export function since(d, now) {
  const until = d.until(now)
  if (until.total('day') > 30) {
    return mediumDate(d)
  }
  if (until.total('day') > 1) { return `${until.total('day').toFixed()}d`}
  if (until.total('hour') > 1) { return `${until.total('hour').toFixed()}h`}
  if (until.total('minute') > 1) { return `${until.total('minute').toFixed()}m`}
  return `${until.total('second').toFixed()}s`
  // return 'now'
}

export default {
  mediumDate,
  since
} 
