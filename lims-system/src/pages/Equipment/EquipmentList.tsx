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
  ToolOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { Equipment, EquipmentStatus } from '../../types';

const { Option } = Select;

const statusMap: Record<EquipmentStatus, { color: string; text: string }> = {
  normal: { color: 'success', text: '正常' },
  in_use: { color: 'processing', text: '使用中' },
  maintenance: { color: 'warning', text: '维护中' },
  calibrating: { color: 'blue', text: '校准中' },
  overdue: { color: 'error', text: '超期未检' },
  fault: { color: 'red', text: '故障' },
};

const EquipmentList = () => {
  const equipments = useStore((state) => state.equipments);
  const [selectedRecord, setSelectedRecord] = useState<Equipment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const columns: ColumnsType<Equipment> = [
    {
      title: '设备编号',
      dataIndex: 'equipmentNo',
      key: 'equipmentNo',
      width: 120,
      render: (text) => <a>{text}</a>,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 140,
    },
    {
      title: '生产厂家',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 150,
    },
    {
      title: '所属科室',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location',
      width: 140,
    },
    {
      title: '设备管理员',
      dataIndex: 'manager',
      key: 'manager',
      width: 100,
    },
    {
      title: '使用时长',
      key: 'usage',
      width: 120,
      render: (_, record) => `${record.usageHours} 小时`,
    },
    {
      title: '下次校准',
      dataIndex: 'nextCalibrationDate',
      key: 'nextCalibrationDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EquipmentStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      ),
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
            维修
          </Button>
        </Space>
      ),
    },
  ];

  const handleView = (record: Equipment) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const stats = {
    total: equipments.length,
    normal: equipments.filter((e) => e.status === 'normal' || e.status === 'in_use').length,
    maintenance: equipments.filter((e) => e.status === 'maintenance').length,
    fault: equipments.filter((e) => e.status === 'fault').length,
    overdue: equipments.filter((e) => e.status === 'overdue').length,
  };

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="设备总数"
                  value={stats.total}
                  prefix={<ToolOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="正常运行"
                  value={stats.normal}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ fontSize: 20, color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="维护中"
                  value={stats.maintenance}
                  prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ fontSize: 20, color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="故障"
                  value={stats.fault}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="超期未检"
                  value={stats.overdue}
                  prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ fontSize: 20, color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <div className="search-bar" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="设备编号/名称"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
            <Select placeholder="设备状态" style={{ width: 120 }} allowClear>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.text}
                </Option>
              ))}
            </Select>
            <Select placeholder="所属科室" style={{ width: 140 }} allowClear>
              <Option value="化学检测室">化学检测室</Option>
              <Option value="环境检测室">环境检测室</Option>
              <Option value="仪器分析室">仪器分析室</Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={equipments}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="设备详情"
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
              <Descriptions.Item label="设备编号" span={2}>
                <Space>
                  <span style={{ fontWeight: 600 }}>{selectedRecord.equipmentNo}</span>
                  <Tag color={statusMap[selectedRecord.status].color}>
                    {statusMap[selectedRecord.status].text}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="设备名称">{selectedRecord.name}</Descriptions.Item>
              <Descriptions.Item label="型号">{selectedRecord.model}</Descriptions.Item>
              <Descriptions.Item label="生产厂家">{selectedRecord.manufacturer}</Descriptions.Item>
              <Descriptions.Item label="所属科室">{selectedRecord.department}</Descriptions.Item>
              <Descriptions.Item label="存放位置">{selectedRecord.location}</Descriptions.Item>
              <Descriptions.Item label="设备管理员">{selectedRecord.manager}</Descriptions.Item>
              <Descriptions.Item label="使用时长">{selectedRecord.usageHours} 小时</Descriptions.Item>
              <Descriptions.Item label="上次校准">{selectedRecord.lastCalibrationDate}</Descriptions.Item>
              <Descriptions.Item label="下次校准">{selectedRecord.nextCalibrationDate}</Descriptions.Item>
              <Descriptions.Item label="校准周期">{selectedRecord.calibrationCycle} 天</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EquipmentList;
