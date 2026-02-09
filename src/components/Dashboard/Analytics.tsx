import React, { useEffect, useState } from 'react';
import { Table, Tabs, Card, Spin, Empty, Tag, Row, Col, Select, DatePicker, Button, Space, Drawer, Alert } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { analyticsAPI } from '../../api/endpoints';
import { ticketsAPI } from '../../api/endpoints';
import { Ticket, TicketDetailResponse } from '../../types/ticket.types';
import { useTheme } from '../../context/ThemeContext';

interface PartAnalytics {
  part: string;
  total: number;
  byState: { [key: string]: number };
}

export const Analytics: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [analytics, setAnalytics] = useState<PartAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<string | undefined>(() => {
    return localStorage.getItem('analytics_state') || undefined;
  });
  // Default to current month
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(() => {
    const saved = localStorage.getItem('analytics_dateRange');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [dayjs(parsed[0]), dayjs(parsed[1])];
      } catch {
        return [dayjs().startOf('month'), dayjs().endOf('month')];
      }
    }
    return [dayjs().startOf('month'), dayjs().endOf('month')];
  });
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [partTickets, setPartTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('analytics_partTickets');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [partTicketsLoading, setPartTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetailResponse | null>(() => {
    const saved = localStorage.getItem('analytics_selectedTicket');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(() => {
    return localStorage.getItem('analytics_selectedTicketId') || null;
  });

  // Save state to localStorage
  useEffect(() => {
    if (state !== undefined) {
      localStorage.setItem('analytics_state', state);
    }
  }, [state]);

  // Save date range to localStorage
  useEffect(() => {
    if (dateRange) {
      localStorage.setItem('analytics_dateRange', JSON.stringify([dateRange[0].toISOString(), dateRange[1].toISOString()]));
    }
  }, [dateRange]);


  useEffect(() => {
    localStorage.setItem('analytics_partTickets', JSON.stringify(partTickets));
  }, [partTickets]);

  useEffect(() => {
    if (selectedTicket) {
      localStorage.setItem('analytics_selectedTicket', JSON.stringify(selectedTicket));
    } else {
      localStorage.removeItem('analytics_selectedTicket');
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (selectedTicketId) {
      localStorage.setItem('analytics_selectedTicketId', selectedTicketId);
    } else {
      localStorage.removeItem('analytics_selectedTicketId');
    }
  }, [selectedTicketId]);

  useEffect(() => {
    loadAnalytics();
  }, [state, dateRange?.[0]?.toString(), dateRange?.[1]?.toString()]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (state && state !== 'all') filters.state = state;
      if (dateRange?.[0] && dateRange?.[1]) {
        filters.dateFrom = dateRange[0].startOf('day').toISOString();
        filters.dateTo = dateRange[1].endOf('day').toISOString();
      }

      const response = await analyticsAPI.getByPart(filters);
      setAnalytics(response.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadPartTickets = async (part: string) => {
    try {
      setPartTicketsLoading(true);
      // Build filters - include current state and date filters
      const filters: any = { type: 'ticket' };
      if (state && state !== 'all') filters.state = state;
      if (dateRange?.[0] && dateRange?.[1]) {
        filters.dateFrom = dateRange[0].startOf('day').toISOString();
        filters.dateTo = dateRange[1].endOf('day').toISOString();
      }

      const response = await ticketsAPI.getTickets(
        filters,
        { page: 1, limit: 100, total: 0, totalPages: 0 }
      );
      // Filter to only show tickets from the selected part
      const filtered = response.tickets.filter(t => t.applies_to_part_name === part);
      setPartTickets(filtered);
    } catch (err) {
      console.error('Error loading part tickets:', err);
    } finally {
      setPartTicketsLoading(false);
    }
  };

  const handlePartClick = (part: string) => {
    setSelectedPart(part);
    loadPartTickets(part);
  };

  const handleTicketClick = async (ticketId: string) => {
    try {
      setTicketDetailLoading(true);
      setSelectedTicketId(ticketId);
      const response = await ticketsAPI.getTicket(ticketId);
      setSelectedTicket(response);
    } catch (err) {
      console.error('Error loading ticket details:', err);
    } finally {
      setTicketDetailLoading(false);
    }
  };

  // Load saved ticket on mount
  useEffect(() => {
    if (selectedTicketId && !selectedTicket) {
      handleTicketClick(selectedTicketId);
    }
  }, []);

  // Save selected ticket ID to localStorage
  useEffect(() => {
    if (selectedTicketId) {
      localStorage.setItem('analytics_selectedTicketId', selectedTicketId);
    } else {
      localStorage.removeItem('analytics_selectedTicketId');
    }
  }, [selectedTicketId]);

  // Clear selected ticket when drawer closes
  const handleTicketDetailClose = () => {
    setSelectedTicket(null);
    setSelectedTicketId(null);
  };

  const handleReset = () => {
    setState(undefined);
    setDateRange([dayjs().startOf('month'), dayjs().endOf('month')]);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin spinning={true} size="large" tip="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ marginBottom: '24px' }}>
        <Empty description={error} />
      </Card>
    );
  }

  if (analytics.length === 0) {
    return <Empty description="No data available" />;
  }

  // Create table columns
  const columns: any[] = [
    {
      title: 'Product Area',
      dataIndex: 'part',
      key: 'part',
      width: 200,
      fixed: 'left',
      render: (text: string) => (
        <Button
          type="link"
          onClick={() => handlePartClick(text)}
          style={{ padding: 0, textAlign: 'left', fontSize: '14px', fontWeight: 500 }}
        >
          {text || 'Unknown'}
        </Button>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 80,
      render: (count: number) => (
        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
          {count}
        </Tag>
      ),
    },
  ];


  const dataWithKeys = analytics.map((item, idx) => ({
    ...item,
    key: idx,
  }));

  const filterBgColor = isDarkMode ? 'rgba(255,255,255,0.05)' : '#fafafa';

  return (
    <div style={{ padding: '24px', borderRadius: '4px' }}>
      <h2 style={{ marginBottom: '24px' }}>Product Area Analytics</h2>

      {/* Filters */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: filterBgColor, borderRadius: '4px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by State"
              value={state || undefined}
              onChange={setState}
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: 'All States', value: 'all' },
                { label: 'Open', value: 'Open' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Resolved', value: 'Resolved' },
              ]}
            />
          </Col>

          <Col xs={24} md={12}>
            <DatePicker.RangePicker
              placeholder={['From Date', 'To Date']}
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Col>

          <Col xs={24}>
            <Button type="primary" ghost onClick={handleReset} icon={<ClearOutlined />}>
              Reset Filters
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={[
          ...columns,
          {
            title: 'Open',
            dataIndex: ['byState', 'Open'],
            key: 'state_open',
            width: 70,
            render: (count: number) => (
              <Tag color="blue">{count || 0}</Tag>
            ),
          },
          {
            title: 'In Progress',
            dataIndex: ['byState', 'In Progress'],
            key: 'state_in_progress',
            width: 110,
            render: (count: number) => (
              <Tag color="orange">{count || 0}</Tag>
            ),
          },
          {
            title: 'Resolved',
            dataIndex: ['byState', 'Resolved'],
            key: 'state_resolved',
            width: 80,
            render: (count: number) => (
              <Tag color="green">{count || 0}</Tag>
            ),
          },
        ]}
        dataSource={dataWithKeys}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1000 }}
        bordered
      />

      {/* Ticket Detail Drawer */}
      <Drawer
        title={selectedTicket ? `${selectedTicket.ticket.display_id} - ${selectedTicket.ticket.title}` : 'Ticket Details'}
        placement="right"
        onClose={handleTicketDetailClose}
        open={selectedTicket !== null}
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
        ) : null}
      </Drawer>

      {/* Drawer to show tickets for selected part */}
      <Drawer
        title={`Tickets - ${selectedPart}`}
        placement="right"
        onClose={() => setSelectedPart(null)}
        open={selectedPart !== null}
        width={900}
      >
        {partTicketsLoading ? (
          <Spin spinning={true} tip="Loading tickets..." />
        ) : partTickets.length === 0 ? (
          <Empty description="No tickets found" />
        ) : (
          <>
            {/* Status Summary */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: filterBgColor, borderRadius: '4px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      {partTickets.length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
                  </div>
                </Col>
                <Col xs={24} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      {partTickets.filter(t => t.state === 'Open').length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Open</div>
                  </div>
                </Col>
                <Col xs={24} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                      {partTickets.filter(t => t.state === 'In Progress').length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>In Progress</div>
                  </div>
                </Col>
                <Col xs={24} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      {partTickets.filter(t => t.state === 'Resolved' || t.state === 'Closed').length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Resolved</div>
                  </div>
                </Col>
              </Row>
            </div>
            <Table
            columns={[
              {
                title: 'ID',
                dataIndex: 'display_id',
                key: 'display_id',
                width: 130,
                render: (text: string) => (
                  <a style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => handleTicketClick(text)}>
                    {text}
                  </a>
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
                  <Tag color={state === 'Resolved' ? 'green' : state === 'In Progress' ? 'orange' : 'blue'}>
                    {state || '-'}
                  </Tag>
                ),
              },
              {
                title: 'Severity',
                dataIndex: 'severity',
                key: 'severity',
                width: 90,
                render: (severity: string) => (
                  <Tag color={severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'green'}>
                    {severity || '-'}
                  </Tag>
                ),
              },
            ]}
            dataSource={partTickets.map((ticket, idx) => ({
              ...ticket,
              key: idx,
            }))}
            onRow={(record) => ({
              onClick: () => handleTicketClick(record.display_id),
              style: { cursor: 'pointer' },
            })}
            pagination={{ pageSize: 10 }}
            size="small"
          />
          </>
        )}
      </Drawer>
    </div>
  );
};
