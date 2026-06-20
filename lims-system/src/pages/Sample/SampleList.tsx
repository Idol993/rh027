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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { Sample, SampleStatus } from '../../types';
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

const SampleList = () => {
  const samples = useStore((state) => state.samples);
  const [selectedRecord, setSelectedRecord] = useState<Sample | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [qrcodeModalOpen, setQrcodeModalOpen] = useState(false);

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
      width: 180,
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
            icon={<QrcodeOutlined />}
            onClick={() => handleQrcode(record)}
          >
            二维码
          </Button>
        </Space>
      ),
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
          scroll={{ x: 1400 }}
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
        width={700}
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
              <Descriptions.Item label="关联委托">{selectedRecord.entrustNo}</Descriptions.Item>
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
