import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  EntrustOrder,
  Sample,
  TestTask,
  Report,
  Reagent,
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
  updateOrderStatus: (id: string, status: EntrustOrder['status'], opinion?: string) => void;
  addSample: (sample: Omit<Sample, 'id'>) => void;
  updateSampleStatus: (id: string, status: Sample['status']) => void;
  updateTaskStatus: (id: string, status: TestTask['status']) => void;
  updateReportStatus: (id: string, status: Report['status'], signData?: any) => void;
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

      updateOrderStatus: (id, status, opinion) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  reviewOpinion: opinion,
                  reviewedBy: state.currentUser?.name,
                  reviewedAt: new Date().toLocaleString('zh-CN'),
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

      updateTaskStatus: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status } : t
          ),
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
    }),
    {
      name: 'lims-storage',
    }
  )
);
