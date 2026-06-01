import React, { useState } from "react";
import { Settings2, RotateCcw, HelpCircle, Save, Phone } from "lucide-react";

interface SettingsProps {
  whatsappNumber: string;
  onUpdateWhatsapp: (num: string) => void;
  onResetData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  whatsappNumber,
  onUpdateWhatsapp,
  onResetData
}) => {
  const [phoneVal, setPhoneVal] = useState(whatsappNumber);
  const [savedPhone, setSavedPhone] = useState(false);

  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneVal.trim()) return;
    onUpdateWhatsapp(phoneVal.trim());
    setSavedPhone(true);
    setTimeout(() => setSavedPhone(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-650" />
          SMM Settings & Profile Panel
        </h3>

        {/* Whatsapp Change */}
        <form onSubmit={handleSubmitPhone} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="support-number-settings" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Administrative WhatsApp Support Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs font-bold font-mono">
                  +91
                </span>
                <input
                  id="support-number-settings"
                  type="text"
                  placeholder="e.g. 8955932061"
                  value={phoneVal}
                  onChange={(e) => setPhoneVal(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-205 rounded-xl text-xs font-bold font-mono focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-805 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Number
              </button>
            </div>
            {savedPhone && (
              <p className="text-[10px] text-emerald-600 font-extrabold mt-1">
                🟢 Support hotline successfully saved in browser memory!
              </p>
            )}
          </div>
        </form>

        <div className="h-px bg-slate-100 my-4"></div>

        {/* Data Reset */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            System Data Administration
          </h4>
          <p className="text-xs text-slate-400">
            Clear transaction logs, active campaign placement records, raised support tickets, and revert balance parameters to default.
          </p>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear your local storage SMM campaign database? All test transactions and records will be deleted!")) {
                onResetData();
                alert("All local records vanished! Reverting to platform defaults.");
                window.location.reload();
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-3xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear local memory & resetting
          </button>
        </div>
      </div>

      {/* SMM helper guidance */}
      <div className="bg-slate-50 border border-slate-105 p-5 rounded-2xl flex items-start gap-4">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            Helpful Deployment guidance
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            By default, all campaign lists, UTR verification logs, raised support tickets, display currency choices, custom numbers, and generated API profiles persist on your local computer via <strong>LocalStorage</strong> memory, ensuring stability between continuous web page updates. You can connect your actual server APIs later inside the configuration script references.
          </p>
        </div>
      </div>
    </div>
  );
};
