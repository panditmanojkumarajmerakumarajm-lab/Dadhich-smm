import React from "react";
import {
  PlusCircle,
  FileText,
  Briefcase,
  Wallet,
  Code,
  ShieldCheck,
  History,
  RotateCw,
  HelpCircle,
  LogOut,
  Settings,
  ChevronDown,
  User,
  PhoneCall,
  Gift
} from "lucide-react";
import { Currency } from "../types";

export type SidebarTab =
  | "new-order"
  | "orders"
  | "services"
  | "add-funds"
  | "earn"
  | "api-docs"
  | "transactions"
  | "updates"
  | "tickets"
  | "settings"
  | "admin";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  balance: number; // in INR
  whatsappNumber: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currency,
  onCurrencyChange,
  balance,
  whatsappNumber,
  isOpen,
  onClose,
  currentUserEmail = ""
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  const baseMenuItems = [
    { id: "new-order", label: "New Order", icon: PlusCircle },
    { id: "orders", label: "Orders", icon: FileText },
    { id: "services", label: "Services", icon: Briefcase },
    { id: "add-funds", label: "Add Funds", icon: Wallet },
    { id: "earn", label: "Earn Now 🎁", icon: Gift },
    { id: "api-docs", label: "API Docs", icon: Code },
    { id: "transactions", label: "Transactions", icon: History },
    { id: "updates", label: "Updates Feed", icon: RotateCw },
    { id: "tickets", label: "Support Tickets", icon: HelpCircle }
  ] as const;

  const menuItems = [
    ...baseMenuItems,
    ...(currentUserEmail.toLowerCase().trim() === "tiwarigautam819@gmail.com"
      ? [{ id: "admin" as const, label: "Admin Panel", icon: ShieldCheck }]
      : [])
  ];

  const handleTabClick = (tabId: SidebarTab) => {
    onTabChange(tabId);
    onClose();
  };

  const formattedBalance = () => {
    if (currency === Currency.USD) {
      const usdBal = balance * (1 / 83);
      return `$ ${usdBal.toFixed(2)}`;
    }
    return `₹ ${balance.toFixed(2)}`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 xl:hidden active:opacity-100 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 flex flex-col justify-between z-50 transition-all duration-300 xl:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } xl:static h-screen`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* SMM Brand Header inside panel (Mobile preview safety) */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between xl:hidden">
            <div className="flex items-center gap-2">
              <img 
                src="https://res.cloudinary.com/dhbnbp0ax/image/upload/f_auto,q_auto/29230_nlstyo" 
                alt="Logo" 
                className="w-7 h-7 object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-slate-800 dark:text-white text-lg uppercase">Dadhich SMM</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white font-semibold p-1.5"
            >
              Back
            </button>
          </div>

          {/* Quick Balance Section */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/65 dark:to-indigo-950/25 border border-indigo-50/70 dark:border-slate-800 m-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Account Wallet
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formattedBalance()}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-indigo-100/50 dark:border-slate-800">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Quick Recharge:</span>
              <button
                onClick={() => handleTabClick("add-funds")}
                className="text-xs px-2.5 py-1 bg-indigo-600 active:bg-indigo-700 hover:bg-indigo-700 text-white rounded-md font-bold shadow-xs transition-colors"
              >
                + Fund Wallet
              </button>
            </div>
          </div>

          {/* Currency Switcher Dropdown */}
          <div className="px-4 mb-2 animate-fade-in">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-650 dark:text-slate-450">Display Currency:</span>
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as Currency)}
                className="text-xs font-extrabold focus:outline-hidden text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded cursor-pointer"
                aria-label="Change Display Currency"
              >
                <option value={Currency.INR}>INR (₹)</option>
                <option value={Currency.USD}>USD ($)</option>
              </select>
            </div>
          </div>

          {/* Core Menu Tabs */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100/10"
                      : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Account Profile Area */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/65 dark:bg-slate-900/65">
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-full flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-905/30 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  D
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">
                    {whatsappNumber}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-none mt-1">
                    🟢 Active SMM Client
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700 shadow-xl p-1.5 z-20 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleTabClick("settings");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-705 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white rounded-md transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  Account Key Settings
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    alert("Mock Logout Triggered! Click the main top right Logout key to end your active session.");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout Account
                </button>
              </div>
            )}
          </div>

          {/* Quick Helpline Indicator */}
          <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center justify-center gap-1">
            <PhoneCall className="w-3 h-3 text-slate-450 dark:text-slate-550" />
            SMM Support: +91 {whatsappNumber}
          </div>
        </div>
      </aside>
    </>
  );
};
