import { Flame, Compass, Sun, Star, Palette, Award, Feather, Heart } from "lucide-react";

export interface ThemeColors {
  themeId: string;
  name: string;
  emoji: string;
  greetingMsg: string;
  subtitle: string;
  
  // Outer Container Styling (Main canvas background)
  bgClass: string;          // Light mode outer
  darkBgClass: string;      // Dark mode outer
  
  // Dashboard card styling
  cardClass: string;        // Light mode card backgrounds
  darkCardClass: string;    // Dark mode card backgrounds
  cardBorderClass: string;  // Light card border
  darkCardBorderClass: string;// Dark card border

  // Dynamic Elements
  accentText: string;       // Accent text light
  darkAccentText: string;   // Accent text dark
  accentBg: string;         // Accents background for badge, pills
  accentBorder: string;     // Accent border

  // Banner properties
  bannerGradient: string;   // Linear tailwind gradient
  bannerText: string;
  bannerBorder: string;
  
  // Floating Decor particles e.g. ["🪔", "✨", "💥"] etc.
  decorEmojis: string[];
  particleAnimationType: "float" | "sparkle" | "spin" | "none";
}

export const FESTIVAL_THEMES: Record<string, ThemeColors> = {
  default: {
    themeId: "default",
    name: "Standard SMM Theme",
    emoji: "🌐",
    greetingMsg: "Welcome to Dadhich SMM Panel",
    subtitle: "The ultimate social growth proxy and API engine with instant auto-provisioning.",
    bgClass: "bg-slate-50",
    darkBgClass: "bg-slate-950",
    cardClass: "bg-white",
    darkCardClass: "bg-slate-900",
    cardBorderClass: "border-slate-100",
    darkCardBorderClass: "border-slate-800",
    accentText: "text-indigo-600",
    darkAccentText: "text-indigo-400",
    accentBg: "bg-indigo-50 dark:bg-indigo-950/50",
    accentBorder: "border-indigo-100 dark:border-indigo-900/40",
    bannerGradient: "from-[#034451] via-[#096d7f] to-[#42ced6]",
    bannerText: "text-white",
    bannerBorder: "border-cyan-500/20",
    decorEmojis: ["🌐", "⚡", "🚀", "💳"],
    particleAnimationType: "none"
  },
  Diwali: {
    themeId: "Diwali",
    name: "Diwali",
    emoji: "🪔",
    greetingMsg: "Happy Diwali",
    subtitle: "May the supreme light of lights illuminate your heart and mind with joy and prosperity!",
    bgClass: "bg-[#fff7ed]", // Amber tone
    darkBgClass: "bg-[#1c0d02]", // Deep dark amber
    cardClass: "bg-white",
    darkCardClass: "bg-[#2d1a08]",
    cardBorderClass: "border-[#fed7aa]", // Orange border
    darkCardBorderClass: "border-[#5c3e21]",
    accentText: "text-[#d97706]",
    darkAccentText: "text-[#fbbf24]",
    accentBg: "bg-[#fef3c7] dark:bg-[#4d2f0f]",
    accentBorder: "border-[#fde68a] dark:border-[#7c4d1d]",
    bannerGradient: "from-[#b45309] via-[#ea580c] to-[#eab308]", // Golden-saffron sunset
    bannerText: "text-white font-extrabold shadow-sm",
    bannerBorder: "border-[#f59e0b]",
    decorEmojis: ["🪔", "✨", "🌟", "🏮", "🕯️"],
    particleAnimationType: "sparkle"
  },
  Holi: {
    themeId: "Holi",
    name: "Holi",
    emoji: "🎨",
    greetingMsg: "Happy Holi",
    subtitle: "May your campaigns and life be filled with vibrant splashes of victory and joy!",
    bgClass: "bg-[#fdf2f8]", // soft pink
    darkBgClass: "bg-[#1e0a15]", // deep magenta-black
    cardClass: "bg-white",
    darkCardClass: "bg-[#2e1222]",
    cardBorderClass: "border-[#fbcfe8]",
    darkCardBorderClass: "border-[#5d2042]",
    accentText: "text-[#db2777]",
    darkAccentText: "text-[#f472b6]",
    accentBg: "bg-[#fce7f3] dark:bg-[#4c1635]",
    accentBorder: "border-[#f9a8d4] dark:border-[#6a214d]",
    bannerGradient: "from-[#ec4899] via-[#a855f7] to-[#06b6d4]", // Cyan-purple-pink splash
    bannerText: "text-white font-extrabold",
    bannerBorder: "border-[#d946ef]",
    decorEmojis: ["🎨", "🌈", "💦", "🔫", "💮"],
    particleAnimationType: "float"
  },
  "Krishna Janmashtami": {
    themeId: "Krishna Janmashtami",
    name: "Krishna Janmashtami",
    emoji: "🪶",
    greetingMsg: "Happy Krishna Janmashtami",
    subtitle: "May Lord Krishna's divine flute rhythm grace your account with continuous growth and fortune!",
    bgClass: "bg-[#e0f2fe]", // soft heavenly light blue
    darkBgClass: "bg-[#0b172a]", // divine midnight blue
    cardClass: "bg-white",
    darkCardClass: "bg-[#0f213a]",
    cardBorderClass: "border-[#bae6fd]",
    darkCardBorderClass: "border-[#1e3a60]",
    accentText: "text-[#0284c7]",
    darkAccentText: "text-[#38bdf8]",
    accentBg: "bg-[#e5f5ff] dark:bg-[#122c4f]",
    accentBorder: "border-[#bae6fd] dark:border-[#134175]",
    bannerGradient: "from-[#1e3a8a] via-[#0d9488] to-[#fbbf24]", // Midnight blue to magical golden peacock
    bannerText: "text-white font-black",
    bannerBorder: "border-[#fbbf24]",
    decorEmojis: ["🪶", "🍯", "🥛", "🎵", "🔱"],
    particleAnimationType: "spin"
  },
  "Ram Navami": {
    themeId: "Ram Navami",
    name: "Ram Navami",
    emoji: "🏹",
    greetingMsg: "Happy Ram Navami",
    subtitle: "Embracing the ideals of truth, valour, and rightness. Rejoice in the divine blessings!",
    bgClass: "bg-[#fff2e6]", // saffron-tinted light bg
    darkBgClass: "bg-[#251000]", // sunset deep orange-black
    cardClass: "bg-white",
    darkCardClass: "bg-[#331802]",
    cardBorderClass: "border-[#ffd1b3]",
    darkCardBorderClass: "border-[#663100]",
    accentText: "text-[#ea580c]",
    darkAccentText: "text-[#f97316]",
    accentBg: "bg-[#ffedd5] dark:bg-[#4d2402]",
    accentBorder: "border-[#ffdbc2] dark:border-[#7a3902]",
    bannerGradient: "from-[#ea580c] via-[#f97316] to-[#b45309]", // Absolute saffron fire
    bannerText: "text-white tracking-widest uppercase",
    bannerBorder: "border-[#ea580c]",
    decorEmojis: ["🏹", "🔱", "🚩", "🌸", "☀️"],
    particleAnimationType: "float"
  },
  "Ganesh Chaturthi": {
    themeId: "Ganesh Chaturthi",
    name: "Ganesh Chaturthi",
    emoji: "🐘",
    greetingMsg: "Happy Ganesh Chaturthi",
    subtitle: "May Vighnaharta Lord Ganesha resolve all obstacles in your path and grant you immense success!",
    bgClass: "bg-[#fff1f2]", // modak light pink-rose
    darkBgClass: "bg-[#200509]", // deep maroon bindi
    cardClass: "bg-white",
    darkCardClass: "bg-[#300c11]",
    cardBorderClass: "border-[#fecdd3]",
    darkCardBorderClass: "border-[#6b1621]",
    accentText: "text-[#e11d48]",
    darkAccentText: "text-[#fb7185]",
    accentBg: "bg-[#ffe4e6] dark:bg-[#4c0d15]",
    accentBorder: "border-[#fecdd3] dark:border-[#731321]",
    bannerGradient: "from-[#e11d48] via-[#f97316] to-[#fbbf24]", // crimson red to marigold joy
    bannerText: "text-white font-black",
    bannerBorder: "border-[#e11d48]",
    decorEmojis: ["🐘", "🥟", "🌸", "🔔", "🥁"],
    particleAnimationType: "sparkle"
  },
  "Makar Sankranti": {
    themeId: "Makar Sankranti",
    name: "Makar Sankranti",
    emoji: "🪁",
    greetingMsg: "Happy Makar Sankranti",
    subtitle: "Soar high as kites in the clear blue skies, harvesting happiness, warmth, and giant growth!",
    bgClass: "bg-[#f0fdf4]", // refreshing cane green
    darkBgClass: "bg-[#021809]", // harvest night green
    cardClass: "bg-white",
    darkCardClass: "bg-[#092b14]",
    cardBorderClass: "border-[#bbf7d0]",
    darkCardBorderClass: "border-[#144723]",
    accentText: "text-[#16a34a]",
    darkAccentText: "text-[#4ade80]",
    accentBg: "bg-[#dcfce7] dark:bg-[#0c3116]",
    accentBorder: "border-[#bbf7d0] dark:border-[#175227]",
    bannerGradient: "from-[#15803d] via-[#10b981] to-[#f59e0b]", // green fields to bright golden sun
    bannerText: "text-white",
    bannerBorder: "border-[#10b981]",
    decorEmojis: ["🪁", "☀️", "🌾", "🍬", "🎈"],
    particleAnimationType: "float"
  },
  Navratri: {
    themeId: "Navratri",
    name: "Navratri",
    emoji: "🔱",
    greetingMsg: "Happy Navratri",
    subtitle: "Invoking the nine forms of divine feminine power to protect and lift your venture!",
    bgClass: "bg-[#faf5ff]", // soft energetic lilac
    darkBgClass: "bg-[#120524]", // cosmic violet
    cardClass: "bg-white",
    darkCardClass: "bg-[#250d42]",
    cardBorderClass: "border-[#e9d5ff]",
    darkCardBorderClass: "border-[#4a1884]",
    accentText: "text-[#9333ea]",
    darkAccentText: "text-[#c084fc]",
    accentBg: "bg-[#f3e8ff] dark:bg-[#34115c]",
    accentBorder: "border-[#e9d5ff] dark:border-[#521c91]",
    bannerGradient: "from-[#7e22ce] via-[#ec4899] to-[#f97316]", // violet-pink-saffron dance
    bannerText: "text-white font-extrabold",
    bannerBorder: "border-[#d946ef]",
    decorEmojis: ["🔱", "💃", "🕺", "🕯️", "⭐"],
    particleAnimationType: "sparkle"
  },
  "New Year": {
    themeId: "New Year",
    name: "New Year",
    emoji: "🎆",
    greetingMsg: "Happy New Year",
    subtitle: "Stepping into a glorious year of digital expansion. Cheers to compound success!",
    bgClass: "bg-slate-50",
    darkBgClass: "bg-[#020617]", // deep night slate
    cardClass: "bg-white",
    darkCardClass: "bg-[#0f172a]",
    cardBorderClass: "border-slate-200",
    darkCardBorderClass: "border-slate-800",
    accentText: "text-slate-800 dark:text-[#f8fafc]",
    darkAccentText: "text-[#f8fafc]",
    accentBg: "bg-slate-100 dark:bg-slate-800",
    accentBorder: "border-slate-200 dark:border-slate-700",
    bannerGradient: "from-[#0f172a] via-[#1e293b] to-[#d97706]", // night black with golden champagne sparkle
    bannerText: "text-[#f8fafc] font-black",
    bannerBorder: "border-amber-500",
    decorEmojis: ["🎆", "🎈", "🍾", "🥂", "🎉", "⭐"],
    particleAnimationType: "sparkle"
  }
};
