import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Badge, Button } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FileDoneOutlined,
  MedicineBoxOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  MonitorOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { getMenusByRole, roleNames } from '../../utils/permission';
import './index.css';

const { Header, Sider, Content } = Layout;

const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  ExperimentOutlined: <ExperimentOutlined />,
  CheckCircleOutlined: <CheckCircleOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  FileDoneOutlined: <FileDoneOutlined />,
  MedicineBoxOutlined: <MedicineBoxOutlined />,
  ToolOutlined: <ToolOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  MonitorOutlined: <MonitorOutlined />,
  SettingOutlined: <SettingOutlined />,
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);

  const menus = currentUser ? getMenusByRole(currentUser.role) : [];

  const menuItems = menus.map((menu) => ({
    key: menu.path,
    icon: iconMap[menu.icon],
    label: menu.label,
    children: menu.children?.map((child) => ({
      key: child.path,
      label: child.label,
    })),
  }));

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    for (const menu of menus) {
      if (menu.path === path) return [menu.path];
      if (menu.children) {
        for (const child of menu.children) {
          if (child.path === path) return [child.path];
        }
      }
    }
    return ['/dashboard'];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    for (const menu of menus) {
      if (menu.children && menu.children.some((c) => c.path === path)) {
        return [menu.path];
      }
    }
    return [];
  };

  return (
    <Layout className="main-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="layout-sider"
        width={240}
      >
        <div className="logo">
          <div className="logo-icon-mini">
            <ExperimentOutlined />
          </div>
          {!collapsed && <span className="logo-text">LIMS 管理系统</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          className="layout-menu"
        />
      </Sider>
      <Layout>
        <Header className="layout-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger-btn"
          />
          <div className="header-right">
            <Space size={20}>
              <Badge count={5} size="small">
                <Button type="text" icon={<BellOutlined />} className="header-btn" />
              </Badge>
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space className="user-info">
                  <Avatar icon={<UserOutlined />} size="small" />
                  <span className="user-name">{currentUser?.name}</span>
                  <span className="user-role">{roleNames[currentUser?.role || 'tester']}</span>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        <Content className="layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
