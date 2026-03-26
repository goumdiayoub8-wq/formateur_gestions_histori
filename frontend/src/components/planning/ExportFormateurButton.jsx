import React from 'react';
import { FileDown, LoaderCircle } from 'lucide-react';
import IconButton from '../ui/IconButton';

function LoadingIcon(props) {
  return <LoaderCircle {...props} className={`${props.className || ''} animate-spin`} />;
}

export default function ExportFormateurButton({
  onClick,
  disabled = false,
  loading = false,
  label = 'Exporter ce formateur',
  position = 'top',
  size = 'sm',
}) {
  return (
    <IconButton
      icon={loading ? LoadingIcon : FileDown}
      label={label}
      type="export"
      position={position}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
    />
  );
}
