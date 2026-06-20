import { useEffect, useRef } from 'react';
import { Row, Col, Tag, List, Space, Typography } from 'antd';
import {
  ExperimentOutlined,
  FileDoneOutlined,
  WarningOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import { useStore } from '../../store/useStore';
import './index.css';

const { Title, Text } = Typography;

const Monitor = () => {
  const dashboardStats = useStore((state) => state.dashboardStats);
  const tasks = useStore((state) => state.tasks);
  const equipments = useStore((state) => state.equipments);
  const samples = useStore((state) => state.samples);
  const reagents = useStore((state) => state.reagents);

  const trendChartRef = useRef<HTMLDivElement>(null);
  const workloadChartRef = useRef<HTMLDivElement>(null);
  const sampleStatusChartRef = useRef<HTMLDivElement>(null);
  const qcChartRef = useRef<HTMLDivElement>(null);
  const trendChart = useRef<echarts.ECharts | null>(null);
  const workloadChart = useRef<echarts.ECharts | null>(null);
  const sampleStatusChart = useRef<echarts.ECharts | null>(null);
  const qcChart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (trendChartRef.current) {
      trendChart.current = echarts.init(trendChartRef.current);
      trendChart.current.setOption({
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 20, 40, 0.9)',
          borderColor: '#1890ff',
          textStyle: { color: '#fff' },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: dashboardStats.sampleTrend.map((item) => item.date),
          axisLine: { lineStyle: { color: '#1890ff40' } },
          axisLabel: { color: '#91caff' },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#1890ff20' } },
          axisLabel: { color: '#91caff' },
        },
        series: [
          {
            data: dashboardStats.sampleTrend.map((item) => item.count),
            type: 'line',
            smooth: true,
            lineStyle: { color: '#1890ff', width: 3 },
            areaStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
                  { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
                ],
              },
            },
            itemStyle: { color: '#1890ff' },
          },
        ],
      });
    }

    if (workloadChartRef.current) {
      workloadChart.current = echarts.init(workloadChartRef.current);
      workloadChart.current.setOption({
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0, 20, 40, 0.9)',
          borderColor: '#52c41a',
          textStyle: { color: '#fff' },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#52c41a20' } },
          axisLabel: { color: '#95de64' },
        },
        yAxis: {
          type: 'category',
          data: dashboardStats.testerWorkload.map((item) => item.name),
          axisLine: { lineStyle: { color: '#52c41a40' } },
          axisLabel: { color: '#95de64' },
        },
        series: [
          {
            type: 'bar',
            data: dashboardStats.testerWorkload.map((item) => item.count),
            itemStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#52c41a' },
                  { offset: 1, color: '#95de64' },
                ],
              },
              borderRadius: [0, 4, 4, 0],
            },
            barWidth: '50%',
          },
        ],
      });
    }

    if (sampleStatusChartRef.current) {
      sampleStatusChart.current = echarts.init(sampleStatusChartRef.current);
      sampleStatusChart.current.setOption({
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0, 20, 40, 0.9)',
          borderColor: '#722ed1',
          textStyle: { color: '#fff' },
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: { color: '#d3adf7' },
        },
        series: [
          {
            name: '样品状态',
            type: 'pie',
            radius: ['50%', '75%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 6, borderColor: '#000c17', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: false } },
            data: [
              { value: dashboardStats.pendingSamples, name: '待检测', itemStyle: { color: '#faad14' } },
              { value: dashboardStats.inTestingSamples, name: '检测中', itemStyle: { color: '#1890ff' } },
              { value: dashboardStats.completedSamples, name: '已完成', itemStyle: { color: '#52c41a' } },
              { value: 32, name: '留样中', itemStyle: { color: '#722ed1' } },
              { value: dashboardStats.overdueSamples, name: '逾期', itemStyle: { color: '#ff4d4f' } },
            ],
          },
        ],
      });
    }

    if (qcChartRef.current) {
      qcChart.current = echarts.init(qcChartRef.current);
      qcChart.current.setOption({
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0, 20, 40, 0.9)',
          borderColor: '#fa8c16',
          textStyle: { color: '#fff' },
        },
        series: [
          {
            name: '质控状态',
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 100,
            splitNumber: 10,
            itemStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#52c41a' },
                  { offset: 1, color: '#1890ff' },
                ],
              },
            },
            progress: { show: true, width: 18 },
            pointer: { show: false },
            axisLine: { lineStyle: { width: 18, color: [[1, '#1890ff30']] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            title: { show: false },
            detail: {
              valueAnimation: true,
              fontSize: 32,
              fontWeight: 'bold',
              color: '#fff',
              offsetCenter: [0, '20%'],
              formatter: '{value}%',
            },
            data: [{ value: 95.8 }],
          },
        ],
      });
    }

    const handleResize = () => {
      trendChart.current?.resize();
      workloadChart.current?.resize();
      sampleStatusChart.current?.resize();
      qcChart.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      trendChart.current?.dispose();
      workloadChart.current?.dispose();
      sampleStatusChart.current?.dispose();
      qcChart.current?.dispose();
    };
  }, [dashboardStats]);

  const recentAbnormalTasks = tasks.filter((t) => t.abnormal).slice(0, 5);
  const warningEquipments = equipments.filter((e) => e.status === 'fault' || e.status === 'overdue');
  const warningReagents = reagents.filter((r) => r.status === 'expired' || r.status === 'expiring' || r.status === 'low_stock');

  return (
    <div className="monitor-page">
      <div className="monitor-header">
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          📊 实验室大屏驾驶舱
        </Title>
        <Text style={{ color: '#91caff' }}>
          实时监控 · 数据可视化 · 全流程追溯
        </Text>
      </div>

      <Row gutter={[16, 16]} className="monitor-stats">
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card monitor-stat">
            <div className="stat-icon stat-icon-blue">
              <ExperimentOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{dashboardStats.totalSamples}</div>
              <div className="stat-label">样品总量</div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card monitor-stat">
            <div className="stat-icon stat-icon-green">
              <FileDoneOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{dashboardStats.issuedReports}</div>
              <div className="stat-label">已签发报告</div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card monitor-stat">
            <div className="stat-icon stat-icon-orange">
              <WarningOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{dashboardStats.abnormalCount}</div>
              <div className="stat-label">异常数据</div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card monitor-stat">
            <div className="stat-icon stat-icon-purple">
              <ToolOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{dashboardStats.equipmentUtilization}%</div>
              <div className="stat-label">设备使用率</div>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <div className="monitor-card">
            <div className="card-title">
              <span className="title-bar"></span>
              样品登记趋势
            </div>
            <div ref={trendChartRef} style={{ height: 280 }} />
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="monitor-card">
            <div className="card-title">
              <span className="title-bar"></span>
              样品状态分布
            </div>
            <div ref={sampleStatusChartRef} style={{ height: 280 }} />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <div className="monitor-card">
            <div className="card-title">
              <span className="title-bar"></span>
              人员工作量统计
            </div>
            <div ref={workloadChartRef} style={{ height: 260 }} />
          </div>
        </Col>
        <Col xs={24} lg={6}>
          <div className="monitor-card">
            <div className="card-title">
              <span className="title-bar"></span>
              质控合格率
            </div>
            <div ref={qcChartRef} style={{ height: 200 }} />
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <Row>
                <Col span={12} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#52c41a', fontSize: 20, fontWeight: 600 }}>
                    {dashboardStats.qcStatus.inControl}
                  </div>
                  <div style={{ color: '#95de64', fontSize: 12 }}>在控</div>
                </Col>
                <Col span={12} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 600 }}>
                    {dashboardStats.qcStatus.outOfControl}
                  </div>
                  <div style={{ color: '#ffa39e', fontSize: 12 }}>失控</div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
        <Col xs={24} lg={6}>
          <div className="monitor-card">
            <div className="card-title">
              <span className="title-bar"></span>
              关键指标
            </div>
            <div className="kpi-list">
              <div className="kpi-item">
                <span className="kpi-label">报告及时率</span>
                <span className="kpi-value" style={{ color: '#52c41a' }}>
                  {dashboardStats.reportTimeliness}%
                </span>
              </div>
              <div className="kpi-item">
                <span className="kpi-label">不合格率</span>
                <span className="kpi-value" style={{ color: '#fa8c16' }}>
                  {dashboardStats.unqualifiedRate}%
                </span>
              </div>
              <div className="kpi-item">
                <span className="kpi-label">复检率</span>
                <span className="kpi-value" style={{ color: '#faad14' }}>
                  {dashboardStats.recheckRate}%
                </span>
              </div>
              <div className="kpi-item">
                <span className="kpi-label">设备故障数</span>
                <span className="kpi-value" style={{ color: '#ff4d4f' }}>
                  {dashboardStats.equipmentFaultCount} 台
                </span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <div className="monitor-card">
            <div className="card-title">
              <span className="title-bar warning"></span>
              异常任务预警
            </div>
            <List
              dataSource={recentAbnormalTasks}
              size="small"
              renderItem={(item) => (
                <List.Item className="warning-list-item">
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ color: '#fff' }}>{item.testItem.name}</span>
                        <Tag color="red" style={{ margin: 0 }}>异常</Tag>
                      </Space>
                    }
                    description={
                      <div style={{ color: '#ffa39e', fontSize: 12 }}>
                        {item.sampleSid} · {item.tester}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="monitor-card">
            <div className="card-title">
              <span className="title-bar warning"></span>
              设备状态预警
            </div>
            <List
              dataSource={warningEquipments}
              size="small"
              renderItem={(item) => (
                <List.Item className="warning-list-item">
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ color: '#fff' }}>{item.name}</span>
                        <Tag color={item.status === 'fault' ? 'red' : 'orange'} style={{ margin: 0 }}>
                          {item.status === 'fault' ? '故障' : '超期'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div style={{ color: '#ffd591', fontSize: 12 }}>
                        {item.equipmentNo} · {item.location}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="monitor-card">
            <div className="card-title">
              <span className="title-bar warning"></span>
              试剂耗材预警
            </div>
            <List
              dataSource={warningReagents}
              size="small"
              renderItem={(item) => (
                <List.Item className="warning-list-item">
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ color: '#fff' }}>{item.name}</span>
                        <Tag
                          color={
                            item.status === 'expired'
                              ? 'red'
                              : item.status === 'expiring'
                              ? 'orange'
                              : 'warning'
                          }
                          style={{ margin: 0 }}
                        >
                          {item.status === 'expired' ? '过期' : item.status === 'expiring' ? '临期' : '低库存'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div style={{ color: '#ffd591', fontSize: 12 }}>
                        批号：{item.batchNo} · 库存：{item.quantity}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Monitor;
