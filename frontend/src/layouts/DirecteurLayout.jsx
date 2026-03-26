import React from 'react';
import RoleLayout from './RoleLayout';
import { roleNavigation } from '../config/navigation';

export default function DirecteurLayout() {
  return <RoleLayout roleKey="directeur" roleLabel="Directeur" navigation={roleNavigation.directeur} />;
}
