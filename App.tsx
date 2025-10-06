
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';

// ===================================================================================
//  TYPES (from types.ts)
// ===================================================================================

type Tool = 
  'pencil' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line' | 'ai' | 'pan' |
  'select' | 'eyedropper' | 'marker' | 'spray' | 'dashed-line' | 'polyline' |
  'triangle' | 'right-triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'octagon' |
  'star' | 'arrow' | 'heart' | 'cloud' | 'speech-bubble' | 'cross' | 'lightning-bolt' |
  'ellipse' | 'rounded-rectangle' | 'trapezoid' | 'parallelogram' | 'crescent-moon' | 'ring' |
  'gear' | 'cube' | 'cylinder' | 'curved-arrow' | 'double-arrow' | 'callout-bubble' |
  'thought-bubble' | 'banner' | 'sun' | 'question-mark' | 'exclamation-mark' |
  'check-mark' | 'infinity' | 'peace' | 'yin-yang' |
  'linear-gradient' | 'radial-gradient' | 'document' | 'multi-document' | 'predefined-process' | 'internal-storage' |
  'manual-input' | 'manual-operation' | 'off-page-connector' | 'or-gate' | 'summing-junction' | 'collate' | 'sort' | 'merge' |
  'stored-data' | 'delay' | 'sequential-storage' | 'magnetic-disk' | 'direct-access-storage' | 'display';

type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
  | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference'
  | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

interface PathObject {
  type: 'path';
  id: string;
  path: [number, number][];
  strokeColor: string;
  strokeWidth: number;
  isEraser?: boolean;
  isMarker?: boolean;
}

interface ImageObject {
  type: 'image';
  id:string;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextObject {
  type: 'text';
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily: string;
}

interface ShapeObject {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    strokeColor: string;
    fillColor: string | null;
    strokeWidth: number;
}

interface GradientObject extends ShapeObject {
    type: 'linear-gradient' | 'radial-gradient';
    startColor: string;
    endColor: string;
}

interface RectangleObject extends ShapeObject { type: 'rectangle'; }
interface TriangleObject extends ShapeObject { type: 'triangle'; }
interface RightTriangleObject extends ShapeObject { type: 'right-triangle'; }
interface DiamondObject extends ShapeObject { type: 'diamond'; }
interface ArrowObject extends ShapeObject { type: 'arrow'; }
interface RoundedRectangleObject extends ShapeObject { type: 'rounded-rectangle'; radius: number; }

interface CircleObject {
    type: 'circle';
    id: string;
    cx: number;
    cy: number;
    radius: number;
    strokeColor: string;
    fillColor: string | null;
    strokeWidth: number;
}

interface EllipseObject {
    type: 'ellipse';
    id: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    strokeColor: string;
    fillColor: string | null;
    strokeWidth: number;
}

interface RingObject {
    type: 'ring';
    id: string;
    cx: number;
    cy: number;
    outerRadius: number;
    innerRadius: number;
    strokeColor: string;
    fillColor: string | null;
    strokeWidth: number;
}

interface PointsObject {
    id: string;
    points: {x: number, y: number}[];
    strokeColor: string;
    fillColor: string | null;
    strokeWidth: number;
}

interface PentagonObject extends PointsObject { type: 'pentagon'; }
interface HexagonObject extends PointsObject { type: 'hexagon'; }
interface OctagonObject extends PointsObject { type: 'octagon'; }
interface StarObject extends PointsObject { type: 'star'; }
interface HeartObject extends PointsObject { type: 'heart'; }
interface CloudObject extends PointsObject { type: 'cloud'; }
interface SpeechBubbleObject extends PointsObject { type: 'speech-bubble'; }
interface CrossObject extends PointsObject { type: 'cross'; }
interface LightningBoltObject extends PointsObject { type: 'lightning-bolt'; }
interface TrapezoidObject extends PointsObject { type: 'trapezoid'; }
interface ParallelogramObject extends PointsObject { type: 'parallelogram'; }
interface CrescentMoonObject extends PointsObject { type: 'crescent-moon'; }
interface GearObject extends PointsObject { type: 'gear'; }
interface CubeObject extends PointsObject { type: 'cube'; }
interface CylinderObject extends PointsObject { type: 'cylinder'; }
interface CurvedArrowObject extends PointsObject { type: 'curved-arrow'; }
interface DoubleArrowObject extends PointsObject { type: 'double-arrow'; }
interface CalloutBubbleObject extends PointsObject { type: 'callout-bubble'; }
interface ThoughtBubbleObject extends PointsObject { type: 'thought-bubble'; }
interface BannerObject extends PointsObject { type: 'banner'; }
interface SunObject extends PointsObject { type: 'sun'; }
interface QuestionMarkObject extends PointsObject { type: 'question-mark'; }
interface ExclamationMarkObject extends PointsObject { type: 'exclamation-mark'; }
interface CheckMarkObject extends PointsObject { type: 'check-mark'; }
interface InfinityObject extends PointsObject { type: 'infinity'; }
interface PeaceObject extends PointsObject { type: 'peace'; }
interface YinYangObject extends PointsObject { type: 'yin-yang'; }
interface DocumentObject extends PointsObject { type: 'document'; }
interface MultiDocumentObject extends PointsObject { type: 'multi-document'; }
interface PredefinedProcessObject extends ShapeObject { type: 'predefined-process'; }
interface InternalStorageObject extends ShapeObject { type: 'internal-storage'; }
interface ManualInputObject extends PointsObject { type: 'manual-input'; }
interface ManualOperationObject extends PointsObject { type: 'manual-operation'; }
interface OffPageConnectorObject extends PointsObject { type: 'off-page-connector'; }
interface OrGateObject extends PointsObject { type: 'or-gate'; }
interface SummingJunctionObject { type: 'summing-junction'; id: string; cx: number; cy: number; radius: number; strokeColor: string; strokeWidth: number; }
interface CollateObject extends PointsObject { type: 'collate'; }
interface SortObject extends PointsObject { type: 'sort'; }
interface MergeObject extends PointsObject { type: 'merge'; }
interface StoredDataObject extends PointsObject { type: 'stored-data'; }
interface DelayObject extends PointsObject { type: 'delay'; }
interface SequentialStorageObject { type: 'sequential-storage'; id: string; cx: number; cy: number; radius: number; strokeColor: string; strokeWidth: number; }
interface MagneticDiskObject extends PointsObject { type: 'magnetic-disk'; }
interface DirectAccessStorageObject extends PointsObject { type: 'direct-access-storage'; }
interface DisplayObject extends PointsObject { type: 'display'; }

interface LineObject {
    type: 'line' | 'dashed-line';
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    strokeColor: string;
    strokeWidth: number;
}

interface PolylineObject {
    type: 'polyline';
    id: string;
    points: [number, number][];
    strokeColor: string;
    strokeWidth: number;
}

type CanvasObject = PathObject | ImageObject | TextObject | RectangleObject | CircleObject | LineObject | PolylineObject | TriangleObject | RightTriangleObject | DiamondObject | PentagonObject | HexagonObject | OctagonObject | StarObject | ArrowObject | HeartObject | CloudObject | SpeechBubbleObject | CrossObject | LightningBoltObject | EllipseObject | RoundedRectangleObject | TrapezoidObject | ParallelogramObject | CrescentMoonObject | RingObject | GearObject | CubeObject | CylinderObject | CurvedArrowObject | DoubleArrowObject | CalloutBubbleObject | ThoughtBubbleObject | BannerObject | SunObject | QuestionMarkObject | ExclamationMarkObject | CheckMarkObject | InfinityObject | PeaceObject | YinYangObject | GradientObject | DocumentObject | MultiDocumentObject | PredefinedProcessObject | InternalStorageObject | ManualInputObject | ManualOperationObject | OffPageConnectorObject | OrGateObject | SummingJunctionObject | CollateObject | SortObject | MergeObject | StoredDataObject | DelayObject | SequentialStorageObject | MagneticDiskObject | DirectAccessStorageObject | DisplayObject;

interface LayerEffects {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  blur: number;
}

interface Layer {
  type: 'layer';
  id: number;
  name: string;
  objects: CanvasObject[];
  isVisible: boolean;
  effects: LayerEffects;
  blendMode: BlendMode;
}

interface LayerGroup {
  type: 'group';
  id: number;
  name: string;
  layers: LayerItem[];
  isVisible: boolean;
  isExpanded: boolean;
}

type LayerItem = Layer | LayerGroup;

// ===================================================================================
//  ICONS (from components/icons.tsx)
// ===================================================================================

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} width="1em" height="1em">{children}</svg>
);
const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></IconWrapper>);
const EraserIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 22"></path><path d="m22 2-2.5 2.5"></path><path d="m13.5 6.5 5 5"></path><path d="m5 14 1 1"></path></IconWrapper>);
const TextIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M17 6.1H3" /><path d="M21 12.1H3" /><path d="M15.1 18H3" /><path d="M10 6V4" /><path d="M10 20v-2" /></IconWrapper>);
const RectangleIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></IconWrapper>);
const CircleIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="10"></circle></IconWrapper>);
const LineIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><line x1="5" y1="12" x2="19" y2="12"></line></IconWrapper>);
const AIIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 8V4H8" /><rect x="4" y="12" width="8" height="8" rx="2" /><path d="M8 12v8" /><path d="M18 20V10c0-1.1.9-2 2-2h0c1.1 0 2 .9 2 2v10" /><path d="M14 20V4" /></IconWrapper>);
const HandIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M18 11.09V6.5a2.5 2.5 0 0 0-5 0V11" /><path d="M13 10.5V6.5a2.5 2.5 0 0 0-5 0V11" /><path d="M8 10.5V7.5a2.5 2.5 0 0 0-5 0V14" /><path d="M3 14v0c0 3.31 2.69 6 6 6h1.5c1.93 0 3.5-1.57 3.5-3.5V11.24" /></IconWrapper>);
const ZoomInIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></IconWrapper>);
const ZoomOutIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></IconWrapper>);
const UndoIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></IconWrapper>);
const RedoIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></IconWrapper>);
const GridIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></IconWrapper>);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></IconWrapper>);
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></IconWrapper>);
const AddLayerIcon: React.FC<{ className?: string; fill?: string }> = ({ className, fill="currentColor" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill={fill} width="1em" height="1em"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>);
const TrashIcon: React.FC<{ className?: string; fill?: string }> = ({ className, fill="currentColor" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill={fill} width="1em" height="1em"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>);
const EyeOpenIcon: React.FC<{ className?: string; fill?: string }> = ({ className, fill="currentColor" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill={fill} width="1em" height="1em"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12c-2.48 0-4.5-2.02-4.5-4.5S9.52 7.5 12 7.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm0-7C10.62 9.5 9.5 10.62 9.5 12s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5S13.38 9.5 12 9.5z"/></svg>);
const EyeClosedIcon: React.FC<{ className?: string; fill?: string }> = ({ className, fill="currentColor" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill={fill} width="1em" height="1em"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>);
const GroupIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><path d="M12 10v6"></path><path d="M9 13h6"></path></IconWrapper>);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="6 9 12 15 18 9"></polyline></IconWrapper>);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="9 18 15 12 9 6"></polyline></IconWrapper>);
const SelectIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M3 3l7 19 2.5-7.5L22 3z"/></IconWrapper>);
const EyedropperIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" /><path d="M12 12.5a2.5 2.5 0 0 1-3.54 0" /><path d="M15.53 8.96L12 12.5" /></IconWrapper>);
const MarkerIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></IconWrapper>);
const SprayIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M22 12h-4"/><path d="M20 10c.941.065 1.334.162 1.5.25.145.08.28.18.4.3.19.19.3.4.4.6.14.35.2.85.25 1.5.065.941.162 1.334.25 1.5.08.145.18.28.3.4.19.19.4.3.6.4.35.14.85.2 1.5.25"/><path d="M15 12a1 1 0 0 1-1 1H4a1 1 0 0 1 0-2h10a1 1 0 0 1 1 1zM2 12h-1c-.552 0-1-.448-1-1v-2c0-.552.448-1 1-1h1c.552 0 1 .448 1 1v2c0 .552-.448 1-1 1z"/><circle cx="6.5" cy="8.5" r=".5"/><circle cx="8.5" cy="6.5" r=".5"/><circle cx="10.5" cy="8.5" r=".5"/><circle cx="8.5" cy="10.5" r=".5"/></IconWrapper>);
const DashedLineIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M5 12h2"/><path d="M11 12h2"/><path d="M17 12h2"/></IconWrapper>);
const PolylineIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M2 12l5-5 5 10 5-10 5 5"/></IconWrapper>);
const TriangleIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2L2 22h20L12 2z"/></IconWrapper>);
const RightTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M22 22H2V2L22 22z"/></IconWrapper>);
const DiamondIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2l10 10-10 10L2 12 12 2z"/></IconWrapper>);
const PentagonIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2l10 7-4 12H6L2 9l10-7z"/></IconWrapper>);
const HexagonIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/></IconWrapper>);
const OctagonIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z"/></IconWrapper>);
const StarIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></IconWrapper>);
const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></IconWrapper>);
const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></IconWrapper>);
const CloudIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></IconWrapper>);
const SpeechBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></IconWrapper>);
const CrossIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M20 20.84V3.16a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v17.68a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1zM10 12H4v-2h6V4h4v6h6v2h-6v6h-4v-6z"/></IconWrapper>);
const LightningBoltIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></IconWrapper>);
const EllipseIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><ellipse cx="12" cy="12" rx="10" ry="6" /></IconWrapper>);
const RoundedRectangleIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><rect x="3" y="5" width="18" height="14" rx="4" ry="4" /></IconWrapper>);
const TrapezoidIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M2 20h20L16 4H8L2 20z" /></IconWrapper>);
const ParallelogramIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M2 20l6-16h14l-6 16H2z" /></IconWrapper>);
const CrescentMoonIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21.54 13.51A9 9 0 0 1 10.46 2.46 9 9 0 1 0 21.54 13.51z" /></IconWrapper>);
const RingIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></IconWrapper>);
const GearIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2v2.55a9.5 9.5 0 0 1 7.22 7.22H21.55a1.5 1.5 0 0 1 0 3h-2.28a9.5 9.5 0 0 1-7.22 7.22V22a1.5 1.5 0 0 1-3 0v-2.28a9.5 9.5 0 0 1-7.22-7.22H2.45a1.5 1.5 0 0 1 0-3h2.28A9.5 9.5 0 0 1 12 4.55V2a1.5 1.5 0 0 1 3 0zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /></IconWrapper>);
const CubeIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96L12 12.01l8.73-5.05" /><path d="M12 22.08V12" /></IconWrapper>);
const CylinderIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /></IconWrapper>);
const CurvedArrowIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21.5 13a9 9 0 1 1-9-9" /><path d="M16 8l-4 4 4 4" /></IconWrapper>);
const DoubleArrowIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /><path d="M12 19l-7-7 7-7" /></IconWrapper>);
const CalloutBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M7.9 20.1L6 22l-3-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2.9z" /></IconWrapper>);
const ThoughtBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 15a8 8 0 0 1-8 8h-1a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8h1a8 8 0 0 1 8 8Z" /><path d="M7 19a1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1Z" /><path d="M4 16a1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1Z" /></IconWrapper>);
const BannerIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M4 22V4h16v5l-8 4 8 4v5H4z" /></IconWrapper>);
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="5" /><path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l-1.42-1.42" /><path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l-1.42 1.42" /></IconWrapper>);
const QuestionMarkIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></IconWrapper>);
const ExclamationMarkIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2v14" /><path d="M12 20h.01" /></IconWrapper>);
const CheckMarkIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M20 6L9 17l-5-5" /></IconWrapper>);
const InfinityIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M10.64 12.36a5 5 0 1 0-1.28-4.72 5 5 0 1 0 1.28 4.72z" /></IconWrapper>);
const PeaceIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="10" /><path d="M12 2v20" /><path d="M12 12l-8 8" /><path d="M12 12l8 8" /></IconWrapper>);
const YinYangIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 0 0 20 5 5 0 0 0 0-10 5 5 0 0 1 0-10z" /><circle cx="12" cy="7" r="1" /><circle cx="12" cy="17" r="1" /></IconWrapper>);
const LinearGradientIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor:'currentColor', stopOpacity:1}} /><stop offset="100%" style={{stopColor:'currentColor', stopOpacity:0.2}} /></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="2" fill="url(#grad1)" stroke="none"/></IconWrapper>);
const RadialGradientIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><defs><radialGradient id="grad2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style={{stopColor:'currentColor', stopOpacity:1}} /><stop offset="100%" style={{stopColor:'currentColor', stopOpacity:0.2}} /></radialGradient></defs><rect x="3" y="3" width="18" height="18" rx="2" fill="url(#grad2)" stroke="none"/></IconWrapper>);
const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M4 3h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8.5A2.5 2.5 0 0 0 6 21.5V19H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8 21.5c.83.83 2.17.83 3 0"/></IconWrapper>);
const MultiDocumentIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M4 3h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8.5A2.5 2.5 0 0 0 6 21.5V19H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8 21.5c.83.83 2.17.83 3 0"/><path d="M6 3v-.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V15"/></IconWrapper>);
const PredefinedProcessIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/></IconWrapper>);
const InternalStorageIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="8" y1="3" x2="8" y2="21"/></IconWrapper>);
const ManualInputIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M2 12h20v8H2z"/><path d="M2 12L6 4h12l4 8"/></IconWrapper>);
const ManualOperationIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M2 20l6-16h8l6 16H2z"/></IconWrapper>);
const OffPageConnectorIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M3 12h14l4 5-4 5H3v-10z"/></IconWrapper>);
const OrGateIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M6.3 4.2C3.8 6.7 3.8 10.8 6.3 13.3l6.4-2.8c-1.2-1.2-1.2-3.1 0-4.2L6.3 4.2z"/><path d="M12.7 6.5l8.1 3.5-8.1 3.5c-1.8 1.8-4.8 1.8-6.6 0"/></IconWrapper>);
const SummingJunctionIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="10"/><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></IconWrapper>);
const CollateIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2L2 12l10 10 10-10z"/></IconWrapper>);
const SortIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2L2 12l10 10 10-10z"/><line x1="2" y1="12" x2="22" y2="12"/></IconWrapper>);
const MergeIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 22V12L2 2h20L12 12z"/></IconWrapper>);
const StoredDataIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z"/><path d="M3 12v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></IconWrapper>);
const DelayIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M3 12h12a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6H3z"/></IconWrapper>);
const SequentialStorageIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="10"/><path d="M12 12l5 3"/></IconWrapper>);
const MagneticDiskIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><ellipse cx="12" cy="12" rx="9" ry="3"/><path d="M3 12v6a9 3 0 0 0 18 0v-6"/></IconWrapper>);
const DirectAccessStorageIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 12a9 3 0 0 1-9 3 9 3 0 0 1-9-3"/><path d="M3 12a9 3 0 0 0 9 3 9 3 0 0 0 9-3"/><path d="M3 12v6c0 1.65 4.03 3 9 3s9-1.35 9-3v-6"/></IconWrapper>);
const DisplayIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M3 12h12l6-6-6-6H3v12z"/><circle cx="6" cy="18" r="2"/></IconWrapper>);
const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></IconWrapper>);
const DesktopIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></IconWrapper>);
const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></IconWrapper>);
const PanelRightIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></IconWrapper>);
const AlignCenterHorizontalIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M2 12h20"/><path d="M10 18v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3"/><path d="M10 6V9a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V6"/></IconWrapper>);
const AlignCenterVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2v20"/><path d="M18 10h-3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h3"/><path d="M6 10H9a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H6"/></IconWrapper>);
const MagnetIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M19 4v8a7 7 0 0 1-14 0V4" /><path d="M5 4h14" /><path d="M5 16h4v4H5z" /><path d="M15 16h4v4h-4z" /></IconWrapper>);


// ===================================================================================
//  UTILITIES (from utils/layerTree.ts)
// ===================================================================================

const findItem = (items: LayerItem[], id: number): LayerItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.type === 'group' && item.layers) {
      const found = findItem(item.layers, id);
      if (found) return found;
    }
  }
  return null;
};

const updateTree = (items: LayerItem[], id: number, updater: (item: LayerItem) => LayerItem): LayerItem[] => {
    return items.map(item => {
        if (item.id === id) {
            return updater(item);
        }
        if (item.type === 'group' && item.layers) {
            return { ...item, layers: updateTree(item.layers, id, updater) };
        }
        return item;
    });
};

const deleteFromTree = (items: LayerItem[], id: number): LayerItem[] => {
    const newItems = items.filter(item => item.id !== id);
    return newItems.map(item => {
        if (item.type === 'group' && item.layers) {
            return { ...item, layers: deleteFromTree(item.layers, id) };
        }
        return item;
    });
};

const addItemToTree = (items: LayerItem[], newItem: LayerItem, parentId: number | null): LayerItem[] => {
    if (parentId === null) {
        return [...items, newItem];
    }
    return items.map(item => {
        if (item.id === parentId && item.type === 'group') {
            return { ...item, layers: [...item.layers, newItem] };
        }
        if (item.type === 'group' && item.layers) {
            return { ...item, layers: addItemToTree(item.layers, newItem, parentId) };
        }
        return item;
    });
};

const getParentId = (items: LayerItem[], id: number, parentId: number | null = null): number | null => {
  for (const item of items) {
    if (item.id === id) return parentId;
    if (item.type === 'group' && item.layers) {
      const foundParentId = getParentId(item.layers, id, item.id);
      if (foundParentId !== null) return foundParentId;
    }
  }
  return null;
}

// ===================================================================================
//  COMPONENTS (from components/*.tsx)
// ===================================================================================

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Poppins', 'Nunito', 'Merriweather',
  'Playfair Display', 'Lobster', 'Pacifico', 'Bebas Neue', 'Anton', 'Dancing Script', 'Shadows Into Light'
];

// --- Toolbar.tsx ---
interface ToolbarProps {
  activeTool: Tool;
  strokeColor: string;
  fillColor: string;
  onSelectTool: (tool: Tool) => void;
  onStrokeColorChange: (color: string) => void;
  onFillColorChange: (color: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  onImport: () => void;
  onDownload: () => void;
  isMobileView: boolean;
  onToggleView: () => void;
}
const ToolButton: React.FC<{ label: string; icon: React.ReactNode; isActive?: boolean; onClick: () => void; disabled?: boolean; }> = ({ label, icon, isActive, onClick, disabled }) => (
  <button title={label} onClick={onClick} disabled={disabled} className={`aspect-square p-2 rounded-lg transition-all duration-150 flex justify-center items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-cyan-400 ${isActive ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-gray-200'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`} aria-pressed={isActive} aria-label={label}>{icon}</button>
);
const ToolbarSection: React.FC<{title: string}> = ({ title }) => (
    <div className="px-2 pt-4 first:pt-0">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
        <hr className="border-t border-zinc-700/50 mb-2"/>
    </div>
);
const ToolbarGrid: React.FC<{children: React.ReactNode}> = ({children}) => (
    <div className="grid grid-cols-4 gap-1 px-1">{children}</div>
);
const ColorInput: React.FC<{label: string, id: string, color: string, onChange: (c: string) => void}> = ({label, id, color, onChange}) => (
    <div className="flex flex-col items-center space-y-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-400 cursor-pointer">{label}</label>
        <div className="relative w-10 h-10">
            <input id={id} type="color" value={color} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="w-full h-full rounded-full border-2 border-zinc-600 shadow-inner" style={{ backgroundColor: color }}></div>
        </div>
        <span className="text-xs text-gray-500 font-mono tracking-tighter">{color.toUpperCase()}</span>
    </div>
);
const Toolbar: React.FC<ToolbarProps> = ({ activeTool, strokeColor, fillColor, onSelectTool, onStrokeColorChange, onFillColorChange, onZoomIn, onZoomOut, showGrid, onToggleGrid, snapToGrid, onToggleSnapToGrid, canUndo, onUndo, canRedo, onRedo, onImport, onDownload, isMobileView, onToggleView }) => {
  type ToolDefinition = { name: Tool; label: string; icon: React.ReactNode };
  const mainTools: ToolDefinition[] = [ { name: 'select', label: 'নির্বাচন করুন', icon: <SelectIcon className="w-5 h-5" /> }, { name: 'pan', label: 'সরান', icon: <HandIcon className="w-5 h-5" /> }, { name: 'eyedropper', label: 'আইড্রপার', icon: <EyedropperIcon className="w-5 h-5" /> }, ];
  const drawingTools: ToolDefinition[] = [ { name: 'pencil', label: 'পেন্সিল', icon: <PencilIcon className="w-5 h-5" /> }, { name: 'eraser', label: 'ইরেজার', icon: <EraserIcon className="w-5 h-5" /> }, { name: 'marker', label: 'মার্কার', icon: <MarkerIcon className="w-5 h-5" /> }, { name: 'spray', label: 'স্প্রে', icon: <SprayIcon className="w-5 h-5" /> }, ];
  const lineTools: ToolDefinition[] = [ { name: 'line', label: 'লাইন', icon: <LineIcon className="w-5 h-5" /> }, { name: 'dashed-line', label: 'ড্যাশড লাইন', icon: <DashedLineIcon className="w-5 h-5" /> }, { name: 'polyline', label: 'পলিলাইন', icon: <PolylineIcon className="w-5 h-5" /> }, { name: 'arrow', label: 'তীর', icon: <ArrowIcon className="w-5 h-5" /> }, ];
  const shapeTools: ToolDefinition[] = [ { name: 'rectangle', label: 'আয়তক্ষেত্র', icon: <RectangleIcon className="w-5 h-5" /> }, { name: 'rounded-rectangle', label: 'গোলাকার আয়তক্ষেত্র', icon: <RoundedRectangleIcon className="w-5 h-5" /> }, { name: 'circle', label: 'বৃত্ত', icon: <CircleIcon className="w-5 h-5" /> }, { name: 'ellipse', label: 'উপবৃত্ত', icon: <EllipseIcon className="w-5 h-5" /> }, { name: 'triangle', label: 'ত্রিভুজ', icon: <TriangleIcon className="w-5 h-5" /> }, { name: 'right-triangle', label: 'সমকোণী ত্রিভুজ', icon: <RightTriangleIcon className="w-5 h-5" /> }, { name: 'diamond', label: 'ডায়মন্ড', icon: <DiamondIcon className="w-5 h-5" /> }, { name: 'trapezoid', label: 'ট্রাপিজয়েড', icon: <TrapezoidIcon className="w-5 h-5" /> }, { name: 'parallelogram', label: 'সমান্তরালগ্রাম', icon: <ParallelogramIcon className="w-5 h-5" /> }, { name: 'pentagon', label: 'পঞ্চভুজ', icon: <PentagonIcon className="w-5 h-5" /> }, { name: 'hexagon', label: 'ষড়ভুজ', icon: <HexagonIcon className="w-5 h-5" /> }, { name: 'octagon', label: 'অষ্টভুজ', icon: <OctagonIcon className="w-5 h-5" /> }, { name: 'star', label: 'তারা', icon: <StarIcon className="w-5 h-5" /> }, ];
  const symbolTools: ToolDefinition[] = [ { name: 'heart', label: 'হার্ট', icon: <HeartIcon className="w-5 h-5" /> }, { name: 'cloud', label: 'মেঘ', icon: <CloudIcon className="w-5 h-5" /> }, { name: 'crescent-moon', label: 'চাঁদ', icon: <CrescentMoonIcon className="w-5 h-5" /> }, { name: 'sun', label: 'সূর্য', icon: <SunIcon className="w-5 h-5" /> }, { name: 'ring', label: 'রিং', icon: <RingIcon className="w-5 h-5" /> }, { name: 'gear', label: 'গিয়ার', icon: <GearIcon className="w-5 h-5" /> }, { name: 'cube', label: 'কিউব', icon: <CubeIcon className="w-5 h-5" /> }, { name: 'cylinder', label: 'সিলিন্ডার', icon: <CylinderIcon className="w-5 h-5" /> }, { name: 'curved-arrow', label: 'বাঁকা তীর', icon: <CurvedArrowIcon className="w-5 h-5" /> }, { name: 'double-arrow', label: 'ডাবল তীর', icon: <DoubleArrowIcon className="w-5 h-5" /> }, { name: 'speech-bubble', label: 'স্পিচ বাবল', icon: <SpeechBubbleIcon className="w-5 h-5" /> }, { name: 'callout-bubble', label: 'কলআউট বাবল', icon: <CalloutBubbleIcon className="w-5 h-5" /> }, { name: 'thought-bubble', label: 'চিন্তা বাবল', icon: <ThoughtBubbleIcon className="w-5 h-5" /> }, { name: 'banner', label: 'ব্যানার', icon: <BannerIcon className="w-5 h-5" /> }, { name: 'question-mark', label: 'প্রশ্নবোধক চিহ্ন', icon: <QuestionMarkIcon className="w-5 h-5" /> }, { name: 'exclamation-mark', label: 'বিস্ময়বোধক চিহ্ন', icon: <ExclamationMarkIcon className="w-5 h-5" /> }, { name: 'check-mark', label: 'টিক চিহ্ন', icon: <CheckMarkIcon className="w-5 h-5" /> }, { name: 'cross', label: 'ক্রস', icon: <CrossIcon className="w-5 h-5" /> }, { name: 'lightning-bolt', label: 'বজ্র', icon: <LightningBoltIcon className="w-5 h-5" /> }, { name: 'infinity', label: 'ইনফিনিটি', icon: <InfinityIcon className="w-5 h-5" /> }, { name: 'peace', label: 'শান্তি', icon: <PeaceIcon className="w-5 h-5" /> }, { name: 'yin-yang', label: 'ইন-ইয়াং', icon: <YinYangIcon className="w-5 h-5" /> }, ];
  const gradientTools: ToolDefinition[] = [ { name: 'linear-gradient', label: 'লিনিয়ার গ্রেডিয়েন্ট', icon: <LinearGradientIcon className="w-5 h-5" /> }, { name: 'radial-gradient', label: 'রেডিয়াল গ্রেডিয়েন্ট', icon: <RadialGradientIcon className="w-5 h-5" /> }, ];
  const flowchartTools: ToolDefinition[] = [ { name: 'document', label: 'ডকুমেন্ট', icon: <DocumentIcon className="w-5 h-5" /> }, { name: 'multi-document', label: 'মাল্টি-ডকুমেন্ট', icon: <MultiDocumentIcon className="w-5 h-5" /> }, { name: 'predefined-process', label: 'পূর্বনির্ধারিত প্রক্রিয়া', icon: <PredefinedProcessIcon className="w-5 h-5" /> }, { name: 'internal-storage', label: 'ইন্টারনাল স্টোরেজ', icon: <InternalStorageIcon className="w-5 h-5" /> }, { name: 'manual-input', label: 'ম্যানুয়াল ইনপুট', icon: <ManualInputIcon className="w-5 h-5" /> }, { name: 'manual-operation', label: 'ম্যানুয়াল অপারেশন', icon: <ManualOperationIcon className="w-5 h-5" /> }, { name: 'off-page-connector', label: 'অফ-পেজ সংযোগকারী', icon: <OffPageConnectorIcon className="w-5 h-5" /> }, { name: 'or-gate', label: 'Or গেট', icon: <OrGateIcon className="w-5 h-5" /> }, { name: 'summing-junction', label: 'সামিং জংশন', icon: <SummingJunctionIcon className="w-5 h-5" /> }, { name: 'collate', label: 'কোলেট', icon: <CollateIcon className="w-5 h-5" /> }, { name: 'sort', label: 'সর্ট', icon: <SortIcon className="w-5 h-5" /> }, { name: 'merge', label: 'মার্জ', icon: <MergeIcon className="w-5 h-5" /> }, { name: 'stored-data', label: 'সংরক্ষিত ডেটা', icon: <StoredDataIcon className="w-5 h-5" /> }, { name: 'delay', label: 'বিলম্ব', icon: <DelayIcon className="w-5 h-5" /> }, { name: 'sequential-storage', label: 'সিকোয়েন্সিয়াল স্টোরেজ', icon: <SequentialStorageIcon className="w-5 h-5" /> }, { name: 'magnetic-disk', label: 'ম্যাগনেটিক ডিস্ক', icon: <MagneticDiskIcon className="w-5 h-5" /> }, { name: 'direct-access-storage', label: 'ডাইরেক্ট এক্সেস স্টোরেজ', icon: <DirectAccessStorageIcon className="w-5 h-5" /> }, { name: 'display', label: 'ডিসপ্লে', icon: <DisplayIcon className="w-5 h-5" /> }, ];
  const contentTools: ToolDefinition[] = [ { name: 'text', label: 'টেক্সট', icon: <TextIcon className="w-5 h-5" /> }, { name: 'ai', label: 'AI দিয়ে তৈরি করুন', icon: <AIIcon className="w-5 h-5" /> }, ];
  const renderTools = (tools: ToolDefinition[]) => tools.map(tool => (<ToolButton key={tool.name} label={tool.label} icon={tool.icon} isActive={activeTool === tool.name} onClick={() => onSelectTool(tool.name)} />));
  return (<div className="flex flex-col items-center h-full"><h1 className="text-2xl font-bold text-gray-100 p-2 my-2 text-center select-none tracking-wide">লোগো মেকার</h1><div className="w-full flex-grow space-y-2 overflow-y-auto pr-1"><ToolbarSection title="প্রধান" /><ToolbarGrid>{renderTools(mainTools)}</ToolbarGrid><ToolbarSection title="অঙ্কন" /><ToolbarGrid>{renderTools(drawingTools)}</ToolbarGrid><ToolbarSection title="লাইন" /><ToolbarGrid>{renderTools(lineTools)}</ToolbarGrid><ToolbarSection title="গ্রেডিয়েন্ট" /><ToolbarGrid>{renderTools(gradientTools)}</ToolbarGrid><ToolbarSection title="আকার" /><ToolbarGrid>{renderTools(shapeTools)}</ToolbarGrid><ToolbarSection title="প্রতীক" /><ToolbarGrid>{renderTools(symbolTools)}</ToolbarGrid><ToolbarSection title="ফ্লোচার্ট এবং ডায়াগ্রাম" /><ToolbarGrid>{renderTools(flowchartTools)}</ToolbarGrid><ToolbarSection title="বিষয়বস্তু" /><ToolbarGrid>{renderTools(contentTools)}</ToolbarGrid><ToolbarSection title="নিয়ন্ত্রণ" /><ToolbarGrid><ToolButton label="আনডু (Ctrl+Z)" icon={<UndoIcon className="w-5 h-5"/>} onClick={onUndo} disabled={!canUndo} /><ToolButton label="রিডু (Ctrl+Y)" icon={<RedoIcon className="w-5 h-5"/>} onClick={onRedo} disabled={!canRedo} /></ToolbarGrid><ToolbarSection title="দৃশ্য" /><ToolbarGrid><ToolButton label="জুম ইন" icon={<ZoomInIcon className="w-5 h-5"/>} onClick={onZoomIn} /><ToolButton label="জুম আউট" icon={<ZoomOutIcon className="w-5 h-5"/>} onClick={onZoomOut} /><ToolButton label="গ্রিড দেখান/লুকান" icon={<GridIcon className="w-5 h-5"/>} isActive={showGrid} onClick={onToggleGrid} /><ToolButton label="গ্রিডে স্ন্যাপ করুন" icon={<MagnetIcon className="w-5 h-5"/>} isActive={snapToGrid} onClick={onToggleSnapToGrid} /><ToolButton label={isMobileView ? "ডেস্কটপ ভিউ" : "মোবাইল ভিউ"} icon={isMobileView ? <DesktopIcon className="w-5 h-5"/> : <PhoneIcon className="w-5 h-5"/>} onClick={onToggleView} /></ToolbarGrid><ToolbarSection title="ফাইল" /><ToolbarGrid><ToolButton label="ছবি ইম্পোর্ট" icon={<UploadIcon className="w-5 h-5"/>} onClick={onImport} /><ToolButton label="ডাউনলোড" icon={<DownloadIcon className="w-5 h-5"/>} onClick={onDownload} /></ToolbarGrid></div><div className="flex items-center justify-around w-full p-3 mt-2 border-t border-zinc-700"><ColorInput label="ফিল" id="fill-color-picker" color={fillColor} onChange={onFillColorChange} /><ColorInput label="স্ট্রোক" id="stroke-color-picker" color={strokeColor} onChange={onStrokeColorChange} /></div></div>);
};

// --- LayerPanel.tsx ---
interface LayerPanelProps { layers: LayerItem[]; activeItemId: number; onAddLayer: () => void; onCreateGroup: () => void; onDeleteItem: (id: number) => void; onSelectItem: (id: number) => void; onToggleVisibility: (id: number) => void; onToggleGroupExpanded: (id: number) => void; }
const LayerItemDisplay: React.FC<{ item: LayerItem; depth: number; activeItemId: number; onDeleteItem: (id: number) => void; onSelectItem: (id: number) => void; onToggleVisibility: (id: number) => void; onToggleGroupExpanded: (id: number) => void; }> = ({ item, depth, activeItemId, onDeleteItem, onSelectItem, onToggleVisibility, onToggleGroupExpanded }) => {
    const isActive = activeItemId === item.id;
    if (item.type === 'group') {
        return (<div><div onClick={() => onSelectItem(item.id)} style={{ paddingLeft: `${depth * 16 + 8}px`}} className={`group flex items-center p-2 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-cyan-600/80 text-white' : 'hover:bg-zinc-700'}`}><button onClick={(e) => { e.stopPropagation(); onToggleGroupExpanded(item.id); }} className="p-1 -ml-1 mr-1 rounded-full hover:bg-zinc-600">{item.isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}</button><span className="flex-grow font-semibold text-sm">{item.name}</span><button onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.id); }} title={item.isVisible ? "গ্রুপ লুকান" : "গ্রুপ দেখান"} className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-600">{item.isVisible ? <EyeOpenIcon className="w-5 h-5" /> : <EyeClosedIcon className="w-5 h-5 text-gray-500"/>}</button><button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} title="গ্রুপ মুছুন" className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"><TrashIcon className="w-5 h-5" /></button></div>{item.isExpanded && (<div className="mt-1 space-y-1">{item.layers.slice().reverse().map(child => (<LayerItemDisplay key={child.id} item={child} depth={depth + 1} activeItemId={activeItemId} onDeleteItem={onDeleteItem} onSelectItem={onSelectItem} onToggleVisibility={onToggleVisibility} onToggleGroupExpanded={onToggleGroupExpanded} />))}</div>)}</div>);
    }
    return (<div onClick={() => onSelectItem(item.id)} style={{ paddingLeft: `${depth * 16 + 8}px`}} className={`group flex items-center p-2 rounded-md cursor-pointer transition-colors text-sm ${isActive ? 'bg-cyan-600 text-white' : 'hover:bg-zinc-700'}`}><span className="flex-grow pl-5">{item.name}</span><button onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.id); }} title={item.isVisible ? "স্তর লুকান" : "স্তর দেখান"} className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-600">{item.isVisible ? <EyeOpenIcon className="w-5 h-5" /> : <EyeClosedIcon className="w-5 h-5 text-gray-500"/>}</button><button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} title="স্তর মুছুন" className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"><TrashIcon className="w-5 h-5" /></button></div>);
};
const LayerPanel: React.FC<LayerPanelProps> = ({ layers, activeItemId, onAddLayer, onCreateGroup, onDeleteItem, onSelectItem, onToggleVisibility, onToggleGroupExpanded }) => {
  return (<div className="p-4 flex flex-col h-full"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-gray-300">স্তর</h3><div className="flex items-center space-x-2"><button onClick={onCreateGroup} title="নতুন গ্রুপ তৈরি করুন" className="p-2 rounded-md hover:bg-zinc-700 transition-colors"><GroupIcon className="w-6 h-6 text-cyan-400" /></button><button onClick={onAddLayer} title="নতুন স্তর যোগ করুন" className="p-2 rounded-md hover:bg-zinc-700 transition-colors"><AddLayerIcon className="w-6 h-6 text-cyan-400" /></button></div></div><div className="flex-grow space-y-1 overflow-y-auto pr-1">{layers.slice().reverse().map(item => (<LayerItemDisplay key={item.id} item={item} depth={0} activeItemId={activeItemId} onDeleteItem={onDeleteItem} onSelectItem={onSelectItem} onToggleVisibility={onToggleVisibility} onToggleGroupExpanded={onToggleGroupExpanded} />))}</div></div>);
};

// --- EffectsPanel.tsx ---
interface EffectsPanelProps { activeLayerEffects: LayerEffects; activeLayerBlendMode: BlendMode; onUpdateEffects: (newEffects: LayerEffects) => void; onUpdateBlendMode: (blendMode: BlendMode) => void; onResetEffects: () => void; }
const EffectSlider: React.FC<{ label: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void; }> = ({ label, value, min, max, unit, onChange }) => (<div className="space-y-2"><div className="flex justify-between items-center text-sm"><label className="text-gray-300">{label}</label><span className="text-sm w-16 text-center bg-zinc-700/50 p-1 rounded-md tabular-nums">{value}{unit}</span></div><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"/></div>);
const BlendModeSelector: React.FC<{ currentMode: BlendMode; onChange: (mode: BlendMode) => void; }> = ({ currentMode, onChange }) => {
    const blendModes: BlendMode[] = [ 'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity' ];
    return (<div className="space-y-2"><label className="text-gray-300 text-sm font-medium">ব্লেন্ড মোড</label><select value={currentMode} onChange={e => onChange(e.target.value as BlendMode)} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow text-white">{blendModes.map(mode => (<option key={mode} value={mode} className="capitalize">{mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}</option>))}</select></div>);
};
const EffectsPanel: React.FC<EffectsPanelProps> = ({ activeLayerEffects, activeLayerBlendMode, onUpdateEffects, onUpdateBlendMode, onResetEffects, }) => {
  const handleEffectChange = (effect: keyof LayerEffects, value: number) => { onUpdateEffects({ ...activeLayerEffects, [effect]: value, }); };
  return (<div className="p-4 space-y-6"><div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-gray-300">ইফেক্টস এবং ফিল্টার</h3><button onClick={onResetEffects} className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline">সমস্ত রিসেট করুন</button></div><BlendModeSelector currentMode={activeLayerBlendMode} onChange={onUpdateBlendMode} /><EffectSlider label="উজ্জ্বলতা" value={activeLayerEffects.brightness} min={0} max={200} unit="%" onChange={(v) => handleEffectChange('brightness', v)} /><EffectSlider label="বৈসাদৃশ্য" value={activeLayerEffects.contrast} min={0} max={200} unit="%" onChange={(v) => handleEffectChange('contrast', v)} /><EffectSlider label="স্যাচুরেশন" value={activeLayerEffects.saturate} min={0} max={200} unit="%" onChange={(v) => handleEffectChange('saturate', v)} /><EffectSlider label="গ্রেস্কেল" value={activeLayerEffects.grayscale} min={0} max={100} unit="%" onChange={(v) => handleEffectChange('grayscale', v)} /><EffectSlider label="সেপিয়া" value={activeLayerEffects.sepia} min={0} max={100} unit="%" onChange={(v) => handleEffectChange('sepia', v)} /><EffectSlider label="রঙ ঘোরান" value={activeLayerEffects.hueRotate} min={0} max={360} unit="°" onChange={(v) => handleEffectChange('hueRotate', v)} /><EffectSlider label="ব্লার" value={activeLayerEffects.blur} min={0} max={20} unit="px" onChange={(v) => handleEffectChange('blur', v)} /></div>);
};

// --- PropertiesPanel.tsx ---
const PropertySection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (<div className="space-y-3 py-3 border-b border-zinc-800 last:border-b-0"><h4 className="text-sm font-semibold text-gray-400 px-4">{title}</h4><div className="space-y-3 px-4">{children}</div></div>);
const PropColorInput: React.FC<{ label: string; value: string | null; onChange: (value: string | null) => void; allowNone?: boolean; }> = ({ label, value, onChange, allowNone }) => (<div className="flex items-center justify-between text-sm"><label className="text-gray-300">{label}</label><div className="flex items-center space-x-2"><span className="font-mono text-xs text-gray-400">{value?.toUpperCase() ?? 'N/A'}</span><div className="relative w-7 h-7"><input type="color" value={value ?? '#000000'} onChange={e => onChange(e.target.value)} className="w-full h-full p-0.5 bg-transparent border-none rounded-md cursor-pointer absolute inset-0 opacity-0" style={{ visibility: value === null ? 'hidden' : 'visible' }} /><div className="w-full h-full rounded-md border-2 border-zinc-600" style={{backgroundColor: value ?? 'transparent'}}></div></div>{allowNone && <input type="checkbox" checked={value !== null} onChange={e => onChange(e.target.checked ? '#000000' : null)} className="form-checkbox h-4 w-4 bg-zinc-700 border-zinc-600 text-cyan-500 rounded focus:ring-cyan-500/50" />}</div></div>);
const PropNumberInput: React.FC<{ label: string; value: number; onChange: (value: number) => void; unit?: string; min?: number; max?: number }> = ({ label, value, onChange, unit, min, max }) => (<div className="flex items-center justify-between text-sm"><label className="text-gray-300">{label}</label><div className="flex items-center"><input type="number" value={Math.round(value)} min={min} max={max} onChange={e => onChange(parseInt(e.target.value, 10) || 0)} className="w-20 bg-zinc-800 border border-zinc-700 rounded-md p-1.5 text-right focus:ring-1 focus:ring-cyan-500 focus:outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />{unit && <span className="pl-2 text-gray-400">{unit}</span>}</div></div>);
const PropTextInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; }> = ({ label, value, onChange }) => (<div className="space-y-2 text-sm"><label className="text-gray-300 font-medium">{label}</label><textarea value={value} onChange={e => onChange(e.target.value)} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-1 focus:ring-cyan-500 focus:outline-none h-24 resize-y text-white" /></div>);
const PropFontSelector: React.FC<{ value: string; onChange: (value: string) => void; }> = ({ value, onChange }) => (<div className="space-y-2 text-sm"><label className="text-gray-300 font-medium">ফন্ট</label><select value={value} onChange={e => onChange(e.target.value)} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow text-white">{GOOGLE_FONTS.map(font => <option key={font} value={font} style={{fontFamily: font}}>{font}</option>)}</select></div>)
const AlignmentButtons: React.FC<{ onAlign: (type: 'h' | 'v') => void }> = ({ onAlign }) => (
    <div className="flex items-center justify-between">
        <button onClick={() => onAlign('h')} title="অনুভূমিকভাবে মাঝখানে আনুন" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"><AlignCenterHorizontalIcon className="w-5 h-5"/></button>
        <button onClick={() => onAlign('v')} title="উল্লম্বভাবে মাঝখানে আনুন" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"><AlignCenterVerticalIcon className="w-5 h-5"/></button>
    </div>
);
interface PropertiesPanelProps { selectedObject: CanvasObject | null; onUpdateSelectedObject: (props: Partial<CanvasObject>) => void; onAlignSelectedObject: (type: 'h' | 'v') => void; canvasBackgroundColor: string; onCanvasBackgroundChange: (color: string) => void; }
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObject, onUpdateSelectedObject, onAlignSelectedObject, canvasBackgroundColor, onCanvasBackgroundChange }) => {
    return (<div className="p-0"><div className="flex justify-between items-center p-4 border-b border-zinc-800"><h3 className="text-lg font-semibold text-gray-300">বৈশিষ্ট্য</h3></div><div className="overflow-y-auto max-h-[calc(100vh-120px)]">{!selectedObject ? (<PropertySection title="ক্যানভাস"><PropColorInput label="পটভূমির রঙ" value={canvasBackgroundColor} onChange={(c) => onCanvasBackgroundChange(c || '#ffffff')} /></PropertySection>) : (<>{('width' in selectedObject && 'height' in selectedObject) && (<PropertySection title="অবস্থান এবং আকার"><div className="grid grid-cols-2 gap-x-4 gap-y-3"><PropNumberInput label="X" value={selectedObject.x} onChange={v => onUpdateSelectedObject({ x: v })} unit="px" /><PropNumberInput label="Y" value={selectedObject.y} onChange={v => onUpdateSelectedObject({ y: v })} unit="px" /><PropNumberInput label="প্রস্থ" value={selectedObject.width} onChange={v => onUpdateSelectedObject({ width: v })} unit="px" min={1} /><PropNumberInput label="উচ্চতা" value={selectedObject.height} onChange={v => onUpdateSelectedObject({ height: v })} unit="px" min={1} /></div><div className="pt-2"><AlignmentButtons onAlign={onAlignSelectedObject} /></div></PropertySection>)}{('fillColor' in selectedObject) && (<PropertySection title="রঙ"><PropColorInput label="ফিল রঙ" value={selectedObject.fillColor} onChange={v => onUpdateSelectedObject({ fillColor: v })} allowNone /></PropertySection>)}{('strokeColor' in selectedObject && 'strokeWidth' in selectedObject) && (<PropertySection title="স্ট্রোক"><PropColorInput label="স্ট্রোক রঙ" value={selectedObject.strokeColor} onChange={v => onUpdateSelectedObject({ strokeColor: v || '#000000' })} /><PropNumberInput label="স্ট্রোক প্রস্থ" value={selectedObject.strokeWidth} onChange={v => onUpdateSelectedObject({ strokeWidth: v })} min={0} unit="px" /></PropertySection>)}{selectedObject.type === 'text' && (<PropertySection title="টেক্সট"><PropTextInput label="লেখা" value={selectedObject.text} onChange={v => onUpdateSelectedObject({ text: v })} /><PropFontSelector value={selectedObject.fontFamily} onChange={v => onUpdateSelectedObject({ fontFamily: v })} /><PropColorInput label="রঙ" value={selectedObject.color} onChange={v => onUpdateSelectedObject({ color: v || '#000000' })} /><PropNumberInput label="ফন্ট সাইজ" value={selectedObject.fontSize} onChange={v => onUpdateSelectedObject({ fontSize: v })} min={1} unit="px" /></PropertySection>)}</>)}</div></div>);
};

// --- AIPromptModal.tsx ---
interface AIPromptModalProps { isOpen: boolean; isLoading: boolean; error: string | null; onSubmit: (prompt: string) => void; onClose: () => void; }
const AIPromptModal: React.FC<AIPromptModalProps> = ({ isOpen, isLoading, error, onSubmit, onClose }) => {
  const [prompt, setPrompt] = useState('');
  useEffect(() => { if (isOpen) { setPrompt(''); } }, [isOpen]);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (prompt.trim()) { onSubmit(prompt.trim()); } };
  if (!isOpen) return null;
  return (<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}><div className="bg-gray-900 border border-zinc-800 rounded-lg shadow-2xl p-6 w-full max-w-md m-4" onClick={e => e.stopPropagation()}><h2 className="text-2xl font-bold mb-4 text-cyan-400">AI দিয়ে তৈরি করুন</h2><p className="text-gray-400 mb-6">আপনি কী তৈরি করতে চান তার একটি বর্ণনা দিন। যেমন: "একটি নীল পাখি আকাশে উড়ছে"</p><form onSubmit={handleSubmit}><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="আপনার কল্পনা এখানে লিখুন..." className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow text-white placeholder-gray-500 h-28 resize-none" disabled={isLoading} />{error && <p className="text-red-400 mt-3 text-sm">{error}</p>}<div className="flex justify-end items-center mt-6 space-x-3"><button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors disabled:opacity-50">বাতিল করুন</button><button type="submit" disabled={isLoading || !prompt.trim()} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">{isLoading && (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)}{isLoading ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}</button></div></form></div></div>);
};

// --- TextPromptModal.tsx ---
interface TextPromptModalProps { isOpen: boolean; onSubmit: (text: string) => void; onClose: () => void; }
const TextPromptModal: React.FC<TextPromptModalProps> = ({ isOpen, onSubmit, onClose }) => {
  const [text, setText] = useState('');
  useEffect(() => { if (isOpen) { setText(''); } }, [isOpen]);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (text.trim()) { onSubmit(text); } };
  if (!isOpen) return null;
  return (<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}><div className="bg-gray-900 border border-zinc-800 rounded-lg shadow-2xl p-6 w-full max-w-md m-4" onClick={e => e.stopPropagation()}><h2 className="text-2xl font-bold mb-4 text-cyan-400">টেক্সট যোগ করুন</h2><form onSubmit={handleSubmit}><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="আপনার টেক্সট এখানে লিখুন..." className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow text-white placeholder-gray-500 h-28 resize-none" autoFocus /><div className="flex justify-end items-center mt-6 space-x-3"><button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors">বাতিল করুন</button><button type="submit" disabled={!text.trim()} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">যোগ করুন</button></div></form></div></div>);
};

// --- CanvasArea.tsx ---
interface CanvasAreaProps { layers: LayerItem[]; activeLayer: Layer | undefined; activeTool: Tool; strokeColor: string; fillColor: string; onAddObject: (object: CanvasObject) => void; onUpdateObject: (object: CanvasObject) => void; onSetStrokeColor: (color: string) => void; onPan: (dx: number, dy: number) => void; onSetSelectedObjectId: (id: string | null) => void; selectedObjectId: string | null; canvasBackgroundColor: string; zoom: number; panOffset: { x: number; y: number }; showGrid: boolean; snapToGrid: boolean; setMousePosition: (pos: {x: number; y: number} | null) => void; setDownloadTrigger: (trigger: () => void) => void; editingText: { objectId: string; text: string } | null; setEditingText: (editing: { objectId: string; text: string } | null) => void;}
const CANVAS_WIDTH = 800; const CANVAS_HEIGHT = 600; const RULER_SIZE = 25; const GRID_SIZE = 50; const HANDLE_SIZE = 8;
type BoundingBox = { x: number; y: number; width: number; height: number; };
type ResizeHandle = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br';
type Interaction = | { type: 'none' } | { type: 'panning', start: { x: number, y: number } } | { type: 'drawing', start: { x: number, y: number }, current: { x: number, y: number }, path?: [number, number][] } | { type: 'moving', objectId: string, startObjectPos: {x:number, y:number}, mouseOffset: {x: number, y: number} } | { type: 'resizing', objectId: string, handle: ResizeHandle, startBox: BoundingBox, startObject: CanvasObject, preserveAspect: boolean };
const flattenVisibleLayers = (items: LayerItem[], groupVisible = true): Layer[] => {
    const flatLayers: Layer[] = [];
    for (const item of items) {
        const isCurrentlyVisible = groupVisible && item.isVisible;
        if (item.type === 'layer' && isCurrentlyVisible) { flatLayers.push(item); }
        if (item.type === 'group' && item.layers) { flatLayers.push(...flattenVisibleLayers(item.layers, isCurrentlyVisible)); }
    }
    return flatLayers;
};
const CanvasArea: React.FC<CanvasAreaProps> = ({ layers, activeLayer, activeTool, strokeColor, fillColor, onAddObject, onUpdateObject, onSetStrokeColor, zoom, panOffset, onPan, showGrid, snapToGrid, setMousePosition, setDownloadTrigger, onSetSelectedObjectId, selectedObjectId, canvasBackgroundColor, editingText, setEditingText }) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null); const gridCanvasRef = useRef<HTMLCanvasElement>(null); const interactionCanvasRef = useRef<HTMLCanvasElement>(null); const topRulerRef = useRef<HTMLCanvasElement>(null); const leftRulerRef = useRef<HTMLCanvasElement>(null); const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [interaction, setInteraction] = useState<Interaction>({ type: 'none' }); const [previewObject, setPreviewObject] = useState<CanvasObject | null>(null); const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const snap = (coord: number) => snapToGrid ? Math.round(coord / GRID_SIZE) * GRID_SIZE : coord;
  const getMousePos = (e: React.MouseEvent | MouseEvent): { raw: {x:number, y:number}, snapped: {x:number, y:number} } => {
    const canvas = mainCanvasRef.current; if (!canvas) return { raw: { x: 0, y: 0 }, snapped: {x:0, y:0} }; const rect = canvas.getBoundingClientRect(); const clientX = e.clientX - rect.left; const clientY = e.clientY - rect.top;
    const rawX = (clientX - panOffset.x) / zoom; const rawY = (clientY - panOffset.y) / zoom;
    return { raw: { x: rawX, y: rawY }, snapped: { x: snap(rawX), y: snap(rawY) }};
  };
  const drawObject = (ctx: CanvasRenderingContext2D, obj: CanvasObject) => {
      if (editingText && obj.id === editingText.objectId) return; // Hide original text while editing
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const hasStroke = ('strokeColor' in obj && 'strokeWidth' in obj && obj.strokeWidth > 0);
      const hasFill = 'fillColor' in obj && obj.fillColor;
      
      ctx.beginPath();
      
      if (obj.type === 'path') { if (obj.path.length < 2) return; ctx.moveTo(obj.path[0][0], obj.path[0][1]); obj.path.forEach(point => ctx.lineTo(point[0], point[1]));
      } else if (obj.type === 'image') { if (obj.image instanceof HTMLImageElement) { ctx.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height); } return;
      } else if (obj.type === 'text') { ctx.font = `${obj.fontSize}px ${obj.fontFamily}`; ctx.fillStyle = obj.color; ctx.fillText(obj.text, obj.x, obj.y); return;
      } else if (obj.type === 'rectangle') { ctx.rect(obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === 'triangle') { const { x, y, width, height } = obj; ctx.moveTo(x + width / 2, y); ctx.lineTo(x + width, y + height); ctx.lineTo(x, y + height); ctx.closePath();
      } else if (obj.type === 'right-triangle') { const { x, y, width, height } = obj; ctx.moveTo(x, y); ctx.lineTo(x, y + height); ctx.lineTo(x + width, y + height); ctx.closePath();
      } else if (obj.type === 'diamond') { const { x, y, width, height } = obj; ctx.moveTo(x + width / 2, y); ctx.lineTo(x + width, y + height / 2); ctx.lineTo(x + width / 2, y + height); ctx.lineTo(x, y + height / 2); ctx.closePath();
      } else if (obj.type === 'arrow') { const { x, y, width, height, strokeWidth } = obj; const headlen = Math.max(10, Math.min(Math.abs(width), Math.abs(height)) * 0.2 + strokeWidth); const angle = Math.atan2(height, width); ctx.moveTo(x, y); ctx.lineTo(x + width, y + height); ctx.moveTo(x + width, y + height); ctx.lineTo(x + width - headlen * Math.cos(angle - Math.PI / 6), y + height - headlen * Math.sin(angle - Math.PI / 6)); ctx.moveTo(x + width, y + height); ctx.lineTo(x + width - headlen * Math.cos(angle + Math.PI / 6), y + height - headlen * Math.sin(angle + Math.PI / 6));
      } else if (obj.type === 'rounded-rectangle') { ctx.roundRect(obj.x, obj.y, obj.width, obj.height, obj.radius);
      } else if (obj.type === 'circle' || obj.type === 'summing-junction' || obj.type === 'sequential-storage') { ctx.arc(obj.cx, obj.cy, obj.radius, 0, 2 * Math.PI);
      } else if (obj.type === 'ellipse') { ctx.ellipse(obj.cx, obj.cy, obj.rx, obj.ry, 0, 0, 2 * Math.PI);
      } else if (obj.type === 'ring') { ctx.arc(obj.cx, obj.cy, obj.outerRadius, 0, 2 * Math.PI, false); ctx.arc(obj.cx, obj.cy, obj.innerRadius, 0, 2 * Math.PI, true);
      } else if (obj.type === 'line' || obj.type === 'dashed-line') { if (obj.type === 'dashed-line') ctx.setLineDash([10, 10]); ctx.moveTo(obj.x1, obj.y1); ctx.lineTo(obj.x2, obj.y2);
      } else if (obj.type === 'polyline') { if (obj.points.length < 2) return; ctx.moveTo(obj.points[0][0], obj.points[0][1]); obj.points.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      } else if (obj.type === 'linear-gradient' || obj.type === 'radial-gradient') { const gradObj = obj as GradientObject; let grad: CanvasGradient; if (gradObj.type === 'linear-gradient') { grad = ctx.createLinearGradient(gradObj.x, gradObj.y, gradObj.x + gradObj.width, gradObj.y + gradObj.height); } else { const radius = Math.max(gradObj.width, gradObj.height) / 2; grad = ctx.createRadialGradient(gradObj.x + gradObj.width/2, gradObj.y + gradObj.height/2, 0, gradObj.x + gradObj.width/2, gradObj.y + gradObj.height/2, radius); } grad.addColorStop(0, gradObj.startColor); grad.addColorStop(1, gradObj.endColor); ctx.fillStyle = grad; ctx.fillRect(gradObj.x, gradObj.y, gradObj.width, gradObj.height); return;
      } else if (obj.type === 'predefined-process' || obj.type === 'internal-storage') { ctx.rect(obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === 'cylinder' || obj.type === 'magnetic-disk') { const { x, y, width, height } = getObjectBoundingBox(obj); const rx = width / 2; const ry = Math.min(height * 0.2, rx * 0.5); ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, 2 * Math.PI); ctx.moveTo(x, y + ry); ctx.lineTo(x, y + height - ry); ctx.moveTo(x + width, y + ry); ctx.lineTo(x + width, y + height - ry); ctx.ellipse(x + rx, y + height - ry, rx, ry, 0, 0, 2 * Math.PI);
      } else if (obj.type === 'sun' || obj.type === 'peace' || obj.type === 'yin-yang') { const box = getObjectBoundingBox(obj); const cx = box.x + box.width/2; const cy = box.y + box.height/2; const r = Math.min(box.width, box.height) / 2; if (obj.type === 'peace' || obj.type === 'sun') ctx.arc(cx, cy, r, 0, 2 * Math.PI); if(obj.type === 'yin-yang') { ctx.arc(cx, cy, r, -Math.PI/2, Math.PI/2, false); ctx.arc(cx, cy + r/2, r/2, Math.PI/2, -Math.PI/2, true); ctx.arc(cx, cy - r/2, r/2, Math.PI/2, -Math.PI/2, false); }
      } else if ('points' in obj && obj.points) { if (obj.points.length < 2) return; ctx.moveTo(obj.points[0].x, obj.points[0].y); obj.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); if (!['curved-arrow', 'double-arrow', 'or-gate', 'check-mark', 'question-mark', 'exclamation-mark'].includes(obj.type)) { ctx.closePath(); } }

      if (hasFill) { ctx.fillStyle = (obj as any).fillColor; ctx.fill(); }
      if (hasStroke) {
          ctx.strokeStyle = (obj as any).strokeColor;
          ctx.lineWidth = (obj as any).strokeWidth;
          const gco = ctx.globalCompositeOperation; const ga = ctx.globalAlpha;
          if(obj.type === 'path' && obj.isEraser) ctx.globalCompositeOperation = 'destination-out';
          if(obj.type === 'path' && obj.isMarker) ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalCompositeOperation = gco; ctx.globalAlpha = ga;
      }
      ctx.setLineDash([]);
      
      if (obj.type === 'summing-junction') { ctx.beginPath(); ctx.moveTo(obj.cx - obj.radius * 0.6, obj.cy - obj.radius * 0.6); ctx.lineTo(obj.cx + obj.radius * 0.6, obj.cy + obj.radius * 0.6); ctx.moveTo(obj.cx + obj.radius * 0.6, obj.cy - obj.radius * 0.6); ctx.lineTo(obj.cx - obj.radius * 0.6, obj.cy + obj.radius * 0.6); ctx.strokeStyle = obj.strokeColor; ctx.lineWidth = obj.strokeWidth; ctx.stroke(); }
      if (obj.type === 'sequential-storage') { ctx.beginPath(); ctx.moveTo(obj.cx, obj.cy); ctx.lineTo(obj.cx + obj.radius * 0.7, obj.cy + obj.radius * 0.5); ctx.strokeStyle = obj.strokeColor; ctx.lineWidth = obj.strokeWidth; ctx.stroke(); }
      if (obj.type === 'predefined-process') { ctx.beginPath(); ctx.moveTo(obj.x + 10, obj.y); ctx.lineTo(obj.x + 10, obj.y + obj.height); ctx.moveTo(obj.x + obj.width - 10, obj.y); ctx.lineTo(obj.x + obj.width - 10, obj.y + obj.height); ctx.strokeStyle = obj.strokeColor; ctx.lineWidth = obj.strokeWidth; ctx.stroke(); }
      if (obj.type === 'internal-storage') { ctx.beginPath(); ctx.moveTo(obj.x, obj.y + 10); ctx.lineTo(obj.x + obj.width, obj.y + 10); ctx.moveTo(obj.x + 10, obj.y); ctx.lineTo(obj.x + 10, obj.y + obj.height); ctx.strokeStyle = obj.strokeColor; ctx.lineWidth = obj.strokeWidth; ctx.stroke(); }
      if (obj.type === 'sun') { if(hasStroke) { const { points } = obj; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for(let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y); ctx.closePath(); ctx.stroke(); } }
      if (obj.type === 'peace') { if(hasStroke) { const box = getObjectBoundingBox(obj); const cx = box.x + box.width/2; const cy = box.y + box.height/2; const r = Math.min(box.width, box.height) / 2; ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.moveTo(cx, cy); ctx.lineTo(cx - r * Math.cos(Math.PI/4), cy + r * Math.sin(Math.PI/4)); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * Math.cos(Math.PI/4), cy + r * Math.sin(Math.PI/4)); ctx.stroke(); } }
      if (obj.type === 'yin-yang') { const box = getObjectBoundingBox(obj); const cx = box.x + box.width / 2; const cy = box.y + box.height / 2; const r = Math.min(box.width, box.height) / 2; ctx.fillStyle = obj.strokeColor; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, Math.PI/2, true); ctx.arc(cx, cy + r/2, r/2, Math.PI/2, -Math.PI/2, true); ctx.arc(cx, cy - r/2, r/2, Math.PI/2, -Math.PI/2, false); ctx.fill(); if(hasStroke) ctx.stroke(); ctx.fillStyle = obj.strokeColor; ctx.beginPath(); ctx.arc(cx, cy-r/2, r/6, 0, 2*Math.PI); ctx.fill(); ctx.fillStyle = obj.fillColor || '#fff'; ctx.beginPath(); ctx.arc(cx, cy+r/2, r/6, 0, 2*Math.PI); ctx.fill(); }
  }
  const visibleLayers = useMemo(() => flattenVisibleLayers(layers), [layers]);
  const selectedObject = useMemo(() => { if (!selectedObjectId || !activeLayer) return null; return activeLayer.objects.find(obj => obj.id === selectedObjectId) || null; }, [selectedObjectId, activeLayer]);
  const selectionBox = useMemo(() => { if (!selectedObject) return null; return getObjectBoundingBox(selectedObject); }, [selectedObject]);
  useEffect(() => {
    const ctx = mainCanvasRef.current?.getContext('2d'); if (!ctx) return;
    // Fill viewport with background color, this is static and doesn't zoom/pan.
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Apply transformations for drawing objects
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);
    
    visibleLayers.forEach(layer => { 
        ctx.save(); 
        const blendMode = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode; 
        ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation; 
        const filterString = `brightness(${layer.effects.brightness}%) contrast(${layer.effects.contrast}%) saturate(${layer.effects.saturate}%) grayscale(${layer.effects.grayscale}%) sepia(${layer.effects.sepia}%) hue-rotate(${layer.effects.hueRotate}deg) blur(${layer.effects.blur}px)`; 
        ctx.filter = filterString; 
        layer.objects.forEach(obj => drawObject(ctx, obj)); 
        ctx.restore(); 
    });
    // Restore to untransformed state
    ctx.restore();
  }, [visibleLayers, canvasBackgroundColor, editingText, zoom, panOffset]);

  useEffect(() => {
    const ctx = interactionCanvasRef.current?.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save(); ctx.translate(panOffset.x, panOffset.y); ctx.scale(zoom, zoom);
    if (previewObject) { ctx.globalAlpha = 0.7; drawObject(ctx, previewObject); ctx.globalAlpha = 1.0; }
    if (selectionBox) { ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1.5 / zoom; ctx.setLineDash([4 / zoom, 2 / zoom]); ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height); ctx.setLineDash([]); const handles = getResizeHandles(selectionBox); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#06b6d4'; Object.values(handles).forEach(handle => { ctx.beginPath(); ctx.arc(handle.x, handle.y, HANDLE_SIZE / 2 / zoom, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }); }
    ctx.restore();
  }, [previewObject, selectionBox, panOffset, zoom]);

  useEffect(() => {
    const gridCtx = gridCanvasRef.current?.getContext('2d'); const topCtx = topRulerRef.current?.getContext('2d'); const leftCtx = leftRulerRef.current?.getContext('2d'); if (!topCtx || !leftCtx || !gridCtx) return;
    topCtx.clearRect(0,0, CANVAS_WIDTH, RULER_SIZE); leftCtx.clearRect(0,0, RULER_SIZE, CANVAS_HEIGHT); gridCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawRuler(topCtx, true, panOffset, zoom); drawRuler(leftCtx, false, panOffset, zoom);
    if (showGrid) { gridCtx.save(); gridCtx.translate(panOffset.x, panOffset.y); gridCtx.scale(zoom, zoom); drawGrid(gridCtx, panOffset, zoom); gridCtx.restore(); }
  }, [zoom, panOffset, showGrid]);
  useEffect(() => {
    setDownloadTrigger(() => () => {
        const tempCanvas = document.createElement('canvas'); tempCanvas.width = CANVAS_WIDTH; tempCanvas.height = CANVAS_HEIGHT; const ctx = tempCanvas.getContext('2d'); if (!ctx) return;
        ctx.fillStyle = canvasBackgroundColor; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        visibleLayers.forEach(layer => { ctx.save(); const blendMode = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode; ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation; const filterString = `brightness(${layer.effects.brightness}%) contrast(${layer.effects.contrast}%) saturate(${layer.effects.saturate}%) grayscale(${layer.effects.grayscale}%) sepia(${layer.effects.sepia}%) hue-rotate(${layer.effects.hueRotate}deg) blur(${layer.effects.blur}px)`; ctx.filter = filterString; layer.objects.forEach(obj => drawObject(ctx, obj)); ctx.restore(); });
        const dataUrl = tempCanvas.toDataURL('image/png'); const link = document.createElement('a'); link.href = dataUrl; link.download = 'logo-makar-export.png'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    });
  }, [visibleLayers, setDownloadTrigger, canvasBackgroundColor]);
  useEffect(() => {
      if (editingText && textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
      }
  }, [editingText]);
  const handleMouseDown = (e: React.MouseEvent) => {
    if (editingText) return;
    const { raw: pos, snapped: snappedPos } = getMousePos(e);
    if (activeTool === 'pan') { setInteraction({ type: 'panning', start: { x: e.clientX, y: e.clientY } }); return; }
    if (activeTool === 'eyedropper') { const mainCtx = mainCanvasRef.current?.getContext('2d'); if(!mainCtx) return; const pixel = mainCtx.getImageData(e.clientX - mainCanvasRef.current!.getBoundingClientRect().left, e.clientY - mainCanvasRef.current!.getBoundingClientRect().top, 1, 1).data; const newColor = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`; onSetStrokeColor(newColor); return; }
    if (activeTool === 'select') { if (selectionBox) { const handle = getHandleAtPosition(pos, selectionBox, zoom); if (handle && selectedObject) { setInteraction({ type: 'resizing', objectId: selectedObject.id, handle, startBox: selectionBox, startObject: selectedObject, preserveAspect: e.shiftKey || ['tl', 'tr', 'bl', 'br'].includes(handle) }); return; } } if (!activeLayer) return; const clickedObject = [...activeLayer.objects].reverse().find(obj => isPointInObject(pos, obj)); if (clickedObject) { onSetSelectedObjectId(clickedObject.id); const objPos = getObjectPosition(clickedObject); setInteraction({ type: 'moving', objectId: clickedObject.id, startObjectPos: objPos, mouseOffset: { x: pos.x - objPos.x, y: pos.y - objPos.y } }); } else { onSetSelectedObjectId(null); setInteraction({ type: 'none' }); } return; }
    if (activeTool === 'text' || activeTool === 'ai' ) { onSetSelectedObjectId(null); return; }
    onSetSelectedObjectId(null); const startPos = snapToGrid ? snappedPos : pos; const path: [number, number][] | undefined = (activeTool === 'pencil' || activeTool === 'eraser' || activeTool === 'marker') ? [[startPos.x, startPos.y]] : undefined; setInteraction({ type: 'drawing', start: startPos, current: startPos, path });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    const { raw: pos, snapped: snappedPos } = getMousePos(e); setMousePosition(pos);
    if (interaction.type === 'panning') { const dx = e.clientX - interaction.start.x; const dy = e.clientY - interaction.start.y; onPan(dx, dy); setInteraction({ type: 'panning', start: { x: e.clientX, y: e.clientY } }); return; }
    if (interaction.type === 'resizing') { const newObject = resizeObject(interaction.startObject, interaction.startBox, snapToGrid ? snappedPos : pos, interaction.handle, interaction.preserveAspect); setPreviewObject(newObject); return; }
    if (interaction.type === 'moving' && activeLayer) { const objToMove = activeLayer.objects.find(o => o.id === interaction.objectId); if (!objToMove) return; const newX = (snapToGrid ? snappedPos.x : pos.x) - interaction.mouseOffset.x; const newY = (snapToGrid ? snappedPos.y : pos.y) - interaction.mouseOffset.y; setPreviewObject(moveObject(objToMove, newX, newY)); return; }
    if (interaction.type === 'drawing') { const currentPos = snapToGrid ? snappedPos : pos; const path = (activeTool === 'pencil' || activeTool === 'eraser' || activeTool === 'marker') ? [...interaction.path!, [currentPos.x, currentPos.y] as [number, number]] : undefined; setInteraction({...interaction, current: currentPos, path }); setPreviewObject(createDrawingPreview(interaction.start, currentPos, path)); }
    if (activeTool === 'select' && selectionBox) { setHoveredHandle(getHandleAtPosition(pos, selectionBox, zoom)); } else { setHoveredHandle(null); }
    if (activeTool === 'spray' && e.buttons === 1) { const sprayDots = Array.from({length: 20}).map(() => { const angle = Math.random() * 2 * Math.PI; const radius = Math.random() * 20; const x = pos.x + radius * Math.cos(angle); const y = pos.y + radius * Math.sin(angle); return { type: 'path', id: `spray-${Date.now()}-${Math.random()}`, path: [[x,y], [x,y]], strokeColor: strokeColor, strokeWidth: 1 } as PathObject; }); sprayDots.forEach(onAddObject); }
  };
  const handleMouseUp = () => { if (previewObject) { if (interaction.type === 'drawing') onAddObject(previewObject); if (interaction.type === 'moving' || interaction.type === 'resizing') onUpdateObject(previewObject); } setInteraction({type: 'none'}); setPreviewObject(null); };
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (activeTool !== 'select' || !activeLayer) return;
    const { raw: pos } = getMousePos(e);
    const clickedObject = [...activeLayer.objects].reverse().find(obj => isPointInObject(pos, obj));
    if (clickedObject && clickedObject.type === 'text') {
        onSetSelectedObjectId(clickedObject.id);
        setEditingText({ objectId: clickedObject.id, text: clickedObject.text });
    }
  };
  const finishEditingText = () => {
    if (!editingText) return;
    onUpdateObject({ ...(selectedObject as TextObject), text: editingText.text });
    setEditingText(null);
  }

  const toolHasFill = (tool: Tool) => !(['pencil', 'eraser', 'marker', 'spray', 'line', 'dashed-line', 'polyline', 'arrow', 'curved-arrow', 'double-arrow'].includes(tool));
  const createDrawingPreview = (start: {x:number, y:number}, current: {x:number, y:number}, path?: [number, number][]): CanvasObject | null => {
    const id = `preview-${Date.now()}`; const x = Math.min(start.x, current.x); const y = Math.min(start.y, current.y); const width = Math.abs(start.x - current.x); const height = Math.abs(start.y - current.y);
    const useFill = toolHasFill(activeTool);
    const baseShape: Omit<ShapeObject, 'type'> = { id, x, y, width, height, strokeColor, fillColor: useFill ? fillColor : null, strokeWidth: 5 };
    const basePoints: Omit<PointsObject, 'type'> = { id, points: [], strokeColor, fillColor: useFill ? fillColor : null, strokeWidth: 5 };
    switch (activeTool) {
        case 'pencil': case 'eraser': case 'marker': return { type: 'path', id, path: path!, strokeColor, strokeWidth: activeTool === 'eraser' ? 20 : 5, isEraser: activeTool === 'eraser', isMarker: activeTool === 'marker' };
        case 'line': case 'dashed-line': return { type: activeTool, id, x1: start.x, y1: start.y, x2: current.x, y2: current.y, strokeColor, strokeWidth: 5 };
        case 'rectangle': return { ...baseShape, type: 'rectangle' };
        case 'rounded-rectangle': return { ...baseShape, type: 'rounded-rectangle', radius: Math.min(width, height) * 0.2 };
        case 'circle': const radius = Math.sqrt(width*width + height*height); return { type: 'circle', id, cx: start.x, cy: start.y, radius, strokeColor, fillColor: useFill ? fillColor : null, strokeWidth: 5 };
        case 'ellipse': return { type: 'ellipse', id, cx: x + width/2, cy: y + height/2, rx: width/2, ry: height/2, strokeColor, fillColor: useFill ? fillColor : null, strokeWidth: 5 };
        case 'ring': const outerRadius = Math.sqrt(width*width + height*height); return { type: 'ring', id, cx: start.x, cy: start.y, outerRadius, innerRadius: outerRadius * 0.6, strokeColor, fillColor: useFill ? fillColor : null, strokeWidth: 5 };
        case 'triangle': return { ...baseShape, type: 'triangle' };
        case 'right-triangle': return { ...baseShape, type: 'right-triangle' };
        case 'diamond': return { ...baseShape, type: 'diamond' };
        case 'arrow': return { ...baseShape, type: 'arrow' };
        case 'pentagon': return { ...basePoints, type: 'pentagon', points: getPolygonPoints(x + width / 2, y + height / 2, Math.max(width, height) / 2, 5) };
        case 'hexagon': return { ...basePoints, type: 'hexagon', points: getPolygonPoints(x + width / 2, y + height / 2, Math.max(width, height) / 2, 6) };
        case 'octagon': return { ...basePoints, type: 'octagon', points: getPolygonPoints(x + width / 2, y + height / 2, Math.max(width, height) / 2, 8) };
        case 'star': return { ...basePoints, type: 'star', points: getStarPoints(x + width / 2, y + height / 2, Math.max(width, height) / 2, 5, 0.5) };
        case 'heart': return { ...basePoints, type: 'heart', points: getHeartPoints(x,y,width,height) };
        case 'cloud': return { ...basePoints, type: 'cloud', points: getCloudPoints(x,y,width,height) };
        case 'speech-bubble': return { ...basePoints, type: 'speech-bubble', points: getSpeechBubblePoints(x,y,width,height) };
        case 'cross': return { ...basePoints, type: 'cross', points: getCrossPoints(x,y,width,height) };
        case 'lightning-bolt': return { ...basePoints, type: 'lightning-bolt', points: getLightningPoints(x,y,width,height) };
        case 'trapezoid': return { ...basePoints, type: 'trapezoid', points: getTrapezoidPoints(x,y,width,height) };
        case 'parallelogram': return { ...basePoints, type: 'parallelogram', points: getParallelogramPoints(x,y,width,height) };
        case 'crescent-moon': return { ...basePoints, type: 'crescent-moon', points: getCrescentMoonPoints(x,y,width,height) };
        case 'gear': return { ...basePoints, type: 'gear', points: getStarPoints(x + width / 2, y + height / 2, Math.max(width, height) / 2, 12, 0.7) };
        case 'cube': return { ...basePoints, type: 'cube', points: getCubePoints(x,y,width,height) };
        case 'cylinder': return { ...basePoints, type: 'cylinder', points: getCylinderPoints(x,y,width,height) };
        case 'curved-arrow': return { ...basePoints, type: 'curved-arrow', fillColor: null, points: getCurvedArrowPoints(start, current) };
        case 'double-arrow': return { ...basePoints, type: 'double-arrow', fillColor: null, points: getDoubleArrowPoints(start, current) };
        case 'callout-bubble': return { ...basePoints, type: 'callout-bubble', points: getCalloutBubblePoints(x,y,width,height) };
        case 'thought-bubble': return { ...basePoints, type: 'thought-bubble', points: getThoughtBubblePoints(x,y,width,height) };
        case 'banner': return { ...basePoints, type: 'banner', points: getBannerPoints(x,y,width,height) };
        case 'sun': return { ...basePoints, type: 'sun', points: getSunPoints(x,y,width,height) };
        case 'question-mark': return { ...basePoints, type: 'question-mark', fillColor: null, points: getQuestionMarkPoints(x,y,width,height) };
        case 'exclamation-mark': return { ...basePoints, type: 'exclamation-mark', fillColor: null, points: getExclamationMarkPoints(x,y,width,height) };
        case 'check-mark': return { ...basePoints, type: 'check-mark', fillColor: null, points: getCheckMarkPoints(x,y,width,height) };
        case 'infinity': return { ...basePoints, type: 'infinity', points: getInfinityPoints(x,y,width,height) };
        case 'peace': return { ...basePoints, type: 'peace', points: [] }; case 'yin-yang': return { ...basePoints, type: 'yin-yang', points: [] };
        case 'linear-gradient': case 'radial-gradient': return { ...baseShape, type: activeTool, startColor: strokeColor, endColor: fillColor };
        case 'document': return { ...basePoints, type: 'document', points: getDocumentPoints(x,y,width,height) };
        case 'multi-document': return { ...basePoints, type: 'multi-document', points: getMultiDocumentPoints(x,y,width,height) };
        case 'predefined-process': return { ...baseShape, type: 'predefined-process' };
        case 'internal-storage': return { ...baseShape, type: 'internal-storage' };
        case 'manual-input': return { ...basePoints, type: 'manual-input', points: getManualInputPoints(x,y,width,height) };
        case 'manual-operation': return { ...basePoints, type: 'manual-operation', points: getManualOperationPoints(x,y,width,height) };
        case 'off-page-connector': return { ...basePoints, type: 'off-page-connector', points: getOffPageConnectorPoints(x,y,width,height) };
        case 'or-gate': return { ...basePoints, type: 'or-gate', points: getOrGatePoints(x,y,width,height) };
        case 'summing-junction': return { type: 'summing-junction', id, cx: x+width/2, cy: y+height/2, radius: Math.min(width,height)/2, strokeColor, strokeWidth: 5 };
        case 'collate': return { ...basePoints, type: 'collate', points: getCollatePoints(x,y,width,height) };
        case 'sort': return { ...basePoints, type: 'sort', points: getSortPoints(x,y,width,height) };
        case 'merge': return { ...basePoints, type: 'merge', points: getMergePoints(x,y,width,height) };
        case 'stored-data': return { ...basePoints, type: 'stored-data', points: getStoredDataPoints(x,y,width,height) };
        case 'delay': return { ...basePoints, type: 'delay', points: getDelayPoints(x,y,width,height) };
        case 'sequential-storage': return { type: 'sequential-storage', id, cx: x+width/2, cy: y+height/2, radius: Math.min(width,height)/2, strokeColor, strokeWidth: 5 };
        case 'magnetic-disk': return { ...basePoints, type: 'magnetic-disk', points: getCylinderPoints(x,y,width,height) };
        case 'direct-access-storage': return { ...basePoints, type: 'direct-access-storage', points: getCylinderPoints(x,y,width,height) };
        case 'display': return { ...basePoints, type: 'display', points: getDisplayPoints(x,y,width,height) };
        default: return null;
    }
  }
  const cursorForHandle: Record<ResizeHandle, string> = { tl: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize', br: 'nwse-resize', tc: 'ns-resize', bc: 'ns-resize', ml: 'ew-resize', mr: 'ew-resize', };
  const cursorStyle = useMemo(() => { if (hoveredHandle) return cursorForHandle[hoveredHandle]; if (activeTool === 'select' && selectedObject) return 'move'; const map: Record<string, string> = { pan: interaction.type === 'panning' ? 'grabbing' : 'grab', select: 'default', eyedropper: 'copy', text: 'text', }; return map[activeTool] || 'crosshair'; }, [activeTool, interaction, hoveredHandle, selectedObject]);
  const textEditorStyle: React.CSSProperties = useMemo(() => {
    if (!editingText || !selectedObject || selectedObject.type !== 'text') return { display: 'none' };
    return {
        display: 'block',
        position: 'absolute',
        left: `${(selectedObject.x - 2) * zoom + panOffset.x}px`,
        top: `${(selectedObject.y - selectedObject.fontSize * 0.2 - 2) * zoom + panOffset.y}px`,
        width: 'auto',
        height: 'auto',
        fontFamily: selectedObject.fontFamily,
        fontSize: `${selectedObject.fontSize * zoom}px`,
        color: selectedObject.color,
        lineHeight: 1.2,
        background: 'rgba(255, 255, 255, 0.1)',
        border: `1px dashed ${selectedObject.color}`,
        outline: 'none',
        padding: '0',
        margin: '0',
        resize: 'none',
        overflow: 'hidden',
        whiteSpace: 'pre',
        zIndex: 100,
    };
  }, [editingText, selectedObject, zoom, panOffset]);
  return (<div className="flex-grow flex items-center justify-center p-4 bg-gray-800 rounded-xl shadow-inner"><div className="grid" style={{ gridTemplateColumns: `${RULER_SIZE}px auto`, gridTemplateRows: `${RULER_SIZE}px auto` }}><div className="bg-zinc-800 shadow-md z-10" /><div className="overflow-hidden shadow-md"><canvas ref={topRulerRef} width={CANVAS_WIDTH} height={RULER_SIZE} className="bg-zinc-800" /></div><div className="overflow-hidden shadow-md"><canvas ref={leftRulerRef} width={RULER_SIZE} height={CANVAS_HEIGHT} className="bg-zinc-800" /></div><div className="relative bg-white shadow-2xl overflow-hidden" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAACdJREFUOE9jZGBgEGHAD97/p0+f/v//PxMDw38UdwCRiWo+AOhjAQB14QZ87aH2agAAAABJRU5ErkJggg==)', cursor: cursorStyle }}><canvas ref={gridCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute top-0 left-0 pointer-events-none" /><canvas ref={mainCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute top-0 left-0 pointer-events-none" /><canvas ref={interactionCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute top-0 left-0" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { handleMouseUp(); setMousePosition(null); }} onDoubleClick={handleDoubleClick} />{editingText && ( <textarea ref={textInputRef} style={textEditorStyle} value={editingText.text} onChange={(e) => setEditingText({ ...editingText, text: e.target.value })} onBlur={finishEditingText} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEditingText(); } }} /> )}</div></div></div>);
};
const drawGrid = (ctx: CanvasRenderingContext2D, panOffset: {x:number, y:number}, zoom: number) => { ctx.beginPath(); ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'; ctx.lineWidth = 1 / zoom; const startX = Math.floor(-panOffset.x / zoom / GRID_SIZE) * GRID_SIZE; const startY = Math.floor(-panOffset.y / zoom / GRID_SIZE) * GRID_SIZE; const endX = (CANVAS_WIDTH - panOffset.x) / zoom; const endY = (CANVAS_HEIGHT - panOffset.y) / zoom; for (let x = startX; x < endX; x += GRID_SIZE) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); } for (let y = startY; y < endY; y += GRID_SIZE) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); } ctx.stroke(); };
const drawRuler = (ctx: CanvasRenderingContext2D, isHorizontal: boolean, panOffset: {x:number, y:number}, zoom: number) => { const size = isHorizontal ? CANVAS_WIDTH : CANVAS_HEIGHT; const offset = isHorizontal ? panOffset.x : panOffset.y; ctx.fillStyle = '#9ca3af'; ctx.font = '10px sans-serif'; ctx.beginPath(); for (let i = 0; i < size / zoom * 1.5; i++) { const worldPos = i * 10; const screenPos = worldPos * zoom + offset; if (screenPos > size) break; if (worldPos % 100 === 0) { if (isHorizontal) { ctx.moveTo(screenPos, 10); ctx.lineTo(screenPos, RULER_SIZE); ctx.fillText(`${Math.round(worldPos)}`, screenPos + 2, 12); } else { ctx.moveTo(10, screenPos); ctx.lineTo(RULER_SIZE, screenPos); ctx.fillText(`${Math.round(worldPos)}`, 2, screenPos + 10); } } else if (worldPos % 10 === 0) { if (isHorizontal) { ctx.moveTo(screenPos, 15); ctx.lineTo(screenPos, RULER_SIZE); } else { ctx.moveTo(15, screenPos); ctx.lineTo(RULER_SIZE, screenPos); } } } ctx.strokeStyle = '#6b7280'; ctx.stroke(); };
const getObjectBoundingBox = (obj: CanvasObject): BoundingBox => {
    if ('x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) { return { x: obj.x, y: obj.y, width: obj.width, height: obj.height }; }
    if (obj.type === 'circle' || obj.type === 'summing-junction' || obj.type === 'sequential-storage') { return { x: obj.cx - obj.radius, y: obj.cy - obj.radius, width: obj.radius * 2, height: obj.radius * 2 }; }
    if (obj.type === 'ellipse') { return { x: obj.cx - obj.rx, y: obj.cy - obj.ry, width: obj.rx * 2, height: obj.ry * 2 }; }
    if (obj.type === 'ring') { return { x: obj.cx - obj.outerRadius, y: obj.cy - obj.outerRadius, width: obj.outerRadius * 2, height: obj.outerRadius * 2 }; }
    if (obj.type === 'line' || obj.type === 'dashed-line') { const x = Math.min(obj.x1, obj.x2); const y = Math.min(obj.y1, obj.y2); const width = Math.abs(obj.x1 - obj.x2); const height = Math.abs(obj.y1 - obj.y2); return { x, y, width, height }; }
    let points: [number, number][];
    if (obj.type === 'path') { points = obj.path; } else if (obj.type === 'polyline') { points = obj.points; } else if ('points' in obj && obj.points) { points = (obj.points as { x: number; y: number }[]).map((p) => [p.x, p.y]); } else { points = []; }
    if (points.length > 0) { const xs = points.map(p => p[0]); const ys = points.map(p => p[1]); const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys); return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }; }
    return { x: 0, y: 0, width: 0, height: 0 };
}
const getResizeHandles = (box: BoundingBox): Record<ResizeHandle, {x:number, y:number}> => ({ tl: { x: box.x, y: box.y }, tc: { x: box.x + box.width / 2, y: box.y }, tr: { x: box.x + box.width, y: box.y }, ml: { x: box.x, y: box.y + box.height / 2 }, mr: { x: box.x + box.width, y: box.y + box.height / 2 }, bl: { x: box.x, y: box.y + box.height }, bc: { x: box.x + box.width / 2, y: box.y + box.height }, br: { x: box.x + box.width, y: box.y + box.height }, });
const getHandleAtPosition = (pos: {x:number, y:number}, box: BoundingBox, zoom: number): ResizeHandle | null => { const handles = getResizeHandles(box); const tolerance = HANDLE_SIZE / zoom; for (const [key, handlePos] of Object.entries(handles)) { if (Math.abs(pos.x - handlePos.x) < tolerance && Math.abs(pos.y - handlePos.y) < tolerance) { return key as ResizeHandle; } } return null; }
const isPointInObject = (pos: {x: number; y: number}, obj: CanvasObject): boolean => { const box = getObjectBoundingBox(obj); const buffer = 5; return pos.x >= box.x - buffer && pos.x <= box.x + box.width + buffer && pos.y >= box.y - buffer && pos.y <= box.y + box.height + buffer; }
const getObjectPosition = (obj: CanvasObject): {x: number, y: number} => { const box = getObjectBoundingBox(obj); return { x: box.x, y: box.y }; }
const moveObject = (obj: CanvasObject, newX: number, newY: number): CanvasObject => {
    const oldPos = getObjectPosition(obj); const dx = newX - oldPos.x; const dy = newY - oldPos.y; const moved: any = { ...obj };
    if ('x' in moved && 'y' in moved) { moved.x += dx; moved.y += dy; }
    if (moved.type === 'circle' || moved.type === 'ellipse' || moved.type === 'ring' || moved.type === 'summing-junction' || moved.type === 'sequential-storage') { moved.cx += dx; moved.cy += dy; }
    if (moved.type === 'line' || moved.type === 'dashed-line') { moved.x1 += dx; moved.y1 += dy; moved.x2 += dx; moved.y2 += dy; }
    if (moved.type === 'path') { moved.path = moved.path.map(([px, py]: [number, number]) => [px + dx, py + dy]); } else if (moved.type === 'polyline') { moved.points = moved.points.map(([px, py]: [number, number]) => [px + dx, py + dy]); } else if ('points' in moved && moved.points) { moved.points = moved.points.map((p: {x: number, y: number}) => ({x: p.x + dx, y: p.y + dy})); }
    return moved;
}
const resizeObject = (obj: CanvasObject, startBox: BoundingBox, currentPos: {x:number, y:number}, handle: ResizeHandle, preserveAspect: boolean): CanvasObject => {
    let { x, y, width, height } = startBox; const aspect = startBox.width / startBox.height;
    if (handle.includes('r')) { width = currentPos.x - x; } if (handle.includes('l')) { width = (x + width) - currentPos.x; x = currentPos.x; } if (handle.includes('b')) { height = currentPos.y - y; } if (handle.includes('t')) { height = (y + height) - currentPos.y; y = currentPos.y; }
    if (preserveAspect && startBox.height > 0 && startBox.width > 0) { if (handle.includes('r') || handle.includes('l')) { height = width / aspect; } else { width = height * aspect; } if (handle.includes('t')) { y = startBox.y + startBox.height - height; } if (handle.includes('l')) { x = startBox.x + startBox.width - width; } }
    const newBox = { x, y, width, height }; const sx = startBox.width === 0 ? 1 : newBox.width / startBox.width; const sy = startBox.height === 0 ? 1 : newBox.height / startBox.height; const resized: any = { ...obj };
    const transformPoint = (p: {x:number, y:number}) => ({ x: newBox.x + (p.x - startBox.x) * sx, y: newBox.y + (p.y - startBox.y) * sy });
    if (resized.type === 'path') { resized.path = (obj as PathObject).path.map(([px, py]: [number, number]) => { const { x, y } = transformPoint({x: px, y: py}); return [x, y]; });
    } else if (resized.type === 'polyline') { resized.points = (obj as PolylineObject).points.map(([px, py]: [number, number]) => { const { x, y } = transformPoint({x: px, y: py}); return [x, y]; });
    } else if ('points' in resized && resized.points) { resized.points = (obj as PointsObject).points.map(transformPoint);
    } else if (resized.type === 'circle' || resized.type === 'summing-junction' || resized.type === 'sequential-storage') { resized.cx = newBox.x + newBox.width/2; resized.cy = newBox.y + newBox.height/2; resized.radius = Math.min(Math.abs(newBox.width), Math.abs(newBox.height)) / 2;
    } else if (resized.type === 'ellipse') { resized.cx = newBox.x + newBox.width/2; resized.cy = newBox.y + newBox.height/2; resized.rx = Math.abs(newBox.width)/2; resized.ry = Math.abs(newBox.height)/2;
    } else if (resized.type === 'ring') { const oldOuterRadius = (obj as RingObject).outerRadius; const newOuterRadius = Math.min(Math.abs(newBox.width), Math.abs(newBox.height)) / 2; const radiusScale = oldOuterRadius === 0 ? 1 : newOuterRadius / oldOuterRadius; resized.cx = newBox.x + newBox.width/2; resized.cy = newBox.y + newBox.height/2; resized.outerRadius = newOuterRadius; resized.innerRadius = (obj as RingObject).innerRadius * radiusScale;
    } else if (resized.type === 'line' || resized.type === 'dashed-line') { const p1 = transformPoint({x: (obj as LineObject).x1, y: (obj as LineObject).y1}); const p2 = transformPoint({x: (obj as LineObject).x2, y: (obj as LineObject).y2}); resized.x1 = p1.x; resized.y1 = p1.y; resized.x2 = p2.x; resized.y2 = p2.y;
    } else if ('x' in resized) { resized.x = newBox.x; resized.y = newBox.y; resized.width = newBox.width; resized.height = newBox.height; }
    return resized;
}
const getPolygonPoints = (cx: number, cy: number, r: number, sides: number) => { const points = []; for (let i = 0; i < sides; i++) { points.push({ x: cx + r * Math.cos(2 * Math.PI * i / sides - Math.PI / 2), y: cy + r * Math.sin(2 * Math.PI * i / sides - Math.PI / 2) }); } return points; }
const getStarPoints = (cx: number, cy: number, r: number, points: number, innerRadiusRatio: number) => { const starPoints = []; const angle = Math.PI / points; for (let i = 0; i < points * 2; i++) { const radius = i % 2 === 0 ? r : r * innerRadiusRatio; starPoints.push({ x: cx + radius * Math.sin(i * angle), y: cy - radius * Math.cos(i * angle) }); } return starPoints; }
const getHeartPoints = (x:number, y:number, w:number, h:number) => { const p = []; for (let i = 0; i < 360; i++) { const t = i * Math.PI / 180; const px = x + w/2 + 16 * Math.sin(t)**3; const py = y + h/2 - (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)); const scaledX = x + ((px - (x + w/2 - 16)) / 32) * w; const scaledY = y + ((py - (y + h/2 - 25)) / 27) * h; p.push({x: scaledX, y: scaledY}); } return p; };
const getCloudPoints = (x:number, y:number, w:number, h:number) => [ {x:x+w*0.25, y:y+h*0.75}, {x:x, y:y+h*0.75}, {x:x, y:y+h*0.25}, {x:x+w*0.25, y:y+h*0.25}, {x:x+w*0.25, y:y}, {x:x+w*0.75, y:y}, {x:x+w*0.75, y:y+h*0.25}, {x:x+w, y:y+h*0.25}, {x:x+w, y:y+h*0.75}, {x:x+w*0.75, y:y+h*0.75}, {x:x+w*0.75, y:y+h}, {x:x+w*0.25, y:y+h} ];
const getSpeechBubblePoints = (x:number, y:number, w:number, h:number) => [ {x:x, y:y}, {x:x+w, y:y}, {x:x+w, y:y+h*0.75}, {x:x+w*0.25, y:y+h*0.75}, {x:x+w*0.2, y:y+h}, {x:x+w*0.15, y:y+h*0.75}, {x:x, y:y+h*0.75} ];
const getCrossPoints = (x:number, y:number, w:number, h:number) => [ {x: x+w*0.35, y: y}, {x: x+w*0.65, y: y}, {x: x+w*0.65, y: y+h*0.35}, {x: x+w, y: y+h*0.35}, {x: x+w, y: y+h*0.65}, {x: x+w*0.65, y: y+h*0.65}, {x: x+w*0.65, y: y+h}, {x: x+w*0.35, y: y+h}, {x: x+w*0.35, y: y+h*0.65}, {x: x, y: y+h*0.65}, {x: x, y: y+h*0.35}, {x: x+w*0.35, y: y+h*0.35} ];
const getLightningPoints = (x:number, y:number, w:number, h:number) => [ {x:x+w*0.5, y:y}, {x:x+w, y:y}, {x:x+w*0.6, y:y+h*0.5}, {x:x+w, y:y+h}, {x:x+w*0.5, y:y+h}, {x:x, y:y+h*0.5} ];
const getTrapezoidPoints = (x:number, y:number, w:number, h:number) => [{x:x+w*0.2, y:y}, {x:x+w*0.8, y:y}, {x:x+w, y:y+h}, {x:x, y:y+h}];
const getParallelogramPoints = (x:number, y:number, w:number, h:number) => [{x:x+w*0.25, y:y}, {x:x+w, y:y}, {x:x+w*0.75, y:y+h}, {x:x, y:y+h}];
const getCrescentMoonPoints = (x:number, y:number, w:number, h:number) => [{x: x+w*0.5, y: y}, {x: x+w*0.6, y: y+h*0.5}, {x: x+w*0.5, y: y+h}, {x: x, y: y+h}, {x: x+w*0.4, y: y+h*0.5}, {x:x,y:y}];
const getCubePoints = (x:number, y:number, w:number, h:number) => { const s = Math.min(w, h); const p = s * 0.4; const x0=x, y0=y+p, x1=x+s-p, y1=y, x2=x+s, y2=y+p, x3=x+p, y3=y+s, x4=x, y4=y+s-p, x5=x+s-p, y5=y+s; return [{x:x0,y:y0},{x:x1,y:y1},{x:x2,y:y2},{x:x5,y:y5},{x:x4,y:y4},{x:x0,y:y0},{x:x3,y:y3},{x:x5,y:y5},{x:x3,y:y3},{x:x4,y:y4}]; }
const getCylinderPoints = (x:number, y:number, w:number, h:number) => [];
const getCurvedArrowPoints = (start:{x:number, y:number}, end:{x:number, y:number}) => { const headlen = 15; const dx = end.x - start.x; const dy = end.y - start.y; const angle = Math.atan2(dy, dx); const cp1x = start.x + dx * 0.5 - dy * 0.3; const cp1y = start.y + dy * 0.5 + dx * 0.3; return [{x: start.x, y: start.y}, {x: cp1x, y: cp1y}, {x: end.x, y: end.y}, {x: end.x-headlen*Math.cos(angle-Math.PI/6), y: end.y-headlen*Math.sin(angle-Math.PI/6)}, {x: end.x, y: end.y}, {x: end.x-headlen*Math.cos(angle+Math.PI/6), y: end.y-headlen*Math.sin(angle+Math.PI/6)}]; };
const getDoubleArrowPoints = (start:{x:number, y:number}, end:{x:number, y:number}) => { const headlen = 15; const dx = end.x - start.x; const dy = end.y - start.y; const angle = Math.atan2(dy, dx); return [{x: start.x, y: start.y}, {x: end.x, y: end.y}, {x: end.x - headlen * Math.cos(angle - Math.PI / 6), y: end.y - headlen * Math.sin(angle - Math.PI / 6)}, {x: end.x, y: end.y}, {x: end.x - headlen * Math.cos(angle + Math.PI / 6), y: end.y - headlen * Math.sin(angle + Math.PI / 6)}, {x: end.x, y: end.y}, {x: start.x, y: start.y}, {x: start.x + headlen * Math.cos(angle - Math.PI / 6), y: start.y + headlen * Math.sin(angle - Math.PI / 6)}, {x: start.x, y: start.y}, {x: start.x + headlen * Math.cos(angle + Math.PI / 6), y: start.y + headlen * Math.sin(angle + Math.PI / 6)}]; };
const getCalloutBubblePoints = (x:number, y:number, w:number, h:number) => [{x:x, y:y}, {x:x+w, y:y}, {x:x+w, y:y+h*0.75}, {x:x+w*0.2, y:y+h*0.75}, {x:x, y:y+h}, {x:x+w*0.1, y:y+h*0.75}, {x:x, y:y+h*0.75}];
const getThoughtBubblePoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y+h*0.2},{x:x+w*0.2,y:y},{x:x+w*0.8,y:y},{x:x+w,y:y+h*0.2},{x:x+w*0.9,y:y+h*0.8},{x:x+w*0.2,y:y+h},{x:x+w*0.1,y:y+h*0.8}];
const getBannerPoints = (x:number, y:number, w:number, h:number) => [{x:x, y:y}, {x:x+w, y:y}, {x:x+w*0.8, y:y+h*0.5}, {x:x+w, y:y+h}, {x:x, y:y+h}, {x:x+w*0.2, y:y+h*0.5}];
const getSunPoints = (x:number, y:number, w:number, h:number) => getStarPoints(x+w/2, y+h/2, Math.min(w,h)/2, 12, 0.6);
const getQuestionMarkPoints = (x:number, y:number, w:number, h:number) => [{x:x+w*0.5, y:y+h*0.8}, {x:x+w*0.5, y:y+h}, {x:x+w*0.5,y:y+h*0.8},{x:x+w*0.5,y:y+h*0.6},{x:x+w,y:y+h*0.5},{x:x+w,y:y+h*0.2},{x:x+w*0.5,y:y},{x:x,y:y+h*0.2},{x:x,y:y+h*0.4}];
const getExclamationMarkPoints = (x:number, y:number, w:number, h:number) => [{x:x+w*0.4, y:y+h*0.85}, {x:x+w*0.6, y:y+h*0.85}, {x:x+w*0.6, y:y+h},{x:x+w*0.4,y:y+h},{x:x+w*0.4, y:y+h*0.85},{x:x+w*0.5, y:y},{x:x+w*0.5, y:y+h*0.7}];
const getCheckMarkPoints = (x:number, y:number, w:number, h:number) => [{x:x, y:y+h*0.5}, {x:x+w*0.4, y:y+h}, {x:x+w, y:y}];
const getInfinityPoints = (x:number, y:number, w:number, h:number) => { const p = []; for(let i = 0; i < 360; i++) { const t = i * Math.PI / 180; const scale = 2 / (3 - Math.cos(2*t)); const px = x + w/2 + (w/2) * scale * Math.cos(t); const py = y + h/2 + (h/2) * scale * Math.sin(2*t) / 2; p.push({x: px, y: py}); } return p; }
const getDocumentPoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y},{x:x+w,y:y},{x:x+w,y:y+h},{x:x+w*0.75,y:y+h*0.85},{x:x+w*0.5,y:y+h},{x:x+w*0.25,y:y+h*0.85},{x:x,y:y+h}];
const getMultiDocumentPoints = (x:number, y:number, w:number, h:number) => getDocumentPoints(x,y,w*0.9,h*0.9).concat(getDocumentPoints(x+w*0.1,y+h*0.1,w*0.9,h*0.9));
const getManualInputPoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y+h*0.2},{x:x+w,y:y},{x:x+w,y:y+h},{x:x,y:y+h}];
const getManualOperationPoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y+h},{x:x+w*0.2,y:y},{x:x+w*0.8,y:y},{x:x+w,y:y+h}];
const getOffPageConnectorPoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y},{x:x+w,y:y},{x:x+w,y:y+h*0.8},{x:x+w/2,y:y+h},{x:x,y:y+h*0.8}];
const getOrGatePoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y},{x:x+w*0.5,y:y},{x:x+w,y:y+h/2},{x:x+w*0.5,y:y+h},{x:x,y:y+h},{x:x+w*0.2,y:y+h/2}];
const getCollatePoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y},{x:x+w,y:y},{x:x,y:y+h},{x:x+w,y:y+h}];
const getSortPoints = (x:number, y:number, w:number, h:number) => [{x:x+w/2,y:y},{x:x+w,y:y+h/2},{x:x+w/2,y:y+h},{x:x,y:y+h/2},{x:x+w/2,y:y},{x:x+w/2,y:y+h}];
const getMergePoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y},{x:x+w,y:y},{x:x+w/2,y:y+h}];
const getStoredDataPoints = (x:number, y:number, w:number, h:number) => [{x:x+w*0.1,y:y},{x:x+w,y:y},{x:x+w*0.9,y:y+h},{x:x,y:y+h}];
const getDelayPoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y},{x:x+w*0.75,y:y},{x:x+w,y:y+h/2},{x:x+w*0.75,y:y+h},{x:x,y:y+h}];
const getDisplayPoints = (x:number, y:number, w:number, h:number) => [{x:x,y:y+h/2},{x:x+w*0.2,y:y},{x:x+w*0.8,y:y},{x:x+w,y:y+h/2},{x:x+w*0.8,y:y+h},{x:x+w*0.2,y:y+h}];

// ===================================================================================
//  MAIN APP COMPONENT (from App.tsx)
// ===================================================================================
let itemIdCounter = 1;

const createNewLayer = (name: string, objects: CanvasObject[] = []): Layer => {
  itemIdCounter++;
  return { type: 'layer', id: itemIdCounter, name, objects, isVisible: true, blendMode: 'normal', effects: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, blur: 0, } };
};

const createNewGroup = (): LayerGroup => {
  itemIdCounter++;
  return { type: 'group', id: itemIdCounter, name: `গ্রুপ ${itemIdCounter - 1}`, layers: [], isVisible: true, isExpanded: true, }
}

const TabButton: React.FC<{ children: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ children, isActive, onClick }) => (
    <button onClick={onClick} className={`relative flex-1 p-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
        {children}
        {isActive && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_theme(colors.cyan.400)]"></div>}
    </button>
);

const App: React.FC = () => {
  const [history, setHistory] = useState<LayerItem[][]>([ [createNewLayer('স্তর 1')] ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const layers = history[historyIndex];

  const [activeItemId, setActiveItemId] = useState<number>(layers[0].id);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [fillColor, setFillColor] = useState<string>('#4ade80');
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>('#ffffff');
  
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isTextPromptOpen, setIsTextPromptOpen] = useState(false);
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [mousePosition, setMousePosition] = useState<{x: number; y: number} | null>(null);
  const [activeTab, setActiveTab] = useState<'layers' | 'properties' | 'effects'>('layers');
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [editingText, setEditingText] = useState<{ objectId: string, text: string } | null>(null);


  const importImageInputRef = useRef<HTMLInputElement>(null);
  const downloadTriggerRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!isMobileView) {
      setIsLeftPanelOpen(false);
      setIsRightPanelOpen(false);
    }
  }, [isMobileView]);

  const setLayers = useCallback((updater: (prevLayers: LayerItem[]) => LayerItem[], keepHistory: boolean = false) => {
    const newLayers = updater(history[historyIndex]);
    if (keepHistory) {
      const newHistory = [...history];
      newHistory[historyIndex] = newLayers;
      setHistory(newHistory);
    } else {
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, newLayers]);
      setHistoryIndex(newHistory.length);
    }
  }, [history, historyIndex]);

  const activeItem = useMemo(() => findItem(layers, activeItemId), [layers, activeItemId]);
  const activeLayer = activeItem?.type === 'layer' ? activeItem : undefined;
  const selectedObject = useMemo(() => {
      if (!selectedObjectId || !activeLayer) return null;
      return activeLayer.objects.find(obj => obj.id === selectedObjectId) || null;
  }, [selectedObjectId, activeLayer]);
  
  useEffect(() => {
    if (selectedObjectId && activeTab !== 'properties') { setActiveTab('properties'); }
  }, [selectedObjectId, activeTab]);

  const activeLayerEffects = activeLayer?.effects ?? { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, blur: 0 };
  const activeLayerBlendMode = activeLayer?.blendMode ?? 'normal';
  
  const handleAddLayer = useCallback(() => { const newLayer = createNewLayer(`স্তর ${itemIdCounter}`); const parentId = getParentId(layers, activeItemId); setLayers(prev => addItemToTree(prev, newLayer, parentId)); setActiveItemId(newLayer.id); }, [setLayers, layers, activeItemId]);
  const handleCreateGroup = useCallback(() => { const newGroup = createNewGroup(); setLayers(prev => [...prev, newGroup]); setActiveItemId(newGroup.id); }, [setLayers]);
  const handleDeleteItem = useCallback((id: number) => { if (layers.length <= 1 && findItem(layers, id)?.type === 'layer') return; let nextActiveId = activeItemId; if (activeItemId === id) { nextActiveId = getParentId(layers, id) ?? layers.find(i => i.id !== id)?.id ?? 0; } setLayers(prev => deleteFromTree(prev, id)); setActiveItemId(nextActiveId); }, [layers, activeItemId, setLayers]);
  const handleSelectItem = useCallback((id: number) => { setActiveItemId(id); setSelectedObjectId(null); }, []);
  const handleToggleVisibility = useCallback((id: number) => { setLayers(prev => updateTree(prev, id, item => ({...item, isVisible: !item.isVisible})), true); }, [setLayers]);
  const handleToggleGroupExpanded = useCallback((id: number) => { setLayers(prev => updateTree(prev, id, item => item.type === 'group' ? {...item, isExpanded: !item.isExpanded} : item), true); }, [setLayers]);
  const handleUpdateEffects = useCallback((newEffects: LayerEffects) => { if (!activeLayer) return; setLayers(prev => updateTree(prev, activeLayer.id, layer => ({...layer, effects: newEffects})), true); }, [activeLayer, setLayers]);
  const handleUpdateBlendMode = useCallback((blendMode: BlendMode) => { if (!activeLayer) return; setLayers(prev => updateTree(prev, activeLayer.id, layer => ({...layer, blendMode})), true); }, [activeLayer, setLayers]);
  const handleResetEffects = useCallback(() => { if(!activeLayer) return; handleUpdateEffects({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, blur: 0 }); handleUpdateBlendMode('normal'); }, [activeLayer, handleUpdateEffects, handleUpdateBlendMode]);
  const handleAddObject = useCallback((object: CanvasObject) => { if (!activeLayer) return; setLayers(prev => updateTree(prev, activeLayer.id, layer => ({ ...layer, objects: [...(layer as Layer).objects, object] }))); }, [activeLayer, setLayers]);
  const handleUpdateObject = useCallback((updatedObject: CanvasObject) => { if (!activeLayer) return; setLayers(prev => updateTree(prev, activeLayer.id, layer => ({ ...layer, objects: (layer as Layer).objects.map(obj => obj.id === updatedObject.id ? updatedObject : obj) }))); }, [activeLayer, setLayers]);
  const handleUpdateSelectedObjectProperties = useCallback((props: Partial<CanvasObject>) => {
      if (!activeLayer || !selectedObjectId) return;
      handleUpdateObject({ ...selectedObject, ...props } as CanvasObject);
  }, [activeLayer, selectedObjectId, selectedObject, handleUpdateObject]);
  const handleSelectTool = useCallback((tool: Tool) => { setActiveTool(tool); if (tool === 'ai') setIsAIPromptOpen(true); if (tool === 'text') setIsTextPromptOpen(true); }, []);
  const handleToggleView = () => setIsMobileView(prev => !prev);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const handleUndo = useCallback(() => canUndo && setHistoryIndex(i => i - 1), [canUndo]);
  const handleRedo = useCallback(() => canRedo && setHistoryIndex(i => i + 1), [canRedo]);
  
  const handleZoom = (direction: 'in' | 'out') => { setZoom(prev => { const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2; return Math.max(0.1, Math.min(newZoom, 10)); }); };
  const handlePan = (dx: number, dy: number) => setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  
  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = (event) => {
        const imageUrl = event.target?.result as string; const image = new Image();
        image.onload = () => { const imageObject: ImageObject = { type: 'image', id: `img-${Date.now()}`, image, x: 50, y: 50, width: image.width, height: image.height, }; const newLayer = createNewLayer(file.name.substring(0, 20), [imageObject]); setLayers(prev => [...prev, newLayer]); setActiveItemId(newLayer.id); };
        image.src = imageUrl;
    };
    reader.readAsDataURL(file); if(e.target) e.target.value = '';
  };

  const handleAIGenerate = async (prompt: string) => {
    setAiIsLoading(true); setAiError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' }, });
      const base64Image = response.generatedImages[0].image.imageBytes; const imageUrl = `data:image/jpeg;base64,${base64Image}`; const image = new Image();
      image.onload = () => { const imageObject: ImageObject = { type: 'image', id: `img-${Date.now()}`, image, x: 50, y: 50, width: image.width, height: image.height, }; const newLayer = createNewLayer(prompt.substring(0, 20), [imageObject]); setLayers(prev => [...prev, newLayer]); setActiveItemId(newLayer.id); setIsAIPromptOpen(false); };
      image.src = imageUrl;
    } catch (e: any) { console.error(e); setAiError(e.message || 'ছবি তৈরি করা যায়নি।'); } finally { setAiIsLoading(false); }
  };

  const handleAddText = (text: string) => { const textObject: TextObject = { type: 'text', id: `txt-${Date.now()}`, text, x: 100, y: 100, color: strokeColor, fontSize: 48, fontFamily: 'Inter', }; handleAddObject(textObject); setIsTextPromptOpen(false); setActiveTool('pencil'); };
  
  const handleAlignSelectedObject = useCallback((type: 'h' | 'v') => {
      if (!selectedObject) return;
      const box = getObjectBoundingBox(selectedObject);
      let newX = box.x;
      let newY = box.y;
      if (type === 'h') {
          newX = (CANVAS_WIDTH - box.width) / 2;
      } else { // 'v'
          newY = (CANVAS_HEIGHT - box.height) / 2;
      }
      handleUpdateObject(moveObject(selectedObject, newX, newY));
  }, [selectedObject, handleUpdateObject]);

  const handleDeleteSelectedObject = useCallback(() => {
    if (!activeLayer || !selectedObjectId) return;
    setLayers(prev => updateTree(prev, activeLayer.id, layer => ({ ...layer, objects: (layer as Layer).objects.filter(obj => obj.id !== selectedObjectId) })));
    setSelectedObjectId(null);
  }, [activeLayer, selectedObjectId, setLayers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            handleDeleteSelectedObject();
        }
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if (e.key === 'y' || (e.key === 'Z' && e.shiftKey)) {
                e.preventDefault();
                handleRedo();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelectedObject, handleUndo, handleRedo]);

  return (
    <div className="w-screen h-screen bg-gray-950 flex items-center justify-center p-0 sm:p-4 font-sans">
        <div className={`relative flex bg-gray-900 text-white transition-all duration-500 ease-in-out shadow-2xl ${isMobileView ? 'w-[390px] h-[844px] border-8 border-zinc-900 rounded-[40px]' : 'w-full h-full sm:rounded-2xl'}`}>
            <div className={`flex w-full h-full overflow-hidden ${isMobileView ? 'rounded-[32px]' : 'sm:rounded-xl'}`}>
                <input type="file" ref={importImageInputRef} onChange={handleImageImport} accept="image/*" className="hidden" />
                
                <aside className={`bg-gray-900 flex-shrink-0 transition-transform duration-300 ease-in-out border-r border-zinc-800 ${
                    isMobileView 
                        ? `absolute top-0 left-0 h-full z-40 w-56 ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-full'}` 
                        : 'w-56'
                }`}>
                    <Toolbar activeTool={activeTool} strokeColor={strokeColor} fillColor={fillColor} onSelectTool={handleSelectTool} onStrokeColorChange={setStrokeColor} onFillColorChange={setFillColor} onZoomIn={() => handleZoom('in')} onZoomOut={() => handleZoom('out')} showGrid={showGrid} onToggleGrid={() => setShowGrid(p => !p)} snapToGrid={snapToGrid} onToggleSnapToGrid={() => setSnapToGrid(p => !p)} canUndo={canUndo} onUndo={handleUndo} canRedo={canRedo} onRedo={handleRedo} onImport={() => importImageInputRef.current?.click()} onDownload={() => downloadTriggerRef.current()} isMobileView={isMobileView} onToggleView={handleToggleView} />
                </aside>
                
                <main className="flex-grow flex items-center justify-center overflow-hidden relative bg-gray-800">
                    <CanvasArea layers={layers} activeLayer={activeLayer} activeTool={activeTool} strokeColor={strokeColor} fillColor={fillColor} onAddObject={handleAddObject} onUpdateObject={handleUpdateObject} onSetStrokeColor={setStrokeColor} zoom={zoom} panOffset={panOffset} onPan={handlePan} showGrid={showGrid} snapToGrid={snapToGrid} setMousePosition={setMousePosition} setDownloadTrigger={(trigger) => { downloadTriggerRef.current = trigger; }} selectedObjectId={selectedObjectId} onSetSelectedObjectId={setSelectedObjectId} canvasBackgroundColor={canvasBackgroundColor} editingText={editingText} setEditingText={setEditingText} />
                    {mousePosition && (<div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md pointer-events-none font-mono">X: {mousePosition.x.toFixed(0)}, Y: {mousePosition.y.toFixed(0)}</div>)}
                </main>
                
                <aside className={`bg-gray-900 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out border-l border-zinc-800 ${
                    isMobileView 
                        ? `absolute top-0 right-0 h-full z-40 w-72 ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`
                        : 'w-72'
                }`}>
                    <div className="flex border-b border-zinc-800">
                        <TabButton isActive={activeTab === 'layers'} onClick={() => setActiveTab('layers')}>স্তর</TabButton>
                        <TabButton isActive={activeTab === 'properties'} onClick={() => setActiveTab('properties')}>বৈশিষ্ট্য</TabButton>
                        <TabButton isActive={activeTab === 'effects'} onClick={() => setActiveTab('effects')}>ইফেক্টস</TabButton>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'layers' && <LayerPanel layers={layers} activeItemId={activeItemId} onAddLayer={handleAddLayer} onCreateGroup={handleCreateGroup} onDeleteItem={handleDeleteItem} onSelectItem={handleSelectItem} onToggleVisibility={handleToggleVisibility} onToggleGroupExpanded={handleToggleGroupExpanded} />}
                        {activeTab === 'properties' && <PropertiesPanel selectedObject={selectedObject} onUpdateSelectedObject={handleUpdateSelectedObjectProperties} onAlignSelectedObject={handleAlignSelectedObject} canvasBackgroundColor={canvasBackgroundColor} onCanvasBackgroundChange={setCanvasBackgroundColor} />}
                        {activeTab === 'effects' && activeLayer && <EffectsPanel key={activeLayer.id} activeLayerEffects={activeLayerEffects} activeLayerBlendMode={activeLayerBlendMode} onUpdateEffects={handleUpdateEffects} onUpdateBlendMode={handleUpdateBlendMode} onResetEffects={handleResetEffects} />}
                        {activeTab === 'effects' && !activeLayer && <div className="p-4 text-center text-gray-500 text-sm">একটি স্তর নির্বাচন করুন</div>}
                    </div>
                </aside>
                
                {isMobileView && (
                  <>
                    <div className="absolute top-4 left-4 z-50">
                      <button 
                        onClick={() => { setIsLeftPanelOpen(prev => !prev); setIsRightPanelOpen(false); }} 
                        className={`flex items-center justify-center w-12 h-12 backdrop-blur-sm text-white rounded-full shadow-lg transition-colors ${isLeftPanelOpen ? 'bg-cyan-600' : 'bg-black/50'}`}
                      >
                        <MenuIcon className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="absolute top-4 right-4 z-50">
                      <button 
                        onClick={() => { setIsRightPanelOpen(prev => !prev); setIsLeftPanelOpen(false); }}
                        className={`flex items-center justify-center w-12 h-12 backdrop-blur-sm text-white rounded-full shadow-lg transition-colors ${isRightPanelOpen ? 'bg-cyan-600' : 'bg-black/50'}`}
                      >
                         <PanelRightIcon className="w-6 h-6" />
                      </button>
                    </div>
                    
                    {(isLeftPanelOpen || isRightPanelOpen) && (
                      <div 
                        className="absolute inset-0 bg-black/60 z-30" 
                        onClick={() => { setIsLeftPanelOpen(false); setIsRightPanelOpen(false); }}>
                      </div>
                    )}
                  </>
                )}
            </div>
        </div>
        <AIPromptModal isOpen={isAIPromptOpen} isLoading={aiIsLoading} error={aiError} onSubmit={handleAIGenerate} onClose={() => { setIsAIPromptOpen(false); setActiveTool('pencil'); }} />
        <TextPromptModal isOpen={isTextPromptOpen} onSubmit={handleAddText} onClose={() => { setIsTextPromptOpen(false); setActiveTool('pencil'); }} />
    </div>
  );
};

export default App;
