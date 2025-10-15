// Type definitions for applicant API responses

export interface JobApplicant {
  id: number
  soleUserId: string
  roleId: number
  paymentBasis?: string
  quotePrice?: number
  otQuotePrice?: number
  skills?: string
  answer?: string
  applicationStatus?: string
  applicationProcess?: string
  createdAt: string
}

export interface UserInfo {
  id?: number
  name: string
  bio?: string
  category?: string
  profilePic?: string
  soleUserId?: string
}

export interface JobApplicantPreviewResponse {
  id: number
  soleUserId: string
  roleId: number
  paymentBasis?: string
  quotePrice?: number
  otQuotePrice?: number
  skills?: string
  answer?: string
  applicationStatus?: string
  applicationProcess?: string
  createdAt: string
  username: string
  userInfo: UserInfo
  comcardFirstPic?: string
}

export interface SearchApplicantsParams {
  id?: number
  soleUserId?: string
  roleId?: number
  applicationProcess?: string
  applicationStatus?: string
  paymentBasis?: string
  nameSearch?: string
  orderBy?: string
  orderSeq?: "asc" | "desc"
  pageNo?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export type SearchApplicantsResponse =
  PaginatedResponse<JobApplicantPreviewResponse>
