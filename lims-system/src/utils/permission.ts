import { UserRole } from '../types';

export const roleNames: Record<UserRole, string> = {
  tester: '检测员',
  reviewer: '审核员',
  quality_manager: '质量负责人',
  director: '实验室主任',
};

export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};

export const menuConfig: Array<{
  key: string;
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
  children?: Array<{
    key: string;
    label: string;
    path: string;
    roles: UserRole[];
  }>;
}> = [
  {
    key: 'dashboard',
    label: '工作台',
    icon: 'DashboardOutlined',
    path: '/dashboard',
    roles: ['tester', 'reviewer', 'quality_manager', 'director'],
  },
  {
    key: 'entrust',
    label: '委托管理',
    icon: 'FileTextOutlined',
    path: '/entrust',
    roles: ['reviewer', 'quality_manager', 'director'],
    children: [
      {
        key: 'entrust-list',
        label: '委托列表',
        path: '/entrust/list',
        roles: ['reviewer', 'quality_manager', 'director'],
      },
      {
        key: 'entrust-review',
        label: '合同评审',
        path: '/entrust/review',
        roles: ['quality_manager', 'director'],
      },
    ],
  },
  {
    key: 'sample',
    label: '样品管理',
    icon: 'ExperimentOutlined',
    path: '/sample',
    roles: ['tester', 'reviewer', 'quality_manager', 'director'],
    children: [
      {
        key: 'sample-list',
        label: '样品列表',
        path: '/sample/list',
        roles: ['tester', 'reviewer', 'quality_manager', 'director'],
      },
      {
        key: 'sample-register',
        label: '样品登记',
        path: '/sample/register',
        roles: ['tester', 'reviewer'],
      },
      {
        key: 'sample-storage',
        label: '留样管理',
        path: '/sample/storage',
        roles: ['tester', 'reviewer', 'quality_manager'],
      },
    ],
  },
  {
    key: 'task',
    label: '检测任务',
    icon: 'CheckCircleOutlined',
    path: '/task',
    roles: ['tester', 'reviewer', 'quality_manager', 'director'],
    children: [
      {
        key: 'task-my',
        label: '我的任务',
        path: '/task/my',
        roles: ['tester'],
      },
      {
        key: 'task-all',
        label: '任务列表',
        path: '/task/list',
        roles: ['reviewer', 'quality_manager', 'director'],
      },
      {
        key: 'task-assign',
        label: '任务分配',
        path: '/task/assign',
        roles: ['reviewer', 'quality_manager'],
      },
    ],
  },
  {
    key: 'data',
    label: '数据采集',
    icon: 'BarChartOutlined',
    path: '/data',
    roles: ['tester', 'reviewer', 'quality_manager'],
    children: [
      {
        key: 'data-collect',
        label: '数据录入',
        path: '/data/collect',
        roles: ['tester'],
      },
      {
        key: 'data-review',
        label: '数据审核',
        path: '/data/review',
        roles: ['reviewer', 'quality_manager'],
      },
      {
        key: 'data-abnormal',
        label: '异常处理',
        path: '/data/abnormal',
        roles: ['quality_manager', 'reviewer'],
      },
    ],
  },
  {
    key: 'report',
    label: '报告管理',
    icon: 'FileDoneOutlined',
    path: '/report',
    roles: ['tester', 'reviewer', 'quality_manager', 'director'],
    children: [
      {
        key: 'report-list',
        label: '报告列表',
        path: '/report/list',
        roles: ['tester', 'reviewer', 'quality_manager', 'director'],
      },
      {
        key: 'report-create',
        label: '报告编制',
        path: '/report/create',
        roles: ['tester', 'reviewer'],
      },
      {
        key: 'report-review',
        label: '报告审核',
        path: '/report/review',
        roles: ['reviewer', 'quality_manager', 'director'],
      },
    ],
  },
  {
    key: 'reagent',
    label: '试剂耗材',
    icon: 'MedicineBoxOutlined',
    path: '/reagent',
    roles: ['tester', 'reviewer', 'quality_manager', 'director'],
    children: [
      {
        key: 'reagent-list',
        label: '试剂库存',
        path: '/reagent/list',
        roles: ['tester', 'reviewer', 'quality_manager', 'director'],
      },
      {
        key: 'reagent-usage',
        label: '使用记录',
        path: '/reagent/usage',
        roles: ['tester', 'reviewer', 'quality_manager'],
      },
      {
        key: 'reagent-warning',
        label: '预警管理',
        path: '/reagent/warning',
        roles: ['quality_manager', 'reviewer'],
      },
    ],
  },
  {
    key: 'equipment',
    label: '设备管理',
    icon: 'ToolOutlined',
    path: '/equipment',
    roles: ['tester', 'reviewer', 'quality_manager', 'director'],
    children: [
      {
        key: 'equipment-list',
        label: '设备台账',
        path: '/equipment/list',
        roles: ['tester', 'reviewer', 'quality_manager', 'director'],
      },
      {
        key: 'equipment-calibration',
        label: '校准检定',
        path: '/equipment/calibration',
        roles: ['quality_manager', 'reviewer'],
      },
      {
        key: 'equipment-maintenance',
        label: '维护保养',
        path: '/equipment/maintenance',
        roles: ['tester', 'reviewer', 'quality_manager'],
      },
    ],
  },
  {
    key: 'quality',
    label: '质量控制',
    icon: 'SafetyCertificateOutlined',
    path: '/quality',
    roles: ['quality_manager', 'director'],
    children: [
      {
        key: 'quality-qc',
        label: '质控管理',
        path: '/quality/qc',
        roles: ['quality_manager', 'director'],
      },
      {
        key: 'quality-supervision',
        label: '质量监督',
        path: '/quality/supervision',
        roles: ['quality_manager', 'director'],
      },
    ],
  },
  {
    key: 'monitor',
    label: '大屏监控',
    icon: 'MonitorOutlined',
    path: '/monitor',
    roles: ['director', 'quality_manager'],
  },
  {
    key: 'system',
    label: '系统管理',
    icon: 'SettingOutlined',
    path: '/system',
    roles: ['director'],
    children: [
      {
        key: 'system-user',
        label: '用户管理',
        path: '/system/user',
        roles: ['director'],
      },
      {
        key: 'system-log',
        label: '操作日志',
        path: '/system/log',
        roles: ['director'],
      },
    ],
  },
];

export const getMenusByRole = (role: UserRole) => {
  return menuConfig
    .filter((menu) => menu.roles.includes(role))
    .map((menu) => ({
      ...menu,
      children: menu.children?.filter((child) => child.roles.includes(role)),
    }));
};
