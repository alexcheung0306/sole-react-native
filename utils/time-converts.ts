// import { parseZonedDateTime } from "@internationalized/date" // Commented out due to missing module

//TODO: Implement parseZonedDateTime

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

export function convertHeroUITimeToTimestampz(obj: {
  day: number,
  era?: string,
  hour: number,
  millisecond: number,
  minute: number,
  month: number,
  second: number,
  year: number
}) {
  //from obj to 2025-03-13 22:58:27.000 +0800
  const { day, era, hour, millisecond, minute, month, second, year } = obj
  const date = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  )
  const formattedDate = formatDate(date, userTimeZone)
  console.log(formattedDate) // Output: 2024-04-01 08:45:00.000 +0800
  return formattedDate
}

export function convertTimestampToNewFormat(input: string) {
  //from 2025-03-13 22:58:27.000 +0800 to obj
  if (!input) {
    throw new Error("Input timestamp is undefined or null")
  }
  const date = new Date(input)
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format")
  }
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0") // Months are zero-based
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const output = `${year}-${month}-${day}T${hours}:${minutes}`
  const dataRange = parseZonedDateTime(`${output}[${userTimeZone}]`)

  return dataRange
}

function formatDate(zonedDate, userTimeZone) {
  // Create a new Date object from the zonedDate
  const date = new Date(zonedDate)

  // Get the timezone offset in hours and minutes
  const offset = date.getTimezoneOffset()
  const offsetHours = String(Math.abs(offset / 60)).padStart(2, "0")
  const offsetMinutes = String(Math.abs(offset % 60)).padStart(2, "0")
  const sign = offset > 0 ? "-" : "+"

  // Format the date components
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0") // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  // Construct the formatted date string
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000 ${sign}${offsetHours}${offsetMinutes}`
}

export function formatDateTime(isoString) {
  try {
    // Validate input
    if (!isoString || typeof isoString !== "string") {
      throw new Error("Invalid or missing ISO string")
    }
    const date = new Date(isoString)
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date")
    }
    const datePart = date.toISOString().split("T")[0]
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0") // Ensure two digits
    const ampm = hours >= 12 ? "pm" : "am"
    hours = hours % 12 || 12 // Convert 0 to 12 for 12-hour format
    const timePart = `${hours}:${minutes}${ampm}`
    return `${datePart} ${timePart}`
  } catch (error) {
    console.error("Error formatting date:", error.message, "Input:", isoString)
    return null // or customize fallback (e.g., return a default value or throw error)
  }
}
