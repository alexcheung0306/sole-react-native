export const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "success"
    case "rejected":
      return "danger"
    case "applied":
      return "success"
    case "pending":
      return "warning"
    case "rejected":
      return "danger"
    case "accepted":
      return "primary"
    case "shortlisted":
      return "warning"
    case "offered":
      return "success"
    case "invited":
      return "primary"
    default:
      return "default"
  }
}
