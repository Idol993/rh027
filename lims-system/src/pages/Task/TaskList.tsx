import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  message,
  Descriptions,
  Row,
  Col,
  Statistic,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { TestTask, TaskStatus } from '../../types';

const { Option } = Select;

const statusMap: Record<TaskStatus, { color: string; text: string }> = {
  pending: { color: 'default', text: '待检测' },
  in_progress: { color: 'processing', text: '检测中' },
  completed: { color: 'success', text: '已完成' },
  reviewing: { color: 'warning', text: '审核中' },
  rejected: { color: 'error', text: '已驳回' },
  abnormal: { color: 'red', text: '异常' },
};

const TaskList = () => {
  const tasks = useStore((state) => state.tasks);
  const currentUser = useStore((state) => state.currentUser);
  const [selectedRecord, setSelectedRecord] = useState<TestTask | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const filteredTasks = currentUser?.role === 'tester'
    ? tasks.filter((t) => t.testerId === currentUser.id)
    : tasks;

  const columns: ColumnsType<TestTask> = [
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      width: 140,
      render: (text) => <a>{text}</a>,
    },
    {
      title: '样品编号',
      dataIndex: 'sampleSid',
      key: 'sampleSid',
      width: 160,
    },
    {
      title: '样品名称',
      dataIndex: 'sampleName',
      key: 'sampleName',
      width: 140,
    },
    {
      title: '检测项目',
      dataIndex: ['testItem', 'name'],
      key: 'testItem',
      width: 120,
    },
    {
      title: '检测方法',
      dataIndex: ['testItem', 'method'],
      key: 'method',
      width: 140,
    },
    {
      title: '检测员',
      dataIndex: 'tester',
      key: 'tester',
      width: 100,
    },
    {
      title: '仪器设备',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
      width: 180,
    },
    {
      title: '分配时间',
      dataIndex: 'assignTime',
      key: 'assignTime',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus, record) => (
        <Space>
          <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
          {record.recheck && <Tag color="orange">复检</Tag>}
          {record.abnormal && <Tag color="red">异常</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && currentUser?.role === 'tester' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
            >
              开始检测
            </Button>
          )}
          {record.status === 'in_progress' && currentUser?.role === 'tester' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
            >
              提交结果
            </Button>
          )}
          {record.abnormal && (currentUser?.role === 'quality_manager' || currentUser?.role === 'reviewer') && (
            <Button
              type="link"
              size="small"
              danger
              icon={<WarningOutlined />}
            >
              异常处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (record: TestTask) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const stats = {
    total: filteredTasks.length,
    pending: filteredTasks.filter((t) => t.status === 'pending').length,
    inProgress: filteredTasks.filter((t) => t.status === 'in_progress').length,
    completed: filteredTasks.filter((t) => t.status === 'completed').length,
    abnormal: filteredTasks.filter((t) => t.abnormal).length,
  };

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="任务总数"
                  value={stats.total}
                  prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="待检测"
                  value={stats.pending}
                  prefix={<PlayCircleOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ fontSize: 20, color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="检测中"
                  value={stats.inProgress}
                  prefix={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: 20, color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="已完成"
                  value={stats.completed}
                  prefix={<CheckOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ fontSize: 20, color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="异常数"
                  value={stats.abnormal}
                  prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <div className="search-bar" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="任务编号"
              prefix={<SearchOutlined />}
              style={{ width: 180 }}
            />
            <Input placeholder="样品编号" style={{ width: 160 }} />
            <Select placeholder="任务状态" style={{ width: 120 }} allowClear>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.text}
                </Option>
              ))}
            </Select>
            <Input placeholder="检测员" style={{ width: 120 }} />
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="任务详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="任务编号" span={2}>
                <Space>
                  <span style={{ fontWeight: 600 }}>{selectedRecord.taskNo}</span>
                  <Tag color={statusMap[selectedRecord.status].color}>
                    {statusMap[selectedRecord.status].text}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="样品编号">{selectedRecord.sampleSid}</Descriptions.Item>
              <Descriptions.Item label="样品名称">{selectedRecord.sampleName}</Descriptions.Item>
              <Descriptions.Item label="检测项目">{selectedRecord.testItem.name}</Descriptions.Item>
              <Descriptions.Item label="检测标准">{selectedRecord.testItem.standard}</Descriptions.Item>
              <Descriptions.Item label="限值要求">{selectedRecord.testItem.limit}</Descriptions.Item>
              <Descriptions.Item label="检测方法">{selectedRecord.testItem.method}</Descriptions.Item>
              <Descriptions.Item label="检测员">{selectedRecord.tester}</Descriptions.Item>
              <Descriptions.Item label="仪器设备">{selectedRecord.equipmentName}</Descriptions.Item>
              <Descriptions.Item label="所属科室">{selectedRecord.department}</Descriptions.Item>
              <Descriptions.Item label="分配时间">{selectedRecord.assignTime}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{selectedRecord.startTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="完成时间">{selectedRecord.endTime || '-'}</Descriptions.Item>
            </Descriptions>
            {selectedRecord.abnormal && (
              <div style={{ marginTop: 16, padding: 12, background: '#fff2f0', borderRadius: 4 }}>
                <p style={{ color: '#ff4d4f', fontWeight: 600, marginBottom: 4 }}>
                  <WarningOutlined /> 异常说明
                </p>
                <p style={{ margin: 0 }}>{selectedRecord.abnormalReason}</p>
              </div>
            )}
            {selectedRecord.recheck && (
              <div style={{ marginTop: 12, padding: 12, background: '#fff7e6', borderRadius: 4 }}>
                <p style={{ color: '#fa8c16', fontWeight: 600, marginBottom: 4 }}>
                  复检次数：{selectedRecord.recheckCount} 次
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaskList;
