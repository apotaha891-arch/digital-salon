import { useState, useEffect } from 'react';
import { Bot, Save, RotateCcw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { getAllStageInstructions, updateStageInstruction } from '../../services/salesAgent';
import { PIPELINE_STAGES } from '../../hooks/useSalesLeads';

const STAGE_LABELS = {
  prospect:      'Prospect',
  contacted:     'Contacted',
  replied:       'Replied',
  demo_booked:   'Demo Booked',
  proposal_sent: 'Proposal Sent',
  closed:        'Closed',
};

const STAGE_COLORS = {
  prospect:      '#6366f1',
  contacted:     '#3b82f6',
  replied:       '#06b6d4',
  demo_booked:   '#8b5cf6',
  proposal_sent: '#f59e0b',
  closed:        '#10b981',
};

export default function AdminAgentConfig() {
  const [instructions, setInstructions] = useState({});
  const [originals,    setOriginals]    = useState({});
  const [expanded,     setExpanded]     = useState(PIPELINE_STAGES[0]);
  const [saving,       setSaving]       = useState(null);
  const [saved,        setSaved]        = useState(null);
  const [loadError,    setLoadError]    = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await getAllStageInstructions();
        const map  = Object.fromEntries(rows.map(r => [r.stage, r.instruction]));
        setInstructions(map);
        setOriginals(map);
      } catch (e) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isDirty = (stage) => instructions[stage] !== originals[stage];

  const save = async (stage) => {
    setSaving(stage);
    try {
      await updateStageInstruction(stage, instructions[stage]);
      setOriginals(prev => ({ ...prev, [stage]: instructions[stage] }));
      setSaved(stage);
      setTimeout(() => setSaved(s => s === stage ? null : s), 2000);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(null);
    }
  };

  const reset = (stage) => {
    setInstructions(prev => ({ ...prev, [stage]: originals[stage] }));
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading agent configuration…
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#ef4444', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
        <AlertCircle size={18} /> {loadError}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Bot size={28} color="#6366f1" />
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            AI Agent Configuration
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Edit the outreach instructions the agent uses at each pipeline stage. Changes apply immediately — no code deployment needed.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PIPELINE_STAGES.map(stage => {
          const isOpen  = expanded === stage;
          const dirty   = isDirty(stage);
          const isSaved = saved === stage;

          return (
            <div
              key={stage}
              style={{
                border: `1px solid ${isOpen ? STAGE_COLORS[stage] : 'var(--border)'}`,
                borderRadius: 10,
                overflow: 'hidden',
                background: 'var(--card-bg)',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Stage header */}
              <button
                onClick={() => setExpanded(isOpen ? null : stage)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <span
                  style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: STAGE_COLORS[stage], flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: 15, flex: 1, textAlign: 'left' }}>
                  {STAGE_LABELS[stage]}
                </span>
                {dirty && (
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 99,
                    background: '#fef3c7', color: '#92400e', fontWeight: 600,
                  }}>
                    Unsaved
                  </span>
                )}
                {isSaved && (
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 99,
                    background: '#d1fae5', color: '#065f46', fontWeight: 600,
                  }}>
                    Saved ✓
                  </span>
                )}
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Instruction editor */}
              {isOpen && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '10px 0 6px' }}>
                    This instruction is appended to the system prompt when generating messages for leads in the <strong>{STAGE_LABELS[stage]}</strong> stage.
                    You can reference the lead's name, salon, city, and activity history — the agent sees full context.
                  </p>
                  <textarea
                    value={instructions[stage] ?? ''}
                    onChange={e => setInstructions(prev => ({ ...prev, [stage]: e.target.value }))}
                    rows={8}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--input-bg, var(--bg))',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      lineHeight: 1.6,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => reset(stage)}
                      disabled={!dirty}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 7,
                        border: '1px solid var(--border)', background: 'none',
                        color: dirty ? 'var(--text-secondary)' : 'var(--text-disabled, #aaa)',
                        cursor: dirty ? 'pointer' : 'default',
                        fontSize: 13,
                      }}
                    >
                      <RotateCcw size={13} /> Reset
                    </button>
                    <button
                      onClick={() => save(stage)}
                      disabled={!dirty || saving === stage}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 16px', borderRadius: 7,
                        border: 'none',
                        background: dirty ? STAGE_COLORS[stage] : 'var(--border)',
                        color: dirty ? '#fff' : 'var(--text-disabled, #aaa)',
                        cursor: dirty && saving !== stage ? 'pointer' : 'default',
                        fontWeight: 600, fontSize: 13,
                      }}
                    >
                      <Save size={13} />
                      {saving === stage ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 32, padding: 16, borderRadius: 10,
        background: 'var(--bg-subtle, #f8fafc)', border: '1px solid var(--border)',
        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Tips for effective instructions:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li>Be specific about tone (warm, professional, brief).</li>
          <li>Tell the agent what <em>not</em> to do (no pricing, no competitor mention).</li>
          <li>Specify the desired call-to-action for each stage.</li>
          <li>The agent always receives the full lead context — you do not need to repeat field names.</li>
          <li>Changes are live immediately for the next message generated for any lead in that stage.</li>
        </ul>
      </div>
    </div>
  );
}
