import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../hooks/useTickets';
import { MessageSquare } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import TicketRow from '../components/tickets/TicketRow';

export default function Tickets() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tickets, loading, updateStatus } = useTickets(user?.id);

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('tickets.title')}</h1>
        <p className="page-subtitle">{t('tickets.subtitle')}</p>
      </div>

      <div style={{ marginTop: 24 }}>
        {tickets.length > 0 ? (
          tickets.map(ticket => (
            <TicketRow 
              key={ticket.id} 
              ticket={ticket} 
              onUpdateStatus={updateStatus} 
            />
          ))
        ) : (
          <EmptyState 
            icon={MessageSquare}
            title={t('tickets.empty.title')}
            description={t('tickets.empty.description')}
          />
        )}
      </div>
    </div>
  );
}
