import React from 'react';
import { ContextMenu, ContextMenuTrigger } from './ui/context-menu';

interface ContextMenuWrapperProps {
  children: React.ReactElement;
}

const ContextMenuWrapper = ({ 
    children,
}: ContextMenuWrapperProps) => {
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
    </ContextMenu>
  );
};

export default ContextMenuWrapper;
