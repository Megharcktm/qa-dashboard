import React from 'react';
import { Layout, Space, Button, Spin } from 'antd';
import { SyncOutlined, ReloadOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTickets } from '../../context/TicketsContext';
import { useTheme } from '../../context/ThemeContext';

dayjs.extend(relativeTime);

export const Header: React.FC = () => {
  const { state, triggerSync } = useTickets();
  const { stats, syncStatus } = state;
  const { isDarkMode, toggleDarkMode } = useTheme();

  const isSyncing = syncStatus?.status === 'in_progress';

  const headerBg = isDarkMode ? '#141414' : '#fff';
  const textColor = isDarkMode ? '#rgba(255,255,255,0.85)' : '#000000';
  const syncTextColor = isDarkMode ? 'rgba(255,255,255,0.65)' : '#666';

  return (
    <Layout.Header
      style={{
        background: headerBg,
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: textColor }}>
          QA Dashboard
        </h1>
      </div>

      <Space>
        {stats?.lastSyncAt && (
          <div style={{ fontSize: '12px', color: syncTextColor }}>
            Last sync: {dayjs(stats.lastSyncAt).fromNow()}
          </div>
        )}

        <Button
          type="text"
          icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          style={{
            color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
            fontSize: '18px',
          }}
        />

        <Button
          type="primary"
          icon={<SyncOutlined />}
          loading={isSyncing}
          onClick={() => triggerSync(false)}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </Space>
    </Layout.Header>
  );
};
