import React, { CSSProperties } from 'react';

export interface FlexCarouselItem {
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  expandSrc?: string;
  [key: string]: any;
}

export interface FlexCarouselProps {
  items?: FlexCarouselItem[];
  preset?: 'liquid' | 'ribbon' | 'vortex' | 'arch';
  intro?: 'rise' | 'bloom' | 'spin' | 'deal' | 'none';
  fit?: 'natural' | 'portrait' | 'square' | 'landscape';
  cardHeight?: number;
  gap?: number;
  radius?: number;
  lensWidth?: number;
  lensHeight?: number;
  tilt?: number;
  roundness?: number;
  bend?: number;
  reach?: number;
  curl?: 'twist' | 'rise' | 'fall';
  dispersion?: number;
  liquid?: number;
  followCursor?: boolean;
  squeeze?: number;
  focusOnClick?: boolean;
  autoplay?: boolean;
  interval?: number;
  captions?: boolean;
  captureWheel?: boolean;
  onChange?: (index: number, item: FlexCarouselItem) => void;
  onSelect?: (index: number, item: FlexCarouselItem) => void;
  onScrollPrev?: () => void;
  className?: string;
  style?: CSSProperties;
}

export interface FlexCarouselHandle {
  handleWheel: (e: any) => void;
  step: (direction: number) => void;
  wake: () => void;
}

declare const FlexCarousel: React.ForwardRefExoticComponent<
  FlexCarouselProps & React.RefAttributes<FlexCarouselHandle>
>;

export default FlexCarousel;

