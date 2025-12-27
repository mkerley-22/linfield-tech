/**
 * Rounds time to the nearest 15-minute interval (00, 15, 30, 45)
 * @param timeString - Time string in HH:mm format
 * @returns Rounded time string in HH:mm format
 */
export function roundToQuarterHour(timeString: string): string {
  if (!timeString) return ''
  
  const [hours, minutes] = timeString.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return timeString
  
  // Round minutes to nearest 15-minute interval
  const roundedMinutes = Math.round(minutes / 15) * 15
  
  // Handle overflow (e.g., 60 minutes becomes 1 hour)
  let finalHours = hours
  let finalMinutes = roundedMinutes
  
  if (finalMinutes >= 60) {
    finalHours += 1
    finalMinutes = 0
  }
  
  // Handle 24-hour overflow
  if (finalHours >= 24) {
    finalHours = 0
  }
  
  return `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`
}

/**
 * Rounds datetime-local value to the nearest 15-minute interval
 * @param datetimeString - DateTime string in YYYY-MM-DDTHH:mm format
 * @returns Rounded datetime string
 */
export function roundDateTimeToQuarterHour(datetimeString: string): string {
  if (!datetimeString) return ''
  
  const [datePart, timePart] = datetimeString.split('T')
  if (!timePart) return datetimeString
  
  const roundedTime = roundToQuarterHour(timePart)
  return `${datePart}T${roundedTime}`
}

