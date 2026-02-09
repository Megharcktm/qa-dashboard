import React from 'react';
import { Button, Space, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useTickets } from '../../context/TicketsContext';

export const SyncButton: React.FC = () => {
  const { triggerSync, state } = useTickets();
  const isSyncing = state.syncStatus?.status === 'in_progress';

  const handleSync = async () => {
    message.loading({ content: 'Starting sync...', key: 'sync' });
    try {
      await triggerSync(false);
      message.success({ content: 'Sync completed!', key: 'sync', duration: 2 });
    } catch (error) {
      message.error({ content: 'Sync failed', key: 'sync', duration: 2 });
    }
  };

  return (
    <Button
      type="primary"
      icon={<SyncOutlined spin={isSyncing} />}
      loading={isSyncing}
      onClick={handleSync}
      disabled={isSyncing}
    >
      {isSyncing ? 'Syncing...' : 'Sync Now'}
    </Button>
  );
};
