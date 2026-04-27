import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, CloudLightning, Home, Briefcase, User, Plug, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../hooks/useBusiness';
import { useAgent } from '../../hooks/useAgent';
import { useIntegrations } from '../../hooks/useIntegrations';
import { useSubscription } from '../../hooks/useSubscription';

import SourcesTab from './tabs/SourcesTab';
import BusinessTab from './tabs/BusinessTab';
import ServicesTab from './tabs/ServicesTab';
import PersonaTab from './tabs/PersonaTab';
import IntegrationsTab from './tabs/IntegrationsTab';
import Spinner from '../../components/ui/Spinner';
import PlansModal from '../../components/billing/PlansModal';

export default function Setup() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sources');
  const [success, setSuccess] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const { subscription, plans } = useSubscription(user?.id);

  const TABS = [
    { id: 'sources', label: t('setup.tabs.sources'), icon: CloudLightning },
    { id: 'business', label: t('setup.tabs.business'), icon: Home },
    { id: 'services', label: t('setup.tabs.services'), icon: Briefcase },
    { id: 'persona', label: t('setup.tabs.persona'), icon: User },
    { id: 'integrations', label: t('setup.tabs.integrations'), icon: Plug },
  ];

  // 1. Hook for persistent data
  const { business, loading: bLoading, updateBusiness, saving: bSaving } = useBusiness(user?.id);
  const { agent, loading: aLoading, updateAgent, saving: aSaving } = useAgent(user?.id);
  const { activeToolsMap, loading: iLoading, updateIntegration } = useIntegrations(user?.id);

  // 2. Local state for editing (Drafts)
  const [localBusiness, setLocalBusiness] = useState(null);
  const [localAgent, setLocalAgent] = useState(null);

  const DEFAULT_BUSINESS = { name: '', phone: '', location: '', hours: '', instagram: '', services: [], metadata: {} };
  const DEFAULT_AGENT = { name: 'لين', avatar: '💅', instructions: '', is_active: false, model_provider: 'gemini' };

  // Sync local state when hook data loads
  useEffect(() => {
    if (!bLoading && !localBusiness) setLocalBusiness(business || DEFAULT_BUSINESS);
  }, [bLoading, business]);

  useEffect(() => {
    if (!aLoading && !localAgent) setLocalAgent(agent || DEFAULT_AGENT);
  }, [aLoading, agent]);

  const loading = bLoading || aLoading || iLoading;
  const saving = bSaving || aSaving;

  const handleGlobalSave = async () => {
    try {
      if (activeTab === 'persona') {
        await updateAgent(localAgent);
      } else if (activeTab === 'business' || activeTab === 'services') {
        await updateBusiness(localBusiness);
      }
      setSuccess(t('setup.save_success'));
      setTimeout(() => setSuccess(''), 3000);
      // Show plans modal after first save if not subscribed yet
      if (!subscription) setShowPlans(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !localBusiness || !localAgent) return <Spinner centered={true} />;

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      <PlansModal
        isOpen={showPlans}
        onClose={() => setShowPlans(false)}
        userId={user?.id}
        isAr={t('common.save') === 'حفظ'}
        plans={plans}
      />
      {/* Header & Tabs */}
      <div style={{ marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <Settings size={28} style={{ color: 'var(--primary)' }} /> {t('setup.title')}
            </h1>
            <p className="page-subtitle">{t('setup.subtitle')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 1 }}>
          {TABS.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', border: 'none',
                background: activeTab === tab.id ? 'rgba(217,70,239,0.08)' : 'none', 
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 900 : 500, fontSize: 13, cursor: 'pointer',
                borderBottom: `3px solid ${activeTab === tab.id ? 'var(--primary)' : 'transparent'}`,
                borderTopLeftRadius: 12, borderTopRightRadius: 12, transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}>
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 40 }}>
        {activeTab === 'sources' && <SourcesTab />}
        
        {activeTab === 'business' && (
          <BusinessTab 
            business={localBusiness} 
            onUpdate={setLocalBusiness} 
          />
        )}

        {activeTab === 'services' && (
          <ServicesTab 
            services={localBusiness.services || []} 
            onUpdate={services => setLocalBusiness({ ...localBusiness, services })} 
          />
        )}

        {activeTab === 'persona' && (
          <PersonaTab 
            agent={localAgent} 
            onUpdate={setLocalAgent} 
          />
        )}

        {activeTab === 'integrations' && (
          <IntegrationsTab 
            activeTools={activeToolsMap} 
            agentId={agent?.id}
            agentName={agent?.name}
            onToolSave={updateIntegration}
          />
        )}

        {/* Global Save Button for non-integration tabs */}
        {['persona', 'business', 'services'].includes(activeTab) && (
          <div style={{ 
            marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', 
            display: 'flex', justifyContent: 'flex-end', gap: 16, alignItems: 'center' 
          }}>
             {success && <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 700 }}>{success}</span>}
             <button className="btn btn-primary" onClick={handleGlobalSave} disabled={saving} style={{ padding: '14px 40px', fontWeight: 900 }}>
               {saving ? <Loader2 className="spinner" size={18} /> : <><Save size={18} /> {t('setup.save_btn')}</>}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
