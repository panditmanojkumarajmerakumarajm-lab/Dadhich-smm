import React from "react";
import { Menu, Sun, Moon, Sparkles } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
  brandName: string;
  currentUser?: string | null;
  onLogout?: () => void;
  onEarnClick?: () => void;
  isDarkMode?: boolean;
  onDarkModeToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  brandName, 
  currentUser, 
  onLogout, 
  onEarnClick,
  isDarkMode = false,
  onDarkModeToggle
}) => {
  return (
    <header className="w-full flex flex-col border-b border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs relative z-30 transition-colors duration-300">
      {/* Main Bar */}
      <div className="h-16 px-4 md:px-8 flex items-center justify-between bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors xl:hidden"
            id="mobile-menu-toggle"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Logo Representation */}
          <div className="flex items-center gap-2">
            <img 
              src="https://res.cloudinary.com/dhbnbp0ax/image/upload/f_auto,q_auto/29230_nlstyo" 
              alt="Dadhich SMM Logo" 
              className="w-9 h-9 object-contain rounded-lg shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                {brandName}
              </span>
              <span className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase mt-0.5">
                Social Growth Engine
              </span>
            </div>
          </div>
        </div>

        {/* Support quick shortcuts and User profile actions */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Switch Button */}
          {onDarkModeToggle && (
            <button
              onClick={onDarkModeToggle}
              className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-705">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All Servers Online
          </div>

          {currentUser && (
            <div className="flex items-center gap-2 md:gap-3 border-l border-slate-150 dark:border-slate-800 pl-2 md:pl-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">@{currentUser}</span>
                <span className="text-[9px] text-[#42ced6] font-bold uppercase tracking-wider">Account Active</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#42ced6]/10 text-[#034451] dark:text-cyan-400 flex items-center justify-center font-extrabold text-sm border border-[#42ced6]/25 select-none">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 px-2.5 text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 font-extrabold rounded-lg border border-rose-100 dark:border-rose-900/40 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
