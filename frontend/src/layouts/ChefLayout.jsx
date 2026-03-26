import React from 'react';
import RoleLayout from './RoleLayout';
import { roleNavigation } from '../config/navigation';

export default function ChefLayout() {
  return <RoleLayout roleKey="chef" roleLabel="Chef de pôle" navigation={roleNavigation.chef} />;
}
