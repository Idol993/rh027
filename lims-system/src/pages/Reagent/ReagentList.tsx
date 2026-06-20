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
  Progress,
  Tabs,
  List,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { Reagent, ReagentStatus, ReagentUsage } from '../../types';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const statusMap: Record<ReagentStatus, { color: string; text: string }> = {
  in_stock: { color: 'success', text: '库存充足' },
  low_stock: { color: 'warning', text: '库存不足' },
  expiring: { color: 'orange', text: '临近有效期' },
  expired: { color: 'error', text: '已过期' },
  used_up: { color: 'default', text: '已用完' },
};

const ReagentList = () => {
  const reagents = useStore((state) => state.reagents);
  const updateReagent = useStore((state) => state.updateReagent);
  const addReagentUsage = useStore((state) => state.addReagentUsage);
  const currentUser = useStore((state) => state.currentUser);
  const samples = useStore((state) => state.samples);

  const [selectedRecord, setSelectedRecord] = useState<Reagent | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [form] = Form.useForm();

  const allUsageRecords: (ReagentUsage & { reagentName: string; batchNo: string })[] = [];
  reagents.forEach((r) => {
    r.usageRecords?.forEach((u) => {
      allUsageRecords.push({
        ...u,
        reagentName: r.name,
        batchNo: r.batchNo,
      });
    });
  });
  allUsageRecords.sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime());

  const columns: ColumnsType<Reagent> = [
    {
      title: '试剂名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => <a>{text}</a>,
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 120,
    },
    {
      title: '浓度/规格',
      key: 'spec',
      width: 160,
      render: (_, record) => `${record.concentration} / ${record.specification}`,
    },
    {
      title: '库存数量',
      key: 'quantity',
      width: 100,
      render: (_, record) => (
        <Space>
          <span style={{ fontWeight: 600 }}>{record.quantity}</span>
          <span style={{ color: '#999' }}>{record.unit}</span>
        </Space>
      ),
    },
    {
      title: '生产厂家',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 180,
    },
    {
      title: '有效期至',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
    },
    {
      title: '存储条件',
      dataIndex: 'storageCondition',
      key: 'storageCondition',
      width: 140,
    },
    {
      title: '库存状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        let status: ReagentStatus = 'in_stock';
        if (record.quantity === 0) status = 'used_up';
        else if (record.quantity < record.safetyStock) status = 'low_stock';
        else if (record.status === 'expired') status = 'expired';
        else if (record.status === 'expiring') status = 'expiring';
        return <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const canUse = record.status !== 'expired' && record.status !== 'used_up' && record.quantity > 0;
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
            {canUse && (
              <Button
                type="link"
                size="small"
                icon={<ShoppingOutlined />}
                onClick={() => handleUse(record)}
              >
                领用
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const usageColumns: ColumnsType<ReagentUsage & { reagentName: string; batchNo: string }> = [
    {
      title: '试剂名称',
      dataIndex: 'reagentName',
      key: 'reagentName',
      width: 160,
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 100,
    },
    {
      title: '使用量',
      key: 'quantity',
      width: 80,
      render: (_, record) => `${record.quantity}`,
    },
    {
      title: '领用人',
      dataIndex: 'user',
      key: 'user',
      width: 100,
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
    },
    {
      title: '关联样品',
      key: 'sample',
      width: 140,
      render: (_, record) => {
        const sample = samples.find((s) => s.id === record.sampleId);
        return sample ? sample.sid : '-';
      },
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      key: 'usedAt',
      width: 160,
    },
  ];

  const handleView = (record: Reagent) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleUse = (record: Reagent) => {
    if (record.status === 'expired') {
      message.error('该试剂已过期，禁止领用');
      return;
    }
    if (record.quantity <= 0) {
      message.error('该试剂库存不足');
      return;
    }
    setSelectedRecord(record);
    form.resetFields();
    setUseModalOpen(true);
  };

  const handleUseSubmit = (values: any) => {
    if (!selectedRecord) return;
    if (values.quantity > selectedRecord.quantity) {
      message.error('领用数量不能超过库存');
      return;
    }

    addReagentUsage(selectedRecord.id, {
      reagentId: selectedRecord.id,
      quantity: values.quantity,
      user: currentUser?.name || '',
      purpose: values.purpose,
      sampleId: values.sampleId,
      usedAt: new Date().toLocaleString('zh-CN'),
    });

    message.success('领用成功');
    setUseModalOpen(false);
  };

  const stats = {
    total: reagents.length,
    inStock: reagents.filter((r) => r.quantity > r.safetyStock).length,
    lowStock: reagents.filter((r) => r.quantity > 0 && r.quantity <= r.safetyStock).length,
    expired: reagents.filter((r) => r.status === 'expired').length,
    expiring: reagents.filter((r) => r.status === 'expiring').length,
  };

  const tabItems = [
    {
      key: 'list',
      label: '试剂库存',
      children: (
        <div>
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Input
                placeholder="试剂名称"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
              />
              <Input placeholder="批号" style={{ width: 140 }} />
              <Select placeholder="状态" style={{ width: 120 }} allowClear>
                {Object.entries(statusMap).map(([key, val]) => (
                  <Option key={key} value={key}>
                    {val.text}
                  </Option>
                ))}
              </Select>
              <Button type="primary" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button>重置</Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={reagents}
            rowKey="id"
            scroll={{ x: 1300 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </div>
      ),
    },
    {
      key: 'usage',
      label: '使用记录',
      children: (
        <Table
          columns={usageColumns}
          dataSource={allUsageRecords}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="试剂总数"
                  value={stats.total}
                  prefix={<MedicineBoxOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="库存充足"
                  value={stats.inStock}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ fontSize: 20, color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="库存不足"
                  value={stats.lowStock}
                  prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ fontSize: 20, color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="临期试剂"
                  value={stats.expiring}
                  prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ fontSize: 20, color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="过期试剂"
                  value={stats.expired}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="试剂详情"
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
              <Descriptions.Item label="试剂名称" span={2}>
                <span style={{ fontWeight: 600 }}>{selectedRecord.name}</span>
              </Descriptions.Item>
              <Descriptions.Item label="批号">{selectedRecord.batchNo}</Descriptions.Item>
              <Descriptions.Item label="浓度">{selectedRecord.concentration}</Descriptions.Item>
              <Descriptions.Item label="规格">{selectedRecord.specification}</Descriptions.Item>
              <Descriptions.Item label="库存数量">
                {selectedRecord.quantity} {selectedRecord.unit}
              </Descriptions.Item>
              <Descriptions.Item label="安全库存">
                {selectedRecord.safetyStock} {selectedRecord.unit}
              </Descriptions.Item>
              <Descriptions.Item label="生产厂家">{selectedRecord.manufacturer}</Descriptions.Item>
              <Descriptions.Item label="证书编号">{selectedRecord.certificateNo}</Descriptions.Item>
              <Descriptions.Item label="存储条件">{selectedRecord.storageCondition}</Descriptions.Item>
              <Descriptions.Item label="入库日期">{selectedRecord.inStockDate}</Descriptions.Item>
              <Descriptions.Item label="有效期至">
                <Tag color={selectedRecord.status === 'expired' ? 'error' : 'success'}>
                  {selectedRecord.expiryDate}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="库存状态">
                <Tag color={statusMap[selectedRecord.status].color}>
                  {statusMap[selectedRecord.status].text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <h4>库存进度</h4>
              <Progress
                percent={Math.min(100, (selectedRecord.quantity / (selectedRecord.safetyStock * 2)) * 100)}
                status={selectedRecord.quantity < selectedRecord.safetyStock ? 'exception' : 'active'}
              />
              <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                当前库存：{selectedRecord.quantity} {selectedRecord.unit} | 安全库存：
                {selectedRecord.safetyStock} {selectedRecord.unit}
              </p>
            </div>

            {selectedRecord.usageRecords && selectedRecord.usageRecords.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Title level={5}>领用记录</Title>
                <Table
                  dataSource={selectedRecord.usageRecords}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '使用量', dataIndex: 'quantity', key: 'quantity', width: 80, render: (v) => `${v} ${selectedRecord.unit}` },
                    { title: '领用人', dataIndex: 'user', key: 'user', width: 100 },
                    { title: '用途', dataIndex: 'purpose', key: 'purpose' },
                    {
                      title: '关联样品',
                      key: 'sample',
                      width: 140,
                      render: (_, record) => {
                        const sample = samples.find((s) => s.id === record.sampleId);
                        return sample ? sample.sid : '-';
                      },
                    },
                    { title: '使用时间', dataIndex: 'usedAt', key: 'usedAt', width: 160 },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="试剂领用"
        open={useModalOpen}
        onCancel={() => setUseModalOpen(false)}
        footer={null}
        width={500}
        maskClosable={false}
      >
        {selectedRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <p style={{ margin: 0 }}>
              <b>{selectedRecord.name}</b>（批号：{selectedRecord.batchNo}）
            </p>
            <p style={{ margin: 0, color: '#666' }}>
              当前库存：{selectedRecord.quantity} {selectedRecord.unit}
            </p>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleUseSubmit}>
          <Form.Item
            name="quantity"
            label="领用数量"
            rules={[{ required: true, message: '请输入领用数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入领用数量" />
          </Form.Item>
          <Form.Item
            name="sampleId"
            label="关联样品"
          >
            <Select placeholder="请选择关联样品（可选）" allowClear>
              {samples.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.sid} - {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="purpose"
            label="用途说明"
            rules={[{ required: true, message: '请输入用途' }]}
          >
            <TextArea rows={3} placeholder="请输入领用用途..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认领用
              </Button>
              <Button onClick={() => setUseModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReagentList;
