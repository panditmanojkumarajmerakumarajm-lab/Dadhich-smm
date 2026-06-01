import React, { useState, useEffect } from "react";
import { 
  getGlobalConfig, 
  updateGlobalConfig, 
  searchAllUsers, 
  updateUserBalance,
  getAllWithdrawals,
  updateWithdrawalStatus,
  updateUserReferralBalance,
  addUserTransaction,
  getUserProfile,
  updateGlobalFestivalSettings,
  getAllUserTransactions,
  approveUserDeposit,
  rejectUserDeposit,
  AdminTransaction
} from "../lib/firebaseService";
import { UserProfile } from "../lib/firebaseService";
import { WithdrawalRequest, Transaction } from "../types";
import { Search, UserMinus, UserPlus, Sliders, CheckCircle2, Shield, RefreshCw, Key, Landmark, Check, X, Ban, IndianRupee, Globe, Wallet, Sparkles, AlertCircle, Bell } from "lucide-react";
import { FESTIVAL_THEMES } from "../themeConfig";

interface AdminPanelProps {
  currentUserEmail: string;
  onBalanceUpdated?: () => void; // Hook to notify App component about state changes
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUserEmail, onBalanceUpdated }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [marginPercent, setMarginPercent] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Festival Theme Manager states
  const [selectedTheme, setSelectedTheme] = useState<string>("default");
  const [greetingsEnabled, setGreetingsEnabled] = useState<boolean>(true);
  const [updatingFestival, setUpdatingFestival] = useState(false);

  // Provider states
  const [providerBalance, setProviderBalance] = useState<string>("Loading...");
  const [providerActive, setProviderActive] = useState<boolean | null>(null);

  // Withdrawals states
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [reasonMsg, setReasonMsg] = useState("");

  // Deposits states
  const [allTransactions, setAllTransactions] = useState<AdminTransaction[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<AdminTransaction[]>([]);
  const [confirmingDeposit, setConfirmingDeposit] = useState<{
    action: "approve" | "reject";
    txn: AdminTransaction;
  } | null>(null);

  // Target user being edited
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newBalance, setNewBalance] = useState<string>("");

  // Fetch initial stats
  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // 1. Fetch live margins
      const config = await getGlobalConfig();
      setMarginPercent(config.marginPercent);
      setSelectedTheme(config.festivalTheme || "default");
      setGreetingsEnabled(config.festivalGreetingsEnabled !== false);

      // 2. Fetch all SMM clients registered securely in Firestore
      const allUsers = await searchAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);

      // 3. Fetch all withdrawal requests across users
      const allWithdrawals = await getAllWithdrawals();
      setWithdrawals(allWithdrawals);

      // 3b. Fetch all transaction logs to separate "Pending" deposits
      const txns = await getAllUserTransactions();
      setAllTransactions(txns);
      setPendingDeposits(txns.filter(t => t.status === "Pending"));

      // 4. Fetch main provider SMM balance
      try {
        const balanceRes = await fetch("/api/provider/balance");
        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (data && data.balance !== undefined) {
             const balVal = parseFloat(data.balance);
             const currencyStr = data.currency || "INR";
             setProviderBalance(`₹${(balVal * (currencyStr === "USD" ? 83 : 1)).toFixed(2)} (${data.balance} ${currencyStr})`);
             setProviderActive(true);
          } else {
            setProviderBalance("Unavailable");
            setProviderActive(false);
          }
        } else {
          setProviderBalance("Error fetching balance");
          setProviderActive(false);
        }
      } catch (err) {
        setProviderBalance("Offline");
        setProviderActive(false);
      }
    } catch (e: any) {
      setErrorMsg("Failed to synchronize administrative dataset from Firestore: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserEmail === "tiwarigautam819@gmail.com") {
      fetchAdminData();
    }
  }, [currentUserEmail]);

  // Handle live searches
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredUsers(users);
    } else {
      const matched = users.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.password.toLowerCase().includes(q)
      );
      setFilteredUsers(matched);
    }
  }, [searchQuery, users]);

  // Handle updating user's wallet
  const handleUpdateBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMsg("");
    setSuccessMsg("");

    const parsedBalance = parseFloat(newBalance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setErrorMsg("Please provide a valid wallet balance number.");
      return;
    }

    try {
      setLoading(true);
      
      const diff = parsedBalance - (selectedUser.balance || 0);
      
      await updateUserBalance(selectedUser.username, parsedBalance);
      
      // Calculate and credit referral reward if balance increased manually
      if (diff > 0 && selectedUser.referredBy) {
        const referrerUser = selectedUser.referredBy.toLowerCase().trim();
        const referrerProfile = await getUserProfile(referrerUser);
        if (referrerProfile) {
          const rewardAmount = diff * 0.10;
          const currentReferralBalance = referrerProfile.referralBalance || 0;
          const finalReferralBalance = currentReferralBalance + rewardAmount;
          
          await updateUserReferralBalance(referrerUser, finalReferralBalance);
          
          const refTxnId = "REF_" + Math.floor(100000 + Math.random() * 900000).toString();
          const refTxn: Transaction = {
            id: refTxnId,
            date: new Date().toISOString().replace("T", " ").substring(0, 19),
            method: `Referral Code: 10% of @${selectedUser.username}'s Credit (₹${diff.toFixed(2)})`,
            utr: `Manual Added: @${selectedUser.username}`,
            amount: rewardAmount,
            status: "Completed"
          };
          await addUserTransaction(referrerUser, refTxn);
        }
      }

      setSuccessMsg(`Wallet of @${selectedUser.username} successfully updated to ₹${parsedBalance.toFixed(2)}.`);
      
      // Update local state arrays
      setUsers(prev => prev.map(u => u.username === selectedUser.username ? { ...u, balance: parsedBalance } : u));
      setSelectedUser(null);
      setNewBalance("");
      
      if (onBalanceUpdated) {
        onBalanceUpdated();
      }
    } catch (err: any) {
      setErrorMsg("Error committing wallet modification: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating profit margin
  const handleUpdateMarginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (marginPercent < 0 || marginPercent > 500) {
      setErrorMsg("Margin percentage must be between 0% and 500%.");
      return;
    }

    try {
      setLoading(true);
      await updateGlobalConfig(marginPercent);
      setSuccessMsg(`Global retail profit markup updated successfully to ${marginPercent}%! All services prices re-cached.`);
    } catch (err: any) {
      setErrorMsg("Failed to store profit configurations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating festival theme settings
  const handleUpdateFestivalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingFestival(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await updateGlobalFestivalSettings(selectedTheme, greetingsEnabled);
      setSuccessMsg(`🎉 Success! Instantly updated Dadhich SMM active festival theme to: "${selectedTheme.toUpperCase()}" with greetings ${greetingsEnabled ? "ENABLED" : "DISABLED"}.`);
    } catch (err: any) {
      setErrorMsg("Failed to update active festival settings: " + err.message);
    } finally {
      setUpdatingFestival(false);
    }
  };

  // Admin approval of withdrawal
  const handleApproveWithdrawal = async (w: WithdrawalRequest) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      setLoading(true);
      await updateWithdrawalStatus(w.username, w.id, "Completed");
      setSuccessMsg(`Withdrawal request ${w.id} of ₹${w.amount.toFixed(2)} for @${w.username} has been successfully completed and paid.`);
      await fetchAdminData();
    } catch (err: any) {
      setErrorMsg("Failed to approve withdrawal request: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin approval of user fund deposit (Add Balance)
  const handleApproveDeposit = async (txn: AdminTransaction) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      setLoading(true);
      await approveUserDeposit(txn.username, txn.id, txn.amount);
      setSuccessMsg(`🎉 Success! Approved deposit ${txn.id} of ₹${txn.amount} for @${txn.username}. Wallet has been credited!`);
      await fetchAdminData();
      if (onBalanceUpdated) {
        onBalanceUpdated();
      }
    } catch (err: any) {
      setErrorMsg("Failed to approve deposit: " + err.message);
    } finally {
      setLoading(false);
      setConfirmingDeposit(null);
    }
  };

  // Admin rejection of user fund deposit
  const handleRejectDeposit = async (txn: AdminTransaction) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      setLoading(true);
      await rejectUserDeposit(txn.username, txn.id);
      setSuccessMsg(`Deposit request ${txn.id} has been marked as Failed/Rejected.`);
      await fetchAdminData();
    } catch (err: any) {
      setErrorMsg("Failed to reject deposit: " + err.message);
    } finally {
      setLoading(false);
      setConfirmingDeposit(null);
    }
  };

  // Admin rejection of withdrawal with refund
  const handleRejectWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingWithdrawal) return;
    setErrorMsg("");
    setSuccessMsg("");

    if (!reasonMsg.trim()) {
      setErrorMsg("Please specify the reason for declining this request.");
      return;
    }

    try {
      setLoading(true);
      const w = rejectingWithdrawal;
      
      // 1. Mark request as Rejected in Firestore with rejectionReason
      await updateWithdrawalStatus(w.username, w.id, "Rejected", reasonMsg.trim());

      // 2. Fetch user's current profile from database
      const userProfile = await getUserProfile(w.username);
      if (userProfile) {
        // Refund the deducted amount back to their referralBalance
        const currentReferralBalance = userProfile.referralBalance || 0;
        const refundedReferralBalance = currentReferralBalance + w.amount;
        await updateUserReferralBalance(w.username, refundedReferralBalance);

        // Record visual refund audit log in user transactions
        const refundTxnId = "REF_" + Math.floor(100000 + Math.random() * 900000).toString();
        const refundTxn: Transaction = {
          id: refundTxnId,
          date: new Date().toISOString().replace("T", " ").substring(0, 19),
          method: `REFUND: Decline of dispatch request ${w.id}`,
          utr: `Reason: ${reasonMsg.trim()}`,
          amount: w.amount,
          status: "Completed"
        };
        await addUserTransaction(w.username, refundTxn);
      }

      setSuccessMsg(`Withdrawal request ${w.id} was successfully rejected. The amount of ₹${w.amount.toFixed(2)} has been refunded back to @${w.username}'s referral balance.`);
      setRejectingWithdrawal(null);
      setReasonMsg("");
      await fetchAdminData();
      
      if (onBalanceUpdated) {
        onBalanceUpdated();
      }
    } catch (err: any) {
      setErrorMsg("Failed to decline/refund withdrawal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentUserEmail !== "tiwarigautam819@gmail.com") {
    return (
      <div className="p-8 text-center text-[#034451] bg-[#edf9fa] rounded-2xl border border-cyan-100 flex flex-col items-center gap-4">
        <Shield className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Access Unauthorized</h2>
        <p className="text-sm text-slate-500">Only the legal root administrator (tiwarigautam819@gmail.com) can interface with the SMM admin panel overlays.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 2. Headline card */}
      <div className="bg-gradient-to-r from-slate-900 to-[#034451] p-6 rounded-2xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
        <div>
          <span className="bg-cyan-500 text-slate-950 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full inline-block mb-2">
            Administrator Gateway
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">Dadhich SMM Overlord Panel</h1>
          <p className="text-xs text-cyan-200">System settings, client wallet ledgers, cleartext password lists, and live provider margins.</p>
        </div>
        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-bold rounded-xl border border-white/10 transition-all select-none"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload Data
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-bold leading-normal">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-[#bbf7d0] rounded-xl text-xs text-emerald-800 font-bold leading-normal flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* 🔔 Live Pending Deposit Notifications Alert Box */}
      {pendingDeposits.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4.5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse relative overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/10 rounded-xl relative flex items-center justify-center shrink-0">
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-ping"></span>
              <Bell className="h-5 w-5 text-amber-100" />
            </span>
            <div>
              <h3 className="font-extrabold text-[#fef3c7] uppercase text-xs tracking-wider">न्यू पेमेंट नोटिफिकेशन (New Deposit Alerts)</h3>
              <p className="text-xs font-bold mt-0.5 text-white leading-snug">
                There are <span className="underline font-black">{pendingDeposits.length} UPI deposits</span> waiting for your verification. Please verify and click Approve or Reject!
              </p>
            </div>
          </div>
          <a href="#pending-deposits-section" className="px-4 py-2 bg-slate-950/40 hover:bg-slate-950/60 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center shrink-0 border border-white/15">
            Inspect Queue 👇
          </a>
        </div>
      )}

      {/* Dynamic SMM Balances & Liability Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Provider API Balance (Main Web Balance) */}
        <div className="bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-100 rounded-2xl p-4.5 relative overflow-hidden shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-indigo-700 uppercase tracking-wider">
              Main Web API Balance
            </span>
            <div className="text-md font-black text-slate-900 mt-0.5">
              {providerBalance}
            </div>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${providerActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`}></span>
              {providerActive ? "API Connected" : "Provider Offline"}
            </span>
          </div>
        </div>

        {/* Card 2: Total Client Wallet Balances */}
        <div className="bg-gradient-to-br from-[#edf9fa] to-cyan-50/50 border border-[#d1f1f2] rounded-2xl p-4.5 relative overflow-hidden shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-600 text-white rounded-xl shadow-md">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-teal-700 uppercase tracking-wider">
              Client SMM Balances
            </span>
            <div className="text-md font-black text-slate-900 mt-0.5">
              ₹{users.reduce((acc, u) => acc + (u.balance || 0), 0).toFixed(2)}
            </div>
            <span className="text-[9px] font-bold text-slate-400">
              Across {users.length} active users
            </span>
          </div>
        </div>

        {/* Card 3: Referral Earnings Pool */}
        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100 rounded-2xl p-4.5 relative overflow-hidden shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-600 text-white rounded-xl shadow-md">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-purple-700 uppercase tracking-wider">
              Referral Payout Pool
            </span>
            <div className="text-md font-black text-slate-900 mt-0.5">
              ₹{users.reduce((acc, u) => acc + (u.referralBalance || 0), 0).toFixed(2)}
            </div>
            <span className="text-[9px] font-bold text-slate-400">
              Pending in client portfolios
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: User list and search overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-cyan-100 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <h2 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
                <Landmark className="h-4.5 w-4.5 text-[#42ced6]" />
                Registered Social Clients ({filteredUsers.length})
              </h2>

              {/* Live search input */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, email or password..."
                  className="w-full py-1.5 pl-9 pr-3 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-semibold rounded-xl text-xs outline-hidden transition-all focus:ring-1 focus:ring-cyan-100 hover:bg-slate-100"
                />
              </div>
            </div>

            {/* Clients Listing Table */}
            {loading && users.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 text-[#42ced6] animate-spin" />
                Synchronizing users with cloud database...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                No users found matching "{searchQuery}".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3 text-amber-600">Password</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-right text-indigo-705">Referral Earn</th>
                      <th className="py-2.5 px-3 text-center">First Dep?</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {filteredUsers.map((u) => (
                      <tr key={u.username} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">@{u.username}</span>
                          {u.referralCode && (
                            <span className="text-[9px] text-[#4f46e5] bg-[#f5f3ff] border border-[#ddd6fe] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide inline-block mt-1">
                              Code: {u.referralCode}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[140px] truncate">
                          {u.email}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-sm font-mono border border-amber-100 flex items-center gap-1.5 w-fit">
                            <Key className="h-3 w-3 shrink-0" />
                            {u.password}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-teal-700">
                          ₹{u.balance.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-indigo-600">
                          ₹{(u.referralBalance || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {u.isFirstDeposit ? (
                            <span className="text-[9px] bg-sky-50 text-sky-800 border border-sky-100 font-bold px-1.5 py-0.5 rounded-sm">
                              Pending (5% Bonus)
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-sm">
                              Availed
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewBalance(u.balance.toString());
                            }}
                            className="bg-cyan-50 hover:bg-[#42ced6] text-cyan-800 hover:text-white px-2.5 py-1 text-[10px] font-black rounded-lg transition-all"
                          >
                            Edit Wallet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card: Pending UPI Deposits Queue */}
          <div id="pending-deposits-section" className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h2 className="text-md font-extrabold text-amber-800 flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-amber-600 animate-bounce" />
                Pending wallet UPI deposits ({pendingDeposits.length})
              </h2>
              {pendingDeposits.length > 0 && (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Verification Required
                </span>
              )}
            </div>

            {pendingDeposits.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
                No pending UPI deposit requests to review. All set!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-indigo-50 text-[10px] text-slate-405 font-black uppercase tracking-wider">
                      <th className="py-2.5 px-2">Txn ID</th>
                      <th className="py-2.5 px-2">User</th>
                      <th className="py-2.5 px-2">Date</th>
                      <th className="py-2.5 px-2">Gateway Copy</th>
                      <th className="py-2.5 px-2">UTR (Transaction ID)</th>
                      <th className="py-2.5 px-2 text-right">Amount (INR)</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {pendingDeposits.map((p) => (
                      <tr key={p.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-2 font-mono text-[10px] font-bold text-amber-700">
                          {p.id}
                        </td>
                        <td className="py-3 px-2 font-extrabold text-slate-900">
                          @{p.username}
                        </td>
                        <td className="py-3 px-2 text-[10px] text-slate-500 whitespace-nowrap">
                          {p.date}
                        </td>
                        <td className="py-3 px-2 text-[11px] font-bold text-slate-600">
                          {p.method}
                        </td>
                        <td className="py-3 px-2 font-bold font-mono text-indigo-700 select-all tracking-wider text-[11px] bg-slate-55 rounded px-1.5 py-0.5">
                          {p.utr}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-rose-700 font-mono text-sm">
                          ₹{p.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block text-[9px] bg-amber-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded-full font-black">
                            Pending Audit
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setConfirmingDeposit({ action: "approve", txn: p })}
                              className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                              title="Verify received amount and credit user wallet"
                            >
                              <Check className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirmingDeposit({ action: "reject", txn: p })}
                              className="p-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                              title="Discard / Spurious UTR Rejection"
                            >
                              <X className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card: Withdrawals Queue */}
          <div className="bg-white border border-cyan-100 rounded-2xl p-5 shadow-xs">
            <h2 className="text-md font-extrabold text-[#034451] flex items-center gap-2 mb-4">
              <Landmark className="h-4.5 w-4.5 text-[#30bec5]" />
              Referral Withdrawal Dispatch Queue ({withdrawals.length})
            </h2>

            {withdrawals.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-100 rounded-2xl">
                No withdrawal dispatch requests pending or processed.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-indigo-50 text-[10px] text-slate-400 font-extrabold uppercase">
                      <th className="py-2 px-2">ID</th>
                      <th className="py-2 px-2">Client</th>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Method</th>
                      <th className="py-2 px-2">Payout Destination</th>
                      <th className="py-2 px-2 text-right">Amount (INR)</th>
                      <th className="py-2 px-2 text-center">Status</th>
                      <th className="py-2 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-2 font-mono text-[10px] font-bold text-slate-400">
                          {w.id}
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-900">
                          @{w.username}
                        </td>
                        <td className="py-3 px-2 text-[10px] text-slate-500 whitespace-nowrap">
                          {w.date}
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase bg-[#edf9fa] text-[#034451] border border-[#d1f1f2]">
                            {w.method}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-[10px] text-slate-600 max-w-[164px] truncate leading-tight">
                          {w.method === "UPI" ? (
                            <span className="font-mono bg-indigo-50 text-indigo-805 px-1 rounded">{w.upiId}</span>
                          ) : (
                            <span className="block text-[10px]">
                              A/C: {w.bankAccount} <br />
                              IFSC: {w.bankIfsc} <br />
                              Holder: {w.accountHolder} ({w.bankName})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-extrabold text-teal-800">
                          ₹{w.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {w.status === "Pending" && (
                            <span className="inline-block text-[9px] bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-full font-bold">
                              Pending
                            </span>
                          )}
                          {w.status === "Completed" && (
                            <span className="inline-block text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                              Paid ✓
                            </span>
                          )}
                          {w.status === "Rejected" && (
                            <span className="inline-block text-[9px] bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded-full font-bold cursor-help" title={w.rejectionReason}>
                              Refused 🛇
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {w.status === "Pending" ? (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => handleApproveWithdrawal(w)}
                                className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                                title="Approve & Complete"
                              >
                                <Check className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectingWithdrawal(w)}
                                className="p-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                                title="Decline and Refund"
                              >
                                <X className="w-3 h-3" />
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Processed</span>
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

        {/* Column 3: Global Controls Margin Adjuster & Selected Wallet Form */}
        <div className="space-y-6">

          {/* Card: Profit Multiplier Margins */}
          <div className="bg-white border border-cyan-100 rounded-2xl p-5 shadow-xs">
            <h2 className="text-md font-extrabold text-[#034451] flex items-center gap-2 mb-4">
              <Sliders className="h-4.5 w-4.5 text-[#42ced6]" />
              SMM Markup Margin Adjuster
            </h2>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">
              Increase or decrease your business commission. SMM services fetched from the provider are marked up globally by this percentage automatically.
            </p>

            <form onSubmit={handleUpdateMarginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Markup Margin Percent (%)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 15"
                    className="w-full py-2 px-3.5 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-bold rounded-xl text-xs outline-hidden hover:bg-slate-100/50"
                  />
                  <span className="text-sm font-bold text-slate-500 shrink-0">%</span>
                </div>
              </div>

              <div className="text-[10px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-800 block mb-0.5">Price Multiplier Simulation:</span>
                Rate of ₹10.00 will become <span className="text-teal-700 font-extrabold">₹{(10 * (1 + marginPercent / 100)).toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#42ced6] text-white font-extrabold hover:bg-[#39bec6] rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Apply Profit Margin
              </button>
            </form>
          </div>

          {/* Card: Festival Theme Manager */}
          <div className="bg-white border border-indigo-150 rounded-2xl p-5 shadow-xs">
            <h2 className="text-md font-extrabold text-[#034451] flex items-center gap-2 mb-2">
              <Sparkles className="h-4.5 w-4.5 text-[#4f46e5] animate-pulse" />
              Festival Theme Manager
            </h2>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">
              Manually deploy gorgeous festive theme adjustments, colors, particles, styles, and top greeting banners instantly across the entire website.
            </p>

            <form onSubmit={handleUpdateFestivalSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Select System Theme
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50">
                  {Object.keys(FESTIVAL_THEMES).map((key) => {
                    const t = FESTIVAL_THEMES[key];
                    const isSelected = selectedTheme === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTheme(key)}
                        className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between h-16 cursor-pointer select-none ${
                          isSelected 
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-sm" 
                            : "bg-white hover:bg-indigo-50/50 text-slate-700 border-slate-150"
                        }`}
                      >
                        <span className="text-lg">{t.emoji}</span>
                        <span className="font-extrabold line-clamp-1 block leading-tight text-[11px]">
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle for Festival Greetings */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={greetingsEnabled}
                    onChange={(e) => setGreetingsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700">Enable Festival Greetings Banner</span>
                    <span className="text-[10px] text-slate-400 font-bold">Displays the holiday card at the top of client desks.</span>
                  </div>
                </label>
              </div>

              {selectedTheme !== "default" && (
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[10px] text-slate-600 font-semibold space-y-1">
                  <span className="font-black text-indigo-805 block">Previewing Custom Greeting Payload:</span>
                  <div className="font-mono bg-white p-1.5 rounded border border-indigo-50 text-[10px]">
                    <span className="block font-black text-indigo-700">“{FESTIVAL_THEMES[selectedTheme].greetingMsg}”</span>
                    <span className="block mt-0.5 text-slate-400">{FESTIVAL_THEMES[selectedTheme].subtitle}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={updatingFestival}
                className="w-full py-2 bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
              >
                {updatingFestival ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Deploying settings...
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    Deploy Live Festival Theme
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* 4. Centered Responsive Modal Overlay for Editing Wallet Balance */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-cyan-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden w-full max-w-sm sm:max-w-md animate-scale-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#42ced6]/5 rounded-full translate-x-12 -translate-y-12"></div>
            
            <h2 className="text-md sm:text-lg font-black text-[#034451] flex items-center gap-2 mb-2 relative z-10">
              <Landmark className="h-5.5 w-5.5 text-[#30bec5]" />
              Update Client Wallet Balance
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 relative z-10">
              Set the absolute wallet balance for <span className="font-extrabold text-slate-800">@{selectedUser.username}</span>. This will overwrite their current balance of <span className="font-bold text-teal-700">₹{selectedUser.balance.toFixed(2)}</span> in Firestore.
            </p>

            <form onSubmit={handleUpdateBalanceSubmit} className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Live Balance in INR (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-black text-slate-400 select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder="Enter absolute balance"
                    className="w-full py-2.5 pl-8 pr-3.5 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-extrabold rounded-xl text-xs outline-hidden hover:bg-slate-100/50 focus:bg-white transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#42ced6] hover:bg-[#32bdc4] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98"
                >
                  {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Set Wallet Balance
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all outline-hidden"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Centered Responsive Modal Overlay for Declining Payouts */}
      {rejectingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-cyan-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden w-full max-w-sm sm:max-w-md animate-scale-up">
            
            <h2 className="text-md sm:text-lg font-black text-[#034451] flex items-center gap-2 mb-2 relative z-10">
              <Ban className="h-5.5 w-5.5 text-rose-500" />
              Decline Withdrawal Request
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 relative z-10">
              Double-check this action. Declining the payout request <span className="font-bold text-slate-700">{rejectingWithdrawal.id}</span> of <span className="font-bold text-rose-600">₹{rejectingWithdrawal.amount.toFixed(2)}</span> will **automatically refund** the total back to <span className="font-bold">@{rejectingWithdrawal.username}</span>'s referral balance instantly.
            </p>

            <form onSubmit={handleRejectWithdrawalSubmit} className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Reason for Rejection / Decline Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={reasonMsg}
                  onChange={(e) => setReasonMsg(e.target.value)}
                  placeholder="e.g. Invalid UPI ID, Bank server reject code, Account suspended."
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-[#42ced6] text-slate-800 font-semibold rounded-xl text-xs outline-hidden hover:bg-slate-100/50 focus:bg-white transition-all shadow-xs"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98"
                >
                  {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Decline & Refund Money
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectingWithdrawal(null);
                    setReasonMsg("");
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all outline-hidden"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Custom Modal for Deposit Approval or Rejection */}
      {confirmingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-cyan-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden w-full max-w-sm sm:max-w-md animate-scale-up">
            
            <h2 className="text-md sm:text-lg font-black text-[#034451] flex items-center gap-2 mb-2 relative z-10 w-full">
              {confirmingDeposit.action === "approve" ? (
                <>
                  <CheckCircle2 className="h-5.5 w-5.5 text-emerald-600 shrink-0" />
                  <span>Approve UPI Deposit</span>
                </>
              ) : (
                <>
                  <Ban className="h-5.5 w-5.5 text-rose-600 shrink-0" />
                  <span>Reject UPI Deposit</span>
                </>
              )}
            </h2>
            
            <div className="text-xs text-slate-500 font-medium leading-relaxed mb-4 relative z-10 space-y-2.5">
              <p>
                {confirmingDeposit.action === "approve" ? (
                  <span>
                    Are you sure you want to <strong>APPROVE & CREDIT</strong> this request? This will instantly credit the funds to the user's wallet.
                  </span>
                ) : (
                  <span>
                    Are you sure you want to <strong>REJECT & DISCARD</strong> this request? This will mark the transaction as failed and won't add any database balance.
                  </span>
                )}
              </p>

              <div className="bg-slate-50 dark:bg-slate-940 p-3 rounded-xl border border-slate-150 space-y-1.5 text-left">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">User:</span>
                  <span className="text-slate-950 font-extrabold truncate">@{confirmingDeposit.txn.username}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">UTR ID:</span>
                  <span className="text-indigo-600 font-mono font-bold select-all tracking-wider ml-auto text-right break-all">{confirmingDeposit.txn.utr}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Amount:</span>
                  <span className="text-rose-600 font-extrabold text-sm">₹{confirmingDeposit.txn.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Date:</span>
                  <span className="text-slate-600 text-[11px] truncate">{confirmingDeposit.txn.date}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1 relative z-10">
              {confirmingDeposit.action === "approve" ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleApproveDeposit(confirmingDeposit.txn)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98 cursor-pointer"
                >
                  {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Yes, Approve & Credit
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleRejectDeposit(confirmingDeposit.txn)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98 cursor-pointer"
                >
                  {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Yes, Reject & Discard
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmingDeposit(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all outline-hidden cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
