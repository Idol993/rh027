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
  MedicineBoxOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { Reagent, ReagentStatus } from '../../types';

const { Option } = Select;

const statusMap: Record<ReagentStatus, { color: string; text: string }> = {
  in_stock: { color: 'success', text: '库存充足' },
  low_stock: { color: 'warning', text: '库存不足' },
  expiring: { color: 'orange', text: '临近有效期' },
  expired: { color: 'error', text: '已过期' },
  used_up: { color: 'default', text: '已用完' },
};

const ReagentList = () => {
  const reagents = useStore((state) => state.reagents);
  const [selectedRecord, setSelectedRecord] = useState<Reagent | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

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
      title: '证书编号',
      dataIndex: 'certificateNo',
      key: 'certificateNo',
      width: 140,
    },
    {
      title: '有效期至',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
    },
    {
      title: '库存状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const percent = (record.quantity / record.safetyStock) * 100;
        let status: ReagentStatus = 'in_stock';
        if (record.quantity === 0) status = 'used_up';
        else if (record.quantity < record.safetyStock) status = 'low_stock';
        return (
          <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
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
          <Button
            type="link"
            size="small"
          >
            领用
          </Button>
        </Space>
      ),
    },
  ];

  const handleView = (record: Reagent) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const stats = {
    total: reagents.length,
    inStock: reagents.filter((r) => r.quantity > r.safetyStock).length,
    lowStock: reagents.filter((r) => r.quantity > 0 && r.quantity <= r.safetyStock).length,
    expired: reagents.filter((r) => r.status === 'expired').length,
    expiring: reagents.filter((r) => r.status === 'expiring').length,
  };

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
                当前库存：{selectedRecord.quantity} {selectedRecord.unit} | 
                安全库存：{selectedRecord.safetyStock} {selectedRecord.unit}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReagentList;
