import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Dashboard } from './components/Dashboard/Dashboard';
import { TicketDetail } from './components/TicketDetail/TicketDetail';
import { TicketsProvider } from './context/TicketsContext';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <TicketsProvider>
          <Router>
            <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
            </Routes>
          </Router>
        </TicketsProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
