import React from 'react';
import { FileDown, LoaderCircle } from 'lucide-react';
import IconButton from '../ui/IconButton';

function LoadingIcon(props) {
  return <LoaderCircle {...props} className={`${props.className || ''} animate-spin`} />;
}

export default function ExportAllButton({ onClick, disabled = false, loading = false }) {
  return (
    <IconButton
      icon={loading ? LoadingIcon : FileDown}
      label="Exporter tous les plannings"
      type="export"
      position="bottom"
      onClick={onClick}
      disabled={disabled || loading}
    />
  );
}
