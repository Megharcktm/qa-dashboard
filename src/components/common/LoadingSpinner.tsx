import React from 'react';
import { Spin, Empty } from 'antd';

interface LoadingSpinnerProps {
  loading: boolean;
  children?: React.ReactNode;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading,
  children,
  message = 'Loading...',
}) => {
  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>{message}</p>
      </div>
    );
  }

  return <>{children}</>;
};
