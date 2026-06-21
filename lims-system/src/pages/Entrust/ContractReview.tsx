import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Descriptions,
  Divider,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { EntrustOrder, EntrustStatus } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusMap: Record<EntrustStatus, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  submitted: { color: 'processing', text: '已提交' },
  reviewing: { color: 'warning', text: '评审中' },
  approved: { color: 'success', text: '评审通过' },
  rejected: { color: 'error', text: '评审拒绝' },
};

const ContractReview = () => {
  const orders = useStore((state) => state.orders);
  const updateOrderStatus = useStore((state) => state.updateOrderStatus);
  const [selectedRecord, setSelectedRecord] = useState<EntrustOrder | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve');
  const [form] = Form.useForm();

  const reviewingOrders = orders.filter((o) => o.status === 'submitted' || o.status === 'reviewing');

  const columns: ColumnsType<EntrustOrder> = [
    {
      title: '委托单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (text) => <a>{text}</a>,
    },
    {
      title: '客户名称',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 200,
    },
    {
      title: '样品名称',
      dataIndex: 'sampleName',
      key: 'sampleName',
      width: 150,
    },
    {
      title: '检测项目数',
      dataIndex: 'testItems',
      key: 'testItems',
      width: 100,
      render: (items) => items?.length || 0,
    },
    {
      title: '依据标准',
      dataIndex: 'standards',
      key: 'standards',
      width: 180,
      render: (standards) => (
        <Space direction="vertical" size={2}>
          {standards?.slice(0, 2).map((s, i) => (
            <Tag key={i} color="blue" style={{ margin: 0 }}>
              {s}
            </Tag>
          ))}
          {standards?.length > 2 && <Text type="secondary">+{standards.length - 2}项</Text>}
        </Space>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EntrustStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
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
            查看
          </Button>
          {record.status === 'submitted' || record.status === 'reviewing' ? (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleReview(record, 'approve')}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReview(record, 'reject')}
              >
                拒绝
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  const handleView = (record: EntrustOrder) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleReview = (record: EntrustOrder, type: 'approve' | 'reject') => {
    setSelectedRecord(record);
    setReviewType(type);
    form.resetFields();
    setReviewModalOpen(true);
  };

  const handleSubmitReview = (values: any) => {
    if (!selectedRecord) return;
    const newStatus = reviewType === 'approve' ? 'approved' : 'rejected';
    updateOrderStatus(selectedRecord.id, newStatus, values.opinion);
    message.success(`评审${reviewType === 'approve' ? '通过' : '拒绝'}成功`);
    setReviewModalOpen(false);
  };

  return (
    <div>
      <Card title="合同评审" className="review-card">
        <div className="review-stats" style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={6}>
              <div className="stat-box">
                <SafetyCertificateOutlined className="stat-icon" />
                <div>
                  <div className="stat-value">{orders.length}</div>
                  <div className="stat-label">委托总数</div>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="stat-box stat-pending">
                <SafetyCertificateOutlined className="stat-icon" />
                <div>
                  <div className="stat-value">{reviewingOrders.length}</div>
                  <div className="stat-label">待评审</div>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="stat-box stat-success">
                <SafetyCertificateOutlined className="stat-icon" />
                <div>
                  <div className="stat-value">
                    {orders.filter((o) => o.status === 'approved').length}
                  </div>
                  <div className="stat-label">已通过</div>
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="stat-box stat-error">
                <SafetyCertificateOutlined className="stat-icon" />
                <div>
                  <div className="stat-value">
                    {orders.filter((o) => o.status === 'rejected').length}
                  </div>
                  <div className="stat-label">已拒绝</div>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={reviewingOrders}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="委托单详情"
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
              <Descriptions.Item label="委托单号">{selectedRecord.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedRecord.status].color}>
                  {statusMap[selectedRecord.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户名称">{selectedRecord.clientName}</Descriptions.Item>
              <Descriptions.Item label="样品名称">{selectedRecord.sampleName}</Descriptions.Item>
              <Descriptions.Item label="样品类型">{selectedRecord.sampleType}</Descriptions.Item>
              <Descriptions.Item label="规格型号">{selectedRecord.specModel}</Descriptions.Item>
              <Descriptions.Item label="数量">{selectedRecord.quantity}</Descriptions.Item>
              <Descriptions.Item label="截止日期">{selectedRecord.deadline}</Descriptions.Item>
              <Descriptions.Item label="报告方式">{selectedRecord.reportMethod}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedRecord.createdAt}</Descriptions.Item>
            </Descriptions>
            <Divider />
            <Title level={5}>检测项目</Title>
            <Table
              dataSource={selectedRecord.testItems}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '项目名称', dataIndex: 'name', key: 'name' },
                { title: '检测标准', dataIndex: 'standard', key: 'standard' },
                { title: '限值要求', dataIndex: 'limit', key: 'limit' },
                { title: '检测方法', dataIndex: 'method', key: 'method' },
              ]}
            />
            {selectedRecord.reviewOpinion && (
              <>
                <Divider />
                <Title level={5}>评审意见</Title>
                <p>{selectedRecord.reviewOpinion}</p>
                <p>
                  <Text type="secondary">
                    评审人：{selectedRecord.reviewedBy} | 评审时间：{selectedRecord.reviewedAt}
                  </Text>
                </p>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={reviewType === 'approve' ? '评审通过' : '评审拒绝'}
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitReview}>
          <Form.Item
            name="opinion"
            label="评审意见"
            rules={[{ required: true, message: '请输入评审意见' }]}
          >
            <TextArea
              rows={4}
              placeholder={
                reviewType === 'approve'
                  ? '请输入评审通过意见...'
                  : '请输入评审拒绝原因...'
              }
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
              <Button onClick={() => setReviewModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractReview;
