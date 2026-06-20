import { useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Space, Typography } from 'antd';
import {
  ExperimentOutlined,
  FileDoneOutlined,
  WarningOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import { useStore } from '../../store/useStore';
import './index.css';

const { Title, Text } = Typography;

const Dashboard = () => {
  const dashboardStats = useStore((state) => state.dashboardStats);
  const tasks = useStore((state) => state.tasks);
  const samples = useStore((state) => state.samples);
  const currentUser = useStore((state) => state.currentUser);

  const trendChartRef = useRef<HTMLDivElement>(null);
  const workloadChartRef = useRef<HTMLDivElement>(null);
  const trendChartInstance = useRef<echarts.ECharts | null>(null);
  const workloadChartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (trendChartRef.current) {
      trendChartInstance.current = echarts.init(trendChartRef.current);
      const option = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: dashboardStats.sampleTrend.map((item) => item.date),
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          axisLabel: { color: '#666' },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
          axisLabel: { color: '#666' },
        },
        series: [
          {
            data: dashboardStats.sampleTrend.map((item) => item.count),
            type: 'bar',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#1890ff' },
                  { offset: 1, color: '#69c0ff' },
                ],
              },
              borderRadius: [4, 4, 0, 0],
            },
            barWidth: '50%',
          },
        ],
      };
      trendChartInstance.current.setOption(option);
    }

    if (workloadChartRef.current) {
      workloadChartInstance.current = echarts.init(workloadChartRef.current);
      const option = {
        tooltip: { trigger: 'item' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
        },
        yAxis: {
          type: 'category',
          data: dashboardStats.testerWorkload.map((item) => item.name),
          axisLine: { lineStyle: { color: '#e8e8e8' } },
        },
        series: [
          {
            type: 'bar',
            data: dashboardStats.testerWorkload.map((item) => item.count),
            itemStyle: { color: '#52c41a', borderRadius: [0, 4, 4, 0] },
            barWidth: '60%',
          },
        ],
      };
      workloadChartInstance.current.setOption(option);
    }

    const handleResize = () => {
      trendChartInstance.current?.resize();
      workloadChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      trendChartInstance.current?.dispose();
      workloadChartInstance.current?.dispose();
    };
  }, [dashboardStats]);

  const recentTasks = tasks.slice(0, 5);
  const recentSamples = samples.slice(0, 5);

  const statusColorMap: Record<string, string> = {
    pending: 'default',
    in_progress: 'processing',
    completed: 'success',
    reviewing: 'warning',
    abnormal: 'error',
  };

  const statusTextMap: Record<string, string> = {
    pending: '待检测',
    in_progress: '检测中',
    completed: '已完成',
    reviewing: '审核中',
    abnormal: '异常',
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          工作台
        </Title>
        <Text type="secondary">
          欢迎回来，{currentUser?.name}！今天是 {new Date().toLocaleDateString('zh-CN')}
        </Text>
      </div>

      <Row gutter={[16, 16]} className="stats-cards">
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card stat-blue">
            <Statistic
              title="样品总量"
              value={dashboardStats.totalSamples}
              prefix={<ExperimentOutlined />}
              suffix="件"
            />
            <div className="stat-footer">
              <Tag color="blue">待检 {dashboardStats.pendingSamples}</Tag>
              <Tag color="processing">在检 {dashboardStats.inTestingSamples}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card stat-green">
            <Statistic
              title="报告数量"
              value={dashboardStats.totalReports}
              prefix={<FileDoneOutlined />}
              suffix="份"
            />
            <div className="stat-footer">
              <Tag color="success">已签发 {dashboardStats.issuedReports}</Tag>
              <Tag color="warning">待审核 {dashboardStats.pendingReviewReports}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card stat-orange">
            <Statistic
              title="异常数据"
              value={dashboardStats.abnormalCount}
              prefix={<WarningOutlined />}
              suffix="件"
            />
            <div className="stat-footer">
              <Text type="secondary">复检率</Text>
              <Text strong style={{ color: '#fa8c16' }}>
                {dashboardStats.recheckRate}%
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card stat-purple">
            <Statistic
              title="设备使用率"
              value={dashboardStats.equipmentUtilization}
              prefix={<ToolOutlined />}
              suffix="%"
              precision={1}
            />
            <div className="stat-footer">
              <Text type="secondary">设备总数</Text>
              <Text strong>{dashboardStats.equipmentCount} 台</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="样品登记趋势" className="chart-card">
            <div ref={trendChartRef} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="人员工作量统计" className="chart-card">
            <div ref={workloadChartRef} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="最近任务" extra={<a href="#/task/my">查看更多</a>} className="list-card">
            <List
              dataSource={recentTasks}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.testItem.name}</span>
                        <Tag color={statusColorMap[item.status]}>
                          {statusTextMap[item.status]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space size={16}>
                        <Text type="secondary">
                          <ClockCircleOutlined /> {item.sampleSid}
                        </Text>
                        <Text type="secondary">
                          <CheckCircleOutlined /> {item.tester}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近样品" extra={<a href="#/sample/list">查看更多</a>} className="list-card">
            <List
              dataSource={recentSamples}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space size={16}>
                        <Text type="secondary">
                          <ExperimentOutlined /> {item.sid}
                        </Text>
                        <Text type="secondary">
                          <ClockCircleOutlined /> {item.receiveTime}
                        </Text>
                      </Space>
                    }
                  />
                  <Tag color={item.status === 'completed' ? 'success' : item.status === 'in_testing' ? 'processing' : 'default'}>
                    {item.status === 'pending' ? '待检测' : item.status === 'in_testing' ? '检测中' : item.status === 'completed' ? '已完成' : '留样中'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
