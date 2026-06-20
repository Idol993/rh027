import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Col,
  Descriptions,
  Divider,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { EntrustOrder, EntrustStatus, TestItem } from '../../types';
import { mockTestItems } from '../../mock/data';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

const statusMap: Record<EntrustStatus, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  submitted: { color: 'processing', text: '已提交' },
  reviewing: { color: 'warning', text: '评审中' },
  approved: { color: 'success', text: '评审通过' },
  rejected: { color: 'error', text: '评审拒绝' },
};

const EntrustList = () => {
  const orders = useStore((state) => state.orders);
  const addOrder = useStore((state) => state.addOrder);
  const updateOrder = useStore((state) => state.updateOrder);
  const deleteOrder = useStore((state) => state.deleteOrder);
  const updateOrderStatus = useStore((state) => state.updateOrderStatus);
  const clients = useStore((state) => state.clients);
  const currentUser = useStore((state) => state.currentUser);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EntrustOrder | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [form] = Form.useForm();

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
      title: '样品类型',
      dataIndex: 'sampleType',
      key: 'sampleType',
      width: 100,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (text, record) => `${text} ${record.specModel}`,
    },
    {
      title: '检测项目数',
      dataIndex: 'testItems',
      key: 'testItems',
      width: 100,
      render: (items) => items?.length || 0,
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
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
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmitReview(record.id)}
              >
                送审
              </Button>
              <Popconfirm
                title="确定要删除该委托单吗？"
                description="删除后不可恢复"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'submitted' && (
            <Button
              type="link"
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => handleSendToReview(record.id)}
            >
              提交评审
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (record: EntrustOrder) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleEdit = (record: EntrustOrder) => {
    setSelectedRecord(record);
    form.setFieldsValue({
      ...record,
      deadline: dayjs(record.deadline),
      testItemIds: record.testItems?.map((t) => t.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteOrder(id);
    message.success('委托单删除成功');
  };

  const handleSubmitReview = (id: string) => {
    updateOrderStatus(id, 'submitted');
    message.success('委托单已提交，等待评审');
  };

  const handleSendToReview = (id: string) => {
    updateOrderStatus(id, 'reviewing');
    message.success('已进入评审流程');
  };

  const handleSubmit = (values: any) => {
    const selectedItems = mockTestItems.filter((item) =>
      values.testItemIds?.includes(item.id)
    );
    const standards = [...new Set(selectedItems.map((item) => item.standard))];

    const client = clients.find((c) => c.id === values.clientId);

    const orderData = {
      clientId: values.clientId,
      clientName: client?.name || '',
      sampleName: values.sampleName,
      sampleType: values.sampleType,
      specModel: values.specModel,
      quantity: values.quantity,
      testItems: selectedItems,
      standards: standards,
      deadline: values.deadline.format('YYYY-MM-DD'),
      reportMethod: values.reportMethod,
      status: 'draft' as EntrustStatus,
      createdBy: currentUser?.name || '系统管理员',
    };

    if (selectedRecord) {
      updateOrder(selectedRecord.id, orderData);
      message.success('委托单更新成功');
    } else {
      addOrder(orderData);
      message.success('委托单创建成功');
    }
    setIsModalOpen(false);
  };

  return (
    <div>
      <Card
        title="委托列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建委托
          </Button>
        }
      >
        <div className="search-bar" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="委托单号"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
            <Input placeholder="客户名称" style={{ width: 160 }} />
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.text}
                </Option>
              ))}
            </Select>
            <RangePicker style={{ width: 260 }} />
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={selectedRecord ? '编辑委托单' : '新建委托单'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={720}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="clientId"
                label="客户名称"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select placeholder="请选择客户">
                  {clients.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sampleName"
                label="样品名称"
                rules={[{ required: true, message: '请输入样品名称' }]}
              >
                <Input placeholder="请输入样品名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="sampleType"
                label="样品类型"
                rules={[{ required: true, message: '请选择样品类型' }]}
              >
                <Select placeholder="请选择">
                  <Option value="水质">水质</Option>
                  <Option value="土壤">土壤</Option>
                  <Option value="大气">大气</Option>
                  <Option value="食品">食品</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="specModel"
                label="规格型号"
                rules={[{ required: true, message: '请输入规格型号' }]}
              >
                <Input placeholder="如：500mL/瓶" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="deadline"
                label="完成期限"
                rules={[{ required: true, message: '请选择截止日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reportMethod"
                label="报告方式"
                rules={[{ required: true, message: '请选择报告方式' }]}
              >
                <Select placeholder="请选择">
                  <Option value="电子报告">电子报告</Option>
                  <Option value="纸质报告">纸质报告</Option>
                  <Option value="电子报告+纸质报告">电子报告+纸质报告</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="testItemIds"
            label="检测项目"
            rules={[{ required: true, message: '请至少选择一个检测项目' }]}
          >
            <Select mode="multiple" placeholder="请选择检测项目" style={{ width: '100%' }}>
              {mockTestItems.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name}（{item.code}）- {item.standard}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedRecord ? '保存修改' : '创建委托单'}
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="委托单详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={760}
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
              <Descriptions.Item label="创建人">{selectedRecord.createdBy}</Descriptions.Item>
              <Descriptions.Item label="评审人">{selectedRecord.reviewedBy || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>依据标准</Title>
            <div style={{ marginBottom: 16 }}>
              {selectedRecord.standards && selectedRecord.standards.length > 0 ? (
                selectedRecord.standards.map((s, idx) => (
                  <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>
                    {s}
                  </Tag>
                ))
              ) : (
                <span style={{ color: '#999' }}>暂无标准</span>
              )}
            </div>

            <Title level={5}>检测项目</Title>
            <Table
              dataSource={selectedRecord.testItems || []}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '项目名称', dataIndex: 'name', key: 'name' },
                { title: '项目编码', dataIndex: 'code', key: 'code', width: 100 },
                { title: '检测标准', dataIndex: 'standard', key: 'standard' },
                { title: '限值要求', dataIndex: 'limit', key: 'limit', width: 120 },
                { title: '检测方法', dataIndex: 'method', key: 'method' },
              ]}
            />

            {selectedRecord.reviewOpinion && (
              <>
                <Divider />
                <Title level={5}>评审意见</Title>
                <p style={{ color: '#666' }}>{selectedRecord.reviewOpinion}</p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EntrustList;
