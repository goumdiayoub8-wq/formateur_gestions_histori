import React from 'react';
import { Plus } from 'lucide-react';
import IconButton from '../ui/IconButton';

export default function PlanningCreateButton({ onClick, disabled = false }) {
  return (
    <IconButton
      icon={Plus}
      label="Creer planning"
      type="create"
      position="bottom"
      onClick={onClick}
      disabled={disabled}
    />
  );
}
