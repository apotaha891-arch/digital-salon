import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../hooks/useBusiness';
import Sidebar from './layout/Sidebar';

export default function Layout({ children, isAdmin = false }) {
  const { profile, user } = useAuth();
  const { business } = useBusiness(user?.id);

  return (
    <div className="app-layout">
      <Sidebar profile={profile} isAdmin={isAdmin} businessName={business?.name} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
