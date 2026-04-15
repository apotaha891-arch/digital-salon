import React, { useState } from 'react';
import { Settings, Save, Loader2, CloudLightning, Home, Briefcase, User, Plug } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../hooks/useBusiness';
import { useAgent } from '../../hooks/useAgent';
import { useIntegrations } from '../../hooks/useIntegrations';

import SourcesTab from './tabs/SourcesTab';
import BusinessTab from './tabs/BusinessTab';
import ServicesTab from './tabs/ServicesTab';
import PersonaTab from './tabs/PersonaTab';
import IntegrationsTab from './tabs/IntegrationsTab';
import Spinner from '../../components/ui/Spinner';

const TABS = [
  { id: 'sources', label: 'مصادر المعرفة', icon: CloudLightning },
  { id: 'business', label: 'معلومات الصالون', icon: Home },
  { id: 'services', label: 'الخدمات والمواعيد', icon: Briefcase },
  { id: 'persona', label: 'شخصية الموظفة', icon: User },
  { id: 'integrations', label: 'الربط التقني', icon: Plug },
];

export default function Setup() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sources');
  const [success, setSuccess] = useState('');

  // Hooks for state & actions
  const { business, loading: bLoading, updateBusiness, saving: bSaving } = useBusiness(user?.id);
  const { agent, loading: aLoading, updateAgent, saving: aSaving } = useAgent(user?.id);
  const { activeToolsMap, loading: iLoading, updateIntegration } = useIntegrations(user?.id);

  const loading = bLoading || aLoading || iLoading;
  const saving = bSaving || aSaving;

  const handleGlobalSave = async () => {
    try {
      if (activeTab === 'persona') await updateAgent(agent);
      else if (activeTab === 'business' || activeTab === 'services') await updateBusiness(business);
      
      setSuccess('تم حفظ التعديلات بنجاح ✨');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* Header & Tabs */}
      <div style={{ marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <Settings size={28} style={{ color: 'var(--primary)' }} /> إعدادات الصالون الشاملة
            </h1>
            <p className="page-subtitle">تحكم في كل شاردة وواردة في صالونك وموظفتك الرقمية من مكان واحد</p>
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
            business={business} 
            onUpdate={data => updateBusiness(data)} // Updates local state via hook if we want sync, but here we update the whole object
            // To make it feel fast, we should probably handle local state in hook.
            // For now, let's keep it simple.
          />
        )}

        {activeTab === 'services' && (
          <ServicesTab 
            services={business?.services || []} 
            onUpdate={services => updateBusiness({ ...business, services })} 
          />
        )}

        {activeTab === 'persona' && (
          <PersonaTab 
            agent={agent} 
            onUpdate={data => updateAgent(data)} 
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
               {saving ? <Loader2 className="spinner" size={18} /> : <><Save size={18} /> حفظ التعديلات</>}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
