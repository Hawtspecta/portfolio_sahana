import { CSSProperties, ReactNode } from 'react';

export interface DockMenuItem {
  label?: string;
  icon?: ReactNode;
  onClick?: () => void;
  checked?: boolean;
  disabled?: boolean;
  shortcut?: string;
  separator?: boolean;
  items?: DockMenuItem[];
}

export interface DockItemData {
  icon?: ReactNode;
  label?: string;
  active?: boolean;
  badge?: number | string | boolean;
  className?: string;
  separator?: boolean;
  onClick?: () => void;
  menu?: DockMenuItem[];
}

export interface DockProps {
  items: DockItemData[];
  position?: 'bottom' | 'top' | 'left' | 'right';
  theme?: 'dark' | 'light';
  baseItemSize?: number;
  magnification?: number;
  distance?: number;
  panelHeight?: number;
  gap?: number;
  roundness?: number;
  spring?: { mass?: number; stiffness?: number; damping?: number };
  bounce?: boolean;
  autoHide?: boolean;
  tiles?: boolean;
  showLabels?: boolean;
  showIndicators?: boolean;
  showBadges?: boolean;
  badgeColor?: string;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Dock(props: DockProps): React.JSX.Element | null;

