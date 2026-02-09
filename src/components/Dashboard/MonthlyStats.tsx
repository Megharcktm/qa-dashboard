import React, { useEffect, useState } from 'react';
import { Card, Spin, Empty, Tag, Row, Col, DatePicker, Space, Button, Drawer, Table, Alert } from 'antd';
import { BugOutlined, QuestionCircleOutlined, PhoneOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { analyticsAPI } from '../../api/endpoints';
import { ticketsAPI } from '../../api/endpoints';
import { automationPlansAPI } from '../../api/endpoints';
import { Ticket, TicketDetailResponse } from '../../types/ticket.types';
import { useTheme } from '../../context/ThemeContext';
import { PieChart, Pie as RechartsPie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

dayjs.extend(relativeTime);

interface SubtypeStats {
  subtype: string;
  count: number;
}

// Color mapping for automation statuses
const getAutomationStatusColor = (status: string): string => {
  const normalized = status.toLowerCase().trim();
  switch (normalized) {
    case 'completed':
    case 'done':
      return '#52c41a'; // Green - Done
    case 'in_progress':
    case 'in progress':
      return '#faad14'; // Orange - In Progress
    case 'blocked':
    case 'no need':
    case 'no need':
      return '#f5222d'; // Red - Blocked/No Need
    case 'can be automated in mar':
    case 'can be automated in march':
      return '#1890ff'; // Blue - Can be automated
    case 'pending':
    case 'not set':
    case 'not set: ':
      return '#13c2c2'; // Cyan - Not Set/Pending
    default:
      return '#722ed1'; // Purple - Others
  }
};

interface AutomationStats {
  status: string;
  count: number;
}

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

interface PlanAutomationStats {
  status: string;
  count: number;
}

interface MonthlyStatusData {
  month: string;
  year: number;
  total: number;
  byState: { [key: string]: number };
}

interface MonthlyStatsProps {
  onDateRangeChange?: (date: Dayjs) => void;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({ onDateRangeChange }) => {
  const { isDarkMode } = useTheme();
  const [subtypeData, setSubtypeData] = useState<SubtypeStats[]>([]);
  const [automationData, setAutomationData] = useState<AutomationStats[]>([]);
  const [planAutomationData, setPlanAutomationData] = useState<PlanAutomationStats[]>([]);
  const [statusData, setStatusData] = useState<MonthlyStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(() => {
    const saved = localStorage.getItem('monthlyStats_selectedMonth');
    return saved ? dayjs(saved) : dayjs();
  });
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(() => {
    return localStorage.getItem('monthlyStats_selectedSubtype') || null;
  });
  const [drawerOpen, setDrawerOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('monthlyStats_drawerOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('monthlyStats_tickets');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedTicket, setSelectedTicket] = useState<TicketDetailResponse | null>(() => {
    const saved = localStorage.getItem('monthlyStats_selectedTicket');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [ticketDetailDrawerOpen, setTicketDetailDrawerOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('monthlyStats_ticketDetailDrawerOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(() => {
    return localStorage.getItem('monthlyStats_selectedTicketId') || null;
  });

  // Save state to localStorage and call callback
  useEffect(() => {
    localStorage.setItem('monthlyStats_selectedMonth', selectedMonth.toISOString());
    onDateRangeChange?.(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedSubtype !== null) {
      localStorage.setItem('monthlyStats_selectedSubtype', selectedSubtype);
    } else {
      localStorage.removeItem('monthlyStats_selectedSubtype');
    }
  }, [selectedSubtype]);

  useEffect(() => {
    localStorage.setItem('monthlyStats_drawerOpen', JSON.stringify(drawerOpen));
  }, [drawerOpen]);

  useEffect(() => {
    localStorage.setItem('monthlyStats_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    if (selectedTicket) {
      localStorage.setItem('monthlyStats_selectedTicket', JSON.stringify(selectedTicket));
    } else {
      localStorage.removeItem('monthlyStats_selectedTicket');
    }
  }, [selectedTicket]);

  useEffect(() => {
    localStorage.setItem('monthlyStats_ticketDetailDrawerOpen', JSON.stringify(ticketDetailDrawerOpen));
  }, [ticketDetailDrawerOpen]);

  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth]);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      const monthYear = selectedMonth.format('YYYY-MM');

      // Load subtype stats
      const subtypeResponse = await analyticsAPI.getMonthlyStatsBySubtype(monthYear);
      const filteredSubtypes = (subtypeResponse.data || []).filter((item: SubtypeStats) =>
        ['bugs', 'knowledge_gap', 'support_request', 'enhancement'].includes(item.subtype.toLowerCase())
      );
      setSubtypeData(filteredSubtypes);

      // Load automation status stats (for tickets)
      const automationResponse = await analyticsAPI.getMonthlyStatsByAutomationStatus(monthYear);
      const automationWithColors = (automationResponse.data || []).map((item: any) => ({
        ...item,
        fill: getAutomationStatusColor(item.status),
      }));
      setAutomationData(automationWithColors);

      // Load automation plans status distribution
      try {
        const planStatsResponse = await automationPlansAPI.getStatusDistribution(monthYear);
        const planDataWithColors = (planStatsResponse.data || []).map((item: any) => ({
          ...item,
          fill: getAutomationStatusColor(item.status),
        }));
        setPlanAutomationData(planDataWithColors);
      } catch (err) {
        console.error('Error loading automation plans status:', err);
        setPlanAutomationData([]);
      }

      // Load status stats
      const statusResponse = await analyticsAPI.getMonthlyStats();
      const selectedMonthStr = selectedMonth.format('MMM YYYY');
      const currentMonthStatus = statusResponse.data?.find((m: MonthlyStatusData) => m.month === selectedMonthStr);
      setStatusData(currentMonthStatus || null);
    } catch (err) {
      console.error('Error loading monthly data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total from status data or subtype data
  const totalTkts = statusData?.total || 0;
  const selectedMonthStr = selectedMonth.format('MMM YYYY');
  const headingColor = isDarkMode ? 'rgba(255,255,255,0.85)' : '#333';

  const loadTicketsForMonth = async (filterValue: string | null) => {
    try {
      setTicketsLoading(true);
      const dateFrom = selectedMonth.startOf('month').toISOString();
      const dateTo = selectedMonth.endOf('month').toISOString();

      // Fetch all tickets for the month
      const filters: any = { type: 'ticket', dateFrom, dateTo };
      const response = await ticketsAPI.getTickets(
        filters,
        { page: 1, limit: 1000, total: 0, totalPages: 0 }
      );

      // Filter by state or subtype client-side if needed
      let filtered = response.tickets;
      if (filterValue && filterValue !== 'all') {
        // Check if it's a state filter (Open, In Progress, Resolved/Closed)
        const stateValues = ['Open', 'In Progress', 'Resolved', 'Closed'];
        if (stateValues.includes(filterValue)) {
          // Map "Resolved" to "Closed" for filtering since DB stores "Closed"
          const dbState = filterValue === 'Resolved' ? 'Closed' : filterValue;
          filtered = response.tickets.filter(t => t.state === dbState);
        } else {
          // It's a subtype filter
          filtered = response.tickets.filter(t => t.subtype === filterValue);
        }
      }

      setTickets(filtered);
      setSelectedSubtype(filterValue);
      setDrawerOpen(true);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleNumberClick = (filterValue: string | null) => {
    loadTicketsForMonth(filterValue);
  };

  const handleTicketClick = async (ticket: Ticket) => {
    try {
      setTicketDetailLoading(true);
      setSelectedTicketId(ticket.display_id);
      const response = await ticketsAPI.getTicket(ticket.display_id);
      setSelectedTicket(response);
      setTicketDetailDrawerOpen(true);
    } catch (err) {
      console.error('Error loading ticket details:', err);
    } finally {
      setTicketDetailLoading(false);
    }
  };

  // Load saved ticket on mount
  useEffect(() => {
    if (selectedTicketId && !selectedTicket) {
      ticketsAPI.getTicket(selectedTicketId).then((response) => {
        setSelectedTicket(response);
        setTicketDetailDrawerOpen(true);
      }).catch((err) => {
        console.error('Error loading ticket details:', err);
        setSelectedTicketId(null);
      });
    }
  }, []);

  // Save selected ticket ID to localStorage
  useEffect(() => {
    if (selectedTicketId) {
      localStorage.setItem('monthlyStats_selectedTicketId', selectedTicketId);
    } else {
      localStorage.removeItem('monthlyStats_selectedTicketId');
    }
  }, [selectedTicketId]);

  // Save drawer state
  useEffect(() => {
    localStorage.setItem('monthlyStats_ticketDetailDrawerOpen', JSON.stringify(ticketDetailDrawerOpen));
  }, [ticketDetailDrawerOpen]);

  // Clear selected ticket when drawer closes
  const handleTicketDetailClose = () => {
    setSelectedTicket(null);
    setSelectedTicketId(null);
    setTicketDetailDrawerOpen(false);
  };

  if (loading) {
    return (
      <Card style={{ marginBottom: '24px' }}>
        <Spin spinning={true} size="small" tip="Loading monthly data..." />
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row align="middle" gutter={16}>
          <Col>
            <span style={{ fontWeight: 500 }}>TKT Created in:</span>
          </Col>
          <Col>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date || dayjs())}
              style={{ width: '150px' }}
            />
          </Col>
        </Row>

        {!statusData ? (
          <Empty description="No tickets for this month" />
        ) : (
          <>
            {/* Status Breakdown */}
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 700, color: headingColor }}>Status Overview</h3>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={6}>
                  <Card
                    size="small"
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)',
                      border: 'none',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => handleNumberClick(null)}
                  >
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '8px', opacity: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Total TKT
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
                      {totalTkts}
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={6}>
                  <Card
                    size="small"
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #faad14 0%, #ffc069 100%)',
                      border: 'none',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => handleNumberClick('Open')}
                  >
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '8px', opacity: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Open
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
                      {statusData.byState['Open'] || 0}
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={6}>
                  <Card
                    size="small"
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #ff7a45 0%, #ffb347 100%)',
                      border: 'none',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => handleNumberClick('In Progress')}
                  >
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '8px', opacity: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      In Progress
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
                      {statusData.byState['In Progress'] || 0}
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={6}>
                  <Card
                    size="small"
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #52c41a 0%, #85ce61 100%)',
                      border: 'none',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => handleNumberClick('Resolved')}
                  >
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '8px', opacity: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Resolved
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
                      {statusData.byState['Resolved'] || 0}
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Charts Section */}
            {(subtypeData.length > 0 || automationData.length > 0) && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 700, color: headingColor }}>Breakdown Analysis</h3>
                <Row gutter={[16, 16]}>
                  {/* Subtype Breakdown Cards */}
                  {subtypeData.map((item) => {
                    const getIcon = (subtype: string) => {
                      const normalized = subtype.toLowerCase();
                      switch (normalized) {
                        case 'bugs':
                          return <BugOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />;
                        case 'knowledge_gap':
                          return <QuestionCircleOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />;
                        case 'support_request':
                          return <PhoneOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />;
                        case 'enhancement':
                          return <ThunderboltOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />;
                        default:
                          return <CheckCircleOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />;
                      }
                    };

                    const getColor = (subtype: string) => {
                      const normalized = subtype.toLowerCase();
                      switch (normalized) {
                        case 'bugs':
                          return 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)';
                        case 'knowledge_gap':
                          return 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)';
                        case 'support_request':
                          return 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)';
                        case 'enhancement':
                          return 'linear-gradient(135deg, #faad14 0%, #ffc069 100%)';
                        default:
                          return 'linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)';
                      }
                    };

                    const formatSubtypeLabel = (subtype: string) => {
                      return subtype.replace(/_/g, ' ');
                    };

                    return (
                      <Col xs={24} sm={12} md={automationData.length > 0 ? 6 : 8} key={item.subtype}>
                        <Card
                          size="small"
                          style={{
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: getColor(item.subtype),
                            border: 'none',
                            transition: 'all 0.3s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          onClick={() => handleNumberClick(item.subtype)}
                        >
                          <div style={{ color: '#fff', marginBottom: '8px' }}>
                            {getIcon(item.subtype)}
                          </div>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '8px', opacity: 1, textTransform: 'capitalize', letterSpacing: '0.3px' }}>
                            {formatSubtypeLabel(item.subtype)}
                          </div>
                          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
                            {item.count}
                          </div>
                        </Card>
                      </Col>
                    );
                  })}

                  {/* Automation Status Distribution Pie Chart */}
                  {automationData.length > 0 && (
                    <Col xs={24} sm={12} md={12}>
                      <Card size="small" style={{ height: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: headingColor }}>On-call Tickets Automation Status</div>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <RechartsPie
                              data={automationData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(1)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="status"
                            >
                              {automationData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </RechartsPie>
                            <Tooltip formatter={(value, name, props) => {
                              const total = automationData.reduce((sum, item) => sum + item.count, 0);
                              const percent = ((value / total) * 100).toFixed(1);
                              return [`${value} tickets (${percent}%)`, props.payload.status];
                            }} />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              formatter={(value, entry) => `${entry.payload.status}: ${entry.payload.count}`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                  )}

                  {/* Automation Plans Status Distribution Pie Chart */}
                  {planAutomationData.length > 0 && (
                    <Col xs={24} sm={12} md={12}>
                      <Card size="small" style={{ height: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: headingColor }}>M2 Features Automation</div>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <RechartsPie
                              data={planAutomationData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(1)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="status"
                            >
                              {planAutomationData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </RechartsPie>
                            <Tooltip formatter={(value, name, props) => {
                              const total = planAutomationData.reduce((sum, item) => sum + item.count, 0);
                              const percent = ((value / total) * 100).toFixed(1);
                              return [`${value} plans (${percent}%)`, props.payload.status];
                            }} />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              formatter={(value, entry) => `${entry.payload.status}: ${entry.payload.count}`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                  )}
                </Row>
              </div>
            )}
          </>
        )}

        {/* Tickets Drawer */}
        <Drawer
          title={`${selectedMonthStr} - ${selectedSubtype ? selectedSubtype.toUpperCase() : 'All'} TKT`}
          placement="right"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={900}
        >
          {ticketsLoading ? (
            <Spin spinning={true} tip="Loading tickets..." />
          ) : tickets.length === 0 ? (
            <Empty description="No tickets found" />
          ) : (
            <Table
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'display_id',
                  key: 'display_id',
                  width: 130,
                  render: (id: string) => (
                    <a style={{ cursor: 'pointer', color: '#1890ff' }}>{id}</a>
                  ),
                },
                {
                  title: 'Title',
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: 'Subtype',
                  dataIndex: 'subtype',
                  key: 'subtype',
                  width: 100,
                  render: (subtype: string) => (
                    <Tag color="purple">
                      {subtype || 'Unspecified'}
                    </Tag>
                  ),
                },
                {
                  title: 'State',
                  dataIndex: 'state',
                  key: 'state',
                  width: 90,
                  render: (state: string) => (
                    <Tag color={state === 'Resolved' || state === 'Closed' ? 'green' : state === 'In Progress' ? 'orange' : 'blue'}>
                      {state || '-'}
                    </Tag>
                  ),
                },
                {
                  title: 'Severity',
                  dataIndex: 'severity',
                  key: 'severity',
                  width: 80,
                  render: (severity: string) => (
                    <Tag color={severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'green'}>
                      {severity || '-'}
                    </Tag>
                  ),
                },
              ]}
              dataSource={tickets.map((ticket, idx) => ({
                ...ticket,
                key: idx,
              }))}
              onRow={(record) => ({
                onClick: () => handleTicketClick(record),
                style: { cursor: 'pointer' },
              })}
              pagination={{ pageSize: 20 }}
              size="small"
            />
          )}
        </Drawer>

        {/* Ticket Detail Drawer */}
        <Drawer
          title={selectedTicket ? `${selectedTicket.ticket.display_id} - ${selectedTicket.ticket.title}` : 'Ticket Details'}
          placement="right"
          onClose={handleTicketDetailClose}
          open={ticketDetailDrawerOpen}
          width={1000}
          style={{ zIndex: 1001 }}
        >
          {ticketDetailLoading ? (
            <Spin spinning={true} tip="Loading ticket details..." />
          ) : selectedTicket ? (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Basic Info */}
              <Card size="small" title="Basic Info">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <div><strong>Type:</strong> <Tag color="blue">{selectedTicket.ticket.type?.toUpperCase()}</Tag></div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div><strong>State:</strong> <Tag color={selectedTicket.ticket.state === 'Resolved' || selectedTicket.ticket.state === 'Closed' ? 'green' : selectedTicket.ticket.state === 'In Progress' ? 'orange' : 'blue'}>{selectedTicket.ticket.state || 'N/A'}</Tag></div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div><strong>Severity:</strong> <Tag color={selectedTicket.ticket.severity === 'high' ? 'red' : selectedTicket.ticket.severity === 'medium' ? 'orange' : 'green'}>{selectedTicket.ticket.severity || 'N/A'}</Tag></div>
                  </Col>
                  {selectedTicket.ticket.subtype && (
                    <Col xs={24} sm={12}>
                      <div><strong>Subtype:</strong> <Tag color="purple">{selectedTicket.ticket.subtype}</Tag></div>
                    </Col>
                  )}
                  {selectedTicket.ticket.applies_to_part_name && (
                    <Col xs={24} sm={12}>
                      <div><strong>Part:</strong> {selectedTicket.ticket.applies_to_part_name}</div>
                    </Col>
                  )}
                </Row>
              </Card>

              {/* Description */}
              {selectedTicket.ticket.body && (
                <Card size="small" title="Description">
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {selectedTicket.ticket.body}
                  </div>
                </Card>
              )}

              {/* Slack Conversation */}
              {selectedTicket.slackConversation && (
                <Card size="small" title="Slack Conversation">
                  {selectedTicket.slackConversation.error ? (
                    <Alert message="Error loading Slack messages" description={selectedTicket.slackConversation.error} type="warning" />
                  ) : selectedTicket.slackConversation.messages && selectedTicket.slackConversation.messages.length > 0 ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <small style={{ color: '#999' }}>Channel: {selectedTicket.slackConversation.channel}</small>
                      {selectedTicket.slackConversation.messages.map((msg, idx) => (
                        <div key={idx} style={{ borderLeft: '3px solid #1890ff', paddingLeft: '12px', paddingBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong>{msg.username || msg.user || 'Unknown User'}</strong>
                            <small style={{ color: '#999' }}>
                              {dayjs.unix(parseInt(msg.ts)).format('YYYY-MM-DD HH:mm:ss')}
                            </small>
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px' }}>
                            {msg.text}
                          </div>
                          {(msg as any).files && (msg as any).files.length > 0 && (
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                              📎 {(msg as any).files.length === 1 ? 'Media shared' : `${(msg as any).files.length} media files shared`}
                              {(msg as any).files.map((file: any, fidx: number) => (
                                <div key={fidx} style={{ marginTop: '4px', color: '#1890ff' }}>
                                  • {file.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </Space>
                  ) : (
                    <Empty description="No Slack messages found" />
                  )}
                </Card>
              )}

              {/* Internal Discussions */}
              {selectedTicket.discussions && selectedTicket.discussions.length > 0 && (
                <Card size="small" title="Internal Discussions">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {selectedTicket.discussions.map((discussion, idx) => (
                      <div key={discussion.id || idx} style={{ borderLeft: '3px solid #722ed1', paddingLeft: '12px', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>{discussion.created_by?.display_name || discussion.created_by?.full_name || 'Unknown User'}</strong>
                          {discussion.created_date && (
                            <small style={{ color: '#999' }}>
                              {dayjs(discussion.created_date).format('YYYY-MM-DD HH:mm:ss')}
                            </small>
                          )}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px' }}>
                          {discussion.body}
                        </div>
                      </div>
                    ))}
                  </Space>
                </Card>
              )}
            </Space>
          ) : (
            <Empty description="No ticket selected" />
          )}
        </Drawer>
      </Space>
    </Card>
  );
}
