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
  message,
  Descriptions,
  Row,
  Col,
  Statistic,
  List,
  Avatar,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  QrcodeOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { Sample, SampleStatus, TestItem, User, Equipment } from '../../types';
import { QRCodeSVG } from 'qrcode.react';

const { Option } = Select;

const statusMap: Record<SampleStatus, { color: string; text: string }> = {
  pending: { color: 'default', text: '待检测' },
  in_testing: { color: 'processing', text: '检测中' },
  completed: { color: 'success', text: '已完成' },
  retained: { color: 'blue', text: '留样中' },
  destroyed: { color: 'default', text: '已销毁' },
  returned: { color: 'warning', text: '已退回' },
};

interface TaskAssignItem {
  testItem: TestItem;
  testerId: string;
  testerName: string;
  equipmentId: string;
  equipmentName: string;
}

const SampleList = () => {
  const samples = useStore((state) => state.samples);
  const addTasks = useStore((state) => state.addTasks);
  const updateSampleStatus = useStore((state) => state.updateSampleStatus);
  const users = useStore((state) => state.users);
  const equipments = useStore((state) => state.equipments);
  const tasks = useStore((state) => state.tasks);
  const currentUser = useStore((state) => state.currentUser);

  const [selectedRecord, setSelectedRecord] = useState<Sample | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [qrcodeModalOpen, setQrcodeModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm] = Form.useForm();
  const [taskAssigns, setTaskAssigns] = useState<TaskAssignItem[]>([]);

  const availableEquipments = equipments.filter(
    (e) => !['fault', 'faulty', 'maintenance', 'calibration_due', 'overdue'].includes(e.status)
  );

  const testers = users.filter((u) => ['tester', 'reviewer'].includes(u.role));

  const columns: ColumnsType<Sample> = [
    {
      title: '样品编号',
      dataIndex: 'sid',
      key: 'sid',
      width: 160,
      render: (text) => (
        <Space>
          <QrcodeOutlined style={{ color: '#1890ff' }} />
          <a>{text}</a>
        </Space>
      ),
    },
    {
      title: '样品名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '样品类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: '规格型号',
      dataIndex: 'specModel',
      key: 'specModel',
      width: 120,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '关联委托',
      dataIndex: 'entrustNo',
      key: 'entrustNo',
      width: 140,
    },
    {
      title: '检测项目数',
      dataIndex: 'testItems',
      key: 'testItems',
      width: 110,
      render: (items) => items?.length || 0,
    },
    {
      title: '存放位置',
      dataIndex: 'storageLocation',
      key: 'storageLocation',
      width: 140,
    },
    {
      title: '接收人',
      dataIndex: 'receiver',
      key: 'receiver',
      width: 100,
    },
    {
      title: '接收时间',
      dataIndex: 'receiveTime',
      key: 'receiveTime',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SampleStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const relatedTasks = tasks.filter((t) => t.sampleId === record.id);
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              详情
            </Button>
            <Button
              type="link"
              size="small"
              icon={<QrcodeOutlined />}
              onClick={() => handleQrcode(record)}
            >
              二维码
            </Button>
            {record.status === 'pending' && (
              <Button
                type="link"
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => handleAssign(record)}
              >
                分样分配
              </Button>
            )}
            {record.status === 'in_testing' && (
              <Tag color="blue">{relatedTasks.length} 个任务</Tag>
            )}
          </Space>
        );
      },
    },
  ];

  const handleView = (record: Sample) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleQrcode = (record: Sample) => {
    setSelectedRecord(record);
    setQrcodeModalOpen(true);
  };

  const handleAssign = (record: Sample) => {
    if (!record.testItems || record.testItems.length === 0) {
      message.error('该样品没有检测项目，无法分配任务');
      return;
    }
    setSelectedRecord(record);
    const initialAssigns: TaskAssignItem[] = record.testItems.map((item) => ({
      testItem: item,
      testerId: '',
      testerName: '',
      equipmentId: '',
      equipmentName: '',
    }));
    setTaskAssigns(initialAssigns);
    assignForm.resetFields();
    setAssignModalOpen(true);
  };

  const handleTesterChange = (index: number, value: string) => {
    const user = users.find((u) => u.id === value);
    const newAssigns = [...taskAssigns];
    newAssigns[index].testerId = value;
    newAssigns[index].testerName = user?.name || '';
    setTaskAssigns(newAssigns);
  };

  const handleEquipmentChange = (index: number, value: string) => {
    const equip = equipments.find((e) => e.id === value);
    const newAssigns = [...taskAssigns];
    newAssigns[index].equipmentId = value;
    newAssigns[index].equipmentName = equip?.name || '';
    setTaskAssigns(newAssigns);
  };

  const handleAssignSubmit = () => {
    if (!selectedRecord) return;

    const invalid = taskAssigns.find(
      (t) => !t.testerId || !t.equipmentId
    );
    if (invalid) {
      message.error('请为所有检测项目分配检测员和设备');
      return;
    }

    const newTasks = taskAssigns.map((t) => ({
      sampleId: selectedRecord.id,
      sampleSid: selectedRecord.sid,
      sampleName: selectedRecord.name,
      entrustId: selectedRecord.entrustId,
      entrustNo: selectedRecord.entrustNo,
      testItem: t.testItem,
      status: 'pending' as const,
      tester: t.testerName,
      testerId: t.testerId,
      equipmentId: t.equipmentId,
      equipmentName: t.equipmentName,
      department: currentUser?.department || '',
      assignTime: new Date().toLocaleString('zh-CN'),
    }));

    addTasks(newTasks);
    updateSampleStatus(selectedRecord.id, 'in_testing');
    message.success(`成功生成 ${newTasks.length} 条检测任务，样品已进入检测中状态`);
    setAssignModalOpen(false);
  };

  return (
    <div>
      <Card>
        <div className="sample-stats" style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Card size="small" className="stat-mini">
                <Statistic
                  title="样品总数"
                  value={samples.length}
                  prefix={<ExperimentOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" className="stat-mini">
                <Statistic
                  title="待检测"
                  value={samples.filter((s) => s.status === 'pending').length}
                  prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ fontSize: 20, color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" className="stat-mini">
                <Statistic
                  title="检测中"
                  value={samples.filter((s) => s.status === 'in_testing').length}
                  prefix={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: 20, color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" className="stat-mini">
                <Statistic
                  title="已完成"
                  value={samples.filter((s) => s.status === 'completed').length}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ fontSize: 20, color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" className="stat-mini">
                <Statistic
                  title="留样中"
                  value={samples.filter((s) => s.status === 'retained').length}
                  prefix={<FileDoneOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ fontSize: 20, color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" className="stat-mini">
                <Statistic
                  title="留样到期"
                  value={2}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <div className="search-bar" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="样品编号/名称"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
            <Select placeholder="样品状态" style={{ width: 120 }} allowClear>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.text}
                </Option>
              ))}
            </Select>
            <Input placeholder="委托单号" style={{ width: 160 }} />
            <Input placeholder="接收人" style={{ width: 120 }} />
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={samples}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="样品详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="样品编号" span={2}>
                <Space>
                  <span style={{ fontWeight: 600, color: '#1890ff' }}>
                    {selectedRecord.sid}
                  </span>
                  <Tag color={statusMap[selectedRecord.status].color}>
                    {statusMap[selectedRecord.status].text}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="样品名称">{selectedRecord.name}</Descriptions.Item>
              <Descriptions.Item label="样品类型">{selectedRecord.type}</Descriptions.Item>
              <Descriptions.Item label="规格型号">{selectedRecord.specModel}</Descriptions.Item>
              <Descriptions.Item label="数量">{selectedRecord.quantity}</Descriptions.Item>
              <Descriptions.Item label="外观描述">{selectedRecord.appearance}</Descriptions.Item>
              <Descriptions.Item label="包装方式">{selectedRecord.packaging}</Descriptions.Item>
              <Descriptions.Item label="关联委托">
                <a>{selectedRecord.entrustNo}</a>
              </Descriptions.Item>
              <Descriptions.Item label="存放位置">{selectedRecord.storageLocation}</Descriptions.Item>
              <Descriptions.Item label="接收人">{selectedRecord.receiver}</Descriptions.Item>
              <Descriptions.Item label="接收时间">{selectedRecord.receiveTime}</Descriptions.Item>
              <Descriptions.Item label="留样天数">{selectedRecord.retainDays} 天</Descriptions.Item>
              <Descriptions.Item label="留样到期">{selectedRecord.expireTime}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <h4>检测项目</h4>
              {selectedRecord.testItems.map((item, index) => (
                <Tag key={index} color="blue" style={{ marginBottom: 8 }}>
                  {item.name}
                </Tag>
              ))}
            </div>
            {selectedRecord.status !== 'pending' && (
              <div style={{ marginTop: 16 }}>
                <h4>关联检测任务</h4>
                <List
                  size="small"
                  dataSource={tasks.filter((t) => t.sampleId === selectedRecord.id)}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<ExperimentOutlined />} />}
                        title={
                          <Space>
                            <span>{item.taskNo}</span>
                            <Tag color="blue">{item.testItem.name}</Tag>
                          </Space>
                        }
                        description={
                          <Space split="|">
                            <span>检测员：{item.tester}</span>
                            <span>设备：{item.equipmentName}</span>
                            <span>状态：<Tag color={item.status === 'completed' ? 'success' : item.status === 'in_progress' ? 'processing' : 'default'}>
                              {item.status}
                            </Tag></span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="分样与任务分配"
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setAssignModalOpen(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleAssignSubmit}>
            确认分配
          </Button>,
        ]}
        width={900}
        maskClosable={false}
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f7ff', borderRadius: 4 }}>
              <p style={{ margin: 0, color: '#1890ff', fontWeight: 600 }}>
                {selectedRecord.sid} - {selectedRecord.name}
              </p>
              <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                委托单号：{selectedRecord.entrustNo} | 样品数量：{selectedRecord.quantity}
              </p>
            </div>

            <div style={{ fontWeight: 600, margin: '16px 0 12px 0', fontSize: 15, borderLeft: '3px solid #1890ff', paddingLeft: 8 }}>
              按检测项目分配任务
            </div>

            {taskAssigns.map((assign, index) => (
              <Card
                key={assign.testItem.id}
                size="small"
                style={{ marginBottom: 12 }}
                title={
                  <Space>
                    <Tag color="blue">{index + 1}</Tag>
                    <span style={{ fontWeight: 600 }}>{assign.testItem.name}</span>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      标准：{assign.testItem.standard} | 限值：{assign.testItem.limit}
                    </span>
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>
                      <TeamOutlined /> 检测员
                    </div>
                    <Select
                      placeholder="请选择检测员"
                      style={{ width: '100%' }}
                      value={assign.testerId || undefined}
                      onChange={(v) => handleTesterChange(index, v)}
                    >
                      {testers.map((u) => (
                        <Option key={u.id} value={u.id}>
                          {u.name} - {u.department}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>
                      <ToolOutlined /> 检测设备
                    </div>
                    <Select
                      placeholder="请选择设备"
                      style={{ width: '100%' }}
                      value={assign.equipmentId || undefined}
                      onChange={(v) => handleEquipmentChange(index, v)}
                    >
                      {availableEquipments.map((e) => (
                        <Option key={e.id} value={e.id}>
                          {e.name} - {e.model} ({e.equipmentNo})
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
              </Card>
            ))}

            <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
              共 {taskAssigns.length} 个检测项目，将生成对应数量的检测任务
            </p>
          </div>
        )}
      </Modal>

      <Modal
        title="样品二维码"
        open={qrcodeModalOpen}
        onCancel={() => setQrcodeModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setQrcodeModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {selectedRecord && (
            <>
              <div style={{ display: 'inline-block', padding: 20, background: 'white', border: '1px solid #eee' }}>
                <QRCodeSVG
                  value={JSON.stringify({
                    sid: selectedRecord.sid,
                    name: selectedRecord.name,
                    type: selectedRecord.type,
                  })}
                  size={200}
                  level="H"
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                  {selectedRecord.name}
                </p>
                <p style={{ color: '#666' }}>{selectedRecord.sid}</p>
              </div>
              <Button type="primary" style={{ marginTop: 16 }}>
                打印标签
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SampleList;
