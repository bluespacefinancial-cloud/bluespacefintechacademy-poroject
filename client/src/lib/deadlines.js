export function getDeadlineInfo(dueDateStr) {
  if (!dueDateStr) return null

  const due = new Date(dueDateStr)
  if (isNaN(due.getTime())) return null

  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays)
    return {
      label: overdueDays === 0 ? 'Overdue today' : `Overdue by ${overdueDays}d`,
      isOverdue: true,
      badgeVariant: 'outline',
      badgeClass: 'text-red-700 border-red-200 font-medium',
      dueDateFormatted: due.toLocaleDateString(),
    }
  }

  if (diffHours <= 24) {
    return {
      label: 'Due today',
      isDueSoon: true,
      badgeVariant: 'outline',
      badgeClass: 'text-amber-700 border-amber-200 font-semibold',
      dueDateFormatted: due.toLocaleDateString(),
    }
  }

  if (diffDays <= 3) {
    return {
      label: `Due in ${diffDays} days`,
      isDueSoon: true,
      badgeVariant: 'outline',
      badgeClass: 'text-amber-700 border-amber-200/80 font-medium',
      dueDateFormatted: due.toLocaleDateString(),
    }
  }

  return {
    label: `Due ${due.toLocaleDateString()}`,
    isNormal: true,
    badgeVariant: 'outline',
    badgeClass: 'text-gray-600 border-gray-200 font-normal',
    dueDateFormatted: due.toLocaleDateString(),
  }
}
