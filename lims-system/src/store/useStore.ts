import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  EntrustOrder,
  Sample,
  TestTask,
  Report,
  ReportReturnRecord,
  ReportRevisionRecord,
  ReportStatus,
  SampleDisposalRecord,
  Reagent,
  ReagentUsage,
  Equipment,
  DashboardStats,
  QCResult,
  Client,
} from '../types';
import {
  mockUsers,
  mockOrders,
  mockSamples,
  mockTasks,
  mockReports,
  mockReagents,
  mockEquipments,
  mockDashboardStats,
  mockQCResults,
  mockClients,
} from '../mock/data';

interface AppState {
  currentUser: User | null;
  users: User[];
  clients: Client[];
  orders: EntrustOrder[];
  samples: Sample[];
  tasks: TestTask[];
  reports: Report[];
  reagents: Reagent[];
  equipments: Equipment[];
  qcResults: QCResult[];
  dashboardStats: DashboardStats;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addOrder: (order: Omit<EntrustOrder, 'id' | 'orderNo' | 'createdAt'>) => void;
  updateOrder: (id: string, order: Partial<EntrustOrder>) => void;
  deleteOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: EntrustOrder['status'], opinion?: string) => void;
  addSample: (sample: Omit<Sample, 'id'>) => void;
  updateSampleStatus: (id: string, status: Sample['status']) => void;
  updateTask: (id: string, task: Partial<TestTask>) => void;
  updateTaskStatus: (id: string, status: TestTask['status']) => void;
  addTask: (task: Omit<TestTask, 'id' | 'taskNo'>) => void;
  addTasks: (tasks: Omit<TestTask, 'id' | 'taskNo'>[]) => void;
  addReport: (report: Omit<Report, 'id' | 'reportNo'>) => void;
  updateReportStatus: (id: string, status: Report['status'], signData?: any) => void;
  updateReport: (id: string, report: Partial<Report>) => void;
  returnReport: (id: string, level: 'level1' | 'level2' | 'level3', opinion: string) => void;
  reviseReport: (id: string, data: Partial<Report>, content: string, relatedReturnId?: string) => void;
  resubmitReport: (id: string) => void;
  addSampleDisposal: (sampleId: string, record: Omit<SampleDisposalRecord, 'id' | 'sampleId' | 'operator' | 'operatorId' | 'operateTime'>) => void;
  updateReagent: (id: string, reagent: Partial<Reagent>) => void;
  addReagentUsage: (id: string, usage: Omit<ReagentUsage, 'id'>) => void;
  updateEquipment: (id: string, equipment: Partial<Equipment>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: mockUsers,
      clients: mockClients,
      orders: mockOrders,
      samples: mockSamples,
      tasks: mockTasks,
      reports: mockReports,
      reagents: mockReagents,
      equipments: mockEquipments,
      qcResults: mockQCResults,
      dashboardStats: mockDashboardStats,

      login: (username: string, password: string) => {
        const user = get().users.find(
          (u) => u.username === username && password === '123456'
        );
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
      },

      addOrder: (order) => {
        const newOrder: EntrustOrder = {
          ...order,
          id: `O${Date.now()}`,
          orderNo: `WT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(get().orders.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toLocaleString('zh-CN'),
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
      },

      updateOrder: (id, order) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...order } : o)),
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        }));
      },

      updateOrderStatus: (id, status, opinion) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  ...(status === 'approved' || status === 'rejected'
                    ? {
                        reviewOpinion: opinion,
                        reviewedBy: state.currentUser?.name,
                        reviewedAt: new Date().toLocaleString('zh-CN'),
                      }
                    : {}),
                }
              : o
          ),
        }));
      },

      addSample: (sample) => {
        const newSample: Sample = {
          ...sample,
          id: `S${Date.now()}`,
        };
        set((state) => ({ samples: [...state.samples, newSample] }));
      },

      updateSampleStatus: (id, status) => {
        set((state) => ({
          samples: state.samples.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        }));
      },

      updateTask: (id, task) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
        }));
      },

      updateTaskStatus: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status } : t
          ),
        }));
      },

      addTask: (task) => {
        const state = get();
        const newTask: TestTask = {
          ...task,
          id: `T${Date.now()}`,
          taskNo: `RW${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(state.tasks.length + 1).padStart(4, '0')}`,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      addTasks: (taskList) => {
        const state = get();
        const now = new Date();
        const newTasks = taskList.map((task, idx) => ({
          ...task,
          id: `T${Date.now()}_${idx}`,
          taskNo: `RW${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(state.tasks.length + idx + 1).padStart(4, '0')}`,
        }));
        set((state) => ({ tasks: [...state.tasks, ...newTasks] }));
      },

      addReport: (report) => {
        const newReport: Report = {
          ...report,
          id: `R${Date.now()}`,
          reportNo: `BG${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(get().reports.length + 1).padStart(3, '0')}`,
        };
        set((state) => ({ reports: [...state.reports, newReport] }));
      },

      updateReport: (id, report) => {
        set((state) => ({
          reports: state.reports.map((r) => (r.id === id ? { ...r, ...report } : r)),
        }));
      },

      updateReportStatus: (id, status, signData) => {
        set((state) => ({
          reports: state.reports.map((r) => {
            if (r.id !== id) return r;
            const updated: Report = { ...r, status };
            if (status === 'level1_signed' && signData) {
              updated.level1Sign = {
                signer: state.currentUser?.name || '',
                signerId: state.currentUser?.id || '',
                signTime: new Date().toLocaleString('zh-CN'),
                opinion: signData.opinion,
              };
            }
            if (status === 'level2_signed' && signData) {
              updated.level2Sign = {
                signer: state.currentUser?.name || '',
                signerId: state.currentUser?.id || '',
                signTime: new Date().toLocaleString('zh-CN'),
                opinion: signData.opinion,
              };
            }
            if (status === 'issued' && signData) {
              updated.level3Sign = {
                signer: state.currentUser?.name || '',
                signerId: state.currentUser?.id || '',
                signTime: new Date().toLocaleString('zh-CN'),
                opinion: signData.opinion,
              };
              updated.issuedAt = new Date().toLocaleString('zh-CN');
            }
            return updated;
          }),
        }));
      },

      returnReport: (id, level, opinion) => {
        set((state) => {
          const newReturnRecord: ReportReturnRecord = {
            id: `RET_${Date.now()}`,
            reportId: id,
            level,
            opinion,
            operator: state.currentUser?.name || '',
            operatorId: state.currentUser?.id || '',
            returnTime: new Date().toLocaleString('zh-CN'),
          };
          return {
            reports: state.reports.map((r) => {
              if (r.id !== id) return r;
              const returnRecords = [...(r.returnRecords || []), newReturnRecord];
              let updated: Report = {
                ...r,
                status: 'returned',
                returnRecords,
                currentReturnLevel: level,
              };
              if (level === 'level1') {
                delete updated.level1Sign;
              } else if (level === 'level2') {
                delete updated.level2Sign;
              } else if (level === 'level3') {
                delete updated.level3Sign;
              }
              return updated;
            }),
          };
        });
      },

      reviseReport: (id, data, content, relatedReturnId) => {
        set((state) => {
          const report = state.reports.find((r) => r.id === id);
          if (!report) return state;
          const revisionNo = (report.revisionRecords?.length || 0) + 1;
          const newRevision: ReportRevisionRecord = {
            id: `REV_${Date.now()}`,
            reportId: id,
            revisionNo,
            content,
            modifiedBy: state.currentUser?.name || '',
            modifiedById: state.currentUser?.id || '',
            modifiedAt: new Date().toLocaleString('zh-CN'),
            relatedReturnId,
          };
          return {
            reports: state.reports.map((r) =>
              r.id === id
                ? {
                    ...r,
                    ...data,
                    revisionRecords: [...(r.revisionRecords || []), newRevision],
                  }
                : r
            ),
          };
        });
      },

      resubmitReport: (id) => {
        set((state) => {
          const report = state.reports.find((r) => r.id === id);
          if (!report) return state;
          let newStatus: ReportStatus = 'draft';
          const returnLevel = report.currentReturnLevel;
          if (returnLevel === 'level3') {
            newStatus = 'level2_signed';
          } else if (returnLevel === 'level2') {
            newStatus = 'level1_signed';
          } else {
            newStatus = 'draft';
          }
          return {
            reports: state.reports.map((r) =>
              r.id === id ? { ...r, status: newStatus, currentReturnLevel: undefined } : r
            ),
          };
        });
      },

      addSampleDisposal: (sampleId, record) => {
        set((state) => {
          const newRecord: SampleDisposalRecord = {
            ...record,
            id: `D${Date.now()}`,
            sampleId,
            operator: state.currentUser?.name || '',
            operatorId: state.currentUser?.id || '',
            operateTime: new Date().toLocaleString('zh-CN'),
          };
          return {
            samples: state.samples.map((s) => {
              if (s.id !== sampleId) return s;
              let updated: Sample = {
                ...s,
                disposalRecords: [...(s.disposalRecords || []), newRecord],
              };
              if (record.type === 'retain') {
                updated.status = 'retained';
              } else if (record.type === 'destroy') {
                updated.status = 'destroyed';
              } else if (record.type === 'return') {
                updated.status = 'returned';
              }
              if (record.newExpireTime) {
                updated.expireTime = record.newExpireTime;
              }
              return updated;
            }),
          };
        });
      },

      updateReagent: (id, reagent) => {
        set((state) => ({
          reagents: state.reagents.map((r) => (r.id === id ? { ...r, ...reagent } : r)),
        }));
      },

      addReagentUsage: (id, usage) => {
        set((state) => ({
          reagents: state.reagents.map((r) => {
            if (r.id !== id) return r;
            const newUsage = {
              ...usage,
              id: `U${Date.now()}`,
              usedAt: new Date().toLocaleString('zh-CN'),
            };
            const newQuantity = r.quantity - usage.quantity;
            let status = r.status;
            if (newQuantity <= 0) status = 'used_up';
            else if (newQuantity < r.safetyStock) status = 'low_stock';
            return {
              ...r,
              quantity: newQuantity,
              status,
              usageRecords: [newUsage, ...r.usageRecords],
            };
          }),
        }));
      },

      updateEquipment: (id, equipment) => {
        set((state) => ({
          equipments: state.equipments.map((e) => (e.id === id ? { ...e, ...equipment } : e)),
        }));
      },
    }),
    {
      name: 'lims-storage',
    }
  )
);
