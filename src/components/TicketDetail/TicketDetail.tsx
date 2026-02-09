import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Card, Descriptions, Tag, Collapse, Spin, Empty, Row, Col, Space, Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ticketsAPI } from '../../api/endpoints';
import { Ticket, SlackConversation, Discussion } from '../../types/ticket.types';
import { LoadingSpinner } from '../common/LoadingSpinner';

dayjs.extend(relativeTime);

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [slackConversation, setSlackConversation] = useState<SlackConversation | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTicket(id);
    }
  }, [id]);

  const fetchTicket = async (ticketId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ticketsAPI.getTicket(ticketId);
      setTicket(response.ticket);
      setRawData(response.rawData);
      if (response.slackConversation) {
        setSlackConversation(response.slackConversation);
      }
      if (response.discussions) {
        setDiscussions(response.discussions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>

          {error && <Alert message="Error" description={error} type="error" closable />}

          <LoadingSpinner loading={loading} message="Loading ticket details...">
            {ticket ? (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card title={`${ticket.display_id} - ${ticket.title}`} />

                {/* Basic Info */}
                <Card size="small" title="Basic Info">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <div><strong>Type:</strong> <Tag color="blue">{ticket.type?.toUpperCase()}</Tag></div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div><strong>State:</strong> <Tag color={ticket.state === 'Resolved' || ticket.state === 'Closed' ? 'green' : ticket.state === 'In Progress' ? 'orange' : 'blue'}>{ticket.state || 'N/A'}</Tag></div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div><strong>Severity:</strong> <Tag color={ticket.severity === 'high' ? 'red' : ticket.severity === 'medium' ? 'orange' : 'green'}>{ticket.severity || 'N/A'}</Tag></div>
                    </Col>
                    {ticket.subtype && (
                      <Col xs={24} sm={12}>
                        <div><strong>Subtype:</strong> <Tag color="purple">{ticket.subtype}</Tag></div>
                      </Col>
                    )}
                    {ticket.applies_to_part_name && (
                      <Col xs={24} sm={12}>
                        <div><strong>Part:</strong> {ticket.applies_to_part_name}</div>
                      </Col>
                    )}
                    {ticket.sprint_name && (
                      <Col xs={24} sm={12}>
                        <div><strong>Sprint:</strong> {ticket.sprint_name}</div>
                      </Col>
                    )}
                    <Col xs={24} sm={12}>
                      <div><strong>Created:</strong> {dayjs(ticket.created_date).format('YYYY-MM-DD HH:mm')}</div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div><strong>Modified:</strong> {dayjs(ticket.modified_date).format('YYYY-MM-DD HH:mm')}</div>
                    </Col>
                  </Row>
                </Card>

                {/* Description */}
                {ticket.body && (
                  <Card size="small" title="Description">
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {ticket.body}
                    </div>
                  </Card>
                )}

                {/* Slack Conversation */}
                {slackConversation && (
                  <Card size="small" title="Slack Conversation">
                      {slackConversation.error ? (
                        <Alert message="Error loading Slack messages" description={slackConversation.error} type="warning" />
                      ) : slackConversation.messages && slackConversation.messages.length > 0 ? (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <small style={{ color: '#999' }}>Channel: {slackConversation.channel}</small>
                          {slackConversation.messages.map((msg, idx) => (
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
                {discussions && discussions.length > 0 && (
                  <Card size="small" title="Internal Discussions">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {discussions.map((discussion, idx) => (
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
              !loading && <Empty description="Ticket not found" />
            )}
          </LoadingSpinner>
        </Space>
      </Layout.Content>
    </Layout>
  );
};
