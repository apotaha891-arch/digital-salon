import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../hooks/useAgent';
import { useIntegrations } from '../hooks/useIntegrations';
import Spinner from '../components/ui/Spinner';
import IntegrationsTab from './Setup/tabs/IntegrationsTab';
import { Plug } from 'lucide-react';

export default function Integrations() {
  const { user, loading: authLoading } = useAuth();
  
  // Use the same hooks we created in Phase 3
  const { agent, loading: aLoading } = useAgent(user?.id);
  const { activeToolsMap, loading: iLoading, updateIntegration } = useIntegrations(user?.id);

  const loading = authLoading || aLoading || iLoading;

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Plug size={28} style={{ color: 'var(--primary)' }} /> أدوات التواصل والربط
        </h1>
        <p className="page-subtitle">اربطي موظفتك الرقمية بقنوات التواصل لتستقبل الطلبات</p>
      </div>

      <div style={{ marginTop: 32 }}>
        <IntegrationsTab 
          activeTools={activeToolsMap} 
          agentId={agent?.id}
          agentName={agent?.name}
          onToolSave={updateIntegration}
        />
      </div>
    </div>
  );
}
