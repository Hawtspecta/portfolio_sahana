import React from 'react';

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  initialExpanded?: boolean;
  onProgress?: (progress: number) => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

export interface ScrollExpandHandle {
  getRoot: () => HTMLDivElement | null;
  scrollToTop: () => void;
  scrollBy: (amount: number) => void;
}

declare const ScrollExpand: React.ForwardRefExoticComponent<
  ScrollExpandProps & React.RefAttributes<ScrollExpandHandle>
>;
export default ScrollExpand;

