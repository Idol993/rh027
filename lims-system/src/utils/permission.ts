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
    ],
  },
  {
    key: 'monitor',
    label: '大屏监控',
    icon: 'MonitorOutlined',
    path: '/monitor',
    roles: ['director', 'quality_manager'],
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
