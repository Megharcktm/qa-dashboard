import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Row, Col, DatePicker, Button, Space, Empty, Spin, Modal, Form, Input, Select, message } from 'antd';
import { ClearOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { automationPlansAPI } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import { PieChart, Pie as RechartsPie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface AutomationPlan {
  id: number;
  feature_name: string;
  release_status?: string;
  complexity?: string;
  owner?: string;
  weekly_plan?: string;
  automation_status?: string;
  test_scenario_document?: string;
  notes?: string;
}

export const AutomationPlans: React.FC = () => {
  const [form] = Form.useForm();
  const { isDarkMode } = useTheme();
  const [plans, setPlans] = useState<AutomationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(() => {
    const saved = localStorage.getItem('automationPlans_selectedMonth');
    return saved ? dayjs(saved) : dayjs();
  });
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AutomationPlan | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const headingColor = isDarkMode ? 'rgba(255,255,255,0.85)' : '#333';

  useEffect(() => {
    localStorage.setItem('automationPlans_selectedMonth', selectedMonth.toISOString());
    loadPlans();
  }, [selectedMonth]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const monthYear = selectedMonth.format('YYYY-MM');

      const plansResponse = await automationPlansAPI.getPlansByMonth(monthYear);
      setPlans(plansResponse.data || []);
    } catch (err) {
      console.error('Error loading automation plans:', err);
      message.error('Failed to load automation plans');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async (values: any) => {
    try {
      await automationPlansAPI.createPlan(values);
      message.success('Feature added successfully');
      setIsAddModalVisible(false);
      form.resetFields();
      loadPlans();
    } catch (err) {
      message.error('Failed to add feature');
    }
  };

  const handleEditPlan = async (values: any) => {
    if (!editingPlan) return;
    try {
      await automationPlansAPI.updatePlan(editingPlan.id, values);
      message.success('Feature updated successfully');
      setIsEditModalVisible(false);
      setEditingPlan(null);
      form.resetFields();
      loadPlans();
    } catch (err) {
      message.error('Failed to update feature');
    }
  };

  const handleDeletePlan = (id: number) => {
    Modal.confirm({
      title: 'Delete Feature',
      content: 'Are you sure you want to delete this feature?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await automationPlansAPI.deletePlan(id);
          message.success('Feature deleted successfully');
          loadPlans();
        } catch (err) {
          message.error('Failed to delete feature');
        }
      },
    });
  };

  const handleReset = () => {
    setSelectedMonth(dayjs());
  };

  const handleEditClick = (plan: AutomationPlan) => {
    setEditingPlan(plan);
    form.setFieldsValue(plan);
    setIsEditModalVisible(true);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Month Selector & Add Button */}
        <div style={{ padding: '16px', borderRadius: '4px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <span style={{ fontWeight: 500 }}>Select Month:</span>
            </Col>
            <Col>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(date) => setSelectedMonth(date || dayjs())}
                style={{ width: '150px' }}
              />
            </Col>
            <Col>
              <Button onClick={handleReset} icon={<ClearOutlined />}>
                Current Month
              </Button>
            </Col>
            <Col style={{ marginLeft: 'auto' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalVisible(true)}
              >
                Add New Feature
              </Button>
            </Col>
          </Row>
        </div>

        {loading ? (
          <Spin spinning={true} tip="Loading automation plans..." />
        ) : plans.length === 0 ? (
          <Empty description="No automation plans found for this month" />
        ) : (
          <>
            {/* Automation Plans Table */}
            <Card size="small">
              <h3 style={{ color: headingColor, marginBottom: '16px' }}>Feature List & Automation Plans</h3>
              <Table
                columns={[
                  {
                    title: 'Feature Name',
                    dataIndex: 'feature_name',
                    key: 'feature_name',
                    width: 300,
                    render: (text: string) => <strong>{text}</strong>,
                  },
                  {
                    title: 'Release Status',
                    dataIndex: 'release_status',
                    key: 'release_status',
                    width: 100,
                    render: (status: string) => (
                      <Tag color={status === 'DONE' ? 'green' : status === 'PENDING' ? 'orange' : 'default'}>
                        {status || '-'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Complexity',
                    dataIndex: 'complexity',
                    key: 'complexity',
                    width: 100,
                    render: (complexity: string) => (
                      <Tag color={complexity === 'Highest' ? 'red' : complexity === 'High' ? 'orange' : 'default'}>
                        {complexity || '-'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Owner',
                    dataIndex: 'owner',
                    key: 'owner',
                    width: 100,
                  },
                  {
                    title: 'Weekly Plan',
                    dataIndex: 'weekly_plan',
                    key: 'weekly_plan',
                    width: 100,
                  },
                  {
                    title: 'Automation Status',
                    dataIndex: 'automation_status',
                    key: 'automation_status',
                    width: 150,
                    render: (status: string) => (
                      <Tag
                        color={
                          status === 'Done'
                            ? 'green'
                            : status === 'Pending'
                            ? 'blue'
                            : status === 'No need'
                            ? 'default'
                            : 'orange'
                        }
                      >
                        {status || 'Not Set'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Test Scenario Doc',
                    dataIndex: 'test_scenario_document',
                    key: 'test_scenario_document',
                    width: 120,
                    render: (url: string) =>
                      url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          View Doc
                        </a>
                      ) : (
                        '-'
                      ),
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    width: 100,
                    render: (_, record: AutomationPlan) => (
                      <Space>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => handleEditClick(record)}
                        >
                          Edit
                        </Button>
                        <Button 
                          type="link" 
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeletePlan(record.id)}
                        >
                          Delete
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                dataSource={plans.map((plan, idx) => ({ ...plan, key: plan.id || idx }))}
                pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: ['10', '15', '20', '50'] }}
                size="small"
                scroll={{ x: 1400 }}
              />
            </Card>
          </>
        )}

        {/* Add Feature Modal */}
        <Modal
          title="Add New Feature"
          open={isAddModalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setIsAddModalVisible(false);
            form.resetFields();
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddPlan}
          >
            <Form.Item name="feature_name" label="Feature Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="release_status" label="Release Status">
              <Select placeholder="Select status" options={[
                { label: 'DONE', value: 'DONE' },
                { label: 'PENDING', value: 'PENDING' },
                { label: 'NOT PICKED', value: 'NOT PICKED' },
              ]} />
            </Form.Item>
            <Form.Item name="complexity" label="Complexity">
              <Select placeholder="Select complexity" options={[
                { label: 'Highest', value: 'Highest' },
                { label: 'High', value: 'High' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Small', value: 'Small' },
                { label: 'Not possible', value: 'Not possible' },
              ]} />
            </Form.Item>
            <Form.Item name="owner" label="Owner">
              <Input />
            </Form.Item>
            <Form.Item name="weekly_plan" label="Weekly Plan">
              <Input />
            </Form.Item>
            <Form.Item name="automation_status" label="Automation Status">
              <Input />
            </Form.Item>
            <Form.Item name="test_scenario_document" label="Test Scenario Document URL">
              <Input />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Feature Modal */}
        <Modal
          title="Edit Feature"
          open={isEditModalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingPlan(null);
            form.resetFields();
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleEditPlan}
          >
            <Form.Item name="feature_name" label="Feature Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="release_status" label="Release Status">
              <Select placeholder="Select status" options={[
                { label: 'DONE', value: 'DONE' },
                { label: 'PENDING', value: 'PENDING' },
                { label: 'NOT PICKED', value: 'NOT PICKED' },
              ]} />
            </Form.Item>
            <Form.Item name="complexity" label="Complexity">
              <Select placeholder="Select complexity" options={[
                { label: 'Highest', value: 'Highest' },
                { label: 'High', value: 'High' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Small', value: 'Small' },
                { label: 'Not possible', value: 'Not possible' },
              ]} />
            </Form.Item>
            <Form.Item name="owner" label="Owner">
              <Input />
            </Form.Item>
            <Form.Item name="weekly_plan" label="Weekly Plan">
              <Input />
            </Form.Item>
            <Form.Item name="automation_status" label="Automation Status">
              <Input />
            </Form.Item>
            <Form.Item name="test_scenario_document" label="Test Scenario Document URL">
              <Input />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  );
};
