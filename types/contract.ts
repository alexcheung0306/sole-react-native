// Contract and Job Contract types

export interface JobContractSchedule {
  id?: number;
  location?: string;
  fromTime: string;
  toTime: string;
}

export interface JobContractConditions {
  id?: number;
  usageRights?: string;
  paymentBasis: string;
  paymentAmount: number;
  paymentAmountOt?: number;
  paymentAdditional?: number;
  paymentCurrency: string;
  paymentDate: string;
  termsAndConditions?: string;
  readByTalent?: boolean;
  readByClient?: boolean;
  conditionStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  schedules?: JobContractSchedule[];
}

export interface JobContract {
  id?: number;
  projectId: number;
  roleId: number;
  clientId: string;
  talentId: string;
  jobApplicantId: number;
  projectName: string;
  roleTitle: string;
  remarks?: string;
  contractStatus: string;
  createdAt?: string;
  updatedAt?: string;
  conditions?: JobContractConditions[];
}

export interface JobContractWithProfiles extends JobContract {
  clientProfile?: any;
  talentProfile?: any;
}

