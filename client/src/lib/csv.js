/**
 * Export an array of objects to a CSV file download.
 * Escapes fields containing commas, quotes, or newlines per RFC 4180.
 */
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const escape = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }

  const rows = [headers.map(escape).join(',')]
  for (const row of data) {
    rows.push(headers.map((h) => escape(row[h])).join(','))
  }

  const csvContent = rows.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
