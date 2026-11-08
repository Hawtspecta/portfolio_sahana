import React from 'react';

export interface MagicBentoItem {
  id?: string | number;
  label?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  image?: string;
  visual?: 'analytics' | 'dashboard' | 'collaboration' | 'automation' | 'integration' | 'security' | React.ReactNode;
  content?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: React.MouseEvent) => void;
  colSpan?: number;
  rowSpan?: number;
}

export interface MagicBentoProps {
  items?: MagicBentoItem[];
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  theme?: 'dark' | 'light';
  glowColor?: string;
  textAutoHide?: boolean;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  enableStars?: boolean;
  particleCount?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  intro?: boolean;
  disableAnimations?: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

declare const MagicBento: React.FC<MagicBentoProps>;
export default MagicBento;

