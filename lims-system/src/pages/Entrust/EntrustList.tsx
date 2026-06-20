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
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { EntrustOrder, EntrustStatus } from '../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

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
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </>
          )}
          {record.status === 'submitted' && (
            <Button
              type="link"
              size="small"
              icon={<FileSearchOutlined />}
            >
              送审
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
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    const orderData = {
      ...values,
      deadline: values.deadline.format('YYYY-MM-DD'),
      status: 'draft' as EntrustStatus,
      createdBy: '系统管理员',
      testItems: [],
      standards: [],
      clientId: 'C001',
      sampleType: '水质',
      quantity: values.quantity || 1,
    };
    addOrder(orderData);
    message.success('委托单创建成功');
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
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={selectedRecord ? '编辑委托单' : '新建委托单'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="clientName"
                label="客户名称"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select placeholder="请选择客户">
                  <Option value="清水环保科技有限公司">清水环保科技有限公司</Option>
                  <Option value="绿城食品股份有限公司">绿城食品股份有限公司</Option>
                  <Option value="恒泰制药有限公司">恒泰制药有限公司</Option>
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
            name="standards"
            label="依据标准"
          >
            <Select mode="tags" placeholder="请输入或选择标准" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
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
                { title: '项目编码', dataIndex: 'code', key: 'code' },
                { title: '检测标准', dataIndex: 'standard', key: 'standard' },
                { title: '限值要求', dataIndex: 'limit', key: 'limit' },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

import { Row, Col, Descriptions, Divider, Typography } from 'antd';
const { Title } = Typography;

export default EntrustList;
