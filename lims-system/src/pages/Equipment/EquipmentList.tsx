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
  Tabs,
  DatePicker,
  InputNumber,
  Timeline,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DashboardOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { Equipment, EquipmentStatus, CalibrationRecord, MaintenanceRecord } from '../../types';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const statusMap: Record<EquipmentStatus, { color: string; text: string }> = {
  normal: { color: 'success', text: '正常' },
  in_use: { color: 'processing', text: '使用中' },
  calibrating: { color: 'blue', text: '校准中' },
  calibration_due: { color: 'warning', text: '校准到期' },
  maintenance: { color: 'processing', text: '维护中' },
  overdue: { color: 'orange', text: '超期未校' },
  fault: { color: 'error', text: '故障' },
  faulty: { color: 'error', text: '故障' },
  scrapped: { color: 'default', text: '已报废' },
};

const EquipmentList = () => {
  const equipments = useStore((state) => state.equipments);
  const updateEquipment = useStore((state) => state.updateEquipment);
  const currentUser = useStore((state) => state.currentUser);
  const samples = useStore((state) => state.samples);

  const [selectedRecord, setSelectedRecord] = useState<Equipment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [calibrateModalOpen, setCalibrateModalOpen] = useState(false);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [calibrateForm] = Form.useForm();
  const [repairForm] = Form.useForm();

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
      width: 180,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 140,
    },
    {
      title: '规格参数',
      dataIndex: 'spec',
      key: 'spec',
      width: 180,
      ellipsis: true,
    },
    {
      title: '生产厂家',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 140,
    },
    {
      title: '所属科室',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '放置位置',
      dataIndex: 'location',
      key: 'location',
      width: 140,
    },
    {
      title: '下次校准日期',
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
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        const canCalibrate = record.status !== 'scrapped';
        const canRepair = record.status !== 'scrapped' && record.status !== 'maintenance';
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
            {canCalibrate && (
              <Button
                type="link"
                size="small"
                icon={<SafetyCertificateOutlined />}
                onClick={() => handleCalibrate(record)}
              >
                校准
              </Button>
            )}
            {canRepair && (
              <Button
                type="link"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => handleRepair(record)}
              >
                维修
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const handleView = (record: Equipment) => {
    setSelectedRecord(record);
    setActiveTab('info');
    setViewModalOpen(true);
  };

  const handleCalibrate = (record: Equipment) => {
    if (record.status === 'scrapped') {
      message.error('设备已报废，不能校准');
      return;
    }
    setSelectedRecord(record);
    calibrateForm.resetFields();
    setCalibrateModalOpen(true);
  };

  const handleRepair = (record: Equipment) => {
    if (record.status === 'scrapped') {
      message.error('设备已报废，不能维修');
      return;
    }
    setSelectedRecord(record);
    repairForm.resetFields();
    setRepairModalOpen(true);
  };

  const handleCalibrateSubmit = (values: any) => {
    if (!selectedRecord) return;

    const newRecord: CalibrationRecord = {
      id: `cal_${Date.now()}`,
      equipmentId: selectedRecord.id,
      calibrationDate: new Date().toLocaleDateString('zh-CN'),
      nextCalibrationDate: values.nextDate || '',
      calibrationAgency: values.agency || '',
      certificateNo: values.certificateNo || '',
      result: values.result,
      description: values.description || '',
      operator: currentUser?.name || '',
    };

    const calibrationRecords = [...(selectedRecord.calibrationRecords || []), newRecord];
    const newStatus: EquipmentStatus = values.result === 'pass' ? 'normal' : 'calibration_due';

    updateEquipment(selectedRecord.id, {
      calibrationRecords,
      nextCalibrationDate: values.nextDate || selectedRecord.nextCalibrationDate,
      status: newStatus,
    });

    message.success(`校准完成，结果：${values.result === 'pass' ? '合格' : '不合格'}`);
    setCalibrateModalOpen(false);
  };

  const handleRepairSubmit = (values: any) => {
    if (!selectedRecord) return;

    const newRecord: MaintenanceRecord = {
      id: `maint_${Date.now()}`,
      equipmentId: selectedRecord.id,
      type: values.type,
      startDate: new Date().toLocaleDateString('zh-CN'),
      endDate: values.returnDate || '',
      faultDescription: values.faultDescription || '',
      repairContent: values.repairContent || '',
      repairAgency: values.repairAgency || '',
      cost: values.cost || 0,
      result: values.result,
      operator: currentUser?.name || '',
    };

    const maintenanceRecords = [...(selectedRecord.maintenanceRecords || []), newRecord];
    let newStatus: EquipmentStatus = selectedRecord.status;

    if (values.type === 'repair') {
      if (values.result === 'fixed') {
        newStatus = 'normal';
      } else {
        newStatus = 'maintenance';
      }
    }

    updateEquipment(selectedRecord.id, {
      maintenanceRecords,
      status: newStatus,
    });

    message.success('维修记录已保存');
    setRepairModalOpen(false);
  };

  const stats = {
    total: equipments.length,
    normal: equipments.filter((e) => e.status === 'normal' || e.status === 'in_use').length,
    calibrationDue: equipments.filter((e) => e.status === 'calibration_due' || e.status === 'overdue').length,
    maintenance: equipments.filter((e) => e.status === 'maintenance' || e.status === 'calibrating').length,
    faulty: equipments.filter((e) => e.status === 'fault' || e.status === 'faulty').length,
  };

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        selectedRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="设备编号" span={2}>
              <span style={{ fontWeight: 600 }}>{selectedRecord.equipmentNo}</span>
            </Descriptions.Item>
            <Descriptions.Item label="设备名称">{selectedRecord.name}</Descriptions.Item>
            <Descriptions.Item label="型号/规格">{selectedRecord.model}</Descriptions.Item>
            <Descriptions.Item label="规格参数">{selectedRecord.spec}</Descriptions.Item>
            <Descriptions.Item label="生产厂家">{selectedRecord.manufacturer}</Descriptions.Item>
            <Descriptions.Item label="出厂编号">{selectedRecord.serialNo}</Descriptions.Item>
            <Descriptions.Item label="购置日期">{selectedRecord.purchaseDate}</Descriptions.Item>
            <Descriptions.Item label="使用部门">{selectedRecord.department}</Descriptions.Item>
            <Descriptions.Item label="存放地点">{selectedRecord.location}</Descriptions.Item>
            <Descriptions.Item label="设备状态">
              <Tag color={statusMap[selectedRecord.status].color}>
                {statusMap[selectedRecord.status].text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="责任人">{selectedRecord.manager}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedRecord.managerPhone}</Descriptions.Item>
            <Descriptions.Item label="上次校准日期">{selectedRecord.lastCalibrationDate}</Descriptions.Item>
            <Descriptions.Item label="下次校准日期">
              {selectedRecord.status === 'calibration_due' || selectedRecord.status === 'overdue' ? (
                <Tag color="error">{selectedRecord.nextCalibrationDate}（已过期）</Tag>
              ) : (
                <Tag color="success">{selectedRecord.nextCalibrationDate}</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="校准证书号">{selectedRecord.calibrationCertificateNo}</Descriptions.Item>
          </Descriptions>
        )
      ),
    },
    {
      key: 'calibration',
      label: '校准记录',
      children: (
        selectedRecord?.calibrationRecords && selectedRecord.calibrationRecords.length > 0 ? (
          <Table
            dataSource={selectedRecord.calibrationRecords}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { title: '校准日期', dataIndex: 'calibrationDate', key: 'date', width: 120 },
              { title: '校准机构', dataIndex: 'calibrationAgency', key: 'agency' },
              { title: '证书编号', dataIndex: 'certificateNo', key: 'cert', width: 140 },
              {
                title: '校准结果',
                dataIndex: 'result',
                key: 'result',
                width: 80,
                render: (r: string) =>
                  r === 'pass' ? (
                    <Tag color="success">合格</Tag>
                  ) : (
                    <Tag color="error">不合格</Tag>
                  ),
              },
              { title: '下次校准', dataIndex: 'nextCalibrationDate', key: 'next', width: 120 },
              { title: '校准人', dataIndex: 'operator', key: 'op', width: 100 },
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无校准记录</div>
        )
      ),
    },
    {
      key: 'maintenance',
      label: '维修保养',
      children: (
        selectedRecord?.maintenanceRecords && selectedRecord.maintenanceRecords.length > 0 ? (
          <Table
            dataSource={selectedRecord.maintenanceRecords}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              {
                title: '类型',
                dataIndex: 'type',
                key: 'type',
                width: 80,
                render: (t: string) =>
                  t === 'repair' ? (
                    <Tag color="red">维修</Tag>
                  ) : (
                    <Tag color="blue">保养</Tag>
                  ),
              },
              { title: '开始日期', dataIndex: 'startDate', key: 'start', width: 100 },
              { title: '结束日期', dataIndex: 'endDate', key: 'end', width: 100 },
              { title: '故障描述', dataIndex: 'faultDescription', key: 'fault' },
              { title: '维修内容', dataIndex: 'repairContent', key: 'content' },
              {
                title: '结果',
                dataIndex: 'result',
                key: 'result',
                width: 80,
                render: (r: string) => {
                  const map: Record<string, { color: string; text: string }> = {
                    fixed: { color: 'success', text: '已修复' },
                    processing: { color: 'processing', text: '处理中' },
                    scrapped: { color: 'default', text: '报废' },
                  };
                  return <Tag color={map[r]?.color}>{map[r]?.text || r}</Tag>;
                },
              },
              { title: '费用', dataIndex: 'cost', key: 'cost', width: 80, render: (v) => `¥${v}` },
              { title: '操作人', dataIndex: 'operator', key: 'op', width: 100 },
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无维修记录</div>
        )
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
                  title="设备总数"
                  value={stats.total}
                  prefix={<DashboardOutlined style={{ color: '#1890ff' }} />}
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
                  title="校准到期"
                  value={stats.calibrationDue}
                  prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ fontSize: 20, color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="维护中"
                  value={stats.maintenance}
                  prefix={<ToolOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: 20, color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="故障设备"
                  value={stats.faulty}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <div className="search-bar" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input placeholder="设备编号" style={{ width: 140 }} prefix={<SearchOutlined />} />
            <Input placeholder="设备名称" style={{ width: 160 }} />
            <Select placeholder="设备状态" style={{ width: 120 }} allowClear>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.text}
                </Option>
              ))}
            </Select>
            <Input placeholder="所属科室" style={{ width: 120 }} />
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
        width={800}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Modal>

      <Modal
        title="设备校准登记"
        open={calibrateModalOpen}
        onCancel={() => setCalibrateModalOpen(false)}
        footer={null}
        width={500}
        maskClosable={false}
      >
        {selectedRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <p style={{ margin: 0 }}>
              <b>{selectedRecord.name}</b>（编号：{selectedRecord.equipmentNo}）
            </p>
            <p style={{ margin: 0, color: '#666' }}>当前状态：{statusMap[selectedRecord.status].text}</p>
          </div>
        )}
        <Form form={calibrateForm} layout="vertical" onFinish={handleCalibrateSubmit}>
          <Form.Item
            name="result"
            label="校准结果"
            rules={[{ required: true, message: '请选择校准结果' }]}
          >
            <Select placeholder="请选择校准结果">
              <Option value="pass">合格</Option>
              <Option value="fail">不合格</Option>
            </Select>
          </Form.Item>
          <Form.Item name="nextDate" label="下次校准日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择下次校准日期" />
          </Form.Item>
          <Form.Item name="agency" label="校准机构">
            <Input placeholder="请输入校准机构" />
          </Form.Item>
          <Form.Item name="certificateNo" label="校准证书号">
            <Input placeholder="请输入证书编号" />
          </Form.Item>
          <Form.Item name="description" label="校准说明">
            <TextArea rows={3} placeholder="请输入校准说明..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认登记
              </Button>
              <Button onClick={() => setCalibrateModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="设备维修登记"
        open={repairModalOpen}
        onCancel={() => setRepairModalOpen(false)}
        footer={null}
        width={500}
        maskClosable={false}
      >
        {selectedRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <p style={{ margin: 0 }}>
              <b>{selectedRecord.name}</b>（编号：{selectedRecord.equipmentNo}）
            </p>
            <p style={{ margin: 0, color: '#666' }}>当前状态：{statusMap[selectedRecord.status].text}</p>
          </div>
        )}
        <Form form={repairForm} layout="vertical" onFinish={handleRepairSubmit}>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
            initialValue="repair"
          >
            <Select>
              <Option value="repair">维修</Option>
              <Option value="maintenance">保养</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="faultDescription"
            label="故障描述"
            rules={[{ required: true, message: '请输入故障描述' }]}
          >
            <TextArea rows={3} placeholder="请描述故障情况..." />
          </Form.Item>
          <Form.Item name="repairContent" label="维修内容">
            <TextArea rows={3} placeholder="请输入维修内容..." />
          </Form.Item>
          <Form.Item name="repairAgency" label="维修单位">
            <Input placeholder="请输入维修单位" />
          </Form.Item>
          <Form.Item
            name="result"
            label="处理结果"
            rules={[{ required: true, message: '请选择处理结果' }]}
          >
            <Select placeholder="请选择处理结果">
              <Option value="fixed">已修复</Option>
              <Option value="processing">处理中</Option>
              <Option value="scrapped">建议报废</Option>
            </Select>
          </Form.Item>
          <Form.Item name="returnDate" label="预计归位日期">
            <DatePicker style={{ width: '100%' }} placeholder="选择预计归位日期" />
          </Form.Item>
          <Form.Item name="cost" label="维修费用（元）">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入维修费用" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认登记
              </Button>
              <Button onClick={() => setRepairModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentList;
