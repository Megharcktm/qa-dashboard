import React, { useState, useCallback, useEffect } from 'react';
import { Row, Col, Select, Input, Button, Space, DatePicker } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { TicketFilters as ITicketFilters } from '../../types/ticket.types';

interface TicketFiltersProps {
  onFilterChange: (filters: ITicketFilters) => void;
  currentFilters: ITicketFilters;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  onFilterChange,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<ITicketFilters>(() => {
    // Initialize with currentFilters or default to ticket type
    return currentFilters && Object.keys(currentFilters).length > 0
      ? currentFilters
      : { type: 'ticket' };
  });

  // Sync local state with parent's currentFilters
  useEffect(() => {
    if (currentFilters && Object.keys(currentFilters).length > 0) {
      setFilters(currentFilters);
    }
  }, [currentFilters?.type, currentFilters?.state, currentFilters?.search, currentFilters?.dateFrom, currentFilters?.dateTo]);

  const handleTypeChange = (value: string) => {
    // Set to 'ticket' only if user clears the filter, otherwise use their selection
    const newType = value === '' ? 'ticket' : (value || undefined);
    const newFilters = { ...filters, type: newType };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStateChange = (value: string) => {
    const newFilters = { ...filters, state: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, search: e.target.value || undefined };
    setFilters(newFilters);
    // Don't call onFilterChange yet - wait for Enter key
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFilterChange(filters);
    }
  };

  const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
    let newFilters: ITicketFilters = { ...filters };
    if (dates && dates[0] && dates[1]) {
      newFilters.dateFrom = dates[0].startOf('day').toISOString();
      newFilters.dateTo = dates[1].endOf('day').toISOString();
    } else {
      newFilters = { ...newFilters, dateFrom: undefined, dateTo: undefined };
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: ITicketFilters = { type: 'ticket' };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Filter by Type"
            value={filters.type || 'ticket'}
            onChange={handleTypeChange}
            style={{ width: '100%' }}
            options={[
              { label: 'Ticket', value: 'ticket' },
              { label: 'Issue', value: 'issue' },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Filter by State"
            value={filters.state || undefined}
            onChange={handleStateChange}
            allowClear
            style={{ width: '100%' }}
            options={[
              { label: 'All States', value: '' },
              { label: 'Open', value: 'Open' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Resolved', value: 'Resolved' },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Search tickets... (press Enter)"
            prefix={<SearchOutlined />}
            value={filters.search || ''}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            allowClear
          />
        </Col>

        <Col xs={24} md={12}>
          <DatePicker.RangePicker
            placeholder={['From Date', 'To Date']}
            value={
              filters.dateFrom && filters.dateTo
                ? [dayjs(filters.dateFrom), dayjs(filters.dateTo)]
                : null
            }
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Col>

        <Col xs={24}>
          <Space>
            <Button type="primary" ghost onClick={handleReset} icon={<ClearOutlined />}>
              Reset Filters
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};
