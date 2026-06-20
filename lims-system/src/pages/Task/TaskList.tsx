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
  Form,
  InputNumber,
  message,
  Descriptions,
  Row,
  Col,
  Statistic,
  Divider,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  RetweetOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { TestTask, TaskStatus, TestResult } from '../../types';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

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
  const updateTask = useStore((state) => state.updateTask);
  const currentUser = useStore((state) => state.currentUser);
  const reagents = useStore((state) => state.reagents);
  const equipments = useStore((state) => state.equipments);
  const addReagentUsage = useStore((state) => state.addReagentUsage);

  const [selectedRecord, setSelectedRecord] = useState<TestTask | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [abnormalModalOpen, setAbnormalModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [abnormalForm] = Form.useForm();

  const filteredTasks = currentUser?.role === 'tester'
    ? tasks.filter((t) => t.testerId === currentUser.id)
    : tasks;

  const handleView = (record: TestTask) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleStartTest = (record: TestTask) => {
    const equipment = equipments.find((e) => e.id === record.equipmentId);
    if (equipment && (equipment.status === 'fault' || equipment.status === 'overdue' || equipment.status === 'maintenance')) {
      message.error(`设备状态异常（${statusMap[equipment.status as TaskStatus]?.text || equipment.status}），无法开始检测`);
      return;
    }

    updateTask(record.id, {
      status: 'in_progress',
      startTime: new Date().toLocaleString('zh-CN'),
    });
    message.success('检测已开始');
  };

  const handleSubmitResult = (record: TestTask) => {
    setSelectedRecord(record);
    form.resetFields();
    setResultModalOpen(true);
  };

  const handleResultSubmit = (values: any) => {
    if (!selectedRecord) return;

    const rawData = values.rawData
      .split(/[,，\s]+/)
      .filter((s: string) => s.trim() !== '')
      .map((s: string) => parseFloat(s.trim()))
      .filter((n: number) => !isNaN(n));

    const average = rawData.length > 0
      ? rawData.reduce((a: number, b: number) => a + b, 0) / rawData.length
      : 0;

    const rsd = rawData.length > 1
      ? (Math.sqrt(rawData.reduce((a: number, b: number) => a + (b - average) ** 2, 0) / (rawData.length - 1)) / average) * 100
      : 0;

    const resultValue = values.result ?? average;

    const limit = selectedRecord.testItem.limit;
    let isQualified = true;
    if (limit.includes('≤') || limit.includes('<=')) {
      const limitVal = parseFloat(limit.replace(/[≤<=]/g, '').trim());
      isQualified = resultValue <= limitVal;
    } else if (limit.includes('≥') || limit.includes('>=')) {
      const limitVal = parseFloat(limit.replace(/[≥>=]/g, '').trim());
      isQualified = resultValue >= limitVal;
    } else if (limit.includes('~') || limit.includes('-')) {
      const parts = limit.split(/[~-]/);
      const min = parseFloat(parts[0]);
      const max = parseFloat(parts[1]);
      isQualified = resultValue >= min && resultValue <= max;
    }

    const result: TestResult = {
      id: `RES${Date.now()}`,
      taskId: selectedRecord.id,
      value: resultValue,
      unit: selectedRecord.testItem.unit,
      result: isQualified ? 'qualified' : 'unqualified',
      rawData: rawData,
      average: average,
      deviation: values.deviation,
      rsd: parseFloat(rsd.toFixed(2)),
      environment: {
        temperature: values.temperature || 25,
        humidity: values.humidity || 50,
      },
      testTime: new Date().toLocaleString('zh-CN'),
      instrumentNo: selectedRecord.equipmentName,
      reagentBatch: values.reagentBatch || '',
      standardSubstance: values.standardSubstance || '',
      operator: currentUser?.name || '',
    };

    if (values.reagentId && values.reagentUsage) {
      addReagentUsage(values.reagentId, {
        reagentId: values.reagentId,
        quantity: values.reagentUsage,
        user: currentUser?.name || '',
        purpose: `${selectedRecord.testItem.name}检测`,
        sampleId: selectedRecord.sampleId,
        usedAt: new Date().toLocaleString('zh-CN'),
      });
    }

    if (!isQualified) {
      updateTask(selectedRecord.id, {
        status: 'abnormal',
        result,
        abnormal: true,
        abnormalReason: '检测结果不合格',
        endTime: new Date().toLocaleString('zh-CN'),
      });
      message.warning('检测结果不合格，任务已标记为异常');
    } else {
      updateTask(selectedRecord.id, {
        status: 'completed',
        result,
        abnormal: false,
        endTime: new Date().toLocaleString('zh-CN'),
      });
      message.success('检测结果提交成功');
    }

    setResultModalOpen(false);
  };

  const handleAbnormal = (record: TestTask) => {
    setSelectedRecord(record);
    abnormalForm.resetFields();
    setAbnormalModalOpen(true);
  };

  const handleAbnormalSubmit = (values: any) => {
    if (!selectedRecord) return;

    if (values.action === 'recheck') {
      updateTask(selectedRecord.id, {
        status: 'pending',
        abnormal: false,
        abnormalReason: values.reason,
        recheck: true,
        recheckCount: (selectedRecord.recheckCount || 0) + 1,
        startTime: undefined,
        endTime: undefined,
        result: undefined,
      });
      message.success('已安排复检，任务重新分配');
    } else if (values.action === 'approve') {
      updateTask(selectedRecord.id, {
        status: 'completed',
        abnormalReason: values.reason,
      });
      message.success('异常已确认，任务完成');
    } else if (values.action === 'reject') {
      updateTask(selectedRecord.id, {
        status: 'rejected',
        abnormalReason: values.reason,
      });
      message.success('任务已驳回');
    }

    setAbnormalModalOpen(false);
  };

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
      width: 120,
      render: (status: TaskStatus, record) => (
        <Space direction="vertical" size={4}>
          <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
          <Space size={4}>
            {record.recheck && <Tag color="orange" style={{ margin: 0 }}>复检</Tag>}
            {record.abnormal && <Tag color="red" style={{ margin: 0 }}>异常</Tag>}
          </Space>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" direction="vertical">
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
              onClick={() => handleStartTest(record)}
            >
              开始检测
            </Button>
          )}
          {record.status === 'in_progress' && currentUser?.role === 'tester' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleSubmitResult(record)}
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
              onClick={() => handleAbnormal(record)}
            >
              异常处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: filteredTasks.length,
    pending: filteredTasks.filter((t) => t.status === 'pending').length,
    inProgress: filteredTasks.filter((t) => t.status === 'in_progress').length,
    completed: filteredTasks.filter((t) => t.status === 'completed').length,
    abnormal: filteredTasks.filter((t) => t.abnormal).length,
  };

  const availableReagents = reagents.filter((r) => r.status !== 'expired' && r.status !== 'used_up' && r.quantity > 0);

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
        width={720}
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

            {selectedRecord.result && (
              <>
                <Divider />
                <Title level={5}>检测结果</Title>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="检测值">
                    <span style={{ fontWeight: 600 }}>
                      {selectedRecord.result.value} {selectedRecord.result.unit}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="结果判定">
                    <Tag color={selectedRecord.result.result === 'qualified' ? 'success' : 'error'}>
                      {selectedRecord.result.result === 'qualified' ? '合格' : '不合格'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="平均值">{selectedRecord.result.average}</Descriptions.Item>
                  <Descriptions.Item label="RSD(%)">{selectedRecord.result.rsd}</Descriptions.Item>
                  <Descriptions.Item label="环境温度">
                    {selectedRecord.result.environment.temperature}℃
                  </Descriptions.Item>
                  <Descriptions.Item label="环境湿度">
                    {selectedRecord.result.environment.humidity}%
                  </Descriptions.Item>
                  <Descriptions.Item label="检测时间">{selectedRecord.result.testTime}</Descriptions.Item>
                  <Descriptions.Item label="操作人员">{selectedRecord.result.operator}</Descriptions.Item>
                  <Descriptions.Item label="试剂批号">{selectedRecord.result.reagentBatch || '-'}</Descriptions.Item>
                  <Descriptions.Item label="标准物质">{selectedRecord.result.standardSubstance || '-'}</Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 8 }}>
                  <p style={{ marginBottom: 4 }}><b>原始数据：</b></p>
                  <div>
                    {selectedRecord.result.rawData.map((val, idx) => (
                      <Tag key={idx} color="blue">{val}</Tag>
                    ))}
                  </div>
                </div>
              </>
            )}

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
                  <RetweetOutlined /> 复检次数：{selectedRecord.recheckCount} 次
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="提交检测结果"
        open={resultModalOpen}
        onCancel={() => setResultModalOpen(false)}
        footer={null}
        width={600}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" onFinish={handleResultSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="result"
                label="检测结果值"
                rules={[{ required: true, message: '请输入检测结果' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请输入检测值" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deviation"
                label="偏差值"
              >
                <InputNumber style={{ width: '100%' }} placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="rawData"
            label="原始数据（多个用逗号分隔）"
            rules={[{ required: true, message: '请输入原始数据' }]}
          >
            <TextArea rows={2} placeholder="例如：25.3, 25.1, 25.5" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="temperature"
                label="环境温度(℃)"
                initialValue={25}
              >
                <InputNumber style={{ width: '100%' }} min={0} max={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="humidity"
                label="环境湿度(%)"
                initialValue={50}
              >
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reagentId"
                label="使用试剂"
              >
                <Select placeholder="请选择试剂" allowClear>
                  {availableReagents.map((r) => (
                    <Option key={r.id} value={r.id}>
                      {r.name}（批号：{r.batchNo}，库存：{r.quantity}{r.unit}）
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reagentUsage"
                label="使用量"
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入使用量" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="standardSubstance"
            label="标准物质"
          >
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交结果
              </Button>
              <Button onClick={() => setResultModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="异常处理"
        open={abnormalModalOpen}
        onCancel={() => setAbnormalModalOpen(false)}
        footer={null}
        width={500}
        maskClosable={false}
      >
        <Form form={abnormalForm} layout="vertical" onFinish={handleAbnormalSubmit}>
          <Form.Item
            name="action"
            label="处理方式"
            rules={[{ required: true, message: '请选择处理方式' }]}
          >
            <Select placeholder="请选择">
              <Option value="recheck">安排复检</Option>
              <Option value="approve">确认异常，任务通过</Option>
              <Option value="reject">驳回任务</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="异常原因/处理说明"
            rules={[{ required: true, message: '请输入原因说明' }]}
          >
            <TextArea rows={4} placeholder="请详细说明异常原因或处理意见..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认处理
              </Button>
              <Button onClick={() => setAbnormalModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskList;
