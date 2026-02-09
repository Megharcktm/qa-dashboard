import React, { useEffect, useState } from 'react';
import { Layout, Space, Alert, Empty, Tabs, DatePicker, Row, Col, Button, Drawer, Spin, Card, Tag } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useTickets } from '../../context/TicketsContext';
import { TicketTable } from '../TicketList/TicketTable';
import { TicketFilters } from '../TicketList/TicketFilters';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Analytics } from './Analytics';
import { MonthlyStats } from './MonthlyStats';
import { AutomationPlans } from './AutomationPlans';
import { Ticket, TicketDetailResponse } from '../../types/ticket.types';
import { ticketsAPI } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';

export const Dashboard: React.FC = () => {
  const { state, fetchTickets, fetchStats, clearError } = useTickets();
  const { tickets, stats, loading, error, filters, pagination } = state;
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('dashboard_activeTab') || 'tickets';
  });
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(() => {
    const saved = localStorage.getItem('dashboard_dateRange');
    if (saved) {
      try {
        const [from, to] = JSON.parse(saved);
        return [dayjs(from), dayjs(to)];
      } catch {
        return [dayjs().startOf('month'), dayjs().endOf('month')];
      }
    }
    return [dayjs().startOf('month'), dayjs().endOf('month')];
  });
  const [savedFilters, setSavedFilters] = useState(() => {
    const saved = localStorage.getItem('dashboard_filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });
  const [selectedTicket, setSelectedTicket] = useState<TicketDetailResponse | null>(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [ticketDetailDrawerOpen, setTicketDetailDrawerOpen] = useState(false);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (dateRange) {
      localStorage.setItem('dashboard_dateRange', JSON.stringify([dateRange[0].toISOString(), dateRange[1].toISOString()]));
    }
  }, [dateRange]);

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      localStorage.setItem('dashboard_filters', JSON.stringify(filters));
    }
  }, [filters]);

  useEffect(() => {
    // Load initial data with saved filters or defaults
    fetchStats();
    const dateFrom = dateRange?.[0]?.startOf('day').toISOString() || dayjs().startOf('month').toISOString();
    const dateTo = dateRange?.[1]?.endOf('day').toISOString() || dayjs().endOf('month').toISOString();
    const initialFilters = { type: 'ticket', ...savedFilters, dateFrom, dateTo };
    fetchTickets(initialFilters, { page: 1, limit: 50, total: 0, totalPages: 0 });
  }, []);

  const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
    setDateRange(dates);
    let newFilters = { ...filters };
    if (dates && dates[0] && dates[1]) {
      newFilters.dateFrom = dates[0].startOf('day').toISOString();
      newFilters.dateTo = dates[1].endOf('day').toISOString();
    } else {
      newFilters = { ...newFilters, dateFrom: undefined, dateTo: undefined };
    }
    fetchTickets(newFilters, { page: 1, limit: 50, total: 0, totalPages: 0 });
  };

  const handleFilterChange = (newFilters: any) => {
    // Merge with existing date range - always include type: ticket
    const mergedFilters = { type: 'ticket', ...newFilters };
    if (dateRange?.[0] && dateRange?.[1]) {
      mergedFilters.dateFrom = dateRange[0].startOf('day').toISOString();
      mergedFilters.dateTo = dateRange[1].endOf('day').toISOString();
    }
    // Save filters to localStorage before fetching
    localStorage.setItem('dashboard_filters', JSON.stringify(mergedFilters));
    fetchTickets(mergedFilters, { page: 1, limit: 50, total: 0, totalPages: 0 });
  };

  const handleResetDate = () => {
    setDateRange(null);
    const dateFrom = dayjs().startOf('month').toISOString();
    const dateTo = dayjs().endOf('month').toISOString();
    fetchTickets({ ...filters, dateFrom, dateTo }, { page: 1, limit: 50, total: 0, totalPages: 0 });
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    const paginationFilters = { type: 'ticket', ...filters };
    if (dateRange?.[0] && dateRange?.[1]) {
      paginationFilters.dateFrom = dateRange[0].startOf('day').toISOString();
      paginationFilters.dateTo = dateRange[1].endOf('day').toISOString();
    }
    fetchTickets(paginationFilters, { page, limit: pageSize, total: pagination.total, totalPages: pagination.totalPages });
  };

  const handleTicketClick = async (ticket: Ticket) => {
    try {
      setTicketDetailLoading(true);
      const response = await ticketsAPI.getTicket(ticket.display_id);
      setSelectedTicket(response);
      setTicketDetailDrawerOpen(true);
    } catch (err) {
      console.error('Error loading ticket details:', err);
    } finally {
      setTicketDetailLoading(false);
    }
  };

  const handleTicketDetailClose = () => {
    setSelectedTicket(null);
    setTicketDetailDrawerOpen(false);
  };

  const handleAutomatedTestChange = async (ticketId: string, value: string) => {
    try {
      console.log('Updating automated test:', ticketId, value);
      const result = await ticketsAPI.updateAutomatedTest(ticketId, value);
      console.log('Update response:', result);
      // Refresh tickets to show updated value
      await fetchTickets(filters, pagination);
    } catch (err) {
      console.error('Error updating automated test field:', err);
      // Show error to user in future - for now just log
    }
  };

  const secondaryTextColor = isDarkMode ? 'rgba(255,255,255,0.65)' : '#999';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              closable
              onClose={clearError}
            />
          )}

          <MonthlyStats onDateRangeChange={(date) => {
            if (date) {
              setDateRange([date.startOf('month'), date.endOf('month')]);
            }
          }} />

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'tickets',
                label: <span style={{ fontSize: '16px', fontWeight: 500 }}>Detailed View</span>,
                children: (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ padding: '24px', borderRadius: '4px' }}>
                      <h2 style={{ margin: '0 0 16px 0' }}>Tickets</h2>
                      {/* Default filters applied: current month date range, type defaults to ticket in UI */}
                      <TicketFilters onFilterChange={handleFilterChange} currentFilters={filters} />
                    </div>

                    <LoadingSpinner loading={loading} message="Loading tickets...">
                      {tickets.length === 0 ? (
                        <div style={{ padding: '50px', textAlign: 'center' }}>
                          <Empty
                            description="No tickets found"
                            style={{ marginTop: '50px' }}
                          />
                        </div>
                      ) : (
                        <TicketTable
                          tickets={tickets}
                          loading={loading}
                          pagination={pagination}
                          onPaginationChange={handlePaginationChange}
                          onTicketClick={handleTicketClick}
                          onAutomatedTestChange={handleAutomatedTestChange}
                        />
                      )}
                    </LoadingSpinner>
                  </Space>
                ),
              },
              {
                key: 'analytics',
                label: <span style={{ fontSize: '16px', fontWeight: 500 }}>Product Area Analytics</span>,
                children: <Analytics />,
              },
              {
                key: 'automation-plans',
                label: <span style={{ fontSize: '16px', fontWeight: 500 }}>Automation Plans</span>,
                children: <AutomationPlans />,
              },
            ]}
          />

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
                        <small style={{ color: secondaryTextColor }}>Channel: {selectedTicket.slackConversation.channel}</small>
                        {selectedTicket.slackConversation.messages.map((msg, idx) => (
                          <div key={idx} style={{ borderLeft: '3px solid #1890ff', paddingLeft: '12px', paddingBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <strong>{msg.username || msg.user || 'Unknown User'}</strong>
                              <small style={{ color: secondaryTextColor }}>
                                {dayjs.unix(parseInt(msg.ts)).format('YYYY-MM-DD HH:mm:ss')}
                              </small>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px' }}>
                              {msg.text}
                            </div>
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
                              <small style={{ color: secondaryTextColor }}>
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
      </Layout.Content>
    </Layout>
  );
};
