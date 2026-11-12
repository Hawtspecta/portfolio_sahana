import type { CSSProperties } from 'react';

export interface CircularGalleryItem {
  image: string;
  text?: string;
  description?: string;
  alt?: string;
}

export interface CircularGalleryProps {
  items?: CircularGalleryItem[];
  bend?: number;
  itemSize?: number;
  itemAspect?: number;
  gap?: number;
  borderRadius?: number;
  wave?: number;
  fadeEdges?: number;
  shadow?: number;
  textColor?: string;
  font?: string;
  fontUrl?: string;
  showTitles?: boolean;
  scrollSpeed?: number;
  scrollEase?: number;
  snap?: boolean;
  loop?: boolean;
  autoScroll?: number;
  grayscale?: boolean;
  openOnClick?: boolean;
  intro?: boolean;
  onItemClick?: (item: CircularGalleryItem, index: number) => void;
  onActiveChange?: (index: number) => void;
  onOpenChange?: (isOpen: boolean) => void;
  openShiftX?: number;
  showCaption?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

export interface CircularGalleryHandle {
  step: (direction: number) => void;
  goTo: (index: number) => void;
  getActive: () => number;
  scrollBy: (deltaPx: number) => {
    atStart: boolean;
    atEnd: boolean;
    slot: number;
    targetSlot: number;
  };
}

declare const CircularGallery: React.ForwardRefExoticComponent<
  CircularGalleryProps & React.RefAttributes<CircularGalleryHandle>
>;

export default CircularGallery;

