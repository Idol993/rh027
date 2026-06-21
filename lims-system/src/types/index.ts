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

export type ReportStatus = 'draft' | 'reviewing' | 'level1_signed' | 'level2_signed' | 'issued' | 'voided' | 'returned';

export type ReagentStatus = 'in_stock' | 'low_stock' | 'expiring' | 'expired' | 'used_up';

export type EquipmentStatus = 'normal' | 'in_use' | 'maintenance' | 'calibrating' | 'calibration_due' | 'overdue' | 'fault' | 'faulty' | 'scrapped';

export interface ReportReturnRecord {
  id: string;
  reportId: string;
  level: 'level1' | 'level2' | 'level3';
  opinion: string;
  operator: string;
  operatorId: string;
  returnTime: string;
}

export interface ReportRevisionRecord {
  id: string;
  reportId: string;
  revisionNo: number;
  content: string;
  modifiedBy: string;
  modifiedById: string;
  modifiedAt: string;
  relatedReturnId?: string;
}

export interface SampleDisposalRecord {
  id: string;
  sampleId: string;
  type: 'retain' | 'destroy' | 'return' | 'extend';
  operator: string;
  operatorId: string;
  operateTime: string;
  remark?: string;
  newExpireTime?: string;
}

export interface CalibrationRecord {
  id: string;
  equipmentId: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationAgency: string;
  certificateNo: string;
  result: 'pass' | 'fail';
  description?: string;
  operator: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: 'repair' | 'maintenance';
  startDate: string;
  endDate: string;
  faultDescription: string;
  repairContent: string;
  repairAgency: string;
  cost: number;
  result: 'fixed' | 'processing' | 'scrapped';
  operator: string;
}

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
  disposalRecords?: SampleDisposalRecord[];
}

export interface TestTask {
  id: string;
  taskNo: string;
  sampleId: string;
  sampleSid: string;
  sampleName: string;
  entrustId: string;
  entrustNo: string;
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
  remarks?: string;
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
  returnRecords?: ReportReturnRecord[];
  revisionRecords?: ReportRevisionRecord[];
  currentReturnLevel?: 'level1' | 'level2' | 'level3';
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
  code: string;
  spec: string;
  manufacturer: string;
  serialNo: string;
  purchaseDate: string;
  department: string;
  status: EquipmentStatus;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  calibrationCycle: number;
  calibrationCertificateNo: string;
  lastMaintenanceDate?: string;
  usageHours: number;
  location: string;
  manager: string;
  managerPhone: string;
  calibrationRecords?: CalibrationRecord[];
  maintenanceRecords?: MaintenanceRecord[];
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
