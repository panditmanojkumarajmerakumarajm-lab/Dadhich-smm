import React from "react";
import { motion } from "motion/react";
import { ThemeColors } from "../themeConfig";
import { Sparkles, Calendar, Heart, Gift } from "lucide-react";

interface FestivalGreetingBannerProps {
  themeConfig: ThemeColors;
  isDarkMode: boolean;
}

export const FestivalGreetingBanner: React.FC<FestivalGreetingBannerProps> = ({ themeConfig, isDarkMode }) => {
  // If no banner is active or theme is default, render standard welcome greeting politely.
  const isDefaultTheme = themeConfig.themeId === "default";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`relative w-full rounded-3xl p-5 md:p-7 overflow-hidden border shadow-sm transition-all duration-500 z-10 ${
        isDefaultTheme 
          ? "bg-[#034451] text-white border-cyan-800/10" 
          : `bg-gradient-to-r ${themeConfig.bannerGradient} ${themeConfig.bannerText} ${themeConfig.bannerBorder}`
      }`}
    >
      {/* Visual background sparkles accent */}
      <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none opacity-60"></div>
      
      {/* Decorative large shadow emoji on the right corner */}
      <div className="absolute right-6 md:right-12 bottom-1.5 md:bottom-3 text-[72px] sm:text-[96px] opacity-15 pointer-events-none select-none">
        {themeConfig.emoji}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-1 bg-white/20 text-white rounded-full text-[11px] font-black px-2.5 uppercase tracking-wider backdrop-blur-xs">
              {isDefaultTheme ? "📢 Live Update" : `${themeConfig.name} Festival Special`}
            </span>
            {!isDefaultTheme && (
              <span className="text-sm flex gap-1 items-center font-bold text-yellow-300 animate-bounce">
                <Sparkles className="w-3.5 h-3.5" />
                Live Theme
              </span>
            )}
          </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight filter drop-shadow-sm flex items-center gap-3">
            <span>{isDefaultTheme ? "Welcome to Dadhich SMM" : themeConfig.greetingMsg}</span>
            <span className="text-2xl sm:text-3xl animate-pulse">{themeConfig.emoji}</span>
          </h2>
          
          <p className="text-xs sm:text-sm font-semibold text-white/90 leading-relaxed balance max-w-xl">
            {themeConfig.subtitle}
          </p>
        </div>

        {/* Decorative Festive Widget Card */}
        <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-xs flex items-center gap-3.5 max-w-xs self-stretch md:self-auto shrink-0">
          <div className="p-2.5 bg-white/20 rounded-xl text-white">
            {isDefaultTheme ? (
              <Calendar className="w-5 h-5" />
            ) : (
              <Gift className="w-5 h-5 animate-pulse text-yellow-300" />
            )}
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-white/70 tracking-widest leading-none">
              Dadhich Campaign Bonus
            </span>
            <span className="block text-xs font-black text-white mt-1">
              5% extra bonus credits
            </span>
            <span className="block text-[10px] font-bold text-white/90">
              On every first deposit ₹ INR
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
