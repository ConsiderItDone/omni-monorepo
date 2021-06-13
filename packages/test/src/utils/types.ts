export interface VestingScheduleFormatted {
  start: string;
  period: string;
  periodCount: number;
  perPeriod: string;
}
export interface VestingSchedule {
  start: string;
  period: string;
  period_count: number;
  per_period: string;
}

export interface RootCertificate {
  revoked: boolean; renewed: string; created: string
}