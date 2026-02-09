import React from 'react';
import { Row, Col, Card, Statistic, Divider, Space, Tag } from 'antd';
import { BugOutlined, FileTextOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Stats } from '../../types/ticket.types';

interface StatsCardsProps {
  stats: Stats | null;
  loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  if (!stats) {
    return null;
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading} bordered={false}>
            <div>
              <h4 style={{ margin: '0 0 12px 0' }}>Tickets Only (TKT)</h4>
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(stats.byType)
                  .filter(([type]) => type === 'ticket')
                  .map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>TKT</span>
                      <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>
                        {count}
                      </Tag>
                    </div>
                  ))}
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading} bordered={false}>
            <div>
              <h4 style={{ margin: '0 0 12px 0' }}>By State</h4>
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(stats.byState)
                  .slice(0, 4)
                  .map(([state, count]) => (
                    <div key={state} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{state}</span>
                      <Tag>{count}</Tag>
                    </div>
                  ))}
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading} bordered={false}>
            <div>
              <h4 style={{ margin: '0 0 12px 0' }}>By Priority</h4>
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(stats.byPriority).map(([priority, count]) => {
                  const color =
                    priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green';
                  return (
                    <div key={priority} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                      <Tag color={color}>{count}</Tag>
                    </div>
                  );
                })}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
