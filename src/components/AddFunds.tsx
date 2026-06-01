import React, { useState, useEffect } from "react";
import { AlertCircle, FileText, CheckCircle, Smartphone, ExternalLink, HelpCircle, Loader2 } from "lucide-react";
import { Transaction, Currency } from "../types";
import QRCode from "qrcode";

// A high-reliability local client-side QR renderer that runs entirely offline
const LocalQrCode: React.FC<{ upiString: string; label: string }> = ({ upiString, label }) => {
  const [url, setUrl] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(
      upiString,
      {
        margin: 1,
        width: 300,
        color: {
          dark: "#0f172a", // slate-900
          light: "#ffffff",
        },
      },
      (error, resultUrl) => {
        if (error) {
          console.error("QR Code generation error:", error);
          setErr("Failed to render QR Code");
        } else {
          setUrl(resultUrl);
        }
      }
    );
  }, [upiString]);

  if (err) {
    return (
      <div className="w-44 h-44 flex flex-col items-center justify-center bg-red-55/40 dark:bg-red-950/20 rounded-xl border border-red-200 p-3 text-red-600 dark:text-red-400 text-center text-[10px]">
        <span>⚠️ {err}</span>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="w-44 h-44 flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white p-2.5 rounded-lg shadow-sm flex items-center justify-center">
      <img
        src={url}
        alt={label}
        className="w-44 h-44 object-contain rounded"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

interface AddFundsProps {
  onAddFundsSuccess: (amountInI_N_R: number, utr: string) => void;
  transactions: Transaction[];
  onOpenSupportTicket: () => void;
}

export const AddFunds: React.FC<AddFundsProps> = ({
  onAddFundsSuccess,
  transactions,
  onOpenSupportTicket
}) => {
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!utr.trim()) {
      setError("कृपया अपना UTR (Transaction ID) दर्ज करें। (Please enter your UTR)");
      return;
    }

    if (utr.trim().length < 10) {
      setError("अवैध UTR नंबर! UTR नंबर कम से कम 10 अंकों का होना चाहिए। (UTR must be at least 10 digits)");
      return;
    }

    if (amount === "" || amount <= 0) {
      setError("कृपया वैध राशि दर्ज करें। (Please enter a valid amount)");
      return;
    }

    if (!isChecked) {
      setError("कृपया सहमति चेकबॉक्स टिक करें। (Please check the agreement box before submitting)");
      return;
    }

    setLoading(true);

    // Simulate UPI verification with banking server
    setTimeout(() => {
      setLoading(false);
      onAddFundsSuccess(Number(amount), utr);
      setSuccess(`🎉 ₹${Number(amount).toLocaleString()} successfully credited via UTR: ${utr}! Welcome to Dadhich SMM.`);
      setUtr("");
      setAmount("");
      setIsChecked(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* video notice banner */}
      <div className="p-4 bg-amber-500 hover:bg-amber-600 rounded-xl text-white font-heavy flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer shadow-xs select-none">
        <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">
          अगर आपका पैसा ADD नहीं हो रहा है तो वीडियो देखें 👇
        </h3>
        <p className="text-[11px] font-semibold text-amber-50 leading-none">
          How to Add Money in SMM Panel — Click to play complete checkout guidelines
        </p>
      </div>

      {/* Styled Embed Video frame */}
      <div className="bg-slate-900 aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden border-4 border-white shadow-xl relative group flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=800&auto=format&fit=crop&q=60"
          alt="SMM Panel checkout Guide"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-slate-950/40 flex flex-col justify-between p-5">
          <div className="text-white text-xs font-bold flex justify-between items-center bg-black/60 p-2.5 rounded-lg">
            <span>Tech Masterminds - how to add money in Dadhich SMM</span>
            <ExternalLink className="w-4 h-4" />
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => alert("Mock Video Player Triggered! In production, this hosts your YouTube tutorial video.")}
              aria-label="Play SMM Guide Video"
              className="w-16 h-16 bg-red-650 hover:bg-red-750 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg"
            >
              <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-white ml-1"></div>
            </button>
          </div>

          <div className="text-[11px] font-bold text-center text-red-400 bg-black/50 p-1.5 rounded">
            🎥 Tutorial: Setup wallet recharge using PhonePe, Paytm QR scanner
          </div>
        </div>
      </div>

      {/* QR Codes section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* 1st QR Code Card: Manoj Kumar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs text-center space-y-4">
          <div className="inline-flex items-center justify-center p-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black px-2.5 uppercase tracking-wider">
            🔵 1st QR Code
          </div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Scan QR Code to Pay (MANOJ KUMAR)
          </h4>

          {/* QR image design code using offline local generator */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 max-w-[210px] mx-auto rounded-xl border border-indigo-150 dark:border-indigo-900/40 flex flex-col items-center">
            <LocalQrCode 
              upiString="upi://pay?pa=8955932061@axl&pn=Manoj%20Kumar&cu=INR"
              label="MANOJ KUMAR QR 1"
            />
            
            <div className="w-full bg-indigo-600 py-1.5 px-3 uppercase text-[10px] font-black text-white tracking-widest rounded-md mt-2">
              MANOJ KUMAR
            </div>
          </div>

          <div className="text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">Official UPI ID copy</span>
            <span className="font-extrabold text-indigo-700 dark:text-indigo-400 font-mono mt-0.5 select-all">8955932061@axl</span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block animate-ping animate-duration-1000"></span>
            <p className="text-[10px] font-black tracking-wide text-slate-500 dark:text-slate-400 uppercase">
              Supports GPay, Paytm, BHIM, UPI
            </p>
          </div>
        </div>

        {/* 2nd QR Code Card: Manoj Kumar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs text-center space-y-4">
          <div className="inline-flex items-center justify-center p-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black px-2.5 uppercase tracking-wider">
            🟠 2nd QR Code
          </div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Scan QR Code to Pay (MANOJ KUMAR)
          </h4>

          {/* QR image design code using offline local generator */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 max-w-[210px] mx-auto rounded-xl border border-amber-100 dark:border-amber-900/40 flex flex-col items-center">
            <LocalQrCode 
              upiString="upi://pay?pa=8955932061@axl&pn=Manoj%20Kumar&cu=INR"
              label="MANOJ KUMAR QR 2"
            />
            
            <div className="w-full bg-amber-500 py-1.5 px-3 uppercase text-[10px] font-black text-white tracking-widest rounded-md mt-2">
              MANOJ KUMAR
            </div>
          </div>

          <div className="text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500 font-bold block text-[10px] uppercase">PhonePe UPI ID copy</span>
            <span className="font-extrabold text-amber-700 dark:text-amber-400 font-mono mt-0.5 select-all">8955932061@axl</span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-ping animate-duration-1000"></span>
            <p className="text-[10px] font-black tracking-wide text-slate-500 dark:text-slate-400 uppercase">
              Best for PhonePe & PhonePe Wallet / Apps
            </p>
          </div>
        </div>
      </div>

      {/* Important instructions translated box */}
      <div className="bg-red-50 border border-red-150 p-5 rounded-2xl space-y-2 max-w-3xl mx-auto">
        <h4 className="text-xs font-black text-red-900 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          महत्वपूर्ण सूचना (Important Notice)
        </h4>
        <div className="text-slate-700 text-xs font-bold leading-relaxed space-y-1">
          <p>कृपया पेमेंट करने के बाद अपना UTR नंबर (Transaction ID) सही तरीके से दर्ज करें!</p>
          <div className="p-2.5 bg-white/70 border border-red-100/50 rounded-lg text-[11px] text-amber-800 space-y-1">
            <p>⚠️ <strong>ध्यान दें</strong>, कुछ पेमेंट्स में UTR नंबर की शुरुआत में 0 (Zero) आ सकता है जैसे: <code>001234567891...</code></p>
            <p>ऐसी स्थिति में UTR नंबर डालते समय शुरुआत के सभी 0 (Zero) हटा दें और केवल बाद के नंबर दर्ज करें!</p>
          </div>
          <p className="text-emerald-700 mt-1">✔️ सही UTR डालने पर आपका पेमेंट तुरंत आपके अकाउंट में ऐड हो जाएगा।</p>
        </div>
      </div>

      {/* Manual deposit verification input form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-105 shadow-sm max-w-lg mx-auto">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider text-center border-b border-slate-50 pb-3 mb-4">
          Submit Transaction Verification Request
        </h3>

        <form onSubmit={handlePaySubmit} className="space-y-4">
          
          {/* Transaction UTR */}
          <div className="space-y-1">
            <label htmlFor="utr-number-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              UTR Number / Transaction ID *
            </label>
            <input
              id="utr-number-input"
              type="text"
              placeholder="e.g. 12 or 16 digit Number (like 601245678901)"
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\s+/g, ""))}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Amount Box */}
          <div className="space-y-1">
            <label htmlFor="fund-amount-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Amount In INR (₹) *
            </label>
            <input
              id="fund-amount-input"
              type="number"
              placeholder="Minimum ₹1 — Amount paid to MANOJ KUMAR"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                setAmount(val === "" ? "" : Number(val));
              }}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-2 pt-2">
            <input
              id="fraud-disclaimer"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-0.5 rounded cursor-pointer border-slate-300 text-indigo-600 focus:ring-indigo-550"
            />
            <label
              htmlFor="fraud-disclaimer"
              className="text-xs font-semibold text-slate-500 leading-tight select-none cursor-pointer"
            >
              I understand after the funds are added successfully, I will not ask for fraudulent dispute or chargeback directly.
            </label>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Pay Trigger action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Interrogating Banking Gateways...
              </>
            ) : (
              "Submit Verification (Add Balance)"
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={onOpenSupportTicket}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            Create a ticket for Quick Support
          </button>
        </div>
      </div>

      {/* Payment log updates */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          Recent Recharge Confirmations
        </h3>
        
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Transaction ID</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">UPI Payee ID (UTR)</th>
                <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {transactions.length > 0 ? (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">#{txn.id}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{txn.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 truncate max-w-xs">{txn.utr}</td>
                    <td className="py-3 px-4 text-right font-black">₹{txn.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-100">
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-bold font-sans">
                    No Transaction Payments Found in this account history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
