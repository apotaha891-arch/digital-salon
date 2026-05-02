import { useState, useEffect, useCallback } from 'react';
import {
  getLeads, createLead, updateLead, deleteLead,
  addActivity, addTask, toggleTask, getTeamMembers,
} from '../services/salesLeads';

export const PIPELINE_STAGES = [
  'prospect', 'contacted', 'replied', 'demo_booked', 'proposal_sent', 'closed',
];

const STAGE_LABELS = {
  prospect: 'Prospect', contacted: 'Contacted', replied: 'Replied',
  demo_booked: 'Demo Booked', proposal_sent: 'Proposal Sent', closed: 'Closed',
};

const STAGE_AUTO_TASKS = {
  contacted:     'Follow up if no reply within 3 days',
  replied:       'Book a demo call',
  demo_booked:   'Send demo confirmation and prep material',
  proposal_sent: 'Follow up on proposal within 2 days',
};

// Returns a human-readable error string if the transition is blocked, or null if allowed.
export function getTransitionError(lead, targetStatus, demoScheduledAt, closedReason) {
  const activities = lead.activities || [];

  if (targetStatus === 'contacted') {
    const hasOutreach = activities.some(a => a.type === 'dm_sent' || a.type === 'whatsapp_sent');
    if (!hasOutreach)
      return 'Log a DM or WhatsApp message in Activities before marking as Contacted.';
  }

  if (targetStatus === 'demo_booked') {
    if (!demoScheduledAt)
      return 'A demo date and time is required to move to Demo Booked.';
  }

  if (targetStatus === 'proposal_sent') {
    const hasProposal = activities.some(a => a.type === 'proposal_sent');
    if (!hasProposal)
      return 'Log a "Proposal Sent" activity before moving to this stage.';
  }

  if (targetStatus === 'closed') {
    if (!closedReason)
      return 'Select a closed reason before closing this lead.';
  }

  return null;
}

export function useSalesLeads() {
  const [leads, setLeads]     = useState([]);
  const [team, setTeam]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsData, teamData] = await Promise.all([getLeads(), getTeamMembers()]);
      setLeads(leadsData);
      setTeam(teamData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addLead = async (leadData) => {
    const created = await createLead(leadData);
    setLeads(prev => [created, ...prev]);
    return created;
  };

  const editLead = async (id, updates) => {
    const updated = await updateLead(id, updates);
    setLeads(prev => prev.map(l => l.id === id ? updated : l));
    return updated;
  };

  // opts: { closedReason, demoScheduledAt }
  const moveLead = async (lead, targetStatus, userId, opts = {}) => {
    const { closedReason, demoScheduledAt } = opts;

    const updates = { status: targetStatus };
    if (closedReason)    updates.closed_reason      = closedReason;
    if (demoScheduledAt) updates.demo_scheduled_at  = demoScheduledAt;

    const updated = await updateLead(lead.id, updates);

    // Auto-log the stage transition as an activity
    const autoNote = `Stage moved: ${STAGE_LABELS[lead.status]} → ${STAGE_LABELS[targetStatus]}`;
    const activity = await addActivity({ lead_id: lead.id, type: 'note', content: autoNote, performed_by: userId });

    setLeads(prev => prev.map(l =>
      l.id === lead.id
        ? { ...updated, activities: [...(updated.activities || []), activity] }
        : l
    ));

    // Auto-create suggested follow-up task
    const taskDesc = STAGE_AUTO_TASKS[targetStatus];
    if (taskDesc) {
      const task = await addTask({ lead_id: lead.id, description: taskDesc, assigned_to: userId });
      setLeads(prev => prev.map(l =>
        l.id === lead.id ? { ...l, tasks: [...(l.tasks || []), task] } : l
      ));
    }

    return { ...updated, activities: [...(updated.activities || []), activity] };
  };

  const removeLead = async (id) => {
    await deleteLead(id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const logActivity = async (leadId, type, content, userId) => {
    const activity = await addActivity({ lead_id: leadId, type, content, performed_by: userId });
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, activities: [...(l.activities || []), activity] } : l
    ));
    return activity;
  };

  const createTask = async (leadId, description, dueDate, assignedTo) => {
    const task = await addTask({ lead_id: leadId, description, due_date: dueDate, assigned_to: assignedTo });
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, tasks: [...(l.tasks || []), task] } : l
    ));
    return task;
  };

  const completeTask = async (leadId, taskId, isDone) => {
    await toggleTask(taskId, isDone);
    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, is_completed: isDone } : t) }
        : l
    ));
  };

  return {
    leads, team, loading, error, reload: load,
    addLead, editLead, moveLead, removeLead,
    logActivity, createTask, completeTask,
  };
}
