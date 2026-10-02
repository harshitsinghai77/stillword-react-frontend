import { ThemeMode } from '../types';

export interface ThemeStyles {
  canvas: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentHover: string;
  progressFill: string;
  progressBg: string;
  boxEmpty: string;
  boxPartial: string;
  boxDone: string;
  boxTodayRing: string;
  editorPaper: string;
  name: string;
}

export const THEMES: Record<ThemeMode, ThemeStyles> = {
  oatmeal: {
    name: 'Oatmeal Paper',
    canvas: 'bg-[#FBF9F4]',
    surface: 'bg-[#F4F0E6]',
    surfaceHover: 'hover:bg-[#EDE8DC]',
    border: 'border-[#E6E0D3]',
    text: 'text-[#232220]',
    textMuted: 'text-[#7D776C]',
    textSubtle: 'text-[#A8A296]',
    accent: 'bg-[#2B2927] text-[#FAF8F3]',
    accentHover: 'hover:bg-[#1C1A19]',
    progressFill: 'bg-[#2B2927]',
    progressBg: 'bg-[#E6E0D3]',
    boxEmpty: 'border-[#DDD6C7] bg-[#F4F0E6]/60 hover:border-[#BFB7A3]',
    boxPartial: 'bg-[#E3D1B4] border-[#D4BF9E] hover:border-[#BFAB8A]',
    boxDone: 'bg-[#2B2927] border-[#2B2927]',
    boxTodayRing: 'ring-2 ring-[#2B2927] ring-offset-2 ring-offset-[#FBF9F4]',
    editorPaper: 'bg-transparent text-[#232220] placeholder-[#A8A296]',
  },
  sage: {
    name: 'Morning Sage',
    canvas: 'bg-[#F4F6F4]',
    surface: 'bg-[#E9EFE9]',
    surfaceHover: 'hover:bg-[#DEE6DE]',
    border: 'border-[#D9E2D8]',
    text: 'text-[#1C251F]',
    textMuted: 'text-[#6A786E]',
    textSubtle: 'text-[#98A69C]',
    accent: 'bg-[#273B2C] text-[#F4F6F4]',
    accentHover: 'hover:bg-[#1C2D20]',
    progressFill: 'bg-[#273B2C]',
    progressBg: 'bg-[#D9E2D8]',
    boxEmpty: 'border-[#D0DBD0] bg-[#E9EFE9]/60 hover:border-[#B5C4B5]',
    boxPartial: 'bg-[#BFD4C1] border-[#A8C2AB] hover:border-[#92B096]',
    boxDone: 'bg-[#273B2C] border-[#273B2C]',
    boxTodayRing: 'ring-2 ring-[#273B2C] ring-offset-2 ring-offset-[#F4F6F4]',
    editorPaper: 'bg-transparent text-[#1C251F] placeholder-[#98A69C]',
  },
  ink: {
    name: 'Deep Ink',
    canvas: 'bg-[#121314]',
    surface: 'bg-[#1C1D1F]',
    surfaceHover: 'hover:bg-[#25272A]',
    border: 'border-[#2C2E32]',
    text: 'text-[#E3E2DE]',
    textMuted: 'text-[#8E8F8B]',
    textSubtle: 'text-[#5B5D5B]',
    accent: 'bg-[#ECEAE4] text-[#121314]',
    accentHover: 'hover:bg-[#FFFFFF]',
    progressFill: 'bg-[#ECEAE4]',
    progressBg: 'bg-[#2C2E32]',
    boxEmpty: 'border-[#2A2C30] bg-[#1C1D1F]/60 hover:border-[#404348]',
    boxPartial: 'bg-[#4A4337] border-[#665D4F] hover:border-[#827766]',
    boxDone: 'bg-[#ECEAE4] border-[#ECEAE4]',
    boxTodayRing: 'ring-2 ring-[#ECEAE4] ring-offset-2 ring-offset-[#121314]',
    editorPaper: 'bg-transparent text-[#E3E2DE] placeholder-[#5B5D5B]',
  },
  pure: {
    name: 'Pure Canvas',
    canvas: 'bg-[#FAFAFA]',
    surface: 'bg-[#F2F2F2]',
    surfaceHover: 'hover:bg-[#E8E8E8]',
    border: 'border-[#E5E5E5]',
    text: 'text-[#171717]',
    textMuted: 'text-[#737373]',
    textSubtle: 'text-[#A3A3A3]',
    accent: 'bg-[#171717] text-[#FAFAFA]',
    accentHover: 'hover:bg-[#000000]',
    progressFill: 'bg-[#171717]',
    progressBg: 'bg-[#E5E5E5]',
    boxEmpty: 'border-[#E0E0E0] bg-[#F2F2F2]/60 hover:border-[#CCCCCC]',
    boxPartial: 'bg-[#D1D1D1] border-[#BDBDBD] hover:border-[#A6A6A6]',
    boxDone: 'bg-[#171717] border-[#171717]',
    boxTodayRing: 'ring-2 ring-[#171717] ring-offset-2 ring-offset-[#FAFAFA]',
    editorPaper: 'bg-transparent text-[#171717] placeholder-[#A3A3A3]',
  },
};
