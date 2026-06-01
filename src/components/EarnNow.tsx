import React, { useState, useEffect } from "react";
import { 
  Gift, 
  Copy, 
  Check, 
  RotateCw, 
  Wallet, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  Landmark,
  Share2
} from "lucide-react";
import { 
  getUserProfile, 
  updateUserReferralBalance, 
  getUserWithdrawals, 
  addUserWithdrawal,
  addUserTransaction,
  generateUniqueReferralCode,
  updateUserReferralCode
} from "../lib/firebaseService";
import { WithdrawalRequest, Transaction } from "../types";

interface EarnNowProps {
  currentUser: string;
  onBalanceUpdated?: () => void;
}

export const EarnNow: React.FC<EarnNowProps> = ({ currentUser, onBalanceUpdated }) => {
  const [referralBalance, setReferralBalance] = useState<number>(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [personalReferralCode, setPersonalReferralCode] = useState<string>("");
  
  // URL Link tracking
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const referralLink = `${window.location.origin}/?ref=${personalReferralCode || currentUser}`;

  // Form Fields
  const [payoutMethod, setPayoutMethod] = useState<"UPI" | "Bank">("UPI");
  const [upiId, setUpiId] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch Referral Data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const profile = await getUserProfile(currentUser);
      if (profile) {
        setReferralBalance(profile.referralBalance || 0);
        
        let code = profile.referralCode;
        if (!code) {
          code = await generateUniqueReferralCode();
          await updateUserReferralCode(currentUser, code);
        }
        setPersonalReferralCode(code);
      }
      const list = await getUserWithdrawals(currentUser);
      setWithdrawals(list);
    } catch (e: any) {
      setErrorMsg("Failed to synchronize referral ledger: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Handle Link Copying
  const copyToClipboard = async (text: string, type: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy path:", err);
    }
  };

  // Submit Withdrawal Form
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 1) {
      setErrorMsg("Minimum withdrawal request is ₹1 INR.");
      return;
    }

    if (amount > referralBalance) {
      setErrorMsg(`Insufficient referral balance. You only have ₹${referralBalance.toFixed(2)} available for withdrawal.`);
      return;
    }

    // Input Validation
    if (payoutMethod === "UPI") {
      if (!upiId.trim() || !upiId.includes("@")) {
        setErrorMsg("Please enter a valid UPI ID (e.g., example@upi, username@ybl).");
        return;
      }
    } else {
      if (!accountHolder.trim()) {
        setErrorMsg("Please provide the account holder's name.");
        return;
      }
      if (!bankAccount.trim() || bankAccount.length < 8) {
        setErrorMsg("Please enter a valid Bank Account Number.");
        return;
      }
      if (!bankName.trim()) {
        setErrorMsg("Please enter your Bank Name.");
        return;
      }
      if (!bankIfsc.trim() || bankIfsc.length < 4) {
        setErrorMsg("Please enter a valid Bank IFSC code.");
        return;
      }
    }

    try {
      setLoading(true);

      // 1. Generate unique request ID
      const reqId = "WDR_" + Math.floor(100000 + Math.random() * 900000).toString();
      
      const payload: WithdrawalRequest = {
        id: reqId,
        username: currentUser,
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        method: payoutMethod,
        amount: amount,
        status: "Pending",
        ...(payoutMethod === "UPI" ? { upiId: upiId.trim() } : {
          accountHolder: accountHolder.trim(),
          bankAccount: bankAccount.trim(),
          bankName: bankName.trim(),
          bankIfsc: bankIfsc.trim().toUpperCase()
        })
      };

      // 2. Write to Firestore withdrawals subcollection
      await addUserWithdrawal(currentUser, payload);

      // 3. Deduct amount from user's referral balance
      const newRefBal = referralBalance - amount;
      await updateUserReferralBalance(currentUser, newRefBal);

      // 4. Record details in Transaction log
      const txnRecord: Transaction = {
        id: reqId,
        date: payload.date,
        method: `Withdrawal Requested (${payoutMethod})`,
        utr: payoutMethod === "UPI" ? `UPI: ${upiId}` : `A/C: ${bankAccount}`,
        amount: -amount,
        status: "Pending"
      };
      await addUserTransaction(currentUser, txnRecord);

      // 5. Update UI state values
      setReferralBalance(newRefBal);
      setWithdrawAmount("");
      setUpiId("");
      setAccountHolder("");
      setBankAccount("");
      setBankName("");
      setBankIfsc("");
      
      setSuccessMsg(`Withdrawal request of ₹${amount.toFixed(2)} submitted successfully! Our dispatch team will process it to your designated channel in 1-4 hours.`);
      
      await fetchData();
      if (onBalanceUpdated) {
        onBalanceUpdated();
      }
    } catch (err: any) {
      setErrorMsg("Failed to lodge withdrawal request: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Promo Hero Header Block */}
      <div className="bg-gradient-to-r from-teal-500 via-indigo-600 to-indigo-800 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-cyan-900/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 translate-y-20 blur-xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10 text-center md:text-left max-w-xl">
          <span className="bg-teal-400 text-slate-900 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full inline-block">
            🎁 LIFETIME COMISSION PROGRAM
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Refer & Earn 10% Cash!</h1>
          <p className="text-sm text-cyan-100 leading-relaxed">
            Invite colleagues or client campaigns to Dadhich SMM. Whenever someone registers using your link, **you get 10% of their actual first deposit amount** credited instantly to your withdrawable balance. No limits!
          </p>
        </div>
        <div className="p-4 bg-white/10 rounded-2xl border border-white/10 shrink-0 self-center">
          <Gift className="w-14 h-14 text-teal-300 animate-bounce" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Referral code copy details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Share Your Link */}
          <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-3xs space-y-5">
            <h2 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
              <Share2 className="w-4.5 h-4.5 text-indigo-500" />
              Your Personal Referral Campaign
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Box: Referral Code */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl relative">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Referral Promo Code
                </span>
                <span className="text-lg font-black text-slate-800 block">
                  {personalReferralCode || currentUser}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(personalReferralCode || currentUser, "code")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Box: Web Link */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl relative">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Reference Sign-up Link
                </span>
                <span className="text-xs font-semibold text-slate-500 block truncate max-w-[150px] sm:max-w-none">
                  {referralLink}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(referralLink, "link")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg border border-teal-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>

            </div>

            <div className="p-4 bg-[#edf9fa] border border-[#d1f1f2] rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-800 space-y-1 leading-normal">
                <p className="font-extrabold text-[#034451]">How does the referral cycle work?</p>
                <p>1. Send your custom link or code to your friend.</p>
                <p>2. Your friend registers on our portal and completes an initial deposit (UPI/Manual recharge).</p>
                <p>3. **We automatically compute 10% of their added cash** and credit it to your Referral Balance instantly.</p>
                <p>4. Example: If they deposit ₹1,000 INR, **you earn ₹100 INR withdrawable currency cash!**</p>
              </div>
            </div>
          </div>

          {/* Card: History list of withdrawals */}
          <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-3xs space-y-4">
            <h2 className="text-md font-extrabold text-slate-800 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-[#30bec5]" />
                Withdrawal Dispatch Ledger
              </span>
              <button
                onClick={fetchData}
                disabled={loading}
                className="text-xs text-[#30bec5] hover:underline font-bold flex items-center gap-1"
              >
                <RotateCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Refresh List
              </button>
            </h2>

            {withdrawals.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl text-xs text-slate-400 font-bold">
                You haven't requested any referrals withdrawals yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      <th className="py-2 px-1">ID</th>
                      <th className="py-2 px-1">Date</th>
                      <th className="py-2 px-1">Method</th>
                      <th className="py-2 px-1">Payout Detail</th>
                      <th className="py-2 px-1 text-right">Amount</th>
                      <th className="py-2 px-1 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-1 text-slate-400 font-mono text-[11px] font-bold">
                          {w.id}
                        </td>
                        <td className="py-3 px-1 text-[11px] text-slate-500 whitespace-nowrap">
                          {w.date}
                        </td>
                        <td className="py-3 px-1">
                          <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[10px] font-black uppercase border border-slate-150">
                            {w.method}
                          </span>
                        </td>
                        <td className="py-3 px-1 text-[11px] text-slate-600 max-w-[150px] truncate">
                          {w.method === "UPI" ? (
                            <span className="font-mono">{w.upiId}</span>
                          ) : (
                            <span>{w.bankAccount} ({w.bankIfsc})</span>
                          )}
                        </td>
                        <td className="py-3 px-1 text-right font-extrabold text-indigo-650">
                          ₹{w.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-1 text-center">
                          {w.status === "Pending" && (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 text-amber-800 border border-amber-100 font-bold px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Pending
                            </span>
                          )}
                          {w.status === "Completed" && (
                            <span className="inline-block text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-2 py-0.5 rounded-full">
                              Paid ✓
                            </span>
                          )}
                          {w.status === "Rejected" && (
                            <span className="inline-block text-[9px] bg-rose-50 text-rose-800 border border-rose-100 font-bold px-2 py-0.5 rounded-full cursor-help" title={w.rejectionReason || "Check support"}>
                              Declined 🛇
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Visual Referral earnings balance + Request Payout form */}
        <div className="space-y-6">
          
          {/* Card: Wallet Balance Overview */}
          <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex flex-col justify-between items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 rounded-full translate-x-4 -translate-y-4"></div>
            
            <span className="text-xs font-black text-slate-400 block uppercase tracking-wider mb-2">
              Withdrawable Referral Balance
            </span>
            <div className="text-4xl font-black text-indigo-700 tracking-tight flex items-center justify-center gap-1.5 my-1.5">
              ₹{referralBalance.toFixed(2)}
            </div>
            <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-100 rounded-full mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
              Only Referral Earnings Withdrawable
            </p>
          </div>

          {/* Card: Form withdrawal request */}
          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-3xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Wallet className="w-4.5 h-4.5 text-teal-500" />
              Lodge Instants Payout Request
            </h2>

            {/* Notification triggers */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-bold">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-bold flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs font-semibold">
              
              {/* Box Selector for UPI versus Bank Transfer */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Payout Method Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutMethod("UPI");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                      payoutMethod === "UPI"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutMethod("Bank");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                      payoutMethod === "Bank"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    Bank Account
                  </button>
                </div>
              </div>

              {/* Amount field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Withdrawal Amount (Min ₹1)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full py-2.5 pl-7 pr-3 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-extrabold rounded-xl text-xs outline-hidden focus:bg-white transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Dynamic Inputs: UPI Fields or Bank Account Fields */}
              {payoutMethod === "UPI" ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recipient UPI ID Link
                  </label>
                  <input
                    type="text"
                    required={payoutMethod === "UPI"}
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. phonepe@upi, name@ybl"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-bold rounded-xl text-xs outline-hidden focus:bg-white transition-all shadow-xs"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Account Holder Full Name
                    </label>
                    <input
                      type="text"
                      required={payoutMethod === "Bank"}
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Receiver's Legal Name"
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-bold rounded-xl text-xs outline-hidden focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      required={payoutMethod === "Bank"}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. SBI, HDFC Bank"
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-bold rounded-xl text-xs outline-hidden focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required={payoutMethod === "Bank"}
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="12 to 16 digit account number"
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-bold rounded-xl text-xs outline-hidden focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      required={payoutMethod === "Bank"}
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      placeholder="e.g. SBIN0001234"
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-bold rounded-xl text-xs uppercase outline-hidden focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Submit Payout trigger */}
              <button
                type="submit"
                disabled={loading || referralBalance < 1}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Withdrawal Request
              </button>

            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
