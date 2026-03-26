import React from 'react';
import RoleLayout from './RoleLayout';
import { roleNavigation } from '../config/navigation';

export default function FormateurLayout() {
  return <RoleLayout roleKey="formateur" roleLabel="Formateur" navigation={roleNavigation.formateur} />;
}
