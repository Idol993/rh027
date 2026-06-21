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
  Typography,
  Divider,
  Popconfirm,
  List,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  FileDoneOutlined,
  CheckOutlined,
  DownloadOutlined,
  PrinterOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  RollbackOutlined,
  ReconciliationOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useStore } from '../../store/useStore';
import { Report, ReportStatus, ReportItem, EntrustOrder, TestTask, ReportReturnRecord, ReportRevisionRecord } from '../../types';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const statusMap: Record<ReportStatus, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  reviewing: { color: 'processing', text: '审核中' },
  level1_signed: { color: 'blue', text: '一级已签' },
  level2_signed: { color: 'purple', text: '二级已签' },
  issued: { color: 'success', text: '已签发' },
  voided: { color: 'error', text: '已作废' },
  returned: { color: 'warning', text: '已退回' },
};

const ReportList = () => {
  const reports = useStore((state) => state.reports);
  const updateReportStatus = useStore((state) => state.updateReportStatus);
  const addReport = useStore((state) => state.addReport);
  const updateReport = useStore((state) => state.updateReport);
  const returnReport = useStore((state) => state.returnReport);
  const reviseReport = useStore((state) => state.reviseReport);
  const resubmitReport = useStore((state) => state.resubmitReport);
  const orders = useStore((state) => state.orders);
  const tasks = useStore((state) => state.tasks);
  const samples = useStore((state) => state.samples);
  const currentUser = useStore((state) => state.currentUser);

  const [selectedRecord, setSelectedRecord] = useState<Report | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signLevel, setSignLevel] = useState<1 | 2 | 3>(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnLevel, setReturnLevel] = useState<'level1' | 'level2' | 'level3'>('level1');
  const [reviseModalOpen, setReviseModalOpen] = useState(false);
  const [selectedEntrustId, setSelectedEntrustId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [reviseForm] = Form.useForm();

  const completedTasks = tasks.filter((t) => t.status === 'completed' && t.result);

  const handleView = (record: Report) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handlePreview = (record: Report) => {
    setSelectedRecord(record);
    setPreviewModalOpen(true);
  };

  const handleSign = (record: Report, level: 1 | 2 | 3) => {
    setSelectedRecord(record);
    setSignLevel(level);
    form.resetFields();
    setSignModalOpen(true);
  };

  const handleReturn = (record: Report, level: 'level1' | 'level2' | 'level3') => {
    setSelectedRecord(record);
    setReturnLevel(level);
    returnForm.resetFields();
    setReturnModalOpen(true);
  };

  const handleReturnSubmit = (values: any) => {
    if (!selectedRecord) return;
    if (!values.opinion) {
      message.error('请填写退回意见');
      return;
    }
    returnReport(selectedRecord.id, returnLevel, values.opinion);
    message.success('报告已退回，可在报告详情中查看退回意见');
    setReturnModalOpen(false);
  };

  const handleResubmit = (record: Report) => {
    resubmitReport(record.id);
    const levelText = record.currentReturnLevel === 'level3' ? '二级审核' :
                      record.currentReturnLevel === 'level2' ? '一级审核' : '草稿';
    message.success(`报告已重新提交，当前状态：${levelText}`);
  };

  const handleRevise = (record: Report) => {
    setSelectedRecord(record);
    reviseForm.setFieldsValue({
      conclusion: record.conclusion,
      remarks: record.remarks || '',
    });
    setReviseModalOpen(true);
  };

  const handleRefreshItems = () => {
    if (!selectedRecord) return;
    const order = orders.find((o) => o.id === selectedRecord.entrustId);
    if (!order) return;

    const relatedSamples = samples.filter((s) => s.entrustId === order.id);
    const allRelatedTasks = tasks.filter(
      (t) => relatedSamples.some((s) => s.id === t.sampleId)
    );
    const completedTasks = allRelatedTasks.filter(
      (t) => t.status === 'completed' && t.result
    );

    const sampleTasks: Record<string, TestTask[]> = {};
    completedTasks.forEach((task) => {
      if (!sampleTasks[task.sampleId]) {
        sampleTasks[task.sampleId] = [];
      }
      sampleTasks[task.sampleId].push(task);
    });

    const reportItems: ReportItem[] = [];
    Object.entries(sampleTasks).forEach(([sampleId, tasks]) => {
      const sample = relatedSamples.find((s) => s.id === sampleId);
      tasks.forEach((task) => {
        reportItems.push({
          sampleSid: task.sampleSid,
          sampleName: sample?.name || task.sampleName,
          testItem: task.testItem.name,
          standard: task.testItem.standard,
          limit: task.testItem.limit,
          result: String(task.result?.value || ''),
          unit: task.testItem.unit,
          conclusion: task.result?.result || 'pending',
        });
      });
    });

    updateReport(selectedRecord.id, { items: reportItems });
    setSelectedRecord({ ...selectedRecord, items: reportItems });
    message.success('检测结果明细已从最新完成的任务中刷新');
  };

  const handleReviseSubmit = (values: any) => {
    if (!selectedRecord) return;
    const lastReturn = selectedRecord.returnRecords?.[selectedRecord.returnRecords.length - 1];
    const content = `修改报告结论和备注：${values.conclusion.substring(0, 50)}...`;
    reviseReport(selectedRecord.id, {
      conclusion: values.conclusion,
      remarks: values.remarks,
    }, content, lastReturn?.id);
    message.success('报告修订成功');
    setReviseModalOpen(false);
  };

  const handleSignSubmit = (values: any) => {
    if (!selectedRecord) return;

    let newStatus: ReportStatus = 'level1_signed';
    if (signLevel === 2) newStatus = 'level2_signed';
    if (signLevel === 3) newStatus = 'issued';

    updateReportStatus(selectedRecord.id, newStatus, { opinion: values.opinion });
    message.success(`第${signLevel}级签名成功`);
    setSignModalOpen(false);
  };

  const handleCreate = () => {
    createForm.resetFields();
    setSelectedEntrustId(null);
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = (values: any) => {
    const order = orders.find((o) => o.id === values.entrustId);
    if (!order) return;

    const relatedSamples = samples.filter((s) => s.entrustId === order.id);
    const allRelatedTasks = tasks.filter(
      (t) => relatedSamples.some((s) => s.id === t.sampleId)
    );
    const completedTasks = allRelatedTasks.filter(
      (t) => t.status === 'completed' && t.result
    );

    if (allRelatedTasks.length === 0) {
      message.error('该委托下还没有分配检测任务，请先完成样品分样和任务分配');
      return;
    }

    if (completedTasks.length < allRelatedTasks.length) {
      const pendingCount = allRelatedTasks.length - completedTasks.length;
      message.error(`该委托下还有 ${pendingCount} 个任务未完成检测，请所有任务完成后再生成报告`);
      return;
    }

    const sampleTasks: Record<string, TestTask[]> = {};
    completedTasks.forEach((task) => {
      if (!sampleTasks[task.sampleId]) {
        sampleTasks[task.sampleId] = [];
      }
      sampleTasks[task.sampleId].push(task);
    });

    const reportItems: ReportItem[] = [];
    Object.entries(sampleTasks).forEach(([sampleId, tasks]) => {
      const sample = relatedSamples.find((s) => s.id === sampleId);
      tasks.forEach((task) => {
        reportItems.push({
          sampleSid: task.sampleSid,
          sampleName: sample?.name || task.sampleName,
          testItem: task.testItem.name,
          standard: task.testItem.standard,
          limit: task.testItem.limit,
          result: String(task.result?.value || ''),
          unit: task.testItem.unit,
          conclusion: task.result?.result || 'pending',
        });
      });
    });

    const allQualified = reportItems.every((item) => item.conclusion === 'qualified');

    const newReport = {
      entrustId: order.id,
      entrustNo: order.orderNo,
      sampleIds: relatedSamples.map((s) => s.id),
      status: 'draft' as ReportStatus,
      conclusion: allQualified
        ? `本次检测共${reportItems.length}项，全部符合${order.standards?.[0] || '相关标准'}要求`
        : `本次检测共${reportItems.length}项，其中存在不合格项`,
      createdAt: new Date().toLocaleString('zh-CN'),
      createdBy: currentUser?.name || '系统',
      items: reportItems,
    };

    addReport(newReport);
    message.success('报告草稿创建成功');
    setCreateModalOpen(false);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-print-area');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('请允许弹出窗口以进行打印');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>检测报告 - ${selectedRecord?.reportNo || ''}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 20px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            table, th, td { border: 1px solid #000; }
            th, td { padding: 8px 12px; text-align: left; font-size: 12px; }
            th { background: #f0f0f0; font-weight: 600; }
            .title { text-align: center; margin-bottom: 20px; }
            .title h1 { margin: 0 0 4px 0; font-size: 24px; }
            .title .sub { color: #666; font-size: 12px; }
            .title .report-no { margin-top: 12px; font-size: 16px; font-weight: 600; color: #1890ff; }
            .desc-table { margin-bottom: 16px; }
            .desc-table td { border: 1px solid #000; padding: 8px 12px; }
            .desc-table .label { background: #f0f0f0; font-weight: 600; width: 120px; }
            .section-title { font-weight: 600; margin: 16px 0 12px 0; font-size: 15px; border-left: 3px solid #1890ff; padding-left: 8px; }
            .conclusion { margin-top: 16px; padding: 12px; background: #f6ffed; border-radius: 4px; }
            .conclusion p { margin: 4px 0; }
            .signatures { display: flex; justify-content: space-around; margin-top: 40px; text-align: center; }
            .sign-box { width: 120px; }
            .sign-box .sign-line { border-top: 1px solid #000; padding-top: 8px; margin-top: 24px; }
            .issued-note { text-align: center; margin-top: 20px; color: #52c41a; }
            @media print {
              body { margin: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    const printContent = document.getElementById('report-print-area');
    if (!printContent || !selectedRecord) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('请允许弹出窗口以下载报告');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>检测报告 - ${selectedRecord.reportNo}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #000; background: #fff; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            table, th, td { border: 1px solid #000; }
            th, td { padding: 8px 12px; text-align: left; font-size: 12px; }
            th { background: #f0f0f0; font-weight: 600; }
            .title { text-align: center; margin-bottom: 20px; }
            .title h1 { margin: 0 0 4px 0; font-size: 28px; }
            .title .sub { color: #666; font-size: 12px; }
            .title .report-no { margin-top: 12px; font-size: 18px; font-weight: 600; color: #1890ff; }
            .desc-table { margin-bottom: 16px; width: 100%; border-collapse: collapse; }
            .desc-table td { border: 1px solid #000; padding: 8px 12px; }
            .desc-table .label { background: #f0f0f0; font-weight: 600; width: 120px; }
            .section-title { font-weight: 600; margin: 16px 0 12px 0; font-size: 16px; border-left: 4px solid #1890ff; padding-left: 10px; }
            .conclusion { margin-top: 16px; padding: 16px; background: #f6ffed; border-radius: 4px; border: 1px solid #b7eb8f; }
            .conclusion p { margin: 4px 0; }
            .signatures { display: flex; justify-content: space-around; margin-top: 60px; text-align: center; }
            .sign-box { width: 140px; }
            .sign-box .sign-line { border-top: 1px solid #000; padding-top: 8px; margin-top: 30px; }
            .issued-note { text-align: center; margin-top: 30px; color: #52c41a; font-size: 14px; }
            @media print {
              body { margin: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>提示：请使用浏览器的"另存为PDF"功能保存报告，或点击"打印"选择PDF打印机</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    message.success('报告已打开，请使用浏览器"另存为PDF"功能保存');
  };

  const columns: ColumnsType<Report> = [
    {
      title: '报告编号',
      dataIndex: 'reportNo',
      key: 'reportNo',
      width: 140,
      render: (text) => <a>{text}</a>,
    },
    {
      title: '委托单号',
      dataIndex: 'entrustNo',
      key: 'entrustNo',
      width: 140,
    },
    {
      title: '检测项目数',
      key: 'itemCount',
      width: 100,
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: '报告结论',
      dataIndex: 'conclusion',
      key: 'conclusion',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ReportStatus) => (
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
      title: '签发时间',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      width: 160,
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileDoneOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          {record.status === 'draft' && (currentUser?.role === 'tester' || currentUser?.role === 'reviewer') && (
            <Button
              type="link"
              size="small"
              icon={<SafetyCertificateOutlined />}
              onClick={() => handleSign(record, 1)}
            >
              一级签名
            </Button>
          )}
          {record.status === 'level1_signed' && (currentUser?.role === 'reviewer' || currentUser?.role === 'quality_manager') && (
            <>
              <Button
                type="link"
                size="small"
                icon={<SafetyCertificateOutlined />}
                onClick={() => handleSign(record, 2)}
              >
                二级签名
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<RollbackOutlined />}
                onClick={() => handleReturn(record, 'level1')}
              >
                退回
              </Button>
            </>
          )}
          {record.status === 'level2_signed' && (currentUser?.role === 'quality_manager' || currentUser?.role === 'director') && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleSign(record, 3)}
              >
                批准签发
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<RollbackOutlined />}
                onClick={() => handleReturn(record, 'level2')}
              >
                退回
              </Button>
            </>
          )}
          {record.status === 'returned' && (currentUser?.role === 'tester' || currentUser?.role === 'reviewer') && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleRevise(record)}
              >
                修订
              </Button>
              <Button
                type="link"
                size="small"
                icon={<ReconciliationOutlined />}
                onClick={() => handleResubmit(record)}
              >
                重新提交
              </Button>
            </>
          )}
          {record.status === 'issued' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handlePreview(record)}
              >
                下载
              </Button>
              <Button
                type="link"
                size="small"
                icon={<PrinterOutlined />}
                onClick={() => handlePreview(record)}
              >
                打印
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: reports.length,
    draft: reports.filter((r) => r.status === 'draft' || r.status === 'returned').length,
    reviewing: reports.filter((r) => r.status === 'level1_signed' || r.status === 'level2_signed').length,
    issued: reports.filter((r) => r.status === 'issued').length,
    returned: reports.filter((r) => r.status === 'returned').length,
  };

  const availableOrders = orders.filter(
    (o) => o.status === 'approved' && !reports.some((r) => r.entrustId === o.id && r.status !== 'voided')
  );

  return (
    <div>
      <Card
        title="报告管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            编制报告
          </Button>
        }
      >
        <div style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="报告总数"
                  value={stats.total}
                  prefix={<FileDoneOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="草稿"
                  value={stats.draft}
                  prefix={<SafetyCertificateOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ fontSize: 20, color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="审核中"
                  value={stats.reviewing}
                  prefix={<SafetyCertificateOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ fontSize: 20, color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="已签发"
                  value={stats.issued}
                  prefix={<CheckOutlined style={{ color: '#52c41a' }} />}
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
          dataSource={reports}
          rowKey="id"
          scroll={{ x: 1300 }}
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
        width={760}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="报告编号">
                <Space>
                  <span style={{ fontWeight: 600 }}>{selectedRecord.reportNo}</span>
                  <Tag color={statusMap[selectedRecord.status].color}>
                    {statusMap[selectedRecord.status].text}
                  </Tag>
                  {selectedRecord.status === 'issued' && (
                    <Tag icon={<LockOutlined />} color="success">
                      已锁定
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="委托单号">{selectedRecord.entrustNo}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedRecord.createdAt}</Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedRecord.createdBy}</Descriptions.Item>
              <Descriptions.Item label="签发时间">{selectedRecord.issuedAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="报告结论" span={2}>
                {selectedRecord.conclusion || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />
            <Title level={5}>检测结果明细</Title>
            <Table
              dataSource={selectedRecord.items || []}
              rowKey={(record, idx) => `${record.sampleSid}-${record.testItem}-${idx}`}
              size="small"
              pagination={false}
              scroll={{ x: 600 }}
              columns={[
                { title: '样品编号', dataIndex: 'sampleSid', key: 'sampleSid', width: 140 },
                { title: '样品名称', dataIndex: 'sampleName', key: 'sampleName', width: 120 },
                { title: '检测项目', dataIndex: 'testItem', key: 'testItem', width: 100 },
                { title: '检测标准', dataIndex: 'standard', key: 'standard' },
                { title: '限值', dataIndex: 'limit', key: 'limit', width: 100 },
                {
                  title: '结果',
                  key: 'result',
                  width: 100,
                  render: (_, record) => (
                    <Space>
                      <span>{record.result}</span>
                      <span style={{ color: '#999' }}>{record.unit}</span>
                    </Space>
                  ),
                },
                {
                  title: '判定',
                  key: 'conclusion',
                  width: 80,
                  render: (_, record) => (
                    <Tag color={record.conclusion === 'qualified' ? 'success' : 'error'}>
                      {record.conclusion === 'qualified' ? '合格' : '不合格'}
                    </Tag>
                  ),
                },
              ]}
            />

            <Divider />
            <Title level={5}>审核流程</Title>
            <Timeline
              items={[
                {
                  color: selectedRecord.level1Sign ? 'green' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>一级签名（检测员）</p>
                      {selectedRecord.level1Sign ? (
                        <>
                          <p style={{ margin: 0, color: '#666' }}>
                            签名人：{selectedRecord.level1Sign.signer}
                          </p>
                          <p style={{ margin: 0, color: '#999' }}>
                            时间：{selectedRecord.level1Sign.signTime}
                          </p>
                          <p style={{ margin: 0, color: '#666' }}>
                            意见：{selectedRecord.level1Sign.opinion}
                          </p>
                        </>
                      ) : (
                        <p style={{ margin: 0, color: '#999' }}>待签名</p>
                      )}
                    </div>
                  ),
                },
                {
                  color: selectedRecord.level2Sign ? 'blue' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>二级审核（审核员）</p>
                      {selectedRecord.level2Sign ? (
                        <>
                          <p style={{ margin: 0, color: '#666' }}>
                            审核人：{selectedRecord.level2Sign.signer}
                          </p>
                          <p style={{ margin: 0, color: '#999' }}>
                            时间：{selectedRecord.level2Sign.signTime}
                          </p>
                          <p style={{ margin: 0, color: '#666' }}>
                            意见：{selectedRecord.level2Sign.opinion}
                          </p>
                        </>
                      ) : (
                        <p style={{ margin: 0, color: '#999' }}>待审核</p>
                      )}
                    </div>
                  ),
                },
                {
                  color: selectedRecord.level3Sign ? 'purple' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>三级签发（授权签字人）</p>
                      {selectedRecord.level3Sign ? (
                        <>
                          <p style={{ margin: 0, color: '#666' }}>
                            签发人：{selectedRecord.level3Sign.signer}
                          </p>
                          <p style={{ margin: 0, color: '#999' }}>
                            时间：{selectedRecord.level3Sign.signTime}
                          </p>
                          <p style={{ margin: 0, color: '#666' }}>
                            意见：{selectedRecord.level3Sign.opinion}
                          </p>
                        </>
                      ) : (
                        <p style={{ margin: 0, color: '#999' }}>待签发</p>
                      )}
                    </div>
                  ),
                },
              ]}
            />

            {selectedRecord.revisionRecords && selectedRecord.revisionRecords.length > 0 && (
              <>
                <Divider />
                <Title level={5}>修订记录</Title>
                <List
                  size="small"
                  dataSource={selectedRecord.revisionRecords.slice().reverse()}
                  renderItem={(record: ReportRevisionRecord) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Tag color="blue" style={{ marginRight: 12 }}>
                            第{record.revisionNo}次
                          </Tag>
                        }
                        title={
                          <Space>
                            <span style={{ fontWeight: 600 }}>{record.content}</span>
                          </Space>
                        }
                        description={
                          <span style={{ color: '#999' }}>
                            修改人：{record.modifiedBy} | 时间：{record.modifiedAt}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}

            {selectedRecord.returnRecords && selectedRecord.returnRecords.length > 0 && (
              <>
                <Divider />
                <Title level={5}>退回记录</Title>
                <List
                  size="small"
                  dataSource={selectedRecord.returnRecords.slice().reverse()}
                  renderItem={(record: ReportReturnRecord) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Tag color="warning" style={{ marginRight: 12 }}>
                            {record.level === 'level1' ? '一级' :
                             record.level === 'level2' ? '二级' : '签发'}
                          </Tag>
                        }
                        title={
                          <Space>
                            <span style={{ fontWeight: 600 }}>{record.opinion}</span>
                          </Space>
                        }
                        description={
                          <span style={{ color: '#999' }}>
                            操作人：{record.operator} | 时间：{record.returnTime}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="电子签名"
        open={signModalOpen}
        onCancel={() => setSignModalOpen(false)}
        footer={null}
        width={500}
        maskClosable={false}
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <p style={{ margin: 0 }}>
            当前操作：<b>第 {signLevel} 级电子签名</b>
          </p>
          <p style={{ margin: 0, color: '#666' }}>
            操作员：{currentUser?.name}
          </p>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSignSubmit}>
          <Form.Item
            name="opinion"
            label="签名意见"
            rules={[{ required: true, message: '请输入签名意见' }]}
          >
            <TextArea
              rows={4}
              placeholder={
                signLevel === 1
                  ? '请输入原始数据审核意见...'
                  : signLevel === 2
                  ? '请输入报告审核意见...'
                  : '请输入批准签发意见...'
              }
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

      <Modal
        title="编制报告"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={700}
        maskClosable={false}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit}>
          <Form.Item
            name="entrustId"
            label="选择委托单"
            rules={[{ required: true, message: '请选择委托单' }]}
            extra="只显示已通过评审且尚未生成报告的委托单"
          >
            <Select
              placeholder="请选择委托单"
              onChange={(value) => setSelectedEntrustId(value)}
            >
              {availableOrders.map((order) => (
                <Option key={order.id} value={order.id}>
                  {order.orderNo} - {order.sampleName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedEntrustId && (() => {
            const order = orders.find((o) => o.id === selectedEntrustId);
            const relatedSamples = samples.filter((s) => s.entrustId === selectedEntrustId);
            const allRelatedTasks = tasks.filter(
              (t) => relatedSamples.some((s) => s.id === t.sampleId)
            );
            const completedTasks = allRelatedTasks.filter(
              (t) => t.status === 'completed' && t.result
            );
            const canGenerate = allRelatedTasks.length > 0 && completedTasks.length === allRelatedTasks.length;

            return (
              <div>
                <div style={{ fontWeight: 600, margin: '16px 0 12px 0', fontSize: 15, borderLeft: '3px solid #1890ff', paddingLeft: 8 }}>
                  任务完成情况
                </div>
                {relatedSamples.length === 0 ? (
                  <Alert
                    message="该委托单下还没有登记样品"
                    description="请先到样品管理登记样品并分配检测任务"
                    type="warning"
                    showIcon
                  />
                ) : (
                  <div>
                    {relatedSamples.map((sample) => {
                      const sampleTasks = allRelatedTasks.filter((t) => t.sampleId === sample.id);
                      const sampleCompleted = sampleTasks.filter(
                        (t) => t.status === 'completed' && t.result
                      );
                      return (
                        <Card
                          key={sample.id}
                          size="small"
                          style={{ marginBottom: 8 }}
                          title={
                            <Space>
                              <span style={{ fontWeight: 600 }}>{sample.sid}</span>
                              <span>{sample.name}</span>
                              <Tag color={sampleCompleted.length === sampleTasks.length ? 'success' : 'processing'}>
                                {sampleCompleted.length}/{sampleTasks.length} 已完成
                              </Tag>
                            </Space>
                          }
                        >
                          <List
                            size="small"
                            dataSource={sampleTasks}
                            renderItem={(task) => (
                              <List.Item>
                                <List.Item.Meta
                                  title={task.testItem.name}
                                  description={
                                    <Space split="|">
                                      <span>检测员：{task.tester}</span>
                                      <span>
                                        状态：
                                        <Tag color={
                                          task.status === 'completed' ? 'success' :
                                          task.status === 'in_progress' ? 'processing' : 'default'
                                        }>
                                          {task.status === 'completed' ? '已完成' :
                                           task.status === 'in_progress' ? '检测中' :
                                           task.status === 'pending' ? '待开始' : task.status}
                                        </Tag>
                                      </span>
                                    </Space>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        </Card>
                      );
                    })}
                    <div style={{ marginTop: 12 }}>
                      <Statistic
                        title="总完成进度"
                        value={completedTasks.length}
                        suffix={`/ ${allRelatedTasks.length} 项`}
                        valueStyle={{ fontSize: 16 }}
                      />
                      {!canGenerate && (
                        <Alert
                          message="还有未完成的检测任务"
                          description="请等所有检测任务完成后再生成报告"
                          type="error"
                          showIcon
                          style={{ marginTop: 12 }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <Form.Item style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                生成报告草稿
              </Button>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="退回报告"
        open={returnModalOpen}
        onCancel={() => setReturnModalOpen(false)}
        footer={null}
        width={500}
        maskClosable={false}
      >
        {selectedRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff1f0', borderRadius: 4 }}>
            <p style={{ margin: 0, color: '#ff4d4f', fontWeight: 600 }}>
              {selectedRecord.reportNo}
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
              从
              {returnLevel === 'level1' ? '一级审核' :
               returnLevel === 'level2' ? '二级审核' : '签发环节'} 退回
            </p>
          </div>
        )}
        <Form form={returnForm} layout="vertical" onFinish={handleReturnSubmit}>
          <Form.Item
            name="opinion"
            label="退回意见"
            rules={[{ required: true, message: '请填写退回意见' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明需要修改的内容..."
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                确认退回
              </Button>
              <Button onClick={() => setReturnModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="报告修订"
        open={reviseModalOpen}
        onCancel={() => setReviseModalOpen(false)}
        footer={null}
        width={650}
        maskClosable={false}
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
              <Space wrap>
                <span style={{ fontWeight: 600 }}>{selectedRecord.reportNo}</span>
                <Tag color="warning">已退回</Tag>
                <span style={{ color: '#666', fontSize: 12 }}>
                  第 {(selectedRecord.revisionRecords?.length || 0) + 1} 次修订
                </span>
              </Space>
            </div>

            {selectedRecord.returnRecords && selectedRecord.returnRecords.length > 0 && (
              <Alert
                message="最新退回意见"
                description={selectedRecord.returnRecords[selectedRecord.returnRecords.length - 1].opinion}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Form form={reviseForm} layout="vertical" onFinish={handleReviseSubmit}>
              <Form.Item
                name="conclusion"
                label="报告结论"
                rules={[{ required: true, message: '请填写报告结论' }]}
              >
                <TextArea rows={3} placeholder="请填写报告结论..." />
              </Form.Item>

              <Form.Item name="remarks" label="备注说明">
                <TextArea rows={3} placeholder="可填写其他需要说明的内容..." />
              </Form.Item>

              <div style={{ marginBottom: 16 }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshItems}
                >
                  刷新检测明细
                </Button>
                <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                  从已完成的检测任务中重新获取最新结果
                </span>
              </div>

              <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>
                检测结果明细（共 {selectedRecord.items?.length || 0} 项）：
              </div>
              <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e8e8e8', borderRadius: 4 }}>
                <Table
                  dataSource={selectedRecord.items || []}
                  rowKey={(record, idx) => `revise-${record.sampleSid}-${record.testItem}-${idx}`}
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '样品', dataIndex: 'sampleSid', key: 'sampleSid', width: 120 },
                    { title: '检测项目', dataIndex: 'testItem', key: 'testItem', width: 100 },
                    { title: '结果', key: 'result', width: 100, render: (_, r) => `${r.result} ${r.unit}` },
                    {
                      title: '判定',
                      key: 'judge',
                      width: 70,
                      render: (_, r) => (
                        <Tag color={r.conclusion === 'qualified' ? 'success' : 'error'}>
                          {r.conclusion === 'qualified' ? '合格' : '不合格'}
                        </Tag>
                      ),
                    },
                  ]}
                />
              </div>

              <Form.Item style={{ marginTop: 20 }}>
                <Space>
                  <Button type="primary" htmlType="submit">
                    保存修订
                  </Button>
                  <Button onClick={() => setReviseModalOpen(false)}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="报告预览"
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        width={800}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
            下载PDF
          </Button>,
          <Button key="close" onClick={() => setPreviewModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedRecord && (
          <div className="report-preview" id="report-print-area">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Title level={3} style={{ marginBottom: 4 }}>检测报告</Title>
              <Text type="secondary">TEST REPORT</Text>
              <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: '#1890ff' }}>
                报告编号：{selectedRecord.reportNo}
              </div>
            </div>

            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="委托单位">
                {orders.find((o) => o.id === selectedRecord.entrustId)?.clientName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="委托单号">{selectedRecord.entrustNo}</Descriptions.Item>
              <Descriptions.Item label="样品数量">
                {selectedRecord.sampleIds?.length || 0} 件
              </Descriptions.Item>
              <Descriptions.Item label="报告日期">
                {selectedRecord.issuedAt || selectedRecord.createdAt}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ fontWeight: 600, margin: '16px 0 12px 0', fontSize: 15, borderLeft: '3px solid #1890ff', paddingLeft: 8 }}>
              检测结果
            </div>

            {(() => {
              const sampleGroups: Record<string, ReportItem[]> = {};
              (selectedRecord.items || []).forEach((item) => {
                if (!sampleGroups[item.sampleSid]) {
                  sampleGroups[item.sampleSid] = [];
                }
                sampleGroups[item.sampleSid].push(item);
              });
              
              return Object.entries(sampleGroups).map(([sampleSid, items]) => {
                const sampleName = items[0]?.sampleName || '';
                return (
                  <div key={sampleSid} style={{ marginBottom: 16 }}>
                    <div style={{ 
                      marginBottom: 8, 
                      padding: '8px 12px', 
                      background: '#f0f7ff', 
                      borderRadius: 4,
                      fontWeight: 600,
                      fontSize: 14,
                      borderLeft: '3px solid #1890ff',
                    }}>
                      <Space>
                        <span>样品编号：{sampleSid}</span>
                        <span style={{ color: '#666', fontWeight: 400 }}>|</span>
                        <span style={{ color: '#666', fontWeight: 400 }}>样品名称：{sampleName}</span>
                      </Space>
                    </div>
                    <Table
                      dataSource={items}
                      rowKey={(record, idx) => `preview-${sampleSid}-${record.testItem}-${idx}`}
                      size="small"
                      pagination={false}
                      bordered
                      columns={[
                        { title: '序号', key: 'idx', width: 50, render: (_, __, idx) => idx + 1 },
                        { title: '检测项目', dataIndex: 'testItem', key: 'testItem', width: 100 },
                        { title: '检测标准', dataIndex: 'standard', key: 'standard' },
                        { title: '限值要求', dataIndex: 'limit', key: 'limit', width: 100 },
                        { title: '检测结果', key: 'result', width: 100, render: (_, r) => `${r.result} ${r.unit}` },
                        {
                          title: '单项判定',
                          key: 'judge',
                          width: 80,
                          render: (_, r) =>
                            r.conclusion === 'qualified' ? '合格' : '不合格',
                        },
                      ]}
                    />
                  </div>
                );
              });
            })()}

            <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 4 }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#389e0d' }}>
                报告结论：
              </p>
              <p style={{ margin: 4, color: '#389e0d' }}>{selectedRecord.conclusion}</p>
            </div>

            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: 24 }}>检测员（一级）</p>
                <p style={{ borderTop: '1px solid #000', width: 120, paddingTop: 8, margin: 0 }}>
                  {selectedRecord.level1Sign?.signer || '____________'}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: 24 }}>审核员（二级）</p>
                <p style={{ borderTop: '1px solid #000', width: 120, paddingTop: 8, margin: 0 }}>
                  {selectedRecord.level2Sign?.signer || '____________'}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: 24 }}>授权签字人（三级）</p>
                <p style={{ borderTop: '1px solid #000', width: 120, paddingTop: 8, margin: 0 }}>
                  {selectedRecord.level3Sign?.signer || '____________'}
                </p>
              </div>
            </div>

            {selectedRecord.status === 'issued' && (
              <div style={{ textAlign: 'center', marginTop: 20, color: '#52c41a' }}>
                <LockOutlined /> 本报告已签发，具有法律效力
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportList;
