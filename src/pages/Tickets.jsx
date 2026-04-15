import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../hooks/useTickets';
import { MessageSquare } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import TicketRow from '../components/tickets/TicketRow';

export default function Tickets() {
  const { user } = useAuth();
  const { tickets, loading, updateStatus } = useTickets(user?.id);

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">تذاكر الدعم</h1>
        <p className="page-subtitle">تابعي استفسارات ومشكلات العميلات التي تم تحويلها إليك</p>
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
            title="لا توجد تذاكر حالياً"
            description="عندما تعجز الموظفة الرقمية عن حل مشكلة معينة، ستقوم بفتح تذكرة لك هنا."
          />
        )}
      </div>
    </div>
  );
}
