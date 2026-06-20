import { useState } from 'react';
import { Form, Input, Button, Card, message, Select, Typography } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { roleNames } from '../../utils/permission';
import './index.css';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('director');
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const roleAccounts = [
    { role: 'director', username: 'director', name: '实验室主任' },
    { role: 'quality_manager', username: 'quality', name: '质量负责人' },
    { role: 'reviewer', username: 'reviewer', name: '审核员' },
    { role: 'tester', username: 'tester1', name: '检测员' },
  ];

  const handleSubmit = (values: { username: string; password: string }) => {
    setLoading(true);
    setTimeout(() => {
      const success = login(values.username, values.password);
      if (success) {
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error('用户名或密码错误');
      }
      setLoading(false);
    }, 500);
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    const account = roleAccounts.find((a) => a.role === role);
    if (account) {
      form.setFieldsValue({ username: account.username, password: '123456' });
    }
  };

  const [form] = Form.useForm();

  return (
    <div className="login-container">
      <div className="login-bg">
        <div className="bg-pattern"></div>
      </div>
      <Card className="login-card" bordered={false}>
        <div className="login-header">
          <div className="logo-icon">
            <ExperimentIcon />
          </div>
          <Title level={3} className="login-title">
            LIMS 实验室信息管理系统
          </Title>
          <Text type="secondary">第三方检测实验室全生命周期管理平台</Text>
        </div>

        <div className="role-selector">
          <Text type="secondary" className="role-label">
            快速选择角色登录：
          </Text>
          <div className="role-buttons">
            {roleAccounts.map((item) => (
              <Button
                key={item.role}
                type={selectedRole === item.role ? 'primary' : 'default'}
                size="small"
                onClick={() => handleRoleSelect(item.role)}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ username: 'director', password: '123456' }}
          className="login-form"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              icon={<LoginOutlined />}
              className="login-btn"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <Text type="secondary">
            默认密码：123456 | 符合 ISO17025 / CMA / CNAS 规范
          </Text>
        </div>
      </Card>
    </div>
  );
};

const ExperimentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 3H15M9 3V11L4 21H20L15 11V3M9 3H15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Login;
