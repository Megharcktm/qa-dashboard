import React from 'react';
import { Table, Tag, Select } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Ticket, PaginationInfo } from '../../types/ticket.types';

dayjs.extend(relativeTime);

interface TicketTableProps {
  tickets: Ticket[];
  loading: boolean;
  pagination: PaginationInfo;
  onPaginationChange: (page: number, pageSize: number) => void;
  onTicketClick?: (ticket: Ticket) => void;
  onAutomatedTestChange?: (ticketId: string, value: string) => void;
}

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  loading,
  pagination,
  onPaginationChange,
  onTicketClick,
  onAutomatedTestChange,
}) => {

  const columns = [
    {
      title: 'ID',
      dataIndex: 'display_id',
      key: 'display_id',
      width: 130,
      render: (text: string) => (
        <a style={{ cursor: 'pointer', color: '#1890ff' }}>{text}</a>
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
      render: (state: string) => {
        const color = state === 'Resolved' || state === 'Closed' ? 'green' : state === 'In Progress' ? 'orange' : 'blue';
        return <Tag color={color}>{state || 'N/A'}</Tag>;
      },
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
    {
      title: 'Automated Test',
      dataIndex: 'automated_test',
      key: 'automated_test',
      width: 150,
      render: (value: string, record: Ticket) => (
        <Select
          value={value || undefined}
          onChange={(selectedValue) => onAutomatedTestChange?.(record.id, selectedValue || '')}
          onClick={(e) => e.stopPropagation()}
          placeholder="Select status"
          allowClear
          style={{ width: '100%' }}
          options={[
            { label: 'Complete', value: 'completed' },
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Not Applicable', value: 'not_applicable' },
          ]}
        />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tickets}
      loading={loading}
      rowKey="id"
      pagination={{
        current: pagination.page,
        pageSize: Number(pagination.limit),
        total: pagination.total,
        totalBoundaryShowSizeChanger: 50,
        pageSizeOptions: ['10', '20', '50', '100'],
        onChange: onPaginationChange,
      }}
      onRow={(record) => ({
        onClick: () => onTicketClick?.(record),
        style: { cursor: 'pointer' },
      })}
      size="small"
    />
  );
};
