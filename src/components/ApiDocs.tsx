import React, { useState } from "react";
import { Copy, Check, ShieldAlert, BookOpen, Send, CheckCircle2 } from "lucide-react";

interface ApiDocsProps {
  apiKey: string;
  onRegenerateKey: () => void;
  brandUrl: string;
}

export const ApiDocs: React.FC<ApiDocsProps> = ({ apiKey, onRegenerateKey, brandUrl }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [selectedDocsTab, setSelectedDocsTab] = useState<"add" | "services" | "status" | "balance">("add");

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${brandUrl}/api/v2`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1500);
  };

  const codeBlocks = {
    add: {
      params: [
        { name: "key", desc: "Your unique Secret SMM API Key", req: "Yes" },
        { name: "action", desc: "Operation action value: must be 'add'", req: "Yes" },
        { name: "service", desc: "Service ID (retrieve from services list)", req: "Yes" },
        { name: "url", desc: "Target link (URL or username description)", req: "Yes" },
        { name: "quantity", desc: "Total quantity size required", req: "Yes" }
      ],
      response: `{
  "order": 235129,
  "status": "Success",
  "charge": "15.1100",
  "currency": "INR"
}`
    },
    services: {
      params: [
        { name: "key", desc: "Your unique Secret SMM API Key", req: "Yes" },
        { name: "action", desc: "Operation action value: must be 'services'", req: "Yes" }
      ],
      response: `[
  {
    "service": 1998,
    "name": "IG Followers | 365 Days | 0 to 5% Drop Normally",
    "type": "Default",
    "category": "Instagram Followers - [ Ultra Stable Server ] 🔥",
    "rate": "70.6800",
    "min": "100",
    "max": "100000"
  },
  {
    "service": 1886,
    "name": "IG Story Views - ⚡ Instant",
    "type": "Default",
    "category": "IG Views |- Supper Fast ⚡",
    "rate": "15.1100",
    "min": "100",
    "max": "5000"
  }
]`
    },
    status: {
      params: [
        { name: "key", desc: "Your unique Secret SMM API Key", req: "Yes" },
        { name: "action", desc: "Operation action value: must be 'status'", req: "Yes" },
        { name: "order", desc: "Single order ID or array of IDs separated by comma", req: "Yes" }
      ],
      response: `{
  "charge": "15.1100",
  "start_count": "1025",
  "status": "Completed",
  "remains": "0",
  "currency": "INR"
}`
    },
    balance: {
      params: [
        { name: "key", desc: "Your unique Secret SMM API Key", req: "Yes" },
        { name: "action", desc: "Operation action value: must be 'balance'", req: "Yes" }
      ],
      response: `{
  "balance": "850.50",
  "currency": "INR"
}`
    }
  };

  return (
    <div className="space-y-6">
      
      {/* API Key Credentials panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Developer API Credentials
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Integrate Dadhich SMM into your custom website CMS, panels, or software automation tools.
          </p>
        </div>

        {/* Credentials table representation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Item 1: API Endpoint */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Core Request URL
            </span>
            <div className="flex items-center justify-between mt-1.5 gap-2">
              <code className="text-xs font-black text-indigo-700 font-mono truncate">
                {brandUrl}/api/v2
              </code>
              <button
                onClick={handleCopyUrl}
                className="p-1 px-2.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shrink-0 shadow-xs"
                title="Copy API Endpoint"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                Copy Url
              </button>
            </div>
            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded-full inline-block mt-3 uppercase tracking-wider">
              HTTP METHOD: POST ONLY
            </span>
          </div>

          {/* Item 2: API Secret key */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Your Secret API Auth Key
            </span>
            <div className="flex items-center justify-between mt-1.5 gap-2">
              <code className="text-xs font-black text-slate-700 font-mono truncate max-w-[160px]">
                {revealed ? apiKey : "dad_•••••••••••••••••••••••••••••smm"}
              </code>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setRevealed(!revealed)}
                  className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-[10px] font-bold text-slate-600 cursor-pointer"
                >
                  {revealed ? "Hide" : "Reveal"}
                </button>
                <button
                  onClick={handleCopyKey}
                  className="p-1 px-2.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-xs"
                  title="Copy API Key"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  Copy Key
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                onRegenerateKey();
                alert("API Key has been regenerated. Please update any connected API integrations immediately!");
              }}
              className="text-[9px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-wider block mt-3 select-none hover:underline cursor-pointer"
            >
              ⚠️ Regenerate API key
            </button>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100/60 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold text-slate-650 leading-relaxed">
            Keep your API key strictly secure! Sharing this key unlocks full administrative power over your balance and active orders without secondary validation steps.
          </p>
        </div>
      </div>

      {/* Interactive API Docs Endpoints Reference manually */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          Technical endpoints reference documentation
        </h3>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-105 pb-3">
          {[
            { id: "add", label: "Add order Campaign" },
            { id: "services", label: "Retrieve Services List" },
            { id: "status", label: "Query order Status" },
            { id: "balance", label: "Account Balance Query" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDocsTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedDocsTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-105/30"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Documentation details panel content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              POST Endpoint parameters
            </h4>

            {/* Params table representation */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-4 w-40">Parameter Name</th>
                    <th className="py-2.5 px-4">Description Info</th>
                    <th className="py-2.5 px-4 text-center">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {codeBlocks[selectedDocsTab].params.map((p) => (
                    <tr key={p.name} className="hover:bg-slate-55">
                      <td className="py-2.5 px-4 font-bold font-mono text-indigo-650">{p.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{p.desc}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-800">{p.req}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* JSON sample blocks */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              Example Successful Response (JSON JSON)
            </span>
            <div className="bg-slate-900 ring-1 ring-slate-800 p-4 rounded-xl relative shadow-md">
              <pre className="text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                <code>{codeBlocks[selectedDocsTab].response}</code>
              </pre>
              <div className="absolute top-3 right-3 bg-slate-800 p-1 px-1.5 rounded text-[9px] font-bold text-slate-400 tracking-wider">
                JSON FORMAT
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
