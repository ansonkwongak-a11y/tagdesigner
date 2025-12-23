import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

// --- 🔑 設定區 ---
const GOOGLE_CLIENT_ID = "1083951648656-u9n474lm8q7de43dlu34tqr8n9sfgoda.apps.googleusercontent.com"; 
// 2. Google API Key (Gemini & GAPI)
// 👇👇👇【安全修正】優先讀取環境變數，避免 Key 再次外洩 👇👇👇
const GOOGLE_API_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) || // Vite 專用
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_API_KEY) || // CRA 專用
  ""; // ⚠️ 請保持為空字串，不要將 Key 寫在這裡，除非您的 GitHub 是 Private 的

const apiKey = GOOGLE_API_KEY; 

// --- 內部圖示元件庫 (Internal Icons) ---
const IconBase = ({ size = 24, color = "currentColor", className = "", children, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    {children}
  </svg>
);

const Sparkles = (p) => <IconBase {...p}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></IconBase>;
const Share2 = (p) => <IconBase {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></IconBase>;
const Maximize = (p) => <IconBase {...p}><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></IconBase>;
const ZoomIn = (p) => <IconBase {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></IconBase>;
const ZoomOut = (p) => <IconBase {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></IconBase>;
const ImageIcon = (p) => <IconBase {...p}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></IconBase>;
const Trash2 = (p) => <IconBase {...p}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></IconBase>;
const ChevronRight = (p) => <IconBase {...p}><path d="m9 18 6-6-6-6"/></IconBase>;
const ChevronLeft = (p) => <IconBase {...p}><path d="m15 18-6-6 6-6"/></IconBase>;
const Layers = (p) => <IconBase {...p}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></IconBase>;
const Palette = (p) => <IconBase {...p}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></IconBase>;
const Zap = (p) => <IconBase {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></IconBase>;
const RotateCcw = (p) => <IconBase {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></IconBase>;
const Award = (p) => <IconBase {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></IconBase>;
const Move = (p) => <IconBase {...p}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 15 22 12 19 9"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></IconBase>;
const RotateCw = (p) => <IconBase {...p}><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></IconBase>;
const ArrowUp = (p) => <IconBase {...p}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></IconBase>;
const ArrowDown = (p) => <IconBase {...p}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></IconBase>;
// --- 👇👇👇 請補上這行遺失的圖示定義 👇👇👇 ---
const ChevronDown = (p) => <IconBase {...p}><polyline points="6 9 12 15 18 9"/></IconBase>;
// --- 👆👆👆 補上這行 👆👆👆 ---
const Type = (p) => <IconBase {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></IconBase>;
const HandIcon = (p) => <IconBase {...p}><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></IconBase>;
const Save = (p) => <IconBase {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></IconBase>;
const Box = (p) => <IconBase {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></IconBase>;
const Scissors = (p) => <IconBase {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></IconBase>;
const Eraser = (p) => <IconBase {...p}><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></IconBase>;
const Circle = (p) => <IconBase {...p}><circle cx="12" cy="12" r="10"/></IconBase>;
const Square = (p) => <IconBase {...p}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></IconBase>;
const Wallpaper = (p) => <IconBase {...p}><circle cx="8" cy="8" r="2"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></IconBase>;
const Sticker = (p) => <IconBase {...p}><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></IconBase>;
const PaintBucket = (p) => <IconBase {...p}><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></IconBase>;
const Heart = (p) => <IconBase {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></IconBase>;
const Star = (p) => <IconBase {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></IconBase>;
const Shield = (p) => <IconBase {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></IconBase>;
const Check = (p) => <IconBase {...p}><polyline points="20 6 9 17 4 12"/></IconBase>;
const Scan = (p) => <IconBase {...p}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></IconBase>;
const Menu = (p) => <IconBase {...p}><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></IconBase>;
const Home = (p) => <IconBase {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></IconBase>;
const LinkIcon = (p) => <IconBase {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></IconBase>;
const AtSign = (p) => <IconBase {...p}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></IconBase>;
const Copy = (p) => <IconBase {...p}><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></IconBase>;
const Code = (p) => <IconBase {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></IconBase>;
const CopyPlus = (p) => <IconBase {...p}><line x1="15" y1="12" x2="19" y2="12"/><line x1="17" y1="10" x2="17" y2="14"/><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></IconBase>;
const AlignCenterHorizontal = (p) => <IconBase {...p}><path d="M2 12h20"/><path d="M10 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/><path d="M10 8V4a2 2 0 0 1-2-2H6a2 2 0 0 1-2 2v4"/><path d="M20 16v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1"/><path d="M14 8V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/></IconBase>;
const AlignCenterVertical = (p) => <IconBase {...p}><path d="M12 2v20"/><path d="M16 10h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4"/><path d="M8 10H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4"/><path d="M16 20h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-1"/><path d="M8 20H7a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1"/></IconBase>;
const FlipHorizontal = (p) => <IconBase {...p}><path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 3v18"/></IconBase>;
const FlipVertical = (p) => <IconBase {...p}><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M3 12h18"/></IconBase>;
const Cloud = (p) => <IconBase {...p}><path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19"/><path d="M17.5 19c3.037 0 5.5-2.239 5.5-5s-2.463-5-5.5-5h-1"/><path d="M6.5 19C3.463 19 1 16.761 1 14s2.463-5 5.5-5h1.05a7.5 7.5 0 0 1 13.899-2.5"/></IconBase>;
const Loader2 = (p) => <IconBase {...p}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></IconBase>;
const LogIn = (p) => <IconBase {...p}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></IconBase>;
const HardDrive = (p) => <IconBase {...p}><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></IconBase>;
const Wrench = (p) => <IconBase {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></IconBase>;
const Settings = (p) => <IconBase {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></IconBase>;
const Lightbulb = (p) => <IconBase {...p}><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.9.66-1.74 1.41-2.35 1.5-1.24 1.7-3.48.42-5A6 6 0 0 0 6 9c0 1 .2 2 .6 3 .5 1.1 1.4 2 1.4 2.8V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2z"/></IconBase>;
const Cpu = (p) => <IconBase {...p}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></IconBase>;
const Grid = (p) => <IconBase {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></IconBase>;
const Hash = (p) => <IconBase {...p}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></IconBase>;
const Flame = (p) => <IconBase {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3.7.8 1.4 3 2.8z"/></IconBase>;
const X = (p) => <IconBase {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></IconBase>;
const Minimize2 = (p) => <IconBase {...p}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></IconBase>;
const User = (p) => <IconBase {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></IconBase>;
const Shirt = (p) => <IconBase {...p}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></IconBase>;
const MapPin = (p) => <IconBase {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></IconBase>;
const Camera = (p) => <IconBase {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></IconBase>;
const Sliders = (p) => <IconBase {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></IconBase>;
const Upload = (p) => <IconBase {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></IconBase>;
const UserPlus = (p) => <IconBase {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></IconBase>;
const FileImage = (p) => <IconBase {...p}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></IconBase>;
const HelpCircle = (p) => <IconBase {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></IconBase>;
// --- 應用程式常數 ---
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

const MATERIAL_316 = { 
  id: '316_ss', name: '316 醫療級不鏽鋼 (平面)', css: 'bg-[#E5E7EB] border border-gray-300' 
};

const PX_PER_MM = 10;
const TAG_WIDTH_MM = 29;
const TAG_HEIGHT_MM = 50;
const TAG_WIDTH_PX = TAG_WIDTH_MM * PX_PER_MM; // 290px
const TAG_HEIGHT_PX = TAG_HEIGHT_MM * PX_PER_MM; // 500px

// 邊框紋理選項
const EDGE_PATTERNS = [
    { id: 'plain', name: '光滑拋光 (Polished)', icon: Box },
    { id: 'matte', name: '霧面噴砂 (Matte)', icon: Cloud },
    { id: 'brushed', name: '金屬拉絲 (Brushed)', icon: AlignCenterHorizontal },
    { id: 'coin', name: '錢幣齒紋 (Coin Edge)', icon: Settings },
    { id: 'knurled', name: '菱格滾花 (Knurled)', icon: Grid },
    { id: 'damascus', name: '大馬士革 (Damascus)', icon: Zap },
    { id: 'hammered', name: '手工錘紋 (Hammered)', icon: Circle },
    { id: 'grooved', name: '水平溝槽 (Grooved)', icon: Menu },
    { id: 'circuit', name: '科技電路 (Circuit)', icon: Cpu },
    { id: 'scales', name: '龍鱗紋路 (Scales)', icon: Shield },
];

const FONTS = {
  en: [
    { name: 'Inter (Default)', value: '"Inter", sans-serif' },
    { name: 'Roboto', value: '"Roboto", sans-serif' },
    { name: 'Arial Black', value: '"Arial Black", sans-serif' },
    { name: 'Montserrat', value: '"Montserrat", sans-serif' },
    { name: 'Oswald (Bold)', value: '"Oswald", sans-serif' },
    { name: 'Courier Prime', value: '"Courier Prime", monospace' },
    { name: '海盜哥德 (Pirata One)', value: '"Pirata One", cursive' }, 
    { name: '現代哥德 (Grenze Gotisch)', value: '"Grenze Gotisch", cursive' }, 
    // 新增更多硬派字型
    { name: '紋理哥德 (Texturina)', value: '"Texturina", serif' },
    { name: '重金屬 (New Rocker)', value: '"New Rocker", cursive' },
    { name: '狂熱金屬 (Metal Mania)', value: '"Metal Mania", cursive' },
    { name: '中世紀 (MedievalSharp)', value: '"MedievalSharp", cursive' },
  ],
  military: [
    { name: '特種部隊 (Black Ops One)', value: '"Black Ops One", system-ui' },
    { name: '軍用模板 (Stardos Stencil)', value: '"Stardos Stencil", system-ui' },
    { name: '舊式印刷 (Courier Prime)', value: '"Courier Prime", monospace' },
  ],
  zh: [
    { name: '微軟正黑體', value: '"Microsoft JhengHei", "Microsoft YaHei", sans-serif' },
    { name: '標楷體', value: '"DFKai-SB", "BiauKai", serif' },
    { name: '新細明體', value: '"PMingLiU", serif' },
  ],
  signature: [
    { name: '商務風 (Alex Brush)', value: '"Alex Brush", cursive' },
    { name: '優雅風 (Great Vibes)', value: '"Great Vibes", cursive' },
    { name: '古典鋼筆 (Herr Von Muellerhoff)', value: '"Herr Von Muellerhoff", cursive' },
    { name: '私人手簽 (Mrs Saint Delafield)', value: '"Mrs Saint Delafield", cursive' },
    { name: '現代流暢 (Allura)', value: '"Allura", cursive' },
    { name: '貴族氣息 (Pinyon Script)', value: '"Pinyon Script", cursive' },
    { name: '藝術飛白 (Aguafina Script)', value: '"Aguafina Script", cursive' },
    { name: '真實墨水 (Meddon)', value: '"Meddon", cursive' },
  ]
};

const CROP_SHAPES = {
  none: { name: '原圖', icon: Box, css: 'none' },
  circle: { name: '圓形', icon: Circle, css: 'circle(50% at 50% 50%)' },
  square: { name: '方形', icon: Square, css: 'inset(0% 0% 0% 0% round 10px)' },
  heart: { name: '愛心', icon: Heart, css: 'polygon(50% 15%, 61% 10%, 75% 10%, 90% 25%, 90% 45%, 50% 90%, 10% 45%, 10% 25%, 25% 10%, 39% 10%)' },
  star: { name: '星形', icon: Star, css: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  shield: { name: '盾牌', icon: Shield, css: 'polygon(50% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%, 0% 0%)' } 
};

// --- Helpers ---
const removeWhiteBackground = (imageSrc) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { resolve(imageSrc); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
        if (r > 230 && g > 230 && b > 230) { data[i + 3] = 0; }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};

// --- Web Worker 實作區 ---
const simulateMopaColors = (imageSrc) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { resolve(imageSrc); return; }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const workerCode = `
        self.onmessage = function(e) {
          const { pixels, width, height } = e.data;
          const data = new Uint8ClampedArray(pixels);
          const preservationMask = new Uint8Array(width * height);

          for (let i = 0; i < data.length; i += 4) {
            if (data[i+3] < 10) continue; 
            const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
            
            const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
            const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
            let h, s, l = (max + min) / 2;

            if (max === min) { h = s = 0; } else {
              const d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                case gNorm: h = (bNorm - rNorm) / d + 2; break;
                case bNorm: h = (rNorm - gNorm) / d + 4; break;
              }
              h *= 60;
            }
            
            const isGreenish = (h >= 75 && h <= 165); 
            if (isGreenish && s > 0.15) {
                 const pixelIndex = i / 4; preservationMask[pixelIndex] = 1; continue;
            }

            const noise = (Math.random() - 0.5) * 30; 
            const factor = 1.1; 
            const rC = ((r - 128) * factor + 128) + noise;
            const gC = ((g - 128) * factor + 128) + noise;
            const bC = ((b - 128) * factor + 128) + noise;
            data[i] = Math.min(255, Math.max(0, rC));
            data[i+1] = Math.min(255, Math.max(0, gC));
            data[i+2] = Math.min(255, Math.max(0, bC));
          }

          const dashR = 255, dashG = 0, dashB = 0;
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (preservationMask[idx] === 1) {
                    let isEdge = false;
                    const neighbors = [
                        (y - 1) * width + x, (y + 1) * width + x, y * width + (x - 1), y * width + (x + 1)  
                    ];
                    for (let nIdx of neighbors) {
                        if (nIdx < 0 || nIdx >= preservationMask.length || preservationMask[nIdx] === 0) { isEdge = true; break; }
                    }
                    if (isEdge) {
                        if ((x + y) % 8 < 4) {
                            const dataIdx = idx * 4;
                            data[dataIdx] = dashR; data[dataIdx + 1] = dashG; data[dataIdx + 2] = dashB; data[dataIdx + 3] = 255;
                        }
                    }
                }
            }
          }
          self.postMessage({ pixels: data.buffer }, [data.buffer]);
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      worker.postMessage({ pixels: imageData.data.buffer, width: canvas.width, height: canvas.height }, [imageData.data.buffer]);
      worker.onmessage = (e) => {
        const processedPixels = new Uint8ClampedArray(e.data.pixels);
        const newImageData = new ImageData(processedPixels, canvas.width, canvas.height);
        ctx.putImageData(newImageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
        worker.terminate(); URL.revokeObjectURL(workerUrl);
      };
      worker.onerror = (err) => { console.error("Worker Error:", err); worker.terminate(); resolve(imageSrc); };
    };
    img.onerror = () => resolve(imageSrc); img.src = imageSrc;
  });
};

const calculateFillScale = (imgWidth, imgHeight) => {
    const baseWidth = 200; 
    const aspect = imgWidth / imgHeight;
    const baseHeight = baseWidth / aspect;
    const scaleW = TAG_WIDTH_PX / baseWidth;
    const scaleH = TAG_HEIGHT_PX / baseHeight;
    const fillScale = Math.max(scaleW, scaleH);
    return { scale: fillScale, width: baseWidth, height: baseHeight, aspect: aspect };
};

// --- 新增：圖片壓縮 helper，解決圖片過大導致沒反應的問題 ---
const compressImage = (base64Str, maxWidth = 1024) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.9)); // 壓縮為 JPEG 80% 品質
        };
        // 若載入失敗，直接回傳原圖，避免流程卡死
        img.onerror = () => { console.warn("Image compression failed, using original."); resolve(base64Str); };
    });
};
// --- 👇👇👇 請補上這段遺失的程式碼 👇👇👇 ---

// 強制將圖片轉為 16:9 寬版 (補黑邊/延伸/升頻)
const convertToLandscape = (base64Str) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const aspect = 16 / 9;
            
            // 1. 初始計算：基於原圖尺寸
            let targetHeight = img.height;
            let targetWidth = Math.round(img.height * aspect);
            
            // 如果原圖比 16:9 更寬，以寬度為準
            if (img.width > targetWidth) {
                targetWidth = img.width;
                targetHeight = Math.round(img.width / aspect);
            }

            // 2. 強制升頻 (Upscaling) 確保畫質
            if (targetHeight < 1080) {
                const scale = 1080 / targetHeight;
                targetHeight = 1080;
                targetWidth = Math.round(targetWidth * scale);
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            
            // 填滿黑色背景 (讓 AI 知道這是要延伸的區域)
            ctx.fillStyle = '#000000'; 
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            
            // 3. 將原圖置中繪製
            const ratio = Math.min(targetWidth / img.width, targetHeight / img.height);
            const drawW = img.width * ratio;
            const drawH = img.height * ratio;
            const x = (targetWidth - drawW) / 2;
            const y = (targetHeight - drawH) / 2;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, x, y, drawW, drawH);
            
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = () => resolve(base64Str);
    });
};
// --- 👆👆👆 補上這段 👆👆👆 ---
// --- API Calls ---
// 自動選擇最佳 Key: 優先使用 apiKey, 若無則嘗試 GOOGLE_API_KEY
// 【修改】自動選擇最佳 Key: 優先使用「使用者輸入的 Key」，其次才是系統預設 Key
const getEffectiveKey = () => localStorage.getItem('USER_GEMINI_KEY') || apiKey || GOOGLE_API_KEY;
// --- 【新增】額度管理 Helper ---
const checkAndConsumeQuota = () => {
    // 1. 如果已經有使用者 Key，直接通過，不扣額度
    if (localStorage.getItem('USER_GEMINI_KEY')) return true;

    // 2. 讀取目前使用次數
    const currentCount = parseInt(localStorage.getItem('FREE_QUOTA_COUNT') || '0');
    const MAX_FREE = 5; // 設定免費額度為 5 張

    // 3. 檢查是否超過
    if (currentCount >= MAX_FREE) {
        const inputKey = window.prompt(
            `⚠️ 免費試用額度 (${MAX_FREE}張) 已用完！\n\n若要繼續使用，請輸入您自己的 Google Gemini API Key：\n(輸入後將儲存在您的瀏覽器中)`
        );
        
        if (inputKey && inputKey.trim().length > 10) {
            localStorage.setItem('USER_GEMINI_KEY', inputKey.trim());
            alert("✅ API Key 已儲存！您可以繼續使用了。");
            return true;
        } else {
            alert("❌ 未輸入有效的 API Key，停止生成。");
            return false;
        }
    }

    // 4. 沒超過，次數 +1
    localStorage.setItem('FREE_QUOTA_COUNT', currentCount + 1);
    return true;
};

// 重置 Key 的功能 (給 UI 按鈕用)
const resetUserKey = () => {
    localStorage.removeItem('USER_GEMINI_KEY');
    alert("已移除您的 API Key，恢復為免費試用模式 (若額度已滿則需重新輸入)。");
    window.location.reload();
};

// 【修改】增加 aspectRatio 參數，預設為 "1:1"
const callGeminiImage = async (prompt, aspectRatio = "1:1") => {
    try {
        const key = getEffectiveKey();
        if (!key) { alert("錯誤：API Key 未設定！\n請確認程式碼中的 apiKey 或 GOOGLE_API_KEY 變數。"); return null; }
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${key}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // 【修改】將 aspectRatio 傳入 parameters
            body: JSON.stringify({ instances: [{ prompt: prompt }], parameters: { sampleCount: 1, aspectRatio: aspectRatio } }),
            }
        );
        if (!response.ok) { const errorText = await response.text(); throw new Error(`API Error ${response.status}: ${errorText}`); }
        const result = await response.json();
        
        // --- 修正：更嚴謹的錯誤檢查，防止靜默失敗 ---
        if (result.predictions && result.predictions[0]?.bytesBase64Encoded) { 
            return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`; 
        }
        
        // 如果回傳 200 但沒有 predictions，通常是安全過濾器擋住了
        console.warn("API Response OK but no image:", result);
        if (result.error) {
             throw new Error(result.error.message || "API 回傳錯誤");
        }
        // 主動拋出錯誤，讓 handleNanoGenerate 的 catch 區塊能捕捉到並顯示 alert
        throw new Error("AI 無法生成此圖片 (可能包含不安全內容或被拒絕)。請嘗試修改描述。");
        
    } catch (error) { 
        console.error("Gemini Image Error:", error); 
        // 這裡回傳 null，但外層的 handleNanoGenerate 必須檢查並處理
        // 我們直接在這裡 throw 也可以，但為了保持舊有結構，我們讓它回傳 null，
        // 並在 handleNanoGenerate 做最終檢查。
        // 不過為了保險，這裡也 alert 一次 (之前的代碼已經有 alert)
        alert(`生成圖片失敗：${error.message}`); 
        return null; 
    }
};

const callGeminiImg2Img = async (prompt, base64Image) => {
    try {
        const key = getEffectiveKey();
        if (!key) { alert("錯誤：API Key 未設定！\n請確認程式碼中的 apiKey 或 GOOGLE_API_KEY 變數。"); return null; }
        
        // 1. 壓縮圖片，避免 Payload 過大 (調整至 1024px 寬度以加快速度)
        const compressedImage = await compressImage(base64Image, 2048);
        
        // 2. 處理 MIME Type
        let mimeType = "image/jpeg";
        if (compressedImage.startsWith("data:")) {
            const matches = compressedImage.match(/^data:(.+);base64,/);
            if (matches && matches[1]) { mimeType = matches[1]; }
        }
        const imageBase64 = compressedImage.split(',')[1] || compressedImage;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${key}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: mimeType, data: imageBase64 } }
                        ]
                    }],
                    generationConfig: { responseModalities: ['IMAGE'] }
                }),
            }
        );
        if (!response.ok) { 
            const errorText = await response.text(); 
            // 403 錯誤通常代表 Key 沒有權限或 Key 錯誤
            if (response.status === 403) {
                 throw new Error("API Key 無效或權限不足 (403)。請檢查 Key 是否開啟了 Generative Language API。");
            }
            throw new Error(`API Error ${response.status}: ${errorText}`); 
        }
        const result = await response.json();
        const outputBase64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        
        if (outputBase64) { return `data:image/png;base64,${outputBase64}`; }
        
        // --- 修正：防止靜默失敗 ---
        console.warn("Img2Img Response OK but no image:", result);
        if (result.promptFeedback && result.promptFeedback.blockReason) {
             throw new Error(`生成被阻擋，原因: ${result.promptFeedback.blockReason}`);
        }
        throw new Error("API 回傳成功但沒有包含圖片資料 (可能被安全機制過濾)");
        
    } catch (error) { 
        console.error("Gemini Img2Img Error:", error); 
        alert(`以圖生圖失敗：${error.message}`); 
        return null; 
    }
};
// --- 新增：雙圖合成 API (底圖 + 設計圖) ---
const callGeminiComposite = async (prompt, baseImage, designImage) => {
    try {
        const key = getEffectiveKey();
        if (!key) { alert("錯誤：API Key 未設定！"); return null; }
        
        // 分別壓縮兩張圖片
        // 【修改 1】提高解析度至 1280 (HD)，解決模糊問題
        const compressedBase = await compressImage(baseImage, 2048);
        const compressedDesign = await compressImage(designImage, 1024);
        
        const getBase64 = (dataUrl) => dataUrl.split(',')[1];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${key}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: "image/jpeg", data: getBase64(compressedBase) } }, // 第一張：人物底圖
                            { inlineData: { mimeType: "image/jpeg", data: getBase64(compressedDesign) } } // 第二張：設計圖
                        ]
                    }],
                    generationConfig: { responseModalities: ['IMAGE'] }
                }),
            }
        );
        if (!response.ok) throw new Error(`API Error ${response.status}`);
        const result = await response.json();
        const outputBase64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (outputBase64) return `data:image/png;base64,${outputBase64}`;
        throw new Error("生成失敗，無影像資料");
    } catch (error) { 
        console.error("Gemini Composite Error:", error); 
        return null; 
    }
};
const callGeminiText = async (prompt) => {
    try {
        const key = getEffectiveKey();
        if (!key) { console.warn("API Key is missing!"); }
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
        );
        if (!response.ok) { const errorText = await response.text(); throw new Error(`API Error ${response.status}: ${errorText}`); }
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) { console.error("Gemini Text Error:", error); return null; }
};

const callGeminiFaceGen = async (prompt, base64Image) => {
    // Re-use the Img2Img logic since it's the same endpoint
    return callGeminiImg2Img(prompt, base64Image);
};

const generateEdgeTexture = (type) => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 64; const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dddddd'; ctx.fillRect(0, 0, 512, 64);
    const addNoise = (amount) => { const id = ctx.getImageData(0,0,512,64); const d = id.data; for(let i=0; i<d.length; i+=4){ const v = (Math.random()-0.5)*amount; d[i]+=v; d[i+1]+=v; d[i+2]+=v; } ctx.putImageData(id, 0, 0); };
    switch (type) {
        case 'plain': addNoise(10); break;
        case 'matte': addNoise(50); break;
        case 'brushed': ctx.fillStyle = 'rgba(0,0,0,0.05)'; for(let i=0; i<800; i++) { const y = Math.random() * 64; const h = Math.random() * 2 + 1; ctx.fillRect(0, y, 512, h); } break;
        case 'coin': ctx.fillStyle = '#888888'; for(let i=0; i<512; i+=16) ctx.fillRect(i, 0, 8, 64); break;
        case 'knurled': ctx.strokeStyle = '#999999'; ctx.lineWidth = 2; ctx.beginPath(); for(let i=-64; i<512; i+=16) { ctx.moveTo(i, 0); ctx.lineTo(i+32, 64); ctx.moveTo(i+32, 0); ctx.lineTo(i, 64); } ctx.stroke(); break;
        case 'damascus': ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = 2; for(let i=0; i<50; i++) { const x = Math.random() * 512; const y = Math.random() * 64; const r = Math.random() * 20 + 5; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.stroke(); } break;
        case 'hammered': for(let i=0; i<80; i++){ const x = Math.random()*512; const y = Math.random()*64; const r = Math.random()*15+5; const g = ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0, 'rgba(0,0,0,0.15)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); } break;
        case 'grooved': ctx.fillStyle = '#999999'; for(let i=0; i<64; i+=8) ctx.fillRect(0, i, 512, 4); break;
        case 'circuit': ctx.strokeStyle = '#777777'; ctx.lineWidth=2; ctx.beginPath(); for(let i=0; i<20; i++){ ctx.moveTo(Math.random()*512, Math.random()*64); ctx.lineTo(Math.random()*512, Math.random()*64); } ctx.stroke(); break;
        case 'scales': ctx.strokeStyle = '#888888'; ctx.lineWidth=2; for(let y=0; y<64; y+=10){ for(let x=0; x<512; x+=12){ ctx.beginPath(); ctx.arc(x + (y%20===0?0:6), y, 6, 0, Math.PI); ctx.stroke(); } } break;
        default: break;
    }
    return canvas;
};

const normalizeUVs = (geometry) => {
    geometry.computeBoundingBox(); const min = geometry.boundingBox.min; const offset = new THREE.Vector2(0 - min.x, 0 - min.y); const range = new THREE.Vector2(geometry.boundingBox.max.x - min.x, geometry.boundingBox.max.y - min.y); const uvAttribute = geometry.attributes.uv;
    for (let i = 0; i < uvAttribute.count; i++) { const u = uvAttribute.getX(i); const v = uvAttribute.getY(i); uvAttribute.setXY(i, (u + offset.x) / range.x, (v + offset.y) / range.y); }
    uvAttribute.needsUpdate = true;
};

const renderDesignToCanvas = async (layers, scaleFactor = 2, options = {}) => {
    const canvas = document.createElement('canvas');
    const width = TAG_WIDTH_PX * scaleFactor;
    const height = TAG_HEIGHT_PX * scaleFactor;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, width, height);
    const radius = 48 * scaleFactor; 
    ctx.beginPath();
    ctx.moveTo(radius, 0); ctx.lineTo(width - radius, 0); ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius); ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height); ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius); ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fillStyle = options.isMockup ? '#D4D4D8' : '#E5E7EB'; ctx.fill();
    if (!options.isMockup) { ctx.lineWidth = 1.5 * scaleFactor; ctx.strokeStyle = '#D1D5DB'; ctx.stroke(); }
    ctx.save(); ctx.clip(); 

    if (!layers) { ctx.restore(); return canvas; }

    const drawClipPath = (ctx, shape, size) => {
        if (!CROP_SHAPES[shape]) return;
        const css = CROP_SHAPES[shape].css;
        ctx.beginPath();
        if (shape === 'circle') { ctx.arc(0, 0, size / 2, 0, Math.PI * 2); } 
        else if (shape === 'square') {
            const r = 10 * scaleFactor; const x = -size/2; const y = -size/2; const w = size; const h = size;
            ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        } else if (css.startsWith('polygon')) {
            const points = css.match(/[\d.]+% [\d.]+%/g);
            if (points) {
                points.forEach((p, i) => { const parts = p.split(' '); const xPct = parseFloat(parts[0]); const yPct = parseFloat(parts[1]); const x = (xPct / 100) * size - size / 2; const y = (yPct / 100) * size - size / 2; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
            }
        }
        ctx.closePath();
    };

    for (const layer of layers) {
      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;
      const centerX = width / 2; const centerY = height / 2;
      ctx.translate(centerX + layer.x * scaleFactor, centerY + layer.y * scaleFactor);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale, layer.scale);
      const flipX = layer.flipX ?? 1; const flipY = layer.flipY ?? 1;
      ctx.scale(flipX, flipY);

      if (layer.type === 'text') {
        const fontSize = 40 * scaleFactor; 
        let fontFamily = layer.fontFamily || '"Inter", sans-serif'; fontFamily = fontFamily.replace(/"/g, "'"); 
        ctx.font = `bold ${fontSize}px ${fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
        ctx.fillStyle = layer.color || '#000';
        if(layer.colorMode === 'gradient') {
             const gradient = ctx.createLinearGradient(-100 * scaleFactor, 0, 100 * scaleFactor, 0);
             gradient.addColorStop(0, layer.gradientStart || '#000'); gradient.addColorStop(1, layer.gradientEnd || '#000');
             ctx.fillStyle = gradient;
        }

        // --- 自動換行邏輯 (Auto Wrap) 開始 ---
        // 設定最大寬度 (軍牌總寬 - 左右各留 20px 邊距)
        const maxTextWidth = (TAG_WIDTH_PX - 40) * scaleFactor; 
        const rawLines = layer.content.split('\n'); // 先依照使用者的換行符切割
        const wrappedLines = [];

        rawLines.forEach(paragraph => {
            let currentLine = '';
            for (let i = 0; i < paragraph.length; i++) {
                const char = paragraph[i];
                const testLine = currentLine + char;
                const metrics = ctx.measureText(testLine);
                
                // 如果加入這個字會超過寬度，且這不是這行的第一個字 -> 換行
                if (metrics.width > maxTextWidth && i > 0) {
                    wrappedLines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            wrappedLines.push(currentLine);
        });
        // --- 自動換行邏輯 結束 ---

        const lineHeight = fontSize * 1.2; const centerIndex = (wrappedLines.length - 1) / 2;
        wrappedLines.forEach((line, i) => { const yOffset = (i - centerIndex) * lineHeight; ctx.fillText(line, 0, yOffset); });
      } else if (layer.type === 'image') {
        const img = new Image(); img.crossOrigin = "Anonymous"; img.src = layer.content; await new Promise(r => { img.onload = r; img.onerror = r; }); 
        const baseSize = 200 * scaleFactor; const drawH = (img.height / img.width) * baseSize;
        if (layer.cropShape && layer.cropShape !== 'none') { drawClipPath(ctx, layer.cropShape, baseSize); ctx.clip(); }
        const cropX = (layer.cropX || 0) * scaleFactor; const cropY = (layer.cropY || 0) * scaleFactor; const cropScale = layer.cropScale || 1;
        ctx.drawImage(img, -baseSize / 2 + cropX, -drawH / 2 + cropY, baseSize * cropScale, drawH * cropScale);
      }
      ctx.restore();
    }
    ctx.restore();

    const holeRadius = 8 * scaleFactor; const holeY = 38 * scaleFactor; const holeX = width / 2;
    ctx.beginPath(); ctx.arc(holeX, holeY, holeRadius, 0, Math.PI * 2); ctx.fillStyle = '#1f2937'; ctx.fill(); ctx.lineWidth = 1 * scaleFactor; ctx.strokeStyle = '#4b5563'; ctx.stroke();
    const highlight = ctx.createLinearGradient(0, 0, width, height); highlight.addColorStop(0, 'rgba(255,255,255,0.4)'); highlight.addColorStop(0.4, 'rgba(255,255,255,0)'); highlight.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = highlight; ctx.fillRect(0,0,width,height); ctx.restore();
    return canvas;
};

// --- 新增：防抖動輸入框組件 ---
// --- 新增：防抖動輸入框組件 ---
const DebouncedInput = ({ value, onChange, className, placeholder, ...props }) => {
    const [localValue, setLocalValue] = useState(value);
    
    useEffect(() => { setLocalValue(value); }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => { 
            if (localValue !== value) onChange(localValue); 
        }, 300);
        return () => clearTimeout(handler);
    }, [localValue]);

    return <input type="text" value={localValue} onChange={(e) => setLocalValue(e.target.value)} className={className} placeholder={placeholder} {...props} />;
};

// 👇👇👇 請確保 ApiKeyModal 放在這裡 (在 DebouncedInput 下面，獨立存在) 👇👇👇
const ApiKeyModal = ({ isOpen, onClose, onSave }) => {
    const [key, setKey] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 border border-slate-200">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">免費試用額度已滿</h3>
                    <p className="text-slate-500 text-sm mt-2">免費試用圖片次數已全部用完。<br/>若要繼續使用，請輸入您的 Google Gemini API Key。</p>
                </div>
                <input 
                    type="password" 
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="貼上 API Key (AIza...)"
                    className="w-full p-3 border border-slate-300 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors text-sm">取消</button>
                    <button 
                        onClick={() => { if(key.length > 10) { onSave(key); onClose(); } else { alert("Key 格式似乎不正確"); } }} 
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors text-sm"
                    >
                        儲存並繼續
                    </button>
                </div>
                <div className="mt-4 text-center">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">沒有 Key？點此免費取得 &rarr;</a>
                </div>
            </div>
        </div>
    );
};
// 👆👆👆 ApiKeyModal 結束 👆👆👆

const ToolPlaceholder = ({ title, icon: Icon, description }) => (
  <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 text-slate-400 p-8 animate-in fade-in zoom-in-95 duration-300">
    <div className="bg-white p-6 rounded-full shadow-lg mb-6">{Icon && <Icon className="w-16 h-16 text-indigo-200" />}</div>
    <h2 className="text-3xl font-bold text-slate-600 mb-2">{title}</h2>
    <p className="text-slate-500 max-w-md text-center leading-relaxed">{description}</p>
    <div className="mt-8 px-4 py-2 bg-green-100 text-green-700 text-xs font-mono rounded-full flex items-center"><Zap className="w-3 h-3 mr-2" />背景資源已釋放：設計器程序已暫停</div>
  </div>
);

// --- 改進：服裝清單與對應的「項鍊友善」Prompt ---
// 針對每種衣服，強制 AI 留出胸口空間 (e.g., 開領、無領帶、拉鍊拉下)
const OUTFITS = [ 
    { value: "streetwear", label: "街頭潮流 (Streetwear)", prompt: "Trendy streetwear, loose fit, layered clothing" }, 
    { value: "white t-shirt", label: "休閒白T (Casual T-Shirt)", prompt: "Classic white cotton t-shirt, round neck" }, 
    { value: "formal suit", label: "正式西裝 (Formal Suit)", prompt: "Dark formal suit jacket, crisp white shirt underneath, OPEN COLLAR, NO TIE, exposed upper chest" }, 
    { value: "military jacket", label: "軍裝外套 (Military Jacket)", prompt: "Olive green military field jacket, unzipped at the top, showing t-shirt underneath" }, 
    { value: "black hoodie", label: "黑色帽T (Black Hoodie)", prompt: "Black pullover hoodie, drawstrings visible, logo on chest" }, 
    { value: "cyberpunk outfit", label: "賽博龐克 (Cyberpunk)", prompt: "Futuristic techwear jacket, high collar but open at front, neon accents" }, 
    { value: "vintage denim", label: "復古丹寧 (Vintage Denim)", prompt: "Blue denim jacket over a band t-shirt, casual rugged look" }, 
    { value: "leather biker", label: "騎士皮衣 (Leather Biker)", prompt: "Black leather motorcycle jacket, asymmetrical zip OPEN at the top" }, 
    { value: "sporty gym", label: "運動健身 (Sporty Gym)", prompt: "Athletic tank top or compression shirt, muscular definition visible" }, 
    { value: "summer beach", label: "夏日海灘 (Summer Beach)", prompt: "Unbuttoned linen shirt or swimwear, summer vibe, bare chest" }, 
    { value: "gothic style", label: "哥德風格 (Gothic Style)", prompt: "Dark gothic clothing, mesh or velvet textures, v-neck" }, 
    { value: "hip hop oversized", label: "嘻哈寬鬆 (Hip Hop)", prompt: "Oversized graphic tee, heavy fabric, street style" }, 
    { value: "smart casual", label: "商務休閒 (Smart Casual)", prompt: "Oxford shirt, top two buttons UNBUTTONED, relaxed blazer" }, 
    { value: "evening wear", label: "晚宴禮服 (Evening Wear)", prompt: "Elegant evening attire, deep neckline suitable for necklace" }, 
    { value: "minimalist", label: "極簡風格 (Minimalist)", prompt: "Solid color high-quality sweater or tee, clean lines" } 
];

// --- 新增：場景清單 ---
const LOCATIONS = [
    { value: "neon city street", label: "霓虹街頭 (Neon City)" },
    { value: "japanese shrine", label: "日本神社 (Japanese Shrine)" },
    { value: "paris street", label: "巴黎街頭 (Paris Street)" },
    { value: "new york times square", label: "紐約時代廣場 (Times Square)" },
    { value: "cyberpunk space station", label: "科幻太空站 (Space Station)" },
    { value: "sunny beach", label: "陽光沙灘 (Sunny Beach)" },
    { value: "urban rooftop", label: "城市頂樓 (Urban Rooftop)" },
    { value: "gym interior", label: "健身房 (Gym)" },
    { value: "coffee shop", label: "文青咖啡廳 (Coffee Shop)" },
    { value: "studio plain background", label: "攝影棚純色 (Studio)" }
];

const WearableSimulator = ({ designerState }) => {
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    // 新增狀態：處理融合中
    const [isBlending, setIsBlending] = useState(false);
    const [gender, setGender] = useState('man');
    const [race, setRace] = useState('Asian');
    const [outfit, setOutfit] = useState('streetwear');
    const [location, setLocation] = useState('neon city street');
    const [vibe, setVibe] = useState('cool');
    // 新增：全身/半身切換
    const [shotType, setShotType] = useState('half'); // 'half' or 'full'
    const [necklaceLength, setNecklaceLength] = useState(0);
    const [autoScale, setAutoScale] = useState(0.4);
    const [faceImage, setFaceImage] = useState(null); 
    const [designImgUrl, setDesignImgUrl] = useState(null);
    const [overlayConfig, setOverlayConfig] = useState({ x: 0, y: 65, scale: 0.35, rotation: 0, opacity: 0.92, blendMode: 'multiply' });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const [pipelineStatus, setPipelineStatus] = useState('');
    // 【修改 1】新增這兩行狀態：
    const [baseSceneCache, setBaseSceneCache] = useState(null); // 儲存第一階段的人像
    const [lockModel, setLockModel] = useState(false); // 控制是否鎖定
    // 【修改 A】新增歷史紀錄狀態
    const [historyImages, setHistoryImages] = useState([]);
// 【修改 1】加入視窗控制狀態
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    // 【修改 2】加入儲存 Key 的函式
    const handleSaveKey = (userKey) => {
        localStorage.setItem('USER_GEMINI_KEY', userKey.trim());
        alert("✅ API Key 已儲存！請再次點擊生成按鈕。");
    };
    // --- 重置功能 (Clean Version) ---
    const handleReset = () => {
        // 1. 清除顯示相關
        setGeneratedImage(null);
        setDesignImgUrl(null);
        setPipelineStatus('');
        
        // 2. 清除輸入相關 (如果您希望重置時保留自拍照片，請註解掉下面這行 setFaceImage)
        setFaceImage(null); 
        
        // 3. 重置狀態旗標
        setIsGenerating(false);
        setIsBlending(false);
        
        // 4. 【關鍵】清除快取與鎖定 (確保下次生成會重新跑 16:9 流程)
        setBaseSceneCache(null);
        setLockModel(false);
        
        // 5. 重置手動調整參數 (雖然現在用不到了，但保留作為預設值)
        setOverlayConfig({ x: 0, y: 65, scale: 0.35, rotation: 0, opacity: 0.92, blendMode: 'multiply' });
    };

    // --- Helper: 合成圖片 (用於自動化流程) ---
    // 【修改】加入 turnDirection 參數，接收人像的轉向資訊
    const compositeImagesAuto = async (bgUrl, designUrl, currentShotType, overrideConfig = null, turnDirection = null) => {
        if (!bgUrl || !designUrl) return null;
        
        const bgImg = new Image(); bgImg.src = bgUrl; await new Promise(r => bgImg.onload = r);
        const designImg = new Image(); designImg.src = designUrl; await new Promise(r => designImg.onload = r);
        
        const canvas = document.createElement('canvas');
        canvas.width = bgImg.width;
        canvas.height = bgImg.height;
        const ctx = canvas.getContext('2d');
        
        // 1. 繪製背景 (模特兒)
        ctx.drawImage(bgImg, 0, 0);

        // 2. 自動定位邏輯
        // 【修改】加入隨機水平偏移 (Natural Sway)，模擬人體自然的重心曲線
        // 讓軍牌不要死板地掛在正中央，而是隨機左右偏移 ±3%
        const swayOffset = (Math.random() - 0.5) * (canvas.width * 0.06); 
        let targetX = (canvas.width * 0.5) + swayOffset;
        
        // 根據 Shot Type 決定大小和位置
        let targetY, targetWidth;
        
// 基礎比例 (Base Ratio)
        const baseFullRatio = 0.12; 
        // 【修改 2-A】半身照基礎大小：從 0.15 改為 0.18 (放大半身圖)
        const baseHalfRatio = 0.18; 

        // 計算長度偏移量 (將 -10~10 的滑桿值轉換為座標偏移)
        const lengthOffset = canvas.height * (necklaceLength * 0.01);

        if (currentShotType === 'full') {
            // 全身照
            targetY = (canvas.height * 0.30) + lengthOffset; 
            targetWidth = canvas.width * baseFullRatio * autoScale; 
        } else {
            // 半身照
            // 【修改 2-B】基礎位置設為 0.75，並加上滑桿偏移
            targetY = (canvas.height * 0.75) + lengthOffset; 
            targetWidth = canvas.width * baseHalfRatio * autoScale; 
        }

        let rotation = 0;

        if (overrideConfig) {
            targetX = overrideConfig.x;
            targetY = overrideConfig.y;

            // 【// --- 【修改 1】開始 ---
            // 修正：確保在點擊校正時，如果沒有指定特定縮放，就沿用目前的 autoScale 設定
            const baseRatio = currentShotType === 'full' ? baseFullRatio : baseHalfRatio;
            targetWidth = canvas.width * (overrideConfig.scale || (baseRatio * autoScale));
            // --- 【修改 1】結束 ---

            rotation = overrideConfig.rotation || 0;
        } else {
             // 【修改】回歸垂直重力 (Vertical Gravity)。
             // 因為我們無法預測人像傾斜角度，先保持垂直，再交給 AI 在 Stage 3 根據畫面微調。
             // 只保留極微小的自然擺動 (±1度)。
             rotation = (Math.random() - 0.5) * 2;
        }
        
        // 保持 29mm:50mm 的長寬比
        const tagAspect = 29 / 50; 
        const drawW = targetWidth;
        const drawH = drawW / tagAspect;

        // --- 【步驟 1】計算物理幾何座標 ---
        const rad = rotation * Math.PI / 180;
        const holeOffsetY = -drawH * 0.42; // 孔洞中心 (相對於軍牌中心)
        const ringRadius = drawW * 0.12;   // 連接環半徑
        
        // 計算「連接環」的頂端位置 (這是鍊子要匯聚的點)
        // 邏輯：從軍牌中心 -> 往上到孔洞 -> 再往上到環的頂端
        const localRingTopY = holeOffsetY - (ringRadius * 1.5); 
        
        // 將這個局部座標轉換為全域 Canvas 座標 (考慮旋轉)
        const chainConnectX = targetX + (0 * Math.cos(rad) - localRingTopY * Math.sin(rad));
        const chainConnectY = targetY + (0 * Math.sin(rad) + localRingTopY * Math.cos(rad));

        // --- 【步驟 2】虛擬鍊條 (已移除) ---
        // 修改：我們不再畫假鍊子，改由 AI 在下一階段負責將軍牌「掛」在模特兒原本的鍊子上
        
        // 雖然不畫線，但我們保留這些變數計算，因為下面的程式碼可能會有依賴 (雖然後面好像沒用到，但保留以防萬一)
        const baseChainScale = currentShotType === 'full' ? baseFullRatio : baseHalfRatio;
        const fixedChainWidth = canvas.width * baseChainScale; 
        
        // (這裡原本是 draw chain 的程式碼，現在留空)

        // --- 【步驟 3】繪製軍牌 (Tag) ---
        ctx.save();
        ctx.translate(targetX, targetY);
        ctx.rotate(rad); // 使用計算好的弧度

        // 針對極小尺寸強化陰影
        const isMicro = drawW < 50; 
        ctx.shadowColor = isMicro ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = isMicro ? 2 : drawW * 0.15;
        ctx.shadowOffsetY = isMicro ? 5 : drawW * 0.05;

        // 繪製軍牌本體
        ctx.globalAlpha = 1.0; 
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.fillStyle = '#B0B0B0'; 
        
        const r = drawW * 0.15;
        const x = -drawW/2;
        const y = -drawH/2;
        
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + drawW - r, y); ctx.quadraticCurveTo(x + drawW, y, x + drawW, y + r); ctx.lineTo(x + drawW, y + drawH - r); ctx.quadraticCurveTo(x + drawW, y + drawH, x + drawW - r, y + drawH); ctx.lineTo(x + r, y + drawH); ctx.quadraticCurveTo(x, y + drawH, x, y + drawH - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        // 繪製設計圖
        ctx.drawImage(designImg, -drawW/2, -drawH/2, drawW, drawH);

        // --- 【步驟 4】繪製 Jump Ring (物理連接結構) ---
        // 這個環會壓在軍牌孔洞上，並且讓鍊子看起來穿過它
        
        // 環的位置：孔洞中心再往上一點點，讓它扣住邊緣
        const ringCy = holeOffsetY - (ringRadius * 0.8);
        
        // 1. 繪製環的「後方」陰影 (增加立體感)
        ctx.beginPath();
        ctx.arc(0, ringCy, ringRadius, 0, Math.PI * 2);
        ctx.lineWidth = drawW * 0.04; 
        ctx.strokeStyle = '#6b7280'; // 深灰色陰影
        ctx.stroke();

        // 2. 繪製環的「金屬本體」
        ctx.beginPath();
        ctx.arc(0, ringCy, ringRadius, 0, Math.PI * 2);
        ctx.lineWidth = drawW * 0.03; 
        ctx.strokeStyle = '#d1d5db'; // 銀色主體
        ctx.stroke();
        
        // 3. 繪製環的「高光」 (讓它看起來像金屬圈)
        ctx.beginPath();
        // 只畫左上角的高光
        ctx.arc(0, ringCy, ringRadius, Math.PI * 0.8, Math.PI * 1.5); 
        ctx.strokeStyle = '#ffffff'; 
        ctx.lineWidth = drawW * 0.02;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.restore();
        
        return canvas.toDataURL('image/png', 1.0);
    };

    // ... (compositeImages manual helper remains unchanged) ...
    const compositeImages = async () => {
        if (!generatedImage || !designImgUrl || !containerRef.current) return null;
        
        const bgImg = new Image();
        bgImg.src = generatedImage;
        await new Promise(r => bgImg.onload = r);
        
        const canvas = document.createElement('canvas');
        canvas.width = bgImg.width;
        canvas.height = bgImg.height;
        const ctx = canvas.getContext('2d');
        
        // Draw BG
        ctx.drawImage(bgImg, 0, 0);
        
        // Calculate ratios to map DOM overlay position to Canvas position
        const containerRect = containerRef.current.getBoundingClientRect();
        const imgRatio = bgImg.width / bgImg.height;
        const containerRatio = containerRect.width / containerRect.height;
        
        let displayWidth;
        if (containerRatio > imgRatio) {
            // Image is height-constrained
            const displayHeight = containerRect.height;
            displayWidth = displayHeight * imgRatio;
        } else {
            // Image is width-constrained
            displayWidth = containerRect.width;
        }
        
        // Scale factor between displayed pixels and actual image pixels
        const scaleFactor = bgImg.width / displayWidth;
        
        const designImg = new Image();
        designImg.src = designImgUrl;
        await new Promise(r => designImg.onload = r);
        
        ctx.save();
        // Move to center of canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 轉換座標：overlayConfig.x/y 是相對於容器中心的顯示像素偏移
        ctx.translate(centerX + (overlayConfig.x * scaleFactor), centerY + (overlayConfig.y * scaleFactor));
        ctx.rotate((overlayConfig.rotation * Math.PI) / 180);
        
        // 計算繪製大小
        // 前端 DOM 顯示大小是固定的 w-[145px] h-[250px] 乘上 scale
        const domBaseW = 145;
        const domBaseH = 250;
        const drawW = domBaseW * scaleFactor * overlayConfig.scale;
        const drawH = domBaseH * scaleFactor * overlayConfig.scale;
        
        ctx.globalAlpha = overlayConfig.opacity;
        ctx.globalCompositeOperation = overlayConfig.blendMode === 'normal' ? 'source-over' : overlayConfig.blendMode;
        
        ctx.drawImage(designImg, -drawW/2, -drawH/2, drawW, drawH);
        ctx.restore();
        
        return canvas.toDataURL('image/png', 1.0);
    };

    // --- 全新核心邏輯：AI 原生生成 + 紋理轉印 + 智能質檢 ---
    const handleAutoGeneratePipeline = async () => {
        const turnDirection = Math.random() > 0.5 ? "LEFT" : "RIGHT";
        
        // 1. 額度檢查
        const quotaKey = 'FREE_QUOTA_WEARABLE'; 
        const currentCount = parseInt(localStorage.getItem(quotaKey) || '0');
        const hasUserKey = !!localStorage.getItem('USER_GEMINI_KEY');

        if (!hasUserKey && currentCount >= 5) {
            setShowApiKeyModal(true); return;
        }
        if (!hasUserKey) { localStorage.setItem(quotaKey, currentCount + 1); }
        if (!designerState || !designerState.sides) { alert("請先設計軍牌！"); return; }
        
        setIsGenerating(true);
        setPipelineStatus('準備設計圖...');

        try {
            // 2. 準備設計圖 (高解析度)
            const designCanvas = await renderDesignToCanvas(designerState.sides[designerState.currentSide], 2, { isMockup: true });
            const designBase64 = designCanvas.toDataURL('image/png');
            setDesignImgUrl(designBase64); 

            let baseImgForComposite = null;

            // --- 定義隨機展示動作 (Pose Strategy) ---
            let posePrompt = "";
            if (shotType === 'full') {
                // 【修改 1】優化姿勢庫：移除過度誇張的特寫動作
                const poses = [
                    "Natural Pose: Standing relaxed, hands in pockets.",
                    "Casual Pose: One hand adjusting jacket, chest open.",
                    "Confident Pose: Arms crossed loosely (low), chest clear.",
                    "Dynamic Pose: Leaning slightly forward.",
                    "Stylish Pose: One hand touching hair or chin, elbow out."
                ];
                const selectedPose = poses[Math.floor(Math.random() * poses.length)];
                
                // 【關鍵修改】將「隨機帥氣動作」與「45度側身 + 看鏡頭」強行結合
                posePrompt = `
                    Action: ${selectedPose}
                    CRITICAL BODY ANGLE: Body turned exactly 45 degrees to the ${turnDirection} (3/4 Profile View).
                    FACE DIRECTION: Face turned to look DIRECTLY at the camera.
                    Constraint: Tag must hang naturally on the chest. DO NOT block the tag with hands.
                `;
            } else {
                // 半身照維持標準 45 度側身
                posePrompt = `Pose: Body turned exactly 45 degrees to the ${turnDirection} (3/4 Profile View), Face looking at camera.`;
            }

            // 3. STAGE 1: 生成「戴著空白軍牌」的完美人像
            if (lockModel && baseSceneCache) {
                console.log("Using cached base scene");
                setPipelineStatus('使用鎖定的模特兒 (已含空白軍牌)...');
                baseImgForComposite = baseSceneCache;
            } else {
                const selectedOutfitConfig = OUTFITS.find(o => o.value === outfit) || OUTFITS[0];
                const outfitPrompt = selectedOutfitConfig.prompt;
                
                // 構建 Prompt：強調「空白銀色軍牌」
                const blankTagPrompt = `
                    WEARING A BLANK SILVER DOG TAG NECKLACE.
                    - The tag is a standard rectangular silver metal plate.
                    - CRITICAL: The tag surface is CLEAN, BLANK, and SMOOTH SILVER. NO TEXT, NO DESIGN.
                    - The tag creates a realistic V-shape suspension on the chest.
                    - Lighting and reflection on the blank metal are physically accurate.
                `;

                if (faceImage) {
                    setPipelineStatus('第一階段：人像轉繪 (生成空白軍牌)...'); 
                    const scenePrompt = `
                        Professional Medium Shot (Waist-Up Landscape) of THIS PERSON.
                        
                        // 【修改 1】更強力的縮小與置中 (防止爆邊)
                        Composition: EXTREME WIDE ANGLE. ZOOM OUT SIGNIFICANTLY.
                        Subject Placement: STRICTLY CENTERED floating in the middle.
                        SCALE CONTROL: The subject must be SMALL, occupying only 40-45% of the image height.
                        NEGATIVE SPACE: Leave HUGE empty borders (30% width) on left/right/top.
                        
                        SAFETY BOUNDARIES (CRITICAL): 
                        1. HEADROOM: Massive space above head.
                        2. HORIZONTAL: Arms, elbows, and hands must be COMPLETELY INSIDE the frame with room to spare.
                        3. NO CROPPING: Do not cut off any part of the upper body pose.
                        
                        // 【修改 2】使用結合了動作與角度的 posePrompt
                        Pose: ${posePrompt}

                        Outfit: ${outfitPrompt}.
                        Background: ${location}.
                        Lighting: ${vibe}, realistic high-end photography lighting.
                        ${blankTagPrompt}
                        Ensure the face resembles the input image. High quality, 8k.
                    `;
                    // 【修改 2】先將自拍照強制轉為 16:9 橫圖 (補黑邊)，再讓 AI 填補背景
const landscapeFace = await convertToLandscape(faceImage);
baseImgForComposite = await callGeminiImg2Img(scenePrompt, landscapeFace);
                } else {
                    setPipelineStatus('生成模特兒 (生成空白軍牌)...');
                    const modelPrompt = `
                        Professional Medium Shot (Waist-Up Landscape) of a ${race} ${gender} model.
                        
                        // 【修改 2】更強力的縮小與置中 (防止爆邊)
                        Composition: EXTREME WIDE ANGLE. ZOOM OUT SIGNIFICANTLY.
                        Subject Placement: STRICTLY CENTERED.
                        SCALE CONTROL: The subject must be SMALL, occupying only 40-45% of the image height.
                        NEGATIVE SPACE: Leave HUGE empty borders on all sides.
                        
                        SAFETY BOUNDARIES (CRITICAL): 
                        1. HEADROOM: Massive space above head.
                        2. HORIZONTAL: Ensure arms and gestures are fully visible within the frame. DO NOT CROP ARMS.
                        
                        // 【修改 3】使用結合了動作與角度的 posePrompt
                        Pose: ${posePrompt}
                        
                        Outfit: ${outfitPrompt}.
                        Background: ${location}.
                        Lighting: ${vibe}, realistic photography.
                        ${blankTagPrompt}
                    `;
                    // 【修改 3】傳入 "3:4" (標準人像比例) 或 "4:3" (橫向)，這裡使用 3:4 讓肩膀寬度足夠但不會太扁
                     // 【建議】使用 16:9 寬螢幕，才有足夠的橫向空間顯示手臂兩側的背景
                    baseImgForComposite = await callGeminiImage(modelPrompt, "16:9");
                }

                if (!baseImgForComposite) throw new Error("第一階段生成失敗");
                setBaseSceneCache(baseImgForComposite);
                if (!lockModel) setLockModel(true);
            }

            // 4. STAGE 2: 紋理轉印 (把設計圖 "印" 到空白軍牌上)
            setPipelineStatus('第二階段：智能紋理轉印 (Texture Transfer)...');
            
            const transferPrompt = `
                Advanced Texture Mapping Task.
                
                INPUTS:
                - Image 1: A person wearing a BLANK silver dog tag.
                - Image 2: A specific graphic design (Text/Logo).
                
                MISSION:
                - Apply the design from Image 2 onto the BLANK dog tag in Image 1.
                - Imagine the design is LASER ENGRAVED onto the metal.
                
                CRITICAL GEOMETRY RULES:
                1. DO NOT change the shape, angle, or position of the tag in Image 1.
                2. WARP and DISTORT the design (Image 2) to match the perspective/tilt of the tag in Image 1 exactly.
                
                LIGHTING INTEGRATION:
                1. Keep the original metallic reflections of Image 1. 
                2. Multiply the design onto the metal.
                
                Keep the face and background of Image 1 EXACTLY UNCHANGED.
            `;

            const transferredImage = await callGeminiComposite(transferPrompt, baseImgForComposite, designBase64);
            
            if (!transferredImage) throw new Error("第二階段合成失敗");

            // 5. STAGE 3: AI 智能質檢與修復 (Verification & Refinement)
            // 【修改 3】新增這一步：檢查並修復瑕疵
            setPipelineStatus('第三階段：AI 智能質檢與修復...');
            
            const refinementPrompt = `
                Final Quality Check & Refinement Task.
                The input image is a composite of a person wearing a custom dog tag.
                
                CHECKLIST:
                1. FACE: Is the face distorted? If yes, FIX the eyes and mouth to look natural and beautiful.
                2. TAG TEXT: Is the text on the tag sharp? If blurry, sharpen it while keeping the perspective.
                3. CONNECTION: Does the chain connect perfectly to the tag? Repair any broken links.
                
                ACTION:
                - Output a polished, high-fidelity version of the image.
                - DO NOT change the design content (text/logo) on the tag.
                - Ensure the lighting on the tag matches the environment perfectly.
            `;
            
            // 將第二階段的結果再丟回給 AI 修一次
            const finalImageUrl = await callGeminiImg2Img(refinementPrompt, transferredImage);

            if (finalImageUrl) {
                setGeneratedImage(finalImageUrl);
                // 【修改 2】更新歷史紀錄
                setHistoryImages(prev => [finalImageUrl, ...prev].slice(0, 10));
            } else {
                // 如果第三階段失敗，至少回傳第二階段的圖
                setGeneratedImage(transferredImage);
                setHistoryImages(prev => [transferredImage, ...prev].slice(0, 10));
            }

        } catch (e) {
            console.error(e);
            alert("錯誤：" + e.message);
        } finally {
            setIsGenerating(false);
            setPipelineStatus('');
        }
    };

    const handleDownloadComposite = async () => {
        try { const compositedBase64 = await compositeImages(); if (compositedBase64) { const link = document.createElement('a'); link.download = `Wearable_Scenario_${Date.now()}.png`; link.href = compositedBase64; link.click(); } } catch (e) { console.error("Download Error:", e); }
    };
    
    // 手動載入設計 (如果使用者還是想手調)
    const handleLoadDesign = async () => { if (!designerState || !designerState.sides) return; const canvas = await renderDesignToCanvas(designerState.sides[designerState.currentSide], 2, { isMockup: true }); if (canvas) { setDesignImgUrl(canvas.toDataURL('image/png')); if (containerRef.current) { setOverlayConfig({ x: 0, y: 65, scale: 0.35, rotation: 0, opacity: 0.92, blendMode: 'multiply' }); } } };
    const handleFaceUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setFaceImage(reader.result); }; reader.readAsDataURL(file); } };
    const handleMouseDown = (e) => { e.preventDefault(); setIsDragging(true); setDragStart({ x: e.clientX - overlayConfig.x, y: e.clientY - overlayConfig.y }); };
    const handleMouseMove = (e) => { if (!isDragging) return; setOverlayConfig(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })); };
    const handleMouseUp = () => setIsDragging(false);
    useEffect(() => { window.addEventListener('mouseup', handleMouseUp); return () => window.removeEventListener('mouseup', handleMouseUp); }, []);

    return (
      <div className="flex flex-col md:flex-row h-full w-full bg-white/40 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl relative border border-white/50">
            {/* 【修改 2】改為 bg-black (黑色背景)，視覺上擴大空間感 */}
            <div ref={containerRef} className="flex-1 bg-black relative flex items-center justify-center overflow-hidden" >
                {generatedImage ? (
                    // 【修改】移除 onClick 和 cursor-crosshair
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* 【修改 3】改為 object-cover，強制圖片填滿視窗，消除任何可能的黑邊 */}
<img src={generatedImage} alt="Scenario" className="w-full h-full object-cover select-none" />
                        
                        {/* (已移除校正提示動畫) */}
                        
                        {/* 重置按鈕 (保留) */}
                        <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-colors flex items-center z-50">
                            <RotateCcw className="w-3 h-3 mr-1.5" /> 重置系統
                        </button>
                    </div>
                ) : (
                    <div className="text-slate-400 text-center p-8 select-none"><Camera className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-lg font-medium">尚未生成預覽</p><p className="text-sm">請在右側設定參數並點擊「一鍵全自動生成」</p></div>
                )}
                {(isGenerating || isBlending) && (<div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-indigo-600"><Loader2 className="w-12 h-12 animate-spin mb-6" /><p className="font-bold text-lg animate-pulse">{pipelineStatus || '正在處理...'}</p><div className="mt-4 w-64 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 animate-progress"></div></div>{/* 重置按鈕(Loading時也可按) */}<button onClick={handleReset} className="mt-6 bg-slate-200 hover:bg-slate-300 text-slate-600 px-4 py-2 rounded-full text-xs transition-colors">取消並重置</button></div>)}
            </div>
            <div className="w-full md:w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
                <div>
                    <h3 className="text-slate-800 font-bold flex items-center text-lg mb-4"><User className="w-5 h-5 mr-2 text-indigo-500" /> 穿戴情境模擬</h3>
                    <div className="mb-6 border-b border-slate-100 pb-6">
                        <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">1. 選擇模特兒 (換臉可選)</h4>
                        <div className="mb-4">
                             <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-full border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0">{faceImage ? <img src={faceImage} className="w-full h-full object-cover" /> : <UserPlus className="w-6 h-6 text-slate-400" />}</div>
                                <label className="flex-1 cursor-pointer">
                                    <div className="bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center transition-colors shadow-sm"><Upload className="w-3 h-3 mr-2" /> 選擇自拍照片</div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFaceUpload} />
                                </label>
                             </div>
                        </div>
                        <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">2. 設定參數</h4>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <select value={gender} onChange={(e) => setGender(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded text-xs"><option value="man">男性</option><option value="woman">女性</option></select>
                                <select value={race} onChange={(e) => setRace(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-indigo-700">
                                    <option value="Asian">東亞 (East Asian)</option>
                                    <option value="Caucasian">白人 (Caucasian)</option>
                                    <option value="Black">黑人 (Black)</option>
                                    <option value="Latino">拉丁裔 (Latino)</option>
                                </select>
                                <select value={outfit} onChange={(e) => setOutfit(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded text-xs col-span-2">{OUTFITS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                            </div>
                            
                            {/* 新增：場景與全身/半身選擇 */}
                            <div className="grid grid-cols-1 gap-2">
                                <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs mb-1">
                                    {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                                
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button onClick={() => setShotType('half')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${shotType === 'half' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>
                                        標準半身 (Standard)
                                    </button>
                                    {/* 【修改】按鈕文字改為「造型特寫」 */}
                                    <button onClick={() => setShotType('full')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${shotType === 'full' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>
                                        造型特寫 (Styled Pose)
                                    </button>
                                </div>
                            </div>

                            {/* ... (原本的 location 和 shotType 選擇區塊) ... */}
                            
                            {/* 【修改 3】新增：尺寸調整滑桿 */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200 mt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-slate-500 flex items-center">
                                        <Maximize className="w-3 h-3 mr-1" /> 軍牌尺寸縮放
                                    </label>
                                    <span className="text-[10px] text-indigo-600 font-bold">{Math.round(autoScale * 100)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="0.4" 
                                    step="0.05" 
                                    value={autoScale} 
                                    onChange={(e) => setAutoScale(parseFloat(e.target.value))} 
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                                />
                            </div>

                            {/* 【修改 3】新增：項鍊長度滑桿 */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200 mt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-slate-500 flex items-center">
                                        <ArrowDown className="w-3 h-3 mr-1" /> 項鍊長度 (高低)
                                    </label>
                                    <span className="text-[10px] text-indigo-600 font-bold">{necklaceLength > 0 ? `+${necklaceLength}` : necklaceLength}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="-10" 
                                    max="15" 
                                    step="1" 
                                    value={necklaceLength} 
                                    onChange={(e) => setNecklaceLength(parseInt(e.target.value))} 
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                                />
                            </div>

                            {/* 【修改 4】新增：鎖定模特兒開關 */}
                            <div className="flex items-center justify-between bg-indigo-50 p-2 rounded-lg border border-indigo-100 mt-2">
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={lockModel} 
                                        onChange={(e) => setLockModel(e.target.checked)}
                                        disabled={!baseSceneCache} // 如果還沒生成過，不能鎖定
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                    />
                                    <span className={`ml-2 text-xs font-bold ${baseSceneCache ? 'text-indigo-700' : 'text-slate-400'}`}>
                                        鎖定當前模特兒 (Lock Model)
                                    </span>
                                </label>
                                {baseSceneCache && (
                                    <span className="text-[10px] text-indigo-400 bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                                        已快取
                                    </span>
                                )}
                            </div>
                            
                            {/* 這是新的全自動按鈕 */}
                            <button onClick={handleAutoGeneratePipeline} disabled={isGenerating || isBlending} className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center group">
                                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />} 
                                一鍵全自動生成 (Auto Generate)
                            </button>
                            <p className="text-[10px] text-slate-400 text-center">自動流程：生成模特兒 ➝ 自動佩戴 ➝ 光影融合</p>
                        </div>
                    </div>

                            {/* 【新增】顯示額度提示與重置 Key 按鈕 */}
                            {/* 【修改 2】顯示穿戴模擬專用額度 */}
                            <div className="text-center mt-2">
                                {!localStorage.getItem('USER_GEMINI_KEY') ? (
                                    <p className="text-[10px] text-slate-400">
                                        穿戴模擬額度：
                                        <span className="font-bold text-indigo-600">
                                            {/* 這裡改成讀取 FREE_QUOTA_WEARABLE */}
                                            {5 - (parseInt(localStorage.getItem('FREE_QUOTA_WEARABLE') || '0'))}
                                        </span> / 5 張
                                    </p>
                                ) : (
// ... (下略)
                                    <button onClick={resetUserKey} className="text-[10px] text-slate-300 hover:text-red-400 underline">
                                        清除我的 API Key
                                    </button>
                                )}
                            </div>

                    {/* 下載區域 */}
                    {/* 【修改 2】移除 !designImgUrl 判斷，確保歷史紀錄總是能顯示 */}
                    {generatedImage && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                             <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-4">
                                <div className="flex items-start">
                                    <Check className="w-5 h-5 text-green-600 mr-2 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-green-800 mb-1">生成完成！</h4>
                                        <p className="text-[10px] text-green-700">軍牌已自動佩戴並完成光影融合。</p>
                                    </div>
                                </div>
                             </div>
                             <button onClick={() => { const link = document.createElement('a'); link.download = `Result_${Date.now()}.png`; link.href = generatedImage; link.click(); }} className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center shadow-sm">
                                <HardDrive className="w-4 h-4 mr-2" /> 下載最終成品
                             </button>

                             {/* 【修改 2】歷史圖庫區塊 (點擊可切換回上一幅) */}
                            {historyImages.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-200 animate-in fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">生成歷史 ({historyImages.length})</h4>
                                        <button onClick={() => setHistoryImages([])} className="text-[10px] text-slate-400 hover:text-red-500">清除</button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {historyImages.map((img, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => setGeneratedImage(img)} // 點擊切換回這張圖
                                                title="點擊恢復此版本"
                                                className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:opacity-100 ${generatedImage === img ? 'border-indigo-500 opacity-100 ring-2 ring-indigo-200' : 'border-transparent opacity-60 hover:scale-105'}`}
                                            >
                                                <img src={img} className="w-full h-full object-cover" alt={`History ${idx}`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* 👇👇👇 第 4 步：請把這段貼在這裡 👇👇👇 */}
                    <ApiKeyModal 
                        isOpen={showApiKeyModal} 
                        onClose={() => setShowApiKeyModal(false)} 
                        onSave={handleSaveKey} 
                    />
                    {/* 👆👆👆 貼上這段 👆👆👆 */}
                </div>
            </div>
        </div>
    );
};

const LaserSimulator = ({ designerState, updateDesignerState }) => {
    const mountRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const [simMode, setSimMode] = useState('dither'); 
    const [depthStrength, setDepthStrength] = useState(0.8); 
    const [isGenerating, setIsGenerating] = useState(true);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiSuggesting, setIsAiSuggesting] = useState(false);
    const [generatedTextureUrl, setGeneratedTextureUrl] = useState(null); 
    const edgePattern = designerState.edgePattern || 'plain';

    const getTagShape = () => {
        const shape = new THREE.Shape();
        const width = 2.9; const height = 5.0; const radius = 0.4; const x = -width / 2; const y = -height / 2;
        shape.moveTo(x, y + radius); shape.lineTo(x, y + height - radius); shape.quadraticCurveTo(x, y + height, x + radius, y + height); shape.lineTo(x + width - radius, y + height); shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius); shape.lineTo(x + width, y + radius); shape.quadraticCurveTo(x + width, y, x + width - radius, y); shape.lineTo(x + radius, y); shape.quadraticCurveTo(x, y, x, y + radius);
        return shape;
    };

    useEffect(() => {
        let renderer, scene, camera, group;
        let animationId;
        const init3D = async () => {
            if (!canvasContainerRef.current) return;
            setIsGenerating(true);
            const frontCanvas = await renderDesignToCanvas(designerState.sides.front, 2); 
            const backCanvas = await renderDesignToCanvas(designerState.sides.back, 2);
            const frontTex = new THREE.CanvasTexture(frontCanvas || document.createElement('canvas'));
            const backTex = new THREE.CanvasTexture(backCanvas || document.createElement('canvas'));
            frontTex.colorSpace = THREE.SRGBColorSpace; backTex.colorSpace = THREE.SRGBColorSpace;
            const width = canvasContainerRef.current.clientWidth; const height = canvasContainerRef.current.clientHeight;
            scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1b1e); scene.fog = new THREE.FogExp2(0x1a1b1e, 0.02);
            camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100); camera.position.z = 11;
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); 
            renderer.setSize(width, height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.8;
             renderer.setSize(width, height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.8; 
            
            // --- 【修改】加入虛擬攝影棚環境 (讓金屬產生真實反射) ---
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            
            // 1. 動態繪製一張「環境貼圖」(模擬攝影棚燈光)
            const envCanvas = document.createElement('canvas');
            envCanvas.width = 1024; envCanvas.height = 512;
            const envCtx = envCanvas.getContext('2d');
            
            // 背景漸層 (模擬地平線)
            const grd = envCtx.createLinearGradient(0, 0, 0, 512);
            grd.addColorStop(0, '#ffffff'); // 頂部亮光
            grd.addColorStop(0.5, '#444444'); // 中間灰
            grd.addColorStop(1, '#111111'); // 底部深色
            envCtx.fillStyle = grd;
            envCtx.fillRect(0, 0, 1024, 512);
            
            // 加入一些「柔光箱」亮塊 (讓金屬有漂亮的反射光斑)
            envCtx.fillStyle = '#ffffff';
            envCtx.fillRect(100, 100, 200, 150); // 左側主光
            envCtx.fillRect(700, 200, 100, 50);  // 右側補光
            envCtx.fillStyle = '#ffeedd'; // 暖色光
            envCtx.fillRect(400, 0, 300, 50);    // 頂光
            
            // 2. 轉換為 3D 環境貼圖
            const envTex = new THREE.CanvasTexture(envCanvas);
            envTex.colorSpace = THREE.SRGBColorSpace;
            const envMap = pmremGenerator.fromEquirectangular(envTex).texture;
            
            // 3. 套用到場景 (這是讓金屬變真實的關鍵!)
            scene.environment = envMap; 
            // scene.background = envMap; // 如果想看到背景可取消註解，但通常保持黑色比較專業
            
            envTex.dispose();
            pmremGenerator.dispose();
            // ----------------------------------------------------
            while (canvasContainerRef.current.firstChild) { canvasContainerRef.current.removeChild(canvasContainerRef.current.firstChild); }
            canvasContainerRef.current.appendChild(renderer.domElement);
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); scene.add(ambientLight);
            const keyLight = new THREE.SpotLight(0xfff0dd, 400.0); keyLight.position.set(5, 8, 8); keyLight.angle = Math.PI / 6; keyLight.penumbra = 0.2; keyLight.decay = 2; keyLight.distance = 100; keyLight.castShadow = true; keyLight.shadow.mapSize.width = 1024; keyLight.shadow.mapSize.height = 1024; keyLight.shadow.bias = -0.0001; scene.add(keyLight);
            const fillLight = new THREE.PointLight(0xcceeff, 120.0); fillLight.position.set(-8, 2, 5); fillLight.decay = 2; fillLight.distance = 100; scene.add(fillLight);
            const rimLight = new THREE.SpotLight(0x0088ff, 200.0); rimLight.position.set(0, 5, -5); rimLight.lookAt(0, 0, 0); rimLight.angle = Math.PI / 3; rimLight.penumbra = 0.5; scene.add(rimLight);
            const planeGeo = new THREE.PlaneGeometry(50, 50); const planeMat = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.8, metalness: 0.2 }); const plane = new THREE.Mesh(planeGeo, planeMat); plane.rotation.x = -Math.PI / 2; plane.position.y = -3.5; plane.receiveShadow = true; scene.add(plane);
            group = new THREE.Group();
            const shape = getTagShape(); const thickness = 0.1;
            const matConfig = { color: 0xffffff, roughness: 0.4, metalness: 0.9 };
            let frontMat; const sideMat = new THREE.MeshStandardMaterial({ ...matConfig, color: 0xdddddd, roughness: 0.6 });
            const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness/2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }); 
            normalizeUVs(geo);
            frontMat = new THREE.MeshStandardMaterial({ ...matConfig });
            const frontMesh = new THREE.Mesh(geo, [frontMat, sideMat]); frontMesh.castShadow = true; frontMesh.receiveShadow = true; group.add(frontMesh);
            const backMat = new THREE.MeshStandardMaterial({ ...matConfig });
            const backMesh = new THREE.Mesh(geo, [backMat, sideMat]); backMesh.rotation.y = Math.PI; backMesh.position.z = 0; backMesh.castShadow = true; backMesh.receiveShadow = true; group.add(backMesh);
            if (mountRef.current) { mountRef.current.frontMat = frontMat; mountRef.current.backMat = backMat; mountRef.current.sideMat = sideMat; }
            scene.add(group);
            let isDragging = false; let previousMousePosition = { x: 0, y: 0 }; const domEl = renderer.domElement;
            const onMouseDown = (e) => { isDragging = true; }; const onMouseUp = (e) => { isDragging = false; };
            const onMouseMove = (e) => { if (isDragging) { const deltaMove = { x: e.offsetX - previousMousePosition.x, y: e.offsetY - previousMousePosition.y }; group.rotation.y += deltaMove.x * 0.01; group.rotation.x += deltaMove.y * 0.01; } previousMousePosition = { x: e.offsetX, y: e.offsetY }; };
            domEl.addEventListener('mousedown', onMouseDown); window.addEventListener('mouseup', onMouseUp); domEl.addEventListener('mousemove', onMouseMove);
            if (generatedTextureUrl) { applyGeneratedTexture(frontMat, generatedTextureUrl, simMode, depthStrength); if (mountRef.current.backMat) applyGeneratedTexture(mountRef.current.backMat, generatedTextureUrl, simMode, depthStrength); updateEdgeMaterial(mountRef.current.sideMat, edgePattern); } else { updateMaterials(frontMat, frontTex, simMode, depthStrength); if (mountRef.current.backMat) updateMaterials(mountRef.current.backMat, backTex, simMode, depthStrength); if (mountRef.current.sideMat) updateEdgeMaterial(mountRef.current.sideMat, edgePattern); }
            const animate = () => { animationId = requestAnimationFrame(animate); if (!isDragging) group.rotation.y += 0.005; renderer.render(scene, camera); };
            animate(); setIsGenerating(false);
            if (mountRef.current) { mountRef.current.frontTex = frontTex; mountRef.current.backTex = backTex; }
        };
        init3D();
        return () => { if (animationId) cancelAnimationFrame(animationId); if (canvasContainerRef.current) { const el = canvasContainerRef.current.querySelector('canvas'); if (el) { el.remove(); } if (renderer) renderer.dispose(); } window.removeEventListener('mouseup', () => {}); };
    }, [designerState.sides, generatedTextureUrl]); 

    useEffect(() => { if (mountRef.current && mountRef.current.frontMat && mountRef.current.backMat && mountRef.current.sideMat) { if (generatedTextureUrl) { applyGeneratedTexture(mountRef.current.frontMat, generatedTextureUrl, simMode, depthStrength); applyGeneratedTexture(mountRef.current.backMat, generatedTextureUrl, simMode, depthStrength); updateEdgeMaterial(mountRef.current.sideMat, edgePattern); } else { updateMaterials(mountRef.current.frontMat, mountRef.current.frontTex, simMode, depthStrength); updateMaterials(mountRef.current.backMat, mountRef.current.backTex, simMode, depthStrength); updateEdgeMaterial(mountRef.current.sideMat, edgePattern); } } }, [simMode, depthStrength, generatedTextureUrl, edgePattern]);
    useEffect(() => { if (mountRef.current && mountRef.current.sideMat) { updateEdgeMaterial(mountRef.current.sideMat, edgePattern); } }, [edgePattern]);

    const applyGeneratedTexture = (mat, url, mode, strength, isEdge = false) => { 
        if (!mat || !url) return; 
        const loader = new THREE.TextureLoader(); 
        loader.load(url, (tex) => { 
            tex.colorSpace = THREE.SRGBColorSpace; 
            if (isEdge) { 
                tex.wrapS = THREE.RepeatWrapping; 
                tex.wrapT = THREE.RepeatWrapping; 
                tex.repeat.set(4, 1); 
            } 
            mat.map = null; mat.displacementMap = null; mat.bumpMap = null; mat.needsUpdate = true; 
            
            if (mode === 'color') { 
                mat.map = tex; 
                mat.color.setHex(0xffffff); 
                // 【修改】MOPA 雷射質感：高金屬度 + 微凹凸
                mat.metalness = 1.0; 
                mat.roughness = 0.35; 
                mat.bumpMap = tex;      // 使用顏色紋理作為微凹凸
                mat.bumpScale = 0.02;   // 極細微的蝕刻感
            } else if (mode === 'depth') { 
                mat.color.setHex(0xeeeeee); 
                mat.metalness = 0.9; 
                mat.roughness = 0.4; 
                mat.bumpMap = tex; 
                mat.bumpScale = strength * 0.8; 
            } else if (mode === 'dither') { 
                mat.map = tex; 
                mat.bumpMap = tex; 
                mat.bumpScale = 0.05; 
                mat.color.setHex(0xffffff); 
                mat.metalness = 0.7; // 網點雷射通常較霧面
                mat.roughness = 0.6;
            } 
            mat.needsUpdate = true; 
        }); 
    };
    const handleAiTextureGeneration = async () => { if (!aiPrompt.trim()) return; setIsAiSuggesting(true); const prompt = `${aiPrompt}. High resolution, high quality texture design.`; try { const imageUrl = await callGeminiImage(prompt); if (imageUrl) { setGeneratedTextureUrl(imageUrl); setSimMode('color'); } } catch (e) { console.error("AI Texture Error", e); } finally { setIsAiSuggesting(false); } };
    const clearGeneratedTexture = () => { setGeneratedTextureUrl(null); };
    const updateEdgeMaterial = (mat, pattern) => { const canvas = generateEdgeTexture(pattern); const tex = new THREE.CanvasTexture(canvas); tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 1); mat.map = tex; mat.bumpMap = tex; mat.bumpScale = 0.05; mat.roughness = 0.5; mat.color.setHex(0xcccccc); mat.needsUpdate = true; };
    const updateMaterials = (mat, tex, mode, strength) => { 
        if (!mat) return; 
        mat.map = null; mat.displacementMap = null; mat.bumpMap = null; mat.needsUpdate = true; 
        
        if (mode === 'color') { 
            mat.map = tex; 
            mat.color.setHex(0xffffff); 
            // 【修改】MOPA 氧化色模擬：讓顏色呈現金屬光澤
            mat.metalness = 1.0; // 設為純金屬，讓環境光能反射在顏色上
            mat.roughness = 0.3; // 光滑表面
            
            // 加入凹凸貼圖，讓文字邊緣有雷射燒灼的立體感
            mat.bumpMap = tex;
            mat.bumpScale = 0.03; 
            
        } else if (mode === 'depth') { 
            mat.color.setHex(0xffffff); 
            mat.metalness = 0.9; 
            mat.roughness = 0.35; 
            mat.bumpMap = tex; 
            mat.bumpScale = strength * 0.8; 
            mat.displacementMap = null; 
        } else if (mode === 'dither') { 
            mat.bumpMap = tex; 
            mat.bumpScale = 0.03; 
            mat.map = tex; 
            mat.color.setHex(0xffffff); 
            mat.metalness = 0.7; 
            mat.roughness = 0.5;
        } 
    };

    return (
        <div className="flex flex-row h-full w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl relative border border-slate-700">
            <div className="flex-1 relative bg-slate-900" ref={mountRef}>
                {isGenerating && (<div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur text-slate-300"><Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" /><p>正在渲染 3D 場景...</p></div>)}
                <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-xs text-slate-300 pointer-events-none border border-white/10 shadow-sm">左鍵拖曳旋轉 • 滾輪縮放</div>
                <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full z-0" />
            </div>
            <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
                <div>
                    <h3 className="text-slate-800 font-bold flex items-center text-lg mb-4"><Zap className="w-5 h-5 mr-2 text-yellow-500" /> 3D預覽</h3>
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 mb-6">
                        <h4 className="text-xs font-bold text-indigo-800 mb-2 flex items-center justify-between"><span className="flex items-center"><Sparkles className="w-3 h-3 mr-1" /> AI 材質生成 (Imagen 4)</span>{generatedTextureUrl && (<button onClick={clearGeneratedTexture} className="text-[10px] text-red-500 hover:text-red-700 underline">重置回原設計</button>)}</h4>
                        <div className="flex gap-2"><input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="輸入材質：如碳纖維、龍紋..." className="flex-1 text-xs p-2 rounded border border-indigo-200 focus:border-indigo-500 outline-none bg-white" onKeyDown={(e) => e.key === 'Enter' && handleAiTextureGeneration()} /><button onClick={handleAiTextureGeneration} disabled={isAiSuggesting || !aiPrompt} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition-colors disabled:opacity-50">{isAiSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PaintBucket className="w-4 h-4" />}</button></div>
                        <p className="text-[10px] text-indigo-400 mt-2">* 將替換<span className="font-bold">整塊軍牌（包含背面與邊框）</span>的材質進行預覽。</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mb-6">{['dither', 'depth', 'color'].map(m => (<button key={m} onClick={() => setSimMode(m)} className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-between border ${simMode === m ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}><span>{m === 'dither' ? '網點模式 (Dither)' : m === 'depth' ? '深度雕刻 (Depth)' : '上色預覽 (Color)'}</span>{simMode === m && <Check className="w-4 h-4" />}</button>))}</div>
                    <div className="mb-6"><h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">邊框紋理設計</h4><div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">{EDGE_PATTERNS.map((p) => { const Icon = p.icon; if (!Icon) return null; return (<button key={p.id} onClick={() => updateDesignerState({ edgePattern: p.id })} className={`flex items-center w-full p-3 rounded-lg border text-xs transition-all ${edgePattern === p.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}><Icon className="w-5 h-5 opacity-70 shrink-0" /><span className="ml-3 font-medium">{p.name}</span>{edgePattern === p.id && <Check className="w-4 h-4 ml-auto text-indigo-600" />}</button>); })}</div></div>
                    {simMode === 'depth' && (<div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in slide-in-from-right-4 mb-4"><div className="flex justify-between text-xs text-indigo-600 mb-2 font-bold"><span>雕刻深度</span><span>{depthStrength.toFixed(1)} mm</span></div><input type="range" min="0.1" max="1.5" step="0.1" value={depthStrength} onChange={(e) => setDepthStrength(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" /><p className="text-[10px] text-slate-400 mt-2 text-right">建議值: 0.5mm</p></div>)}
                    <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{simMode === 'dither' && "模擬光纖雷射高頻打點。圖像將轉換為高解析度黑白點陣，適合相片與 QR Code。"}{simMode === 'depth' && "模擬高功率多次來回雕刻產生的物理凹槽。使用 Bump Mapping 增強視覺立體感。"}{simMode === 'color' && "模擬 MOPA 雷射透過脈衝控制，在不鏽鋼表面產生氧化層顏色。"}</div>
                </div>
            </div>
        </div>
    );
};

const ArmyTagDesigner = ({ user, isLoggedIn, handleLogin, isGapiLoaded, persistentState, updatePersistentState }) => {
  const { sides, currentSide, nanoPrompt, driveFileId, driveShareLink, zoomLevel, pan, fontCategory } = persistentState;
  const layers = sides[currentSide] || [];
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHandMode, setIsHandMode] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [selectedId, setSelectedId] = useState(null); 
  const [isGeneratingUV, setIsGeneratingUV] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [aiGenMode, setAiGenMode] = useState('object');
  const [isCropMode, setIsCropMode] = useState(false);
  const [interactionMode, setInteractionMode] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialState, setInitialState] = useState({});
  const [showGuides, setShowGuides] = useState({ x: false, y: false });
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false); 
  const [refImage, setRefImage] = useState(null); // 新增參考圖狀態
  const viewportRef = useRef(null);

  // 【修改 1】加入 API Key 視窗控制狀態
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const handleSaveKey = (userKey) => {
      localStorage.setItem('USER_GEMINI_KEY', userKey.trim());
      alert("✅ API Key 已儲存！請再次點擊生成按鈕。");
  };

  const updateLayers = (newLayers) => { updatePersistentState({ sides: { ...sides, [currentSide]: newLayers } }); };
  const setLayers = (action) => { const newLayers = typeof action === 'function' ? action(layers) : action; updateLayers(newLayers); };
  const updateLayer = (id, updates) => { setLayers(prev => prev.map(layer => layer.id === id ? { ...layer, ...updates } : layer)); };
  const setNanoPrompt = (val) => updatePersistentState({ nanoPrompt: val });
  const setCurrentSide = (val) => updatePersistentState({ currentSide: val });
  const setDriveFileId = (val) => updatePersistentState({ driveFileId: val });
  const setDriveShareLink = (val) => updatePersistentState({ driveShareLink: val });
  const setZoomLevel = (action) => { const newZoom = typeof action === 'function' ? action(zoomLevel) : action; updatePersistentState({ zoomLevel: newZoom }); };
  const setPan = (val) => updatePersistentState({ pan: val });
  const setFontCategory = (val) => updatePersistentState({ fontCategory: val });

  const generateAIQuote = async () => {
    if (!selectedId) return; const layer = layers.find(l => l.id === selectedId); if (!layer || layer.type !== 'text') return; setIsGeneratingQuote(true); const prompt = "Generate a short, powerful, inspirational or military-style motto suitable for a dog tag. Maximum 4 words. Output ONLY the text, no quotes or explanations. Examples: 'NO PAIN NO GAIN', 'SEMPER FI', 'BORN TO LEAD'.";
    try { const text = await callGeminiText(prompt); if (text) { updateLayer(selectedId, { content: text.trim().replace(/^"|"$/g, '').toUpperCase() }); } } catch (e) { console.error("AI Quote Error", e); } finally { setIsGeneratingQuote(false); }
  };

  useEffect(() => {
    const loadDesignFromDrive = async (fileId) => {
        if (!isGapiLoaded) return;
        try { setIsSaving(true); const response = await window.gapi.client.drive.files.get({ fileId: fileId, alt: 'media' }); const data = response.result; let loadedSides = data.sides; if (!loadedSides && data.layers) { loadedSides = { front: JSON.parse(data.layers), back: [] }; } updatePersistentState({ sides: loadedSides || { front: [], back: [] }, nanoPrompt: data.nanoPrompt || '', fontCategory: data.viewState?.fontCategory || 'en', driveFileId: fileId }); } catch (error) { console.error("Load Error:", error); } finally { setIsSaving(false); }
    };
    const params = new URLSearchParams(window.location.search); const fid = params.get('driveId'); if (fid && isGapiLoaded && isLoggedIn && !driveFileId) { loadDesignFromDrive(fid); }
  }, [isGapiLoaded, isLoggedIn, driveFileId]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.code === 'Space' && !e.repeat && document.activeElement.tagName !== 'INPUT') { setIsSpacePressed(true); } };
    const handleKeyUp = (e) => { if (e.code === 'Space') { setIsSpacePressed(false); } };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);
  const effectiveHandMode = isHandMode || isSpacePressed;

  // --- 修正處：補回之前遺失的 handleGeminiEnhancePrompt 函式定義 ---
  const handleGeminiEnhancePrompt = async () => {
    if (!nanoPrompt.trim()) return; 
    setIsEnhancingPrompt(true); 
    let systemInstruction = aiGenMode === 'background' ? `你是一個頂尖視覺藝術家。請將描述「${nanoPrompt}」擴寫成極度詳細的英文 Prompt。` : `你是一個精緻貼紙設計師。請將描述「${nanoPrompt}」擴寫成詳細英文 Prompt，用於生成「獨立主體 (Isolated Subject)」。`; 
    const result = await callGeminiText(systemInstruction); 
    if (result) setNanoPrompt(result.trim()); 
    setIsEnhancingPrompt(false); 
  };
  
 // 更新後的生成函式
  const handleNanoGenerate = async () => { 
    // 【修改 2】設計器專用的額度檢查
    const quotaKey = 'FREE_QUOTA_DESIGNER'; 
    const currentCount = parseInt(localStorage.getItem(quotaKey) || '0');
    const hasUserKey = !!localStorage.getItem('USER_GEMINI_KEY');

    if (!hasUserKey && currentCount >= 10) {
        setShowApiKeyModal(true); 
        return;
    }

    // 檢查是否有足夠資訊開始生成
    if (!nanoPrompt.trim() && !refImage) {
        alert("請輸入文字描述或上傳參考圖片！");
        return;
    }
    // 如果還有額度且沒 Key，先扣次數
    if (!hasUserKey) {
        localStorage.setItem(quotaKey, currentCount + 1);
    }
    // 檢查 Key
    const key = getEffectiveKey();
    if (!key) {
        alert("錯誤：未偵測到有效的 API Key。\n請確認程式碼中 apiKey 或 GOOGLE_API_KEY 已設定。");
        return;
    }

    setIsGeneratingUV(true); 
    
    try { 
        let imageUrl = null;
        if (refImage) {
             // 以圖生圖邏輯
             const safePrompt = nanoPrompt.trim() || "Generate a high quality variation of this image.";
             const prompt = aiGenMode === 'background'
                ? `High-quality full-frame background art based on reference. Transform style/content: ${safePrompt}. Cinematic lighting, 8k resolution, highly detailed texture.`
                : `Generate a high quality sticker design based on this reference image. Changes requested: ${safePrompt}. Isolate subject on white background.`;
             
             // 呼叫並等待結果
             imageUrl = await callGeminiImg2Img(prompt, refImage);
        } else {
             // 文生圖邏輯
             let prompt = aiGenMode === 'background' 
                ? `Masterpiece full frame wallpaper illustration of ${nanoPrompt}. Cinematic lighting, hyper-detailed, 8k resolution, trending on artstation, texture rich.` 
                : `A high quality, hyper-detailed sticker design of ${nanoPrompt}. Isolate subject on SOLID PURE WHITE BACKGROUND.`;
             imageUrl = await callGeminiImage(prompt);
        }

        if (imageUrl) { 
            let finalImageUrl = imageUrl; 
            let isAiBg = false; 
            
            // 如果是物件模式，嘗試自動去背
            if (aiGenMode === 'object') { 
                setIsProcessingBg(true); 
                // 這裡的去背也可能耗時，保持 loading 狀態
                finalImageUrl = await removeWhiteBackground(imageUrl); 
                setIsProcessingBg(false); 
            } else { 
                isAiBg = true; 
            } 

            const img = new Image(); 
            img.onload = () => { 
                const layout = calculateFillScale(img.width, img.height); 
                const newId = `ai-gen-${Date.now()}`; 
                const newLayer = { id: newId, type: 'image', content: finalImageUrl, originalContent: finalImageUrl, x: 0, y: 0, rotation: 0, scale: layout.scale, width: layout.width, height: layout.height, isAiBackground: isAiBg, cropShape: 'none', cropX: 0, cropY: 0, cropScale: 1, opacity: 1, flipX: 1, flipY: 1, filter: 'none' }; 
                if (isAiBg) { 
                    setLayers(prev => { const bgLayers = prev.filter(l => l.isAiBackground); const otherLayers = prev.filter(l => !l.isAiBackground); return [...bgLayers, newLayer, ...otherLayers]; }); 
                } else { 
                    setLayers(prev => [...prev, newLayer]); 
                } 
                setSelectedId(newId); 
            }; 
            img.src = finalImageUrl; 
        } else {
            // --- 修正：如果 imageUrl 是 null (代表上面 catch 已經處理過 alert，或者靜默失敗)，這裡再做一次確認 ---
            // 理論上上面的 callGemini 已經 alert 過了，但為了保險起見，如果什麼都沒發生，我們不希望 loading 一直轉
            console.warn("Generation returned null.");
        }
    } catch (e) { 
        console.error(e); 
        alert("生成過程發生未預期的錯誤：" + e.message);
    } finally { 
        // 無論成功失敗，最後都要關閉 Loading 狀態
        setIsGeneratingUV(false); 
        setIsProcessingBg(false); 
    } 
  };
  
  const handleManualRemoveBackground = async () => { if (!selectedLayer || selectedLayer.type !== 'image') return; setIsProcessingBg(true); const newContent = await removeWhiteBackground(selectedLayer.content); updateLayer(selectedLayer.id, { content: newContent }); setIsProcessingBg(false); };
  const handleMopaSimulation = async () => { if (!selectedLayer || selectedLayer.type !== 'image') return; setIsProcessingBg(true); if (!selectedLayer.originalContent) { updateLayer(selectedLayer.id, { originalContent: selectedLayer.content }); } const source = selectedLayer.originalContent || selectedLayer.content; const newContent = await simulateMopaColors(source); updateLayer(selectedLayer.id, { content: newContent, isMopaSimulated: true }); setIsProcessingBg(false); };
  const handleRevertMopa = () => { if (!selectedLayer || selectedLayer.type !== 'image' || !selectedLayer.originalContent) return; updateLayer(selectedLayer.id, { content: selectedLayer.originalContent, isMopaSimulated: false }); };
  const addTextLayer = () => { const newId = `text-${Date.now()}`; setLayers(prev => [...prev, { id: newId, type: 'text', content: 'NEW TEXT', x: 0, y: 0, scale: 1, rotation: 0, colorMode: 'solid', color: '#1f2937', gradientStart: '#1e3a8a', gradientEnd: '#dc2626', gradientAngle: 90, fontFamily: '"Inter", sans-serif', cropShape: 'none', opacity: 1, flipX: 1, flipY: 1, filter: 'none' }]); setSelectedId(newId); };
  const addImageLayer = (file) => { 
      const reader = new FileReader(); 
      reader.onloadend = async () => { 
          // 👇👇👇【關鍵修正】先壓縮圖片再放入圖層，避免檔案過大導致儲存失敗 👇👇👇
          const compressed = await compressImage(reader.result, 1024); 
          // 👆👆👆【修正結束】👆👆👆
          
          const img = new Image(); 
          img.onload = () => { 
              const layout = calculateFillScale(img.width, img.height); 
              const newId = `img-${Date.now()}`; 
              setLayers(prev => [...prev, { 
                  id: newId, 
                  type: 'image', 
                  content: compressed, // 使用壓縮後的圖片資料
                  originalContent: compressed, 
                  x: 0, y: 0, rotation: 0, scale: layout.scale, width: layout.width, height: layout.height, cropShape: 'none', cropX: 0, cropY: 0, cropScale: 1, opacity: 1, flipX: 1, flipY: 1, filter: 'none' 
              }]); 
              setSelectedId(newId); 
          }; 
          img.src = compressed; 
      }; 
      reader.readAsDataURL(file); 
  };
  const deleteLayer = (id) => { setLayers(prev => prev.filter(l => l.id !== id)); if (selectedId === id) setSelectedId(null); };
  const moveLayerOrder = (id, direction) => { setLayers(prev => { const idx = prev.findIndex(l => l.id === id); if (idx === -1) return prev; if (direction === 'up' && idx === prev.length - 1) return prev; if (direction === 'down' && idx === 0) return prev; const newLayers = [...prev]; const swapIdx = direction === 'up' ? idx + 1 : idx - 1; [newLayers[idx], newLayers[swapIdx]] = [newLayers[swapIdx], newLayers[idx]]; return newLayers; }); };
  
  // --- Saving ---
  const handleSaveImage = async () => { const canvas = await renderDesignToCanvas(layers, 4); const link = document.createElement('a'); link.download = `Design_${Date.now()}.png`; link.href = canvas.toDataURL('image/png', 1.0); link.click(); };
  
  const handleSaveSVG = () => {
    const width = TAG_WIDTH_PX;
    const height = TAG_HEIGHT_PX;
    const radius = 48;
    const bgPath = `M ${radius} 0 L ${width - radius} 0 Q ${width} 0 ${width} ${radius} L ${width} ${height - radius} Q ${width} ${height} ${width - radius} ${height} L ${radius} ${height} Q 0 ${height} 0 ${height - radius} L 0 ${radius} Q 0 0 ${radius} 0 Z`;
    const holeX = width / 2; const holeY = 38; const holeRadius = 8;

    // 修正：加入 xmlns:xlink (確保圖片相容性)，設定寬高為 100% 並強制置中 (preserveAspectRatio)
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`;
    svgContent += `<defs>`;
    
    // 加入 Google Fonts 引用，確保 SVG 在外部開啟時能正確顯示藝術字體 (包含新增的 Texturina, New Rocker, Metal Mania, MedievalSharp)
    const fontsUrl = "https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Aguafina+Script&family=Great+Vibes&family=Herr+Von+Muellerhoff&family=Meddon&family=Mrs+Saint+Delafield&family=Pinyon+Script&family=Inter:wght@400;700&family=Roboto:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@700&family=Courier+Prime&family=Pirata+One&family=Grenze+Gotisch&family=Texturina:wght@400;700&family=New+Rocker&family=Metal+Mania&family=MedievalSharp&display=swap";
    // 修正：將 URL 中的 '&' 轉義為 '&amp;' 以符合 XML 規範
    const escapedFontsUrl = fontsUrl.replace(/&/g, '&amp;');
    svgContent += `<style type="text/css">@import url('${escapedFontsUrl}');</style>`;

    layers.forEach(layer => {
        if (layer.cropShape && layer.cropShape !== 'none' && CROP_SHAPES[layer.cropShape]) {
             const shapeId = `clip-${layer.id}`;
             let clipContent = '';
             const size = 200; 
             if (layer.cropShape === 'circle') { clipContent = `<circle cx="0" cy="0" r="${size/2}" />`; } 
             else if (layer.cropShape === 'square') { clipContent = `<rect x="${-size/2}" y="${-size/2}" width="${size}" height="${size}" rx="10" ry="10" />`; } 
             else {
                 const css = CROP_SHAPES[layer.cropShape].css;
                 if (css.startsWith('polygon')) {
                     const points = css.match(/[\d.]+% [\d.]+%/g);
                     if (points) {
                         const svgPoints = points.map(p => {
                             const parts = p.split(' '); const xPct = parseFloat(parts[0]); const yPct = parseFloat(parts[1]); const x = (xPct / 100) * size - size / 2; const y = (yPct / 100) * size - size / 2; return `${x},${y}`;
                         }).join(' ');
                         clipContent = `<polygon points="${svgPoints}" />`;
                     }
                 }
             }
             if(clipContent) { svgContent += `<clipPath id="${shapeId}">${clipContent}</clipPath>`; }
        }
    });
    svgContent += `</defs>`;
    svgContent += `<path d="${bgPath}" fill="#E5E7EB" stroke="#D1D5DB" stroke-width="1.5" />`;
    
    layers.forEach(layer => {
        const centerX = width / 2; const centerY = height / 2; 
        // 確保座標為數值
        const layerX = Number(layer.x) || 0;
        const layerY = Number(layer.y) || 0;
        const x = centerX + layerX; 
        const y = centerY + layerY; 
        const rotation = layer.rotation || 0; 
        const scale = layer.scale || 1; 
        const flipX = layer.flipX ?? 1; 
        const flipY = layer.flipY ?? 1;
        
        const transform = `translate(${x}, ${y}) rotate(${rotation}) scale(${scale * flipX}, ${scale * flipY})`;
        svgContent += `<g transform="${transform}" opacity="${layer.opacity ?? 1}">`;
        if (layer.type === 'text') {
            const fontSize = 40; let fontFamily = (layer.fontFamily || 'sans-serif').replace(/"/g, "'");
            let fillAttr = `fill="${layer.color || '#000'}"`;
            if (layer.colorMode === 'gradient') {
                const gradId = `grad-${layer.id}`;
                svgContent += `<defs><linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(${layer.gradientAngle || 0} .5 .5)"><stop offset="0%" stop-color="${layer.gradientStart}" /><stop offset="100%" stop-color="${layer.gradientEnd}" /></linearGradient></defs>`;
                fillAttr = `fill="url(#${gradId})"`;
            }
            const lines = layer.content.split('\n'); const lineHeight = fontSize * 1.2; const centerIndex = (lines.length - 1) / 2;
            lines.forEach((line, i) => { const dy = (i - centerIndex) * lineHeight; svgContent += `<text x="0" y="${dy}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" ${fillAttr}>${line}</text>`; });
        } else if (layer.type === 'image') {
             const imgW = 200; const imgH = layer.height || 200; 
             const cropX = layer.cropX || 0; const cropY = layer.cropY || 0; const cropScale = layer.cropScale || 1;
             const clipAttr = (layer.cropShape && layer.cropShape !== 'none') ? `clip-path="url(#clip-${layer.id})"` : '';
             svgContent += `<g ${clipAttr}><image href="${layer.content}" x="${-imgW/2 + cropX}" y="${-imgH/2 + cropY}" width="${imgW * cropScale}" height="${imgH * cropScale}" preserveAspectRatio="none" /></g>`;
        }
        svgContent += `</g>`;
    });
    svgContent += `<circle cx="${holeX}" cy="${holeY}" r="${holeRadius}" fill="#1f2937" stroke="#4b5563" stroke-width="1" />`;
    svgContent += `</svg>`;
    const blob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Design_${Date.now()}.svg`; link.click();
  };
  
  // --- Google Drive Save Logic ---
  const saveToDrive = async () => {
    if (!isLoggedIn) { handleLogin(); return; }
    setIsSaving(true);
    const fileContent = JSON.stringify({ sides, nanoPrompt, viewState: { zoomLevel, pan, fontCategory, edgePattern: persistentState.edgePattern } });
    const fileMetadata = { name: 'MyArmyTagDesign.json', mimeType: 'application/json' };
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    const contentType = 'application/json';
    const multipartRequestBody = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(fileMetadata) + delimiter + 'Content-Type: ' + contentType + '\r\n\r\n' + fileContent + close_delim;
    try {
        const request = await window.gapi.client.request({
            'path': driveFileId ? `/upload/drive/v3/files/${driveFileId}` : '/upload/drive/v3/files',
            'method': driveFileId ? 'PATCH' : 'POST',
            'params': { 'uploadType': 'multipart' },
            'headers': { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
            'body': multipartRequestBody
        });
        const file = request.result;
        setDriveFileId(file.id);
        
        // 設定權限為任何人可讀取 (為了分享連結)
        await window.gapi.client.drive.permissions.create({
            fileId: file.id,
            resource: { role: 'reader', type: 'anyone' }
        });
        
        // 取得 webViewLink
        const fileInfo = await window.gapi.client.drive.files.get({
            fileId: file.id,
            fields: 'webViewLink'
        });
        setDriveShareLink(fileInfo.result.webViewLink);
        setShowShareModal(true);
    } catch (e) { console.error('Upload Error', e); alert('儲存失敗，請檢查網路或登入狀態'); } finally { setIsSaving(false); }
  };
  
  const handleShareAction = (type) => {
    if (type === 'link') {
        const shareUrl = `${window.location.origin}${window.location.pathname}?driveId=${driveFileId}`;
        const tempInput = document.createElement('input'); tempInput.value = shareUrl; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput);
        alert("編輯連結已複製！");
    }
  };

  const handleCanvasMouseDown = (e) => { setInteractionMode('panCanvas'); setDragStart({ x: e.clientX, y: e.clientY }); setInitialState({ pan: { ...pan } }); setSelectedId(null); setIsCropMode(false); };
  const handleLayerMouseDown = (e, id, mode) => { e.stopPropagation(); if (isCropMode && id !== selectedId) return; setSelectedId(id); if (isCropMode && id === selectedId) { setInteractionMode('panImage'); } else { setInteractionMode(mode); } setDragStart({ x: e.clientX, y: e.clientY }); const layer = layers.find(l => l.id === id); if (layer) { if (mode === 'resizeLayer') { const layerEl = document.getElementById(`layer-${id}`); if (layerEl) { const rect = layerEl.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY); setInitialState({ layer: { ...layer }, startDist: dist }); } } else { setInitialState({ layer: { ...layer } }); } } };
  const handleGlobalMouseMove = (e) => { if (!interactionMode) return; if (interactionMode === 'panCanvas' && initialState.pan) { const deltaX = e.clientX - dragStart.x; const deltaY = e.clientY - dragStart.y; setPan({ x: initialState.pan.x + deltaX, y: initialState.pan.y + deltaY }); } else if (interactionMode === 'panImage' && selectedId && isCropMode) { const scaleFactor = zoomLevel / 100; const deltaX = (e.clientX - dragStart.x) / scaleFactor; const deltaY = (e.clientY - dragStart.y) / scaleFactor; const layer = layers.find(l => l.id === selectedId); if (layer && initialState.layer) { updateLayer(selectedId, { cropX: (initialState.layer.cropX || 0) + deltaX / (layer.scale || 1), cropY: (initialState.layer.cropY || 0) + deltaY / (layer.scale || 1) }); } } else if (selectedId && initialState.layer && !isCropMode) { const layerElement = document.getElementById(`layer-${selectedId}`); if (!layerElement) return; if (interactionMode === 'moveLayer') { const scaleFactor = zoomLevel / 100; const deltaX = (e.clientX - dragStart.x) / scaleFactor; const deltaY = (e.clientY - dragStart.y) / scaleFactor; let newX = initialState.layer.x + deltaX; let newY = initialState.layer.y + deltaY; if (Math.abs(newX) < 5) { newX = 0; setShowGuides(p => ({...p, x: true})); } else setShowGuides(p => ({...p, x: false})); if (Math.abs(newY) < 5) { newY = 0; setShowGuides(p => ({...p, y: true})); } else setShowGuides(p => ({...p, y: false})); updateLayer(selectedId, { x: newX, y: newY }); } else if (interactionMode === 'rotateLayer') { const rect = layerElement.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX); let angleDeg = angleRad * (180 / Math.PI); angleDeg += 90; updateLayer(selectedId, { rotation: angleDeg }); } else if (interactionMode === 'resizeLayer' && initialState.startDist) { const rect = layerElement.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; const currentDist = Math.hypot(e.clientX - centerX, e.clientY - centerY); const scaleRatio = currentDist / initialState.startDist; let newScale = initialState.layer.scale * scaleRatio; newScale = Math.max(0.1, Math.min(newScale, 10)); updateLayer(selectedId, { scale: newScale }); } } };
  const handleGlobalMouseUp = () => { setInteractionMode(null); setInitialState({}); setShowGuides({ x: false, y: false }); };
  
  const Rulers = ({ zoomLevel, pan, viewportRef }) => {
    if (!viewportRef.current) return null;
    const viewportRect = viewportRef.current.getBoundingClientRect(); const centerX = viewportRect.width / 2; const centerY = viewportRect.height / 2; const scale = zoomLevel / 100; const originX = centerX + pan.x - (TAG_WIDTH_PX * scale) / 2; const originY = centerY + pan.y - (TAG_HEIGHT_PX * scale) / 2;
    const ticksV = []; const ticksH = [];
    for (let i = -10; i <= 80; i++) { if (i % 5 !== 0 && i % 1 !== 0) continue; const pos = originY + (i * PX_PER_MM * scale); if (pos > 0 && pos < viewportRect.height) { ticksV.push(<div key={`v-${i}`} className="absolute right-0 flex items-center" style={{ top: pos }}>{i % 10 === 0 && <span className="text-[9px] text-gray-500 mr-1 font-mono">{i}</span>}<div className={`bg-gray-400 ${i % 10 === 0 ? 'w-3 h-[1px]' : 'w-2 h-[1px]'}`}></div></div>); } }
    for (let i = -10; i <= 50; i++) { const pos = originX + (i * PX_PER_MM * scale); if (pos > 0 && pos < viewportRect.width) { ticksH.push(<div key={`h-${i}`} className="absolute top-0 flex flex-col items-center" style={{ left: pos }}><div className={`bg-gray-400 ${i % 10 === 0 ? 'h-3 w-[1px]' : 'h-2 w-[1px]'}`}></div>{i % 10 === 0 && <span className="text-[9px] text-gray-500 mt-0.5 font-mono">{i}</span>}</div>); } }
    return (<><div className="absolute top-0 left-0 bottom-0 w-8 bg-gray-50 border-r border-gray-200 z-40 overflow-hidden pointer-events-none select-none">{ticksV}</div><div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-50 border-t border-gray-200 z-40 overflow-hidden pointer-events-none select-none">{ticksH}</div></>);
  };
  const selectedLayer = layers.find(l => l.id === selectedId);
  const duplicateLayer = (id) => { const layerToCopy = layers.find(l => l.id === id); if (!layerToCopy) return; const newId = `${layerToCopy.type}-${Date.now()}`; const newLayer = { ...layerToCopy, id: newId, x: layerToCopy.x + 10, y: layerToCopy.y + 10 }; setLayers(prev => [...prev, newLayer]); setSelectedId(newId); };
  const alignLayer = (id, type) => { updateLayer(id, { x: type === 'horizontal' ? 0 : (selectedLayer?.x || 0), y: type === 'vertical' ? 0 : (selectedLayer?.y || 0) }); };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden relative z-10 w-full h-full" onMouseMove={handleGlobalMouseMove} onMouseUp={handleGlobalMouseUp} onMouseLeave={handleGlobalMouseUp}>
      {showShareModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-50"><HardDrive className="w-8 h-8" /></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">已儲存至 Google Drive！</h3>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">檔案已安全存放在您的雲端硬碟中。<br/>您可以複製下方連結進行分享。</p>
                    <div className="space-y-3"><button onClick={() => handleShareAction('link')} className="w-full flex items-center p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 group active:scale-95"><div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600 mr-4 group-hover:scale-110 transition-transform group-hover:text-indigo-600"><LinkIcon className="w-5 h-5" /></div><div className="text-left"><div className="font-bold text-slate-700 text-sm group-hover:text-indigo-700">複製編輯連結 (推薦)</div><div className="text-xs text-slate-400">顧客點擊可直接回到此 App 檢視</div></div><Copy className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-400" /></button></div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center"><button onClick={() => setShowShareModal(false)} className="text-slate-500 text-sm hover:text-slate-800 font-medium px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">關閉視窗</button></div>
            </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-1 border border-white/50 shadow-xl relative overflow-hidden flex-grow flex flex-col select-none h-full">
          <div ref={viewportRef} className={`relative flex-1 overflow-hidden cursor-${effectiveHandMode ? 'grab' : 'default'} bg-[#e5e7eb]`} onMouseDown={handleCanvasMouseDown} style={{ touchAction: 'none' }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: `${pan.x}px ${pan.y}px`}}></div>
            <Rulers zoomLevel={zoomLevel} pan={pan} viewportRef={viewportRef} />
            <div className="absolute top-4 right-4 z-50 flex flex-col space-y-2">
                <div className="relative">
                    <button onClick={() => setShowSaveOptions(!showSaveOptions)} className="p-3 bg-white text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg border border-gray-200 transition-all hover:scale-105" title="下載設計圖"><Save className="w-5 h-5" /></button>
                    {showSaveOptions && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden w-36 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { handleSaveImage(); setShowSaveOptions(false); }} className="w-full text-left px-4 py-3 text-xs hover:bg-indigo-50 text-slate-700 font-bold flex items-center"><FileImage className="w-4 h-4 mr-2 text-indigo-500"/> PNG (圖片)</button>
                            <button onClick={() => { handleSaveSVG(); setShowSaveOptions(false); }} className="w-full text-left px-4 py-3 text-xs hover:bg-indigo-50 text-slate-700 font-bold flex items-center border-t border-slate-50"><Code className="w-4 h-4 mr-2 text-pink-500"/> SVG (向量)</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute top-4 left-10 text-xs font-mono z-10 bg-white/90 text-slate-700 px-3 py-1 rounded-full border border-slate-200 backdrop-blur-sm pointer-events-none shadow-sm">VIEW: {currentSide === 'front' ? 'FRONT SIDE' : 'BACK SIDE'} • {zoomLevel}%</div>
            {isCropMode && <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-bounce"><Scan className="w-4 h-4" /><span className="text-xs font-bold">裁切編輯模式：拖曳圖片調整位置</span></div>}
            <div className="absolute top-1/2 left-1/2 flex items-center justify-center will-change-transform" style={{ transform: `translate3d(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px), 0) scale(${zoomLevel / 100})`, width: TAG_WIDTH_PX, height: TAG_HEIGHT_PX }}>
              <div className={`w-full h-full rounded-[48px] ${MATERIAL_316.css} relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]`}>
                <div className="absolute top-[30px] left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-slate-800 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-1px_2px_rgba(0,0,0,0.8)] z-40 border border-gray-600"></div>
                {showGuides.y && <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-yellow-400 z-50 shadow-[0_0_4px_rgba(250,204,21,1)]"></div>}
                {showGuides.x && <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-yellow-400 z-50 shadow-[0_0_4px_rgba(250,204,21,1)]"></div>}
                {(isGeneratingUV || isEnhancingPrompt || isProcessingBg) && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-indigo-900"><RotateCcw className="w-8 h-8 animate-spin mb-2 text-indigo-600" /><span className="text-xs font-mono font-bold">{isProcessingBg ? 'PROCESSING...' : 'GENERATING...'}</span></div>}
                {layers.map((layer, index) => (
                  <div key={layer.id} id={`layer-${layer.id}`} className={`absolute cursor-move group select-none`}
                    style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation}deg) scale(${layer.scale})`, zIndex: index + 10, transformOrigin: 'center center', opacity: (isCropMode && selectedId !== layer.id) ? 0.3 : (layer.opacity ?? 1) }}
                    onMouseDown={(e) => handleLayerMouseDown(e, layer.id, 'moveLayer')}
                  >
                    {selectedId === layer.id && !isCropMode && (
                      <>
                        <div className="absolute -inset-3 border-2 border-indigo-500 rounded-lg pointer-events-none z-50 opacity-70 border-dashed"></div>
                        {interactionMode === 'rotateLayer' && (<div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-xl z-[100] pointer-events-none font-mono tracking-wider animate-in fade-in zoom-in-95 duration-150">{Math.round(((layer.rotation % 360) + 360) % 360)}°</div>)}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-indigo-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center z-50 hover:scale-110 transition-transform" onMouseDown={(e) => handleLayerMouseDown(e, layer.id, 'rotateLayer')}><RotateCw className="w-3 h-3 text-white" /></div>
                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-50 hover:scale-125 transition-transform shadow-sm" onMouseDown={(e) => handleLayerMouseDown(e, layer.id, 'resizeLayer')}></div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nesw-resize z-50 hover:scale-125 transition-transform shadow-sm" onMouseDown={(e) => handleLayerMouseDown(e, layer.id, 'resizeLayer')}></div>
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nesw-resize z-50 hover:scale-125 transition-transform shadow-sm" onMouseDown={(e) => handleLayerMouseDown(e, layer.id, 'resizeLayer')}></div>
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-50 hover:scale-125 transition-transform shadow-sm" onMouseDown={(e) => handleLayerMouseDown(e, layer.id, 'resizeLayer')}></div>
                      </>
                    )}
                    {selectedId === layer.id && isCropMode && <div className="absolute -inset-1 border-2 border-green-500 z-50 pointer-events-none shadow-[0_0_15px_rgba(34,197,94,0.5)]"><div className="absolute top-0 left-0 bg-green-500 text-white text-[9px] px-1">CROP AREA</div></div>}
                    <div className="relative" style={{ borderRadius: layer.mask === 'circle' ? '50%' : '0%', clipPath: layer.mask === 'square' ? 'inset(0% 0% 0% 0% round 10px)' : (layer.cropShape && CROP_SHAPES[layer.cropShape] ? CROP_SHAPES[layer.cropShape].css : 'none'), overflow: (layer.mask !== 'none' || (layer.cropShape && layer.cropShape !== 'none')) ? 'hidden' : 'visible', width: layer.type === 'image' ? '200px' : '250px', height: layer.type === 'image' ? (layer.cropShape && layer.cropShape !== 'none' ? '200px' : (layer.height ? `${layer.height}px` : '200px')) : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${layer.flipX ?? 1}, ${layer.flipY ?? 1})` }}>
                      {layer.type === 'text' ? (
                        <div style={{ fontFamily: layer.fontFamily || 'Inter, sans-serif', fontSize: '40px', fontWeight: 'bold', lineHeight: 1.2, textShadow: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'center', backgroundImage: layer.colorMode === 'gradient' ? `linear-gradient(${layer.gradientAngle}deg, ${layer.gradientStart}, ${layer.gradientEnd})` : 'none', WebkitBackgroundClip: layer.colorMode === 'gradient' ? 'text' : 'initial', WebkitTextFillColor: layer.colorMode === 'gradient' ? 'transparent' : 'initial', color: layer.colorMode === 'gradient' ? 'transparent' : (layer.color || '#000'), filter: layer.filter || 'none', width: '100%' }}>{layer.content}</div>
                      ) : (
                        <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: layer.mask === 'circle' ? '50%' : '0%', filter: layer.filter && layer.filter !== 'none' ? layer.filter : (layer.isCMYK ? 'grayscale(0.1) contrast(0.9) brightness(0.9) sepia(0.1) saturate(0.8)' : 'none') }}>
                            <img src={layer.content} alt="layer" className="max-w-none pointer-events-none opacity-100 shadow-sm block" style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${layer.cropX || 0}px, ${layer.cropY || 0}px) scale(${layer.cropScale || 1})`, width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute bottom-10 right-6 flex flex-col bg-white/90 backdrop-blur rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50">
              <button onClick={() => setIsHandMode(!isHandMode)} className={`p-3 border-b border-slate-200 transition-colors ${effectiveHandMode ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`} title="手型工具 (按住空白鍵)"><HandIcon className="w-5 h-5"/></button>
              <button onClick={() => setZoomLevel(z => Math.min(z + 10, 200))} className="p-3 hover:bg-slate-100 text-slate-600 border-b border-slate-200"><ZoomIn className="w-5 h-5"/></button>
              <button onClick={() => setZoomLevel(z => Math.max(z - 10, 50))} className="p-3 hover:bg-slate-100 text-slate-600 border-b border-slate-200"><ZoomOut className="w-5 h-5"/></button>
              <button onClick={() => {setZoomLevel(100); setPan({x:0, y:0});}} className="p-3 hover:bg-slate-100 text-slate-600"><Maximize className="w-5 h-5"/></button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full md:w-[420px] flex flex-col gap-4 overflow-hidden h-full">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 overscroll-contain">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg shrink-0">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center justify-between"><span className="flex items-center"><Zap className="w-4 h-4 mr-2" /> AI 智能生成 (Gemini)</span><button onClick={handleGeminiEnhancePrompt} disabled={!nanoPrompt || isEnhancingPrompt} className="text-indigo-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50" title="Gemini Magic"><Sparkles className="w-4 h-4" /></button></h3>
              <div className="flex space-x-1 mb-3 bg-slate-100 p-1 rounded-lg"><button onClick={() => setAiGenMode('object')} className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center ${aiGenMode === 'object' ? 'bg-white text-indigo-600 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}><Sticker className="w-3 h-3 mr-1.5" /> 智能去背物件</button><button onClick={() => setAiGenMode('background')} className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center ${aiGenMode === 'background' ? 'bg-white text-indigo-600 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}><Wallpaper className="w-3 h-3 mr-1.5" /> 全版背景</button></div>
              
              {/* 新增：參考圖上傳區域 (以圖生圖) */}
              <div className="flex items-center gap-2 mb-2">
                 <label className={`flex-1 flex items-center justify-center border border-dashed rounded-lg p-2 cursor-pointer transition-colors ${refImage ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files[0]; if(file) { const reader = new FileReader(); reader.onload = (e) => setRefImage(e.target.result); reader.readAsDataURL(file); } }} />
                    {refImage ? (
                        <div className="flex items-center text-xs text-indigo-700 font-medium">
                            <img src={refImage} className="w-6 h-6 rounded object-cover mr-2 border border-indigo-200" alt="Ref" />
                            <span>已載入參考圖 (以圖生圖)</span>
                        </div>
                    ) : (
                        <div className="flex items-center text-xs text-slate-500">
                            <Upload className="w-3 h-3 mr-1.5" />
                            <span>上傳參考圖 (選填，以圖生圖)</span>
                        </div>
                    )}
                 </label>
                 {refImage && (
                    <button onClick={() => setRefImage(null)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="移除參考圖">
                        <X className="w-4 h-4" />
                    </button>
                 )}
              </div>

              <div className="flex space-x-2 mb-2"><div className="relative flex-1"><input value={nanoPrompt} onChange={(e) => setNanoPrompt(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-slate-800 text-sm focus:border-indigo-500 outline-none shadow-sm" placeholder={refImage ? "描述要如何修改這張圖 (留空則生成變體)..." : "描述內容..."} />{nanoPrompt && (<button onClick={() => setNanoPrompt('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors" title="清除文字"><X className="w-3 h-3" /></button>)}</div><button onClick={handleNanoGenerate} disabled={isGeneratingUV || (!nanoPrompt && !refImage)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap shadow-md min-w-[60px] flex items-center justify-center">{isGeneratingUV ? <Loader2 className="w-4 h-4 animate-spin" /> : "生成"}</button></div>
              
              {/* 【修改 3】顯示設計器專用額度 */}
              {!localStorage.getItem('USER_GEMINI_KEY') && (
                  <p className="text-[10px] text-slate-400 text-center mb-2">
                      設計生成額度：
                      <span className="font-bold text-indigo-500">
                          {10 - (parseInt(localStorage.getItem('FREE_QUOTA_DESIGNER') || '0'))}
                      </span> / 10 張
                  </p>
              )}
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-lg flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 shrink-0 flex justify-between items-center"><h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center"><Layers className="w-4 h-4 mr-2" /> 圖層 ({layers.length})</h3><div className="flex space-x-1"><button onClick={() => addTextLayer()} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"><Type className="w-4 h-4" /></button><label className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer transition-colors"><ImageIcon className="w-4 h-4" /><input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) addImageLayer(e.target.files[0]); }} /></label></div></div>
                <div className="max-h-[150px] overflow-y-auto p-2 space-y-2 border-b border-slate-100 overscroll-contain">{[...layers].reverse().map((layer) => (<div key={layer.id} onClick={() => setSelectedId(layer.id)} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all group ${selectedId === layer.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50'}`}><div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-500 mr-3 border border-slate-200 overflow-hidden shrink-0">{layer.type === 'text' ? <span className="font-serif font-bold text-lg">T</span> : <img src={layer.content} className="w-full h-full object-cover"/>}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-700 truncate">{layer.type === 'text' ? layer.content : 'Image Layer'}</p><p className="text-[10px] text-slate-400">{layer.type === 'text' ? 'Text Object' : 'Raster Image'}</p></div><div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity space-x-1"><button onClick={(e) => {e.stopPropagation(); moveLayerOrder(layer.id, 'up')}} className="p-1 hover:bg-slate-200 rounded text-slate-500"><ArrowUp className="w-3 h-3"/></button><button onClick={(e) => {e.stopPropagation(); moveLayerOrder(layer.id, 'down')}} className="p-1 hover:bg-slate-200 rounded text-slate-500"><ArrowDown className="w-3 h-3"/></button><button onClick={(e) => {e.stopPropagation(); deleteLayer(layer.id)}} className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-slate-400"><Trash2 className="w-3 h-3"/></button></div></div>))}</div>
            </div>
            {selectedLayer && (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-lg p-4">
                    <div className="grid grid-cols-5 gap-2 pb-4 border-b border-slate-200 mb-4">
                         <button onClick={() => duplicateLayer(selectedLayer.id)} className="col-span-1 p-2 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center shadow-sm"><CopyPlus className="w-4 h-4 mb-1" /><span className="text-[9px]">複製</span></button>
                         <button onClick={() => alignLayer(selectedLayer.id, 'horizontal')} className="col-span-1 p-2 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center shadow-sm"><AlignCenterHorizontal className="w-4 h-4 mb-1" /><span className="text-[9px]">水平</span></button>
                         <button onClick={() => alignLayer(selectedLayer.id, 'vertical')} className="col-span-1 p-2 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center shadow-sm"><AlignCenterVertical className="w-4 h-4 mb-1" /><span className="text-[9px]">垂直</span></button>
                         <button onClick={() => updateLayer(selectedLayer.id, { flipX: (selectedLayer.flipX || 1) * -1 })} className="col-span-1 p-2 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center shadow-sm"><FlipHorizontal className="w-4 h-4 mb-1" /><span className="text-[9px]">翻轉X</span></button>
                         <button onClick={() => updateLayer(selectedLayer.id, { flipY: (selectedLayer.flipY || 1) * -1 })} className="col-span-1 p-2 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center shadow-sm"><FlipVertical className="w-4 h-4 mb-1" /><span className="text-[9px]">翻轉Y</span></button>
                    </div>
                    {selectedLayer.type === 'text' && (
                        <div className="mb-4 space-y-3">
                            <div className="flex items-center gap-2">
                                {/* 【修改】使用 DebouncedInput 提升效能 */}
                                <DebouncedInput 
                                    value={selectedLayer.content} 
                                    onChange={(val) => updateLayer(selectedLayer.id, { content: val })} 
                                    className="flex-1 bg-white border border-slate-200 rounded p-2 text-sm text-slate-800 focus:border-indigo-500 outline-none shadow-sm"
                                />
                                <button onClick={generateAIQuote} disabled={isGeneratingQuote} className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-colors shadow-sm" title="AI 靈感寫手：自動生成軍事格言">{isGeneratingQuote ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lightbulb className="w-4 h-4"/>}</button>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => setFontCategory('en')} className={`flex-1 text-xs py-1 rounded ${fontCategory === 'en' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>英文字體</button>
                                <button onClick={() => setFontCategory('zh')} className={`flex-1 text-xs py-1 rounded ${fontCategory === 'zh' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>中文字體</button>
                                <button onClick={() => setFontCategory('signature')} className={`flex-1 text-xs py-1 rounded ${fontCategory === 'signature' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>手寫簽名</button>
                            </div>
                            <select value={selectedLayer.fontFamily} onChange={(e) => updateLayer(selectedLayer.id, { fontFamily: e.target.value })} className="w-full bg-white border border-slate-200 rounded p-2 text-sm text-slate-800 focus:border-indigo-500 outline-none shadow-sm">{FONTS[fontCategory].map((font, idx) => (<option key={idx} value={font.value}>{font.name}</option>))}</select>
                            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-600 flex items-center"><PaintBucket className="w-3 h-3 mr-1"/> 文字色彩</span><div className="flex space-x-1 bg-slate-100 p-0.5 rounded"><button onClick={() => updateLayer(selectedLayer.id, { colorMode: 'solid' })} className={`text-[10px] px-2 py-0.5 rounded ${selectedLayer.colorMode === 'solid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>單色</button><button onClick={() => updateLayer(selectedLayer.id, { colorMode: 'gradient' })} className={`text-[10px] px-2 py-0.5 rounded ${selectedLayer.colorMode === 'gradient' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>漸變</button></div></div>
                                {selectedLayer.colorMode === 'gradient' ? (<div className="space-y-2"><div className="flex justify-between items-center"><label className="text-[10px] text-slate-500">起始</label><input type="color" value={selectedLayer.gradientStart} onChange={(e) => updateLayer(selectedLayer.id, { gradientStart: e.target.value })} className="w-6 h-6 rounded cursor-pointer" /><label className="text-[10px] text-slate-500 ml-2">結束</label><input type="color" value={selectedLayer.gradientEnd} onChange={(e) => updateLayer(selectedLayer.id, { gradientEnd: e.target.value })} className="w-6 h-6 rounded cursor-pointer" /></div><div className="flex items-center space-x-2"><label className="text-[10px] text-slate-500 whitespace-nowrap">角度 {selectedLayer.gradientAngle}°</label><input type="range" min="0" max="360" value={selectedLayer.gradientAngle} onChange={(e) => updateLayer(selectedLayer.id, { gradientAngle: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600" /></div></div>) : (<div className="flex justify-between items-center"><label className="text-[10px] text-slate-500">選擇顏色</label><div className="flex items-center space-x-2"><input type="text" value={selectedLayer.color} onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })} className="w-16 text-xs border border-slate-200 rounded px-1 py-0.5 text-center" /><input type="color" value={selectedLayer.color} onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })} className="w-6 h-6 rounded cursor-pointer" /></div></div>)}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div><label className="text-[10px] text-slate-500 mb-1 block">大小</label><input type="range" min="0.1" max="5" step="0.1" value={selectedLayer.scale} onChange={(e) => updateLayer(selectedLayer.id, { scale: parseFloat(e.target.value) })} className="w-full h-1 bg-slate-200 rounded accent-indigo-600" /></div>
                        <div><label className="text-[10px] text-slate-500 mb-1 block">旋轉</label><input type="range" min="0" max="360" value={Math.round(selectedLayer.rotation) % 360} onChange={(e) => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded accent-indigo-600" /></div>
                        <div><label className="text-[10px] text-slate-500 mb-1 block">透明度</label><input type="range" min="0.1" max="1" step="0.1" value={selectedLayer.opacity ?? 1} onChange={(e) => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })} className="w-full h-1 bg-slate-200 rounded accent-indigo-600" /></div>
                    </div>
                    {selectedLayer.type === 'image' && (
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold text-slate-500 flex items-center"><Scissors className="w-3 h-3 mr-1" /> 裁切</h4>{selectedLayer.cropShape && selectedLayer.cropShape !== 'none' && (<button onClick={() => setIsCropMode(!isCropMode)} className={`text-[10px] px-2 py-1 rounded flex items-center ${isCropMode ? 'bg-green-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{isCropMode ? <Check className="w-3 h-3 mr-1" /> : <Move className="w-3 h-3 mr-1" />}{isCropMode ? '完成' : '調整'}</button>)}</div>
                        {isCropMode ? (<div className="mb-3 bg-green-50 p-2 rounded border border-green-200"><label className="text-[10px] text-green-700 mb-1 block font-bold">圖片縮放</label><input type="range" min="0.5" max="3" step="0.1" value={selectedLayer.cropScale || 1} onChange={(e) => updateLayer(selectedLayer.id, { cropScale: parseFloat(e.target.value) })} className="w-full h-1 bg-green-200 rounded accent-green-600" /></div>) : (<div className="grid grid-cols-3 gap-2 mb-3">{Object.entries(CROP_SHAPES).map(([key, shape]) => { const Icon = shape.icon; if (!Icon) return null; return (<button key={key} onClick={() => updateLayer(selectedLayer.id, { cropShape: key })} className={`flex flex-col items-center justify-center p-2 rounded border text-xs transition-colors ${selectedLayer.cropShape === key || (!selectedLayer.cropShape && key === 'none') ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Icon className="w-4 h-4 mb-1" /><span>{shape.name}</span></button>); })}</div>)}
                        <button onClick={handleManualRemoveBackground} disabled={isProcessingBg} className="w-full py-2 bg-white hover:bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-200 flex items-center justify-center transition-colors shadow-sm mb-3">{isProcessingBg ? <RotateCcw className="w-3 h-3 animate-spin mr-1"/> : <Eraser className="w-3 h-3 mr-1"/>} 一鍵濾除白底</button>
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-200"><h4 className="text-xs font-bold text-orange-800 flex items-center mb-2"><Flame className="w-3 h-3 mr-1" /> MOPA 彩色雷雕模擬</h4><p className="text-[10px] text-orange-600 mb-2 leading-tight">將圖片轉換為不鏽鋼氧化色質感。非雷雕色域(如綠色)將保留原色並以<span className="font-bold text-red-500">紅色虛線</span>標示。</p><div className="flex gap-2"><button onClick={handleMopaSimulation} disabled={isProcessingBg || selectedLayer.isMopaSimulated} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${selectedLayer.isMopaSimulated ? 'bg-orange-200 text-orange-400 border-orange-200 cursor-default' : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-100 shadow-sm'}`}>{selectedLayer.isMopaSimulated ? '已模擬' : '✨ 應用模擬'}</button><button onClick={handleRevertMopa} disabled={!selectedLayer.isMopaSimulated} className={`py-1.5 px-3 rounded-lg text-xs transition-colors border ${!selectedLayer.isMopaSimulated ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`} title="還原回原圖"><RotateCcw className="w-3 h-3" /></button></div></div>
                      </div>
                    )}
                </div>
            )}
        </div>
        <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-lg mt-auto shrink-0 sticky bottom-0">
            <div className="flex justify-between items-center">
                {currentSide === 'front' ? (
                    <><div className="text-sm text-slate-500">步驟：正面設計</div><button onClick={() => setCurrentSide('back')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center transition-all shadow-lg hover:shadow-indigo-500/30">下一步 - 背面 <ChevronRight className="ml-2 w-4 h-4" /></button></>
                ) : (
                    <><button onClick={() => setCurrentSide('front')} className="px-4 py-3 text-slate-500 hover:text-slate-800 flex items-center transition-colors font-medium"><ChevronLeft className="mr-2 w-4 h-4" /> 回到正面</button><button onClick={saveToDrive} disabled={isSaving} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50">{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <HardDrive className="ml-2 w-4 h-4" />}{isSaving ? '儲存中...' : '完成並儲存'}</button></>
                )}
            </div>
        </div>
      </div>
      {/* 【修改 4】加入 API Key 輸入彈窗 */}
      <ApiKeyModal 
          isOpen={showApiKeyModal} 
          onClose={() => setShowApiKeyModal(false)} 
          onSave={handleSaveKey} 
      />
    </div>
  );
};

// --- 新增：商品攝影場景設定 ---
const SCENE_OPTIONS = [
    { 
        id: 'marble', 
        name: '白色卡拉拉大理石 (Carrara Marble)', 
        desc: '極簡、高雅的白色石材，帶有灰色紋理。', 
        promptPart: 'The tag is resting on a luxurious White Carrara Marble surface. No other fabrics. High-key lighting, clean, expensive and elegant atmosphere. White stone texture with grey veins.' 
    },
    { 
        id: 'velvet', 
        name: '皇家藍絨布 (Royal Blue Velvet)', 
        desc: '深邃、柔軟的藍色絨布，珠寶店展示風格。', 
        promptPart: 'The tag is resting on soft, rich Royal Blue Velvet fabric. No marble. The velvet texture is visible with soft folds. High contrast, premium jewelry store atmosphere.' 
    },
    { 
        id: 'black_leather', 
        name: '高級黑皮革 (Premium Black Leather)', 
        desc: '具有紋理的黑色皮革，展現陽剛與奢華感。', 
        promptPart: 'The tag is lying on premium, textured Black Leather surface. Dramatic lighting, masculine, sophisticated and cool atmosphere. Leather grain texture.' 
    },
    { 
        id: 'wood', 
        name: '深色桃花心木 (Dark Mahogany)', 
        desc: '溫暖、經典的拋光木紋，穩重質感。', 
        promptPart: 'The tag is placed on a polished Dark Mahogany wooden table. Warm tones, classic luxury, executive desk atmosphere. Rich wood grain.' 
    },
    { 
        id: 'slate', 
        name: '黑曜石板 (Black Slate)', 
        desc: '粗獷而現代的深色石材，工業奢華風。', 
        promptPart: 'The tag is on a dark, textured Black Slate stone surface. Modern, sleek, slightly rough but high-end texture. Cool tones.' 
    },
    { 
        id: 'silk', 
        name: '香檳金絲綢 (Champagne Silk)', 
        desc: '流動、柔順的金色絲綢，優雅細緻。', 
        promptPart: 'The tag is resting on flowing Champagne Gold Silk fabric. Soft folds, liquid-like texture. Elegant, delicate and bright atmosphere.' 
    },
];

// --- 更新：功能更強大的商品預覽元件 ---
const ProductPreview = ({ designerState }) => {
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedScene, setSelectedScene] = useState('marble'); // 預設選擇大理石

const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    const handleSaveKey = (userKey) => {
        localStorage.setItem('USER_GEMINI_KEY', userKey.trim());
        alert("✅ API Key 已儲存！請再次點擊生成按鈕。");
        };

    const handleGenerate = async () => {
        // 【修改 3】商品預覽專用的額度 Key
        const quotaKey = 'FREE_QUOTA_PRODUCT';
        const currentCount = parseInt(localStorage.getItem(quotaKey) || '0');
        const hasUserKey = !!localStorage.getItem('USER_GEMINI_KEY');

        if (!hasUserKey && currentCount >= 5) {
            setShowApiKeyModal(true);
            return;
        }
        
        if (!hasUserKey) {
            localStorage.setItem(quotaKey, currentCount + 1);
        }

        setIsGenerating(true);
// ... (下略)
        try {
            // 1. 取得當前設計圖 (Render to Canvas)
            const canvas = await renderDesignToCanvas(designerState.sides[designerState.currentSide], 2, { isMockup: true });
            if (!canvas) throw new Error("設計圖渲染失敗");
            const designBase64 = canvas.toDataURL('image/png');

            // 取得目前選擇的場景設定
            const sceneConfig = SCENE_OPTIONS.find(s => s.id === selectedScene) || SCENE_OPTIONS[0];

            // 2. 建構商品攝影 Prompt (Prompt Engineering)
            const prompt = `
                Professional High-End Jewelry Photography, Macro Shot.
                
                Subject: A custom engraved BRUSHED STAINLESS STEEL dog tag necklace.
                
                CRITICAL GEOMETRY (MANDATORY):
                - The silver ball chain MUST pass DIRECTLY THROUGH the small hole at the top of the metal tag.
                - The connection is physical and realistic. Show the chain looping through the hole clearly.
                - This rule applies to ALL backgrounds (Marble, Leather, Wood, Silk, etc.).
                
                Background & Atmosphere:
                - ${sceneConfig.promptPart}
                - The atmosphere is expensive, high-end, and sophisticated.
                
                Lighting & Texture:
                - Soft diffused studio lighting (Softbox) to create elegant highlights.
                - The metal tag has a VERTICAL BRUSHED FINISH (hairline texture).
                - The engraving matches the input image exactly and looks deeply etched into the metal.
                
                Composition:
                - 45-degree angle or top-down view.
                - Shallow depth of field (f/2.8), sharp focus on the engraving, creamy bokeh on the background.
                
                Quality: 8k, photorealistic, commercial catalog standard, ray-traced reflections.
            `;

            // 3. 呼叫 Gemini (Img2Img)
            const result = await callGeminiImg2Img(prompt, designBase64);
            
            if (result) {
                setGeneratedImage(result);
            }
        } catch (e) {
            console.error(e);
            alert("生成失敗: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const currentSceneName = SCENE_OPTIONS.find(s => s.id === selectedScene)?.name;

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl relative border border-slate-700">
            {/* 左側：預覽區域 */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                {generatedImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img src={generatedImage} alt="Product Shot" className="max-w-full max-h-full object-contain shadow-2xl" />
                        <div className="absolute bottom-6 right-6 flex gap-2">
                             <button 
                                onClick={() => { const link = document.createElement('a'); link.download = `Product_Shot_${selectedScene}_${Date.now()}.png`; link.href = generatedImage; link.click(); }}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold border border-white/10 transition-colors flex items-center"
                             >
                                <HardDrive className="w-4 h-4 mr-2" /> 下載高畫質原圖
                             </button>
                             <button 
                                onClick={() => setGeneratedImage(null)}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold border border-white/10 transition-colors"
                             >
                                重新生成
                             </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-500 text-center p-8 select-none flex flex-col items-center">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-inner">
                            <Camera className="w-10 h-10 text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-300 mb-2">商品情境照生成</h2>
                        <p className="text-slate-500 max-w-md">使用 AI 將您的平面設計圖轉化為電影級質感的微距商品攝影。</p>
                        
                        {/* 提示卡片 */}
                        <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg w-full">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-left">
                                <div className="text-indigo-400 font-bold text-xs mb-1 uppercase tracking-wider">Style</div>
                                <div className="text-slate-300 text-sm">{currentSceneName || '請選擇場景'}</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-left">
                                <div className="text-indigo-400 font-bold text-xs mb-1 uppercase tracking-wider">Perspective</div>
                                <div className="text-slate-300 text-sm">珠寶級微距攝影 (High-End Jewelry)</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {isGenerating && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-indigo-400">
                        <Loader2 className="w-16 h-16 animate-spin mb-6" />
                        <p className="font-bold text-xl text-white animate-pulse">正在渲染商品攝影棚...</p>
                        <p className="text-sm text-slate-400 mt-2">AI 正在計算光影、材質與場景：{currentSceneName}</p>
                    </div>
                )}
            </div>

            {/* 右側：控制面板 */}
            <div className="w-full md:w-80 bg-slate-800 border-l border-slate-700 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
                <div>
                    <h3 className="text-white font-bold flex items-center text-lg mb-4">
                        <Camera className="w-5 h-5 mr-2 text-indigo-400" /> 
                        攝影棚設定
                    </h3>
                    
                    <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 mb-6">
                        <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">1. 選擇背景材質</h4>
                        <div className="space-y-2">
                            {SCENE_OPTIONS.map((scene) => (
                                <button 
                                    key={scene.id}
                                    onClick={() => setSelectedScene(scene.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col ${selectedScene === scene.id ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/50' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'}`}
                                >
                                    <div className={`font-bold text-sm ${selectedScene === scene.id ? 'text-white' : 'text-slate-200'}`}>{scene.name}</div>
                                    <div className={`text-[10px] mt-1 ${selectedScene === scene.id ? 'text-indigo-200' : 'text-slate-400'}`}>{scene.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 flex items-center justify-center transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform text-yellow-300" />
                            )}
                            {isGenerating ? '渲染中...' : '生成商品照 (Render)'}
                        </button>
                        {/* 【修改 4】新增：顯示商品預覽專用額度 */}
                        {!localStorage.getItem('USER_GEMINI_KEY') && (
                            <p className="text-[10px] text-slate-400 text-center -mt-2 mb-2">
                                商品預覽額度：
                                <span className="font-bold text-indigo-400">
                                    {5 - (parseInt(localStorage.getItem('FREE_QUOTA_PRODUCT') || '0'))}
                                </span> / 5 張
                            </p>
                        )}
                        <div className="bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/30">
                            <h5 className="text-xs font-bold text-indigo-300 mb-1 flex items-center">
                                <Zap className="w-3 h-3 mr-1" /> PRO Tips
                            </h5>
                            <p className="text-[10px] text-indigo-200/70 leading-relaxed">
                                AI 已配置為<strong>{currentSceneName}</strong>專用光影模式。提示詞已針對該材質進行優化，以呈現最真實的反射與質感。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* 【修改 3】加入 API Key 輸入彈窗 (放在最外層 div 結束前) */}
            <ApiKeyModal 
                isOpen={showApiKeyModal} 
                onClose={() => setShowApiKeyModal(false)} 
                onSave={handleSaveKey} 
            />
        </div>
    );
};
// --- 新增：服務指南與 Q&A 頁面 (AI 智能客服版) ---
const InfoPage = ({ onNavigate }) => {
    const [openIndex, setOpenIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    const faqData = [
        {
            category: "設計流程 (Design Workflow)",
            icon: Wrench,
            items: [
                { q: "1. 專屬設計 (Designer)", a: "進入「軍牌設計器」，利用左側工具列添加文字或上傳 Logo。您可以自由調整排版、字體與圖層順序。如果缺乏靈感，點擊星星圖示使用 AI 自動生成素材。" },
                { q: "2. 3D 預覽 (Preview)", a: "切換至「3D 預覽」頁面，檢查雷射雕刻在不同光線下的凹凸質感。" },
                { q: "3. 穿戴模擬 (Wearable)", a: "想知道戴起來帥不帥？前往「穿戴模擬」，選擇模特兒或上傳自拍，AI 會將您的設計合成到模特兒胸口，並生成電影級情境照。" },
                { q: "4. 下載與訂購 (Order)", a: "滿意後，請在設計器下載 PNG/SVG 原始檔，傳送給我們的客服進行實體製作。" }
            ]
        },
        {
            category: "收費與材質 (Pricing & Material)",
            icon: Zap,
            items: [
                { q: "軍牌的材質是什麼？", a: "我們統一採用 316L 醫療級不鏽鋼 (Surgical Stainless Steel)，具備抗過敏、不生鏽、耐腐蝕的特性。表面經過精細拉絲處理，質感極佳。" },
                { q: "雷射雕刻會掉色嗎？", a: "不會。我們使用 MOPA 彩色雷射技術，是透過高溫改變金屬表面的氧化層結構來顯色，並非印刷顏料，因此永不褪色。" },
                { q: "有其他的上色效果嗎？", a: "當然有。我們擁有先進的UV噴印技術，無論是平面上色還是立體彩噴都能為你帶來視覺及觸覺上的多種變化。" },
                { q: "客製化收費標準如何？", a: "基本款（單面彩色雷雕、平面UV彩色噴印, 雷雕深度0-0.5mm）：$190 HKD\n進階款（雙面彩色雷雕、平面UV彩色噴印, 雷雕深度0-0.5mm）：$350 HKD\n任何深雕、立體彩噴(每面起計, 雷雕深度>0.5mm 及立體彩噴)：$250 HKD\n*所有價格已含 60cm 珠鍊與精美禮盒包裝" }
            ]
        },
        {
            category: "常見問題 (FAQ)",
            icon: HelpCircle,
            items: [
                { q: "製作需要多少時間？", a: "確認設計圖後，製作時間約為 4-5 個工作天。物流配送約需 2-3 天。" },
                { q: "軍牌的側面可以刻字嗎？", a: "當然可以，我們軍牌厚度約3mm可以讓你刻上簽名或其他文字。" },
                { q: "可以上傳自己的 Logo 嗎？", a: "可以。在設計器中點擊「上傳圖片」圖示即可。建議使用去背的 PNG 檔案以獲得最佳雷雕效果。" }
                
            ]
        }
    ];

    const toggle = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    // AI 智能過濾邏輯
    const filteredData = faqData.map(section => ({
        ...section,
        items: section.items.filter(item => 
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(section => section.items.length > 0);

    return (
        <div className="flex-1 h-full bg-transparent overflow-y-auto p-4 md:p-12 relative scroll-smooth group/page">
            {/* 背景裝飾：動態流光 */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{animationDelay: '1s'}}></div>
            
            <div className="max-w-4xl mx-auto relative z-10 pb-24">
                {/* 標題區塊 */}
                <div className="text-center mb-12 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex p-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mb-6 shadow-lg shadow-indigo-500/30">
                        <div className="bg-white rounded-full p-4">
                            <Sparkles className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-indigo-800 to-slate-800 mb-4 tracking-tight drop-shadow-sm">
                        服務指南
                    </h2>
                    <div className="h-6 flex items-center justify-center">
                        <p className="text-slate-500 text-lg font-medium font-mono flex items-center">
                            <span className="mr-2">System:</span>
                            <span className="typing-effect border-r-2 border-indigo-500 pr-1 animate-pulse">
                                解答您關於設計、材質與訂購的所有疑問...
                            </span>
                        </p>
                    </div>
                </div>

                {/* AI 搜尋欄 (模擬 ChatGPT 輸入框) */}
                <div className="mb-12 sticky top-0 z-50">
                    <div className="relative group max-w-2xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl flex items-center p-2 border border-white/50">
                            <div className="p-3 text-indigo-500">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="請問 AI：雷雕會掉色嗎？如何上傳 Logo？..." 
                                className="w-full bg-transparent text-slate-700 placeholder-slate-400 text-base p-2 outline-none font-medium"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* FAQ 列表 */}
                <div className="grid grid-cols-1 gap-8">
                    {filteredData.length > 0 ? filteredData.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-4 animate-in slide-in-from-bottom-8 duration-700" style={{animationDelay: `${sIdx * 100}ms`}}>
                            <div className="flex items-center space-x-3 mb-2 px-2">
                                <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
                                    <section.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700">{section.category}</h3>
                            </div>
                            
                            <div className="grid gap-4">
                                {section.items.map((item, iIdx) => {
                                    const uniqueId = `${sIdx}-${iIdx}`;
                                    const isOpen = openIndex === uniqueId;
                                    return (
                                        <div 
                                            key={uniqueId} 
                                            className={`group bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 ${isOpen ? 'ring-2 ring-indigo-500/20 bg-white/90 shadow-xl' : ''}`}
                                        >
                                            <button 
                                                onClick={() => toggle(uniqueId)}
                                                className="w-full text-left px-6 py-5 flex justify-between items-start gap-4"
                                            >
                                                <span className={`font-bold text-base transition-colors duration-300 ${isOpen ? 'text-indigo-700' : 'text-slate-700 group-hover:text-indigo-600'}`}>
                                                    {item.q}
                                                </span>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180 bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                                    <ChevronDown className="w-5 h-5" />
                                                </div>
                                            </button>
                                            <div 
                                                className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <div className="px-6 pb-6 pt-0">
                                                    <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl border border-indigo-100/50 text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                                        {item.a}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 opacity-50">
                            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">沒有找到與「{searchQuery}」相關的內容</p>
                        </div>
                    )}
                </div>

                {/* 底部行動呼籲 - 懸浮卡片 */}
                <div className="mt-20 relative group cursor-pointer" onClick={() => onNavigate('designer')}>
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-3xl blur opacity-30 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
                    <div className="relative p-10 bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left hover:bg-white transition-colors">
                        <div>
                            <h3 className="text-3xl font-black text-slate-800 mb-2">準備好展現個性了嗎？</h3>
                            <p className="text-slate-500 text-lg">啟動設計器，完成您完成獨一無二的軍牌。</p>
                        </div>
                        <button className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-600 hover:scale-105 transition-all shadow-xl flex items-center shrink-0">
                            <Wrench className="w-5 h-5 mr-2" />
                            立即開始設計
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- 新增：首頁 (品牌形象影片 + 社群連結) ---
const HomePage = ({ onNavigate }) => {
    // 【修改】固定影片網址 (請將此處替換為您的宣傳影片連結，例如 .mp4 檔案網址)
    // 【修改】將結尾的 dl=0 改為 dl=1，這是 Dropbox 的直連參數
    const videoSrc = "https://www.dropbox.com/scl/fi/m1ch33e08cttntoojebln/fa5bfa05-086f-4d07-a64c-1b28c5caf2f4.mp4?rlkey=gmstsny48t5h9snbio5eaoqgx&st=doibkfdv&dl=1";
    return (
        <div className="flex-1 h-full relative overflow-hidden flex flex-col items-center justify-center bg-black text-white group/home">
            {/* 1. 背景影片層 */}
            <div className="absolute inset-0 z-0">
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    // 【修改 1】將 opacity-50 改為 opacity-80 (讓影片更亮、更清楚)
                    className="w-full h-full object-cover opacity-50"
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>
                
                {/* 漸層遮罩，讓文字更清晰 */}
                {/* 【修改 2】大幅降低黑色濃度：
                    from-black/80 -> from-black/40 (頂部變淺)
                    via-black/20 -> via-black/0 (中間全透明)
                    to-black/90 -> to-black/60 (底部變淺) 
                */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/0 to-black/60"></div>
                
                {/* 網點紋理 (增加戰術感) */}
                {/* 【修改 3】將 opacity-20 改為 opacity-10 (讓網點更隱約，不擋視線) */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
            </div>

            {/* 2. 主要內容層 */}
            <div className="relative z-10 flex flex-col items-center justify-between h-full w-full max-w-6xl py-12 px-6">
                
                {/* 頂部文字區 (取代原本的 DTR Logo) */}
                <div className="mt-16 text-center animate-in slide-in-from-top-10 duration-1000 flex flex-col items-center">
                    {/* 【修改】將標語移至最上方，並放大作為主視覺 */}
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl mb-4 leading-tight">
                        個人化設計 X MOPA 彩色雷雕
                    </h1>
                    <p className="text-lg md:text-2xl text-slate-300 font-light tracking-wide">
                        打造獨一無二的專屬識別，重新定義軍牌工藝。
                    </p>
                </div>

                {/* 中間行動呼籲區 (只保留按鈕) */}
                <div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-1000 delay-200">
                    <button 
                        onClick={() => onNavigate('designer')}
                        className="group relative px-10 py-5 bg-white text-black rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center font-black text-lg tracking-wider">
                            立即開始設計 <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                        </span>
                    </button>
                </div>

                {/* 底部社群連結區 (保持不變) */}
                <div className="w-full flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-1000 delay-500">
                    <div className="flex items-center gap-6">
                        {/* Instagram Link */}
                        <a href="https://www.instagram.com/dogtag_rebels/" target="_blank" rel="noreferrer" className="group flex flex-col items-center gap-2 text-slate-400 hover:text-pink-500 transition-colors">
                            <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl group-hover:border-pink-500/50 group-hover:bg-pink-500/10 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                            </div>
                            <span className="text-[10px] tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-2 group-hover:translate-y-0">INSTAGRAM</span>
                        </a>

                        {/* Threads Link */}
                        <a href="https://www.threads.com/@dogtag_rebels?xmt=AQF0Wg8rcGD4si5b_3mouJTS0FqPDbVVtUHidGRD8aF8SqU" target="_blank" rel="noreferrer" className="group flex flex-col items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl group-hover:border-white/50 group-hover:bg-white/10 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12a7 7 0 1 1-7-7c1.57 0 3 .5 4.09 1.36 1.1.86 1.91 2.14 1.91 3.64 0 1.29-.68 2.5-2 2.5s-2-1.21-2-2.5c0-2.38 2.55-3.5 5.5-3.5 2.5 0 3.5 1.5 3.5 3.5a9 9 0 0 1-9 9 9 9 0 1 1 9-9"/></svg>
                            </div>
                            <span className="text-[10px] tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-2 group-hover:translate-y-0">THREADS</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default function App() {
  const [activeTool, setActiveTool] = useState('designer');
  const [showNavMenu, setShowNavMenu] = useState(false);
  // 新增：控制桌面版側邊欄展開/收起的狀態
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isGisLoaded, setIsGisLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [designerState, setDesignerState] = useState({ sides: { front: [{ id: 'default-text', type: 'text', content: 'VICTORY', x: 0, y: 60, scale: 1, rotation: 0, colorMode: 'solid', color: '#1f2937', gradientStart: '#1e3a8a', gradientEnd: '#dc2626', gradientAngle: 90, fontFamily: '"Inter", sans-serif', cropShape: 'none', cropX: 0, cropY: 0, cropScale: 1, opacity: 1, flipX: 1, flipY: 1, filter: 'none' }], back: [] }, nanoPrompt: '', currentSide: 'front', driveFileId: null, driveShareLink: '', zoomLevel: 100, pan: { x: 0, y: 0 }, fontCategory: 'en', edgePattern: 'plain' });
  const updateDesignerState = (updates) => { setDesignerState(prev => ({ ...prev, ...updates })); };

  const NAV_TOOLS = [ 
      { id: 'home', name: '回到首頁', icon: Home, description: '返回系統儀表板' }, 
      { id: 'designer', name: '軍牌設計器', icon: Award, description: '全功能線上客製化設計' }, 
      { id: 'laser', name: '3D預覽', icon: Zap, description: '模擬不同材質的雷射雕刻效果與參數建議' }, 
      { id: 'wearable', name: '穿戴模擬', icon: User, description: 'AI 生成模特兒佩戴情境，預覽穿搭效果' },
      // 【新增】Q&A 頁面選單
      { id: 'info', name: '服務指南 Q&A', icon: HelpCircle, description: '設計流程、收費標準與常見問題' },
      // 新增選單項目
      { id: 'product_preview', name: '商品預覽', icon: Camera, description: '生成高品質商品情境照' } 
  ];

  // 載入 Google Fonts (包含新增的 Texturina, New Rocker, Metal Mania, MedievalSharp)
  useEffect(() => {
    const link = document.createElement('link');
    // 【修改】加入 Black+Ops+One 和 Stardos+Stencil
    link.href = 'https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Stardos+Stencil:wght@400;700&family=Alex+Brush&family=Allura&family=Aguafina+Script&family=Great+Vibes&family=Herr+Von+Muellerhoff&family=Meddon&family=Mrs+Saint+Delafield&family=Pinyon+Script&family=Pirata+One&family=Grenze+Gotisch&family=Texturina:wght@400;700&family=New+Rocker&family=Metal+Mania&family=MedievalSharp&family=Inter:wght@400;700&family=Roboto:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@700&family=Courier+Prime&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const initGoogle = async () => {
        try {
            await (window.gapi ? Promise.resolve() : new Promise((resolve) => { const script = document.createElement('script'); script.src = 'https://apis.google.com/js/api.js'; script.onload = resolve; document.body.appendChild(script); }));
            await (window.google ? Promise.resolve() : new Promise((resolve) => { const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.onload = resolve; document.body.appendChild(script); }));
            window.gapi.load('client', async () => { if (!GOOGLE_API_KEY) return; await window.gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: DISCOVERY_DOCS }); setIsGapiLoaded(true); });
            if (GOOGLE_CLIENT_ID) { 
                const client = window.google.accounts.oauth2.initTokenClient({ 
                    client_id: GOOGLE_CLIENT_ID, 
                    scope: SCOPES, 
                    callback: (tokenResponse) => { 
                        if (tokenResponse && tokenResponse.access_token) { 
                            setIsLoggedIn(true); 
                            
                            // 👇👇👇【請手動加入這段關鍵修正】👇👇👇
                            // 將登入取得的 Token 設定給 GAPI client，讓 Drive API 可以使用
                            if (window.gapi && window.gapi.client) {
                                window.gapi.client.setToken(tokenResponse);
                            }
                            // 👆👆👆【加入到這裡】👆👆👆; 
                            fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }).then(res => res.json()).then(data => setUser(data)).catch(e => console.error(e)); } }, }); setTokenClient(client); setIsGisLoaded(true); }
        } catch (error) { console.error("Google API Init Failed:", error); }
    };
    initGoogle();
  }, []);
  const handleLogin = () => { tokenClient ? tokenClient.requestAccessToken() : alert("Google API 未初始化"); };

  const renderContent = () => {
    switch (activeTool) {
      case 'designer': return (<ArmyTagDesigner user={user} isLoggedIn={isLoggedIn} handleLogin={handleLogin} isGapiLoaded={isGapiLoaded} persistentState={designerState} updatePersistentState={updateDesignerState} />);
      case 'laser': return <LaserSimulator designerState={designerState} updateDesignerState={updateDesignerState} />;
      case 'wearable': return <WearableSimulator designerState={designerState} />;
      case 'info': return <InfoPage onNavigate={setActiveTool} />;
      case 'product_preview': return <ProductPreview designerState={designerState} />;
      // 【修改】渲染全新的 HomePage，並傳入導航函式以便按鈕運作
      case 'home': return <HomePage onNavigate={setActiveTool} />;
      default: return <ToolPlaceholder title="未知頁面" icon={Wrench} description="找不到此工具。" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#fef9e3] text-slate-800 font-sans selection:bg-indigo-500 selection:text-white flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.12]" style={{ overflow: 'hidden' }}>
        <svg width="100%" height="100%">
          <defs>
            <linearGradient id="DTRGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#ef4444', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#7f1d1d', stopOpacity:1}} />
            </linearGradient>
            <pattern id="DTRPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
              <animate attributeName="x" from="0" to="200" dur="30s" repeatCount="indefinite" />
              <text x="100" y="100" fontFamily="sans-serif" fontWeight="900" fontSize="60" fill="url(#DTRGradient)" textAnchor="middle" dominantBaseline="central">DTR</text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#DTRPattern)" />
        </svg>
      </div>
      <nav className="bg-gradient-to-r from-red-900 via-red-400 to-red-50 backdrop-blur-md border-b border-red-100 sticky top-0 z-50 shadow-sm shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-900 tracking-tighter">DTR</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide hidden sm:block">專屬軍牌設計器</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isLoggedIn ? (
               <button onClick={handleLogin} disabled={!isGisLoaded} className="bg-white text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center">
                 <LogIn className="w-3 h-3 mr-2" /> 登入 Google
               </button>
            ) : (
               // 👇👇👇 加入 user && 保護，確保資料存在才渲染 👇👇👇
               user && (
                   <div className="flex items-center gap-3 bg-red-800/30 px-3 py-1.5 rounded-lg border border-red-400/30 backdrop-blur-sm">
                     <img src={user.picture} alt="User" className="w-6 h-6 rounded-full border border-white/50" />
                     <div className="text-xs text-white">
                       <div className="font-bold">{user.name}</div>
                       <div className="opacity-70 text-[10px]">已連結雲端硬碟</div>
                     </div>
                   </div>
               )
               // 👆👆👆 修改結束 👆👆👆
            )}
            {/* 漢堡選單按鈕 - 只在手機版顯示 (md:hidden) */}
            <button onClick={() => setShowNavMenu(!showNavMenu)} className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"><Menu className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {/* 遮罩層 (Backdrop) - 當手機版選單打開時顯示 */}
      {showNavMenu && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity md:hidden" onClick={() => setShowNavMenu(false)} />
      )}

      {/* 手機版側邊抽屜 - 只在小螢幕運作 */}
      <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl border-r border-red-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showNavMenu ? 'translate-x-0' : '-translate-x-full'} flex flex-col md:hidden`}>
         <div className="p-4 border-b border-red-100/50 flex justify-between items-center bg-gradient-to-r from-red-50 to-white">
            <span className="text-xs font-bold text-red-800 uppercase tracking-widest">System Modules</span>
            <button onClick={() => setShowNavMenu(false)}><X className="w-5 h-5 text-slate-500 hover:text-red-500 transition-colors" /></button>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
           {NAV_TOOLS.map(tool => {
              const Icon = tool.icon;
              return (
                <button key={tool.id} onClick={() => { setActiveTool(tool.id); setShowNavMenu(false); }} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTool === tool.id ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md' : 'hover:bg-red-50 text-slate-600'}`}>
                  <Icon className={`w-5 h-5 mr-3 ${activeTool === tool.id ? 'text-white' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div className="font-bold text-sm">{tool.name}</div>
                    <div className={`text-[10px] ${activeTool === tool.id ? 'text-red-100' : 'text-slate-400'}`}>{tool.description}</div>
                  </div>
                </button>
              );
           })}
         </div>
         <div className="p-4 text-[10px] text-center text-slate-400 border-t border-red-100/50">
            v3.5.0 • Powered by Gemini
         </div>
      </aside>

      {/* 主版面容器 - 使用 Flex 佈局將側邊欄與內容並排 */}
      <div className="flex flex-1 overflow-hidden relative z-10 max-w-[1600px] mx-auto w-full h-full">
         
         {/* 桌面版側邊欄 - 固定顯示 (md:flex) 但可收合 */}
         <aside className={`hidden md:flex flex-col bg-white/60 backdrop-blur-md border-r border-red-100/50 my-4 ml-4 rounded-2xl shadow-lg overflow-hidden shrink-0 transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className={`p-4 border-b border-red-100/50 bg-gradient-to-r from-red-50/50 to-white/50 flex items-center ${isDesktopSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                {isDesktopSidebarOpen && <span className="text-xs font-bold text-red-800 uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2">System Modules</span>}
                <button 
                    onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)} 
                    className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-white/50"
                    title={isDesktopSidebarOpen ? "收起側邊欄" : "展開側邊欄"}
                >
                    {isDesktopSidebarOpen ? <Minimize2 className="w-4 h-4" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {NAV_TOOLS.map(tool => {
                const Icon = tool.icon;
                return (
                    <button 
                        key={tool.id} 
                        onClick={() => setActiveTool(tool.id)} 
                        title={!isDesktopSidebarOpen ? tool.name : ''} // 收起時顯示 Tooltip
                        className={`w-full flex items-center p-3 rounded-xl transition-all ${
                            activeTool === tool.id 
                                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md' 
                                : 'hover:bg-white/80 text-slate-600 hover:text-red-600'
                        } ${isDesktopSidebarOpen ? '' : 'justify-center'}`}
                    >
                    <Icon className={`w-5 h-5 shrink-0 ${isDesktopSidebarOpen ? 'mr-3' : ''} ${activeTool === tool.id ? 'text-white' : 'text-slate-400'}`} />
                    {isDesktopSidebarOpen && (
                        <div className="text-left overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                            <div className="font-bold text-sm truncate">{tool.name}</div>
                            <div className={`text-[10px] truncate ${activeTool === tool.id ? 'text-red-100' : 'text-slate-400'}`}>{tool.description}</div>
                        </div>
                    )}
                    </button>
                );
            })}
            </div>
            {/* 只有在展開時才顯示版本資訊 */}
            {isDesktopSidebarOpen && (
                <div className="p-4 text-[10px] text-center text-slate-400 border-t border-red-100/50 whitespace-nowrap overflow-hidden animate-in fade-in">
                    v3.5.0 • Powered by Gemini
                </div>
            )}
         </aside>

         {/* 內容區域 */}
         {/* 【修改 1】改為 p-0 (無邊框)，讓內容可以貼齊視窗邊緣 */}
         <main className="flex-1 overflow-hidden relative p-0 h-full">
             {renderContent()}
         </main>
      </div>
    </div>
  );
}
  );
}
