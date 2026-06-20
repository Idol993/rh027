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
  Timeline,
  Form,
  Input as AntInput,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  FileDoneOutlined,
  CheckOutlined,
  FileTextOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { Report, ReportStatus } from '../../types';

const { Option } = Select;
const { TextArea } = AntInput;

const statusMap: Record<ReportStatus, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  reviewing: { color: 'processing', text: '审核中' },
  level1_signed: { color: 'blue', text: '一级审核' },
  level2_signed: { color: 'purple', text: '二级审核' },
  issued: { color: 'success', text: '已签发' },
  voided: { color: 'error', text: '已作废' },
};

const ReportList = () => {
  const reports = useStore((state) => state.reports);
  const updateReportStatus = useStore((state) => state.updateReportStatus);
  const currentUser = useStore((state) => state.currentUser);
  const [selectedRecord, setSelectedRecord] = useState<Report | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signLevel, setSignLevel] = useState<1 | 2 | 3>(1);
  const [form] = Form.useForm();

  const columns: ColumnsType<Report> = [
    {
      title: '报告编号',
      dataIndex: 'reportNo',
      key: 'reportNo',
      width: 140,
      render: (text) => <a>{text}</a>,
    },
    {
      title: '关联委托',
      dataIndex: 'entrustNo',
      key: 'entrustNo',
      width: 140,
    },
    {
      title: '检测项目数',
      dataIndex: 'items',
      key: 'items',
      width: 100,
      render: (items) => items?.length || 0,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '签发时间',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      width: 160,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ReportStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<FileDoneOutlined />}
            >
              编辑
            </Button>
          )}
          {(record.status === 'draft' || record.status === 'reviewing') && currentUser?.role === 'tester' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleSign(record, 1)}
            >
              一级签名
            </Button>
          )}
          {record.status === 'level1_signed' && (currentUser?.role === 'reviewer' || currentUser?.role === 'quality_manager') && (
            <Button
              type="link"
              size="small"
              icon={<SafetyCertificateOutlined />}
              onClick={() => handleSign(record, 2)}
            >
              二级签名
            </Button>
          )}
          {record.status === 'level2_signed' && (currentUser?.role === 'quality_manager' || currentUser?.role === 'director') && (
            <Button
              type="link"
              size="small"
              icon={<SafetyCertificateOutlined />}
              onClick={() => handleSign(record, 3)}
            >
              批准签发
            </Button>
          )}
          {record.status === 'issued' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<DownloadOutlined />}
              >
                下载
              </Button>
              <Button
                type="link"
                size="small"
                icon={<PrinterOutlined />}
              >
                打印
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (record: Report) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleSign = (record: Report, level: 1 | 2 | 3) => {
    setSelectedRecord(record);
    setSignLevel(level);
    form.resetFields();
    setSignModalOpen(true);
  };

  const handleSignSubmit = (values: any) => {
    if (!selectedRecord) return;
    let nextStatus: ReportStatus = 'level1_signed';
    if (signLevel === 2) nextStatus = 'level2_signed';
    if (signLevel === 3) nextStatus = 'issued';
    
    updateReportStatus(selectedRecord.id, nextStatus, values);
    message.success(`第${signLevel}级签名成功`);
    setSignModalOpen(false);
  };

  const stats = {
    total: reports.length,
    draft: reports.filter((r) => r.status === 'draft').length,
    reviewing: reports.filter((r) => r.status === 'reviewing' || r.status === 'level1_signed' || r.status === 'level2_signed').length,
    issued: reports.filter((r) => r.status === 'issued').length,
  };

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="报告总数"
                  value={stats.total}
                  prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="草稿"
                  value={stats.draft}
                  prefix={<FileTextOutlined style={{ color: '#8c8c8c' }} />}
                  valueStyle={{ fontSize: 20, color: '#8c8c8c' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="审核中"
                  value={stats.reviewing}
                  prefix={<SafetyCertificateOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ fontSize: 20, color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="已签发"
                  value={stats.issued}
                  prefix={<FileDoneOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ fontSize: 20, color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <div className="search-bar" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="报告编号"
              prefix={<SearchOutlined />}
              style={{ width: 180 }}
            />
            <Input placeholder="委托单号" style={{ width: 160 }} />
            <Select placeholder="报告状态" style={{ width: 120 }} allowClear>
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
          dataSource={reports}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="报告详情"
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
              <Descriptions.Item label="报告编号" span={2}>
                <Space>
                  <span style={{ fontWeight: 600 }}>{selectedRecord.reportNo}</span>
                  <Tag color={statusMap[selectedRecord.status].color}>
                    {statusMap[selectedRecord.status].text}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="关联委托">{selectedRecord.entrustNo}</Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedRecord.createdBy}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedRecord.createdAt}</Descriptions.Item>
              <Descriptions.Item label="签发时间">{selectedRecord.issuedAt || '-'}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <h4>检测结果</h4>
              <Table
                dataSource={selectedRecord.items}
                size="small"
                pagination={false}
                rowKey={(record, index) => index?.toString() || ''}
                columns={[
                  { title: '样品编号', dataIndex: 'sampleSid', key: 'sampleSid', width: 140 },
                  { title: '检测项目', dataIndex: 'testItem', key: 'testItem' },
                  { title: '标准依据', dataIndex: 'standard', key: 'standard' },
                  { title: '限值', dataIndex: 'limit', key: 'limit' },
                  { title: '检测结果', dataIndex: 'result', key: 'result' },
                  { title: '单位', dataIndex: 'unit', key: 'unit' },
                  {
                    title: '结论',
                    dataIndex: 'conclusion',
                    key: 'conclusion',
                    render: (c) => (
                      <Tag color={c === 'qualified' ? 'success' : 'error'}>
                        {c === 'qualified' ? '合格' : '不合格'}
                      </Tag>
                    ),
                  },
                ]}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <h4>三级审核流程</h4>
              <Timeline>
                <Timeline.Item color={selectedRecord.level1Sign ? 'green' : 'gray'}>
                  <p style={{ margin: 0 }}>一级签名（检测员）</p>
                  {selectedRecord.level1Sign ? (
                    <p style={{ color: '#666', fontSize: 12, margin: 0 }}>
                      {selectedRecord.level1Sign.signer} | {selectedRecord.level1Sign.signTime}
                      <br />
                      意见：{selectedRecord.level1Sign.opinion}
                    </p>
                  ) : (
                    <p style={{ color: '#999', fontSize: 12, margin: 0 }}>待签名</p>
                  )}
                </Timeline.Item>
                <Timeline.Item color={selectedRecord.level2Sign ? 'green' : 'gray'}>
                  <p style={{ margin: 0 }}>二级审核（审核员）</p>
                  {selectedRecord.level2Sign ? (
                    <p style={{ color: '#666', fontSize: 12, margin: 0 }}>
                      {selectedRecord.level2Sign.signer} | {selectedRecord.level2Sign.signTime}
                      <br />
                      意见：{selectedRecord.level2Sign.opinion}
                    </p>
                  ) : (
                    <p style={{ color: '#999', fontSize: 12, margin: 0 }}>待审核</p>
                  )}
                </Timeline.Item>
                <Timeline.Item color={selectedRecord.level3Sign ? 'green' : 'gray'}>
                  <p style={{ margin: 0 }}>三级签发（授权签字人）</p>
                  {selectedRecord.level3Sign ? (
                    <p style={{ color: '#666', fontSize: 12, margin: 0 }}>
                      {selectedRecord.level3Sign.signer} | {selectedRecord.level3Sign.signTime}
                      <br />
                      意见：{selectedRecord.level3Sign.opinion}
                    </p>
                  ) : (
                    <p style={{ color: '#999', fontSize: 12, margin: 0 }}>待签发</p>
                  )}
                </Timeline.Item>
              </Timeline>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={`第${signLevel}级电子签名`}
        open={signModalOpen}
        onCancel={() => setSignModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSignSubmit}>
          <Form.Item
            name="opinion"
            label="签名意见"
            rules={[{ required: true, message: '请输入签名意见' }]}
          >
            <TextArea
              rows={4}
              placeholder={signLevel === 1 ? '请确认原始数据真实有效...' : signLevel === 2 ? '请审核检测方法和结果...' : '请确认报告合规有效...'}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认签名
              </Button>
              <Button onClick={() => setSignModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportList;
