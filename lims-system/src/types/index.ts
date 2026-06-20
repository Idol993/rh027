export type UserRole = 'tester' | 'reviewer' | 'quality_manager' | 'director';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department: string;
  phone: string;
  email: string;
  avatar?: string;
}

export type SampleStatus = 'pending' | 'in_testing' | 'completed' | 'retained' | 'destroyed' | 'returned';

export type EntrustStatus = 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'reviewing' | 'rejected' | 'abnormal';

export type ReportStatus = 'draft' | 'reviewing' | 'level1_signed' | 'level2_signed' | 'issued' | 'voided';

export type ReagentStatus = 'in_stock' | 'low_stock' | 'expiring' | 'expired' | 'used_up';

export type EquipmentStatus = 'normal' | 'in_use' | 'maintenance' | 'calibrating' | 'overdue' | 'fault';

export interface Client {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  email: string;
}

export interface EntrustOrder {
  id: string;
  orderNo: string;
  clientId: string;
  clientName: string;
  sampleName: string;
  sampleType: string;
  specModel: string;
  quantity: number;
  testItems: TestItem[];
  standards: string[];
  deadline: string;
  reportMethod: string;
  status: EntrustStatus;
  createdAt: string;
  createdBy: string;
  reviewOpinion?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface TestItem {
  id: string;
  name: string;
  code: string;
  standard: string;
  limit: string;
  unit: string;
  method: string;
}

export interface Sample {
  id: string;
  sid: string;
  name: string;
  type: string;
  specModel: string;
  quantity: number;
  appearance: string;
  packaging: string;
  status: SampleStatus;
  entrustId: string;
  entrustNo: string;
  storageLocation: string;
  receiveTime: string;
  receiver: string;
  retainDays: number;
  expireTime: string;
  testItems: TestItem[];
}

export interface TestTask {
  id: string;
  taskNo: string;
  sampleId: string;
  sampleSid: string;
  sampleName: string;
  testItem: TestItem;
  status: TaskStatus;
  tester: string;
  testerId: string;
  equipmentId: string;
  equipmentName: string;
  department: string;
  assignTime: string;
  startTime?: string;
  endTime?: string;
  result?: TestResult;
  abnormal?: boolean;
  abnormalReason?: string;
  recheck?: boolean;
  recheckCount?: number;
}

export interface TestResult {
  id: string;
  taskId: string;
  value: number | string;
  unit: string;
  result: 'qualified' | 'unqualified' | 'pending';
  rawData: number[];
  average?: number;
  deviation?: number;
  rsd?: number;
  recoveryRate?: number;
  environment: {
    temperature: number;
    humidity: number;
  };
  testTime: string;
  instrumentNo: string;
  reagentBatch: string;
  standardSubstance: string;
  operator: string;
}

export interface Report {
  id: string;
  reportNo: string;
  entrustId: string;
  entrustNo: string;
  sampleIds: string[];
  status: ReportStatus;
  conclusion: string;
  createdAt: string;
  createdBy: string;
  level1Sign?: {
    signer: string;
    signerId: string;
    signTime: string;
    opinion: string;
  };
  level2Sign?: {
    signer: string;
    signerId: string;
    signTime: string;
    opinion: string;
  };
  level3Sign?: {
    signer: string;
    signerId: string;
    signTime: string;
    opinion: string;
  };
  issuedAt?: string;
  items: ReportItem[];
}

export interface ReportItem {
  sampleSid: string;
  sampleName: string;
  testItem: string;
  standard: string;
  limit: string;
  result: string;
  unit: string;
  conclusion: 'qualified' | 'unqualified' | 'pending';
}

export interface Reagent {
  id: string;
  name: string;
  batchNo: string;
  concentration: string;
  specification: string;
  quantity: number;
  unit: string;
  manufacturer: string;
  certificateNo: string;
  storageCondition: string;
  expiryDate: string;
  status: ReagentStatus;
  safetyStock: number;
  inStockDate: string;
  usageRecords: ReagentUsage[];
}

export interface ReagentUsage {
  id: string;
  reagentId: string;
  quantity: number;
  user: string;
  purpose: string;
  sampleId?: string;
  usedAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  equipmentNo: string;
  manufacturer: string;
  department: string;
  status: EquipmentStatus;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  calibrationCycle: number;
  lastMaintenanceDate?: string;
  usageHours: number;
  location: string;
  manager: string;
}

export interface QCResult {
  id: string;
  type: 'blank' | 'parallel' | 'spike' | 'qc_sample';
  sampleName: string;
  testItem: string;
  result: number;
  expectedValue?: number;
  tolerance?: number;
  controlStatus: 'in_control' | 'out_of_control' | 'warning';
  testTime: string;
  operator: string;
}

export interface OperationLog {
  id: string;
  module: string;
  action: string;
  targetId: string;
  targetName: string;
  operator: string;
  operatorId: string;
  operateTime: string;
  ip: string;
  detail: string;
}

export interface DashboardStats {
  totalSamples: number;
  pendingSamples: number;
  inTestingSamples: number;
  completedSamples: number;
  overdueSamples: number;
  totalReports: number;
  issuedReports: number;
  pendingReviewReports: number;
  unqualifiedRate: number;
  abnormalCount: number;
  recheckRate: number;
  reportTimeliness: number;
  equipmentUtilization: number;
  equipmentCount: number;
  equipmentFaultCount: number;
  testerWorkload: { name: string; count: number }[];
  sampleTrend: { date: string; count: number }[];
  reagentConsumption: { name: string; quantity: number }[];
  qcStatus: { type: string; inControl: number; outOfControl: number };
}
