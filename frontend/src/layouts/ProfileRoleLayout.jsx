import React from 'react';
import { useSelector } from 'react-redux';
import ChefLayout from './ChefLayout';
import DirecteurLayout from './DirecteurLayout';
import FormateurLayout from './FormateurLayout';

export default function ProfileRoleLayout() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role_id === 1) {
    return <DirecteurLayout />;
  }

  if (user?.role_id === 2) {
    return <ChefLayout />;
  }

  return <FormateurLayout />;
}
