import React from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './layout/Sidebar';

export default function Layout({ children, isAdmin = false }) {
  const { profile } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar profile={profile} isAdmin={isAdmin} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
