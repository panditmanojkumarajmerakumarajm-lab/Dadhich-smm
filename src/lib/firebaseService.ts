import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  limit
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Order, Transaction, SupportTicket, WithdrawalRequest } from "../types";

export interface UserProfile {
  username: string;
  email: string;
  password: string;
  balance: number;
  isFirstDeposit: boolean;
  createdAt: string;
  referredBy?: string;
  referralBalance?: number;
  referralCode?: string;
}

// Helper: Query a user profile by their 6-character referral code
export async function getProfileByReferralCode(code: string): Promise<UserProfile | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;
  const path = "users";
  try {
    const q = query(collection(db, "users"), where("referralCode", "==", cleanCode), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as UserProfile;
    }
    return null;
  } catch (error) {
    try {
      const allUsers = await searchAllUsers();
      const found = allUsers.find(u => u.referralCode?.toUpperCase() === cleanCode);
      return found || null;
    } catch (fallbackError) {
      console.error("Referral code lookup fallback also failed:", fallbackError);
      return null;
    }
  }
}

// Helper: Generate a unique 6-digit alphanumeric referral code (mix of alphabet and numbers)
export async function generateUniqueReferralCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let attempts = 0;
  while (attempts < 15) {
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Verify uniqueness
    const docWithCode = await getProfileByReferralCode(result);
    if (!docWithCode) {
      return result;
    }
    attempts++;
  }
  // Ultimate deterministic fallback in case of highly improbable collisions
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 1. Get User Profile Reference
export async function getUserProfile(username: string): Promise<UserProfile | null> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}`;
  try {
    const userDoc = await getDoc(doc(db, "users", normUser));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// 2. Register/Create User Profile (IMPORTANT: Sign up bonus is removed - starts with 0 INR)
export async function createUserProfile(username: string, email: string, password: string, referredBy?: string): Promise<UserProfile> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}`;
  
  // Clean referral generate
  const personalReferralCode = await generateUniqueReferralCode();

  const profile: UserProfile = {
    username: username.trim(),
    email: email.trim(),
    password: password,
    balance: 0, // NO SIGN-UP BONUS!
    isFirstDeposit: true, // Eligible for 5% first deposit premium
    createdAt: new Date().toISOString(),
    referralBalance: 0,
    referralCode: personalReferralCode,
    ...(referredBy ? { referredBy: referredBy.trim().toLowerCase() } : {})
  };
  try {
    await setDoc(doc(db, "users", normUser), profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Update Referrer Referral Balance
export async function updateUserReferralBalance(username: string, newReferralBalance: number): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}`;
  try {
    await setDoc(doc(db, "users", normUser), {
      referralBalance: parseFloat(newReferralBalance.toFixed(2))
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 2a. Fetch user's individual withdrawals requests
export async function getUserWithdrawals(username: string): Promise<WithdrawalRequest[]> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/withdrawals`;
  try {
    const ref = collection(db, "users", normUser, "withdrawals");
    const snapshot = await getDocs(ref);
    const withdrawals: WithdrawalRequest[] = [];
    snapshot.forEach((d) => {
      withdrawals.push(d.data() as WithdrawalRequest);
    });
    return withdrawals.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// 2b. Add a withdrawal request
export async function addUserWithdrawal(username: string, withdrawal: WithdrawalRequest): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/withdrawals/${withdrawal.id}`;
  try {
    await setDoc(doc(db, "users", normUser, "withdrawals", withdrawal.id), withdrawal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 2c. Fetch all withdrawals across every user for SMM Overlord Admin
export async function getAllWithdrawals(): Promise<WithdrawalRequest[]> {
  const path = "users_all_withdrawals";
  try {
    // Look up all users, then construct a full withdrawals ledger
    const allUsers = await searchAllUsers();
    let ledger: WithdrawalRequest[] = [];
    for (const u of allUsers) {
      const userRefs = await getUserWithdrawals(u.username);
      ledger = [...ledger, ...userRefs];
    }
    return ledger.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error("Admin failed to query aggregate withdrawals across collections:", error);
    return [];
  }
}

// 2d. Update a request's state
export async function updateWithdrawalStatus(
  username: string,
  withdrawalId: string,
  status: "Pending" | "Completed" | "Rejected",
  rejectionReason?: string
): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/withdrawals/${withdrawalId}`;
  try {
    const updateObj: any = { status };
    if (rejectionReason) {
      updateObj.rejectionReason = rejectionReason;
    }
    await setDoc(doc(db, "users", normUser, "withdrawals", withdrawalId), updateObj, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}


// 3. Search All Users for Admin Search
export async function searchAllUsers(): Promise<UserProfile[]> {
  const path = "users";
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    return users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// 4. Update Any User Balance (Admin action)
export async function updateUserBalance(username: string, newBalance: number): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}`;
  try {
    await setDoc(doc(db, "users", normUser), {
      balance: parseFloat(newBalance.toFixed(2))
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 5. Update First Deposit status
export async function updateUserFirstDepositFlag(username: string, isFirstDeposit: boolean): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}`;
  try {
    await setDoc(doc(db, "users", normUser), { isFirstDeposit }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 6. User Orders Subcollection
export async function getUserOrders(username: string): Promise<Order[]> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/orders`;
  try {
    const ref = collection(db, "users", normUser, "orders");
    const snapshot = await getDocs(ref);
    const orders: Order[] = [];
    snapshot.forEach((d) => {
      orders.push(d.data() as Order);
    });
    // Sort by chronological datetime descending
    return orders.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function addUserOrder(username: string, order: Order): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/orders/${order.id}`;
  try {
    await setDoc(doc(db, "users", normUser, "orders", order.id.toString()), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 7. User Transactions Ledger Subcollection
export async function getUserTransactions(username: string): Promise<Transaction[]> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/transactions`;
  try {
    const ref = collection(db, "users", normUser, "transactions");
    const snapshot = await getDocs(ref);
    const txns: Transaction[] = [];
    snapshot.forEach((d) => {
      txns.push(d.data() as Transaction);
    });
    return txns.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function addUserTransaction(username: string, txn: Transaction): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/transactions/${txn.id}`;
  try {
    await setDoc(doc(db, "users", normUser, "transactions", txn.id), txn);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 8. Support Tickets Subcollection
export async function getUserTickets(username: string): Promise<SupportTicket[]> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/tickets`;
  try {
    const ref = collection(db, "users", normUser, "tickets");
    const snapshot = await getDocs(ref);
    const tickets: SupportTicket[] = [];
    snapshot.forEach((d) => {
      tickets.push(d.data() as SupportTicket);
    });
    return tickets.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function addUserTicket(username: string, ticket: SupportTicket): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/tickets/${ticket.id}`;
  try {
    await setDoc(doc(db, "users", normUser, "tickets", ticket.id.toString()), ticket);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateTicketStatusAndReplies(username: string, ticketId: number, messages: any[], status: "Open" | "Answered" | "Closed"): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}/tickets/${ticketId}`;
  try {
    await updateDoc(doc(db, "users", normUser, "tickets", ticketId.toString()), {
      messages,
      status,
      lastUpdated: new Date().toISOString().replace("T", " ").substring(0, 19)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 9. Global config markup controls
export interface GlobalConfig {
  marginPercent: number; // e.g., 15 for 15% markups
  festivalTheme?: string;
  festivalGreetingsEnabled?: boolean;
}

export async function getGlobalConfig(): Promise<GlobalConfig> {
  const path = "settings/global";
  try {
    const snapshot = await getDoc(doc(db, "settings", "global"));
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        marginPercent: data.marginPercent ?? 15,
        festivalTheme: data.festivalTheme ?? "default",
        festivalGreetingsEnabled: data.festivalGreetingsEnabled ?? true
      };
    }
    // Fallback/Default markup settings
    const def: GlobalConfig = { marginPercent: 15, festivalTheme: "default", festivalGreetingsEnabled: true };
    await setDoc(doc(db, "settings", "global"), def);
    return def;
  } catch (error) {
    // If the read fails, return fallbacks gracefully to preserve runtime
    return { marginPercent: 15, festivalTheme: "default", festivalGreetingsEnabled: true };
  }
}

export async function updateGlobalConfig(marginPercent: number): Promise<void> {
  const path = "settings/global";
  try {
    await setDoc(doc(db, "settings", "global"), { marginPercent }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateGlobalFestivalSettings(themeName: string, enabled: boolean): Promise<void> {
  const path = "settings/global";
  try {
    await setDoc(doc(db, "settings", "global"), { 
      festivalTheme: themeName, 
      festivalGreetingsEnabled: enabled 
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserReferralCode(username: string, referralCode: string): Promise<void> {
  const normUser = username.trim().toLowerCase();
  const path = `users/${normUser}`;
  try {
    await setDoc(doc(db, "users", normUser), { referralCode }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10. Admin Deposit/Verification Approvals & Transaction Aggregation
export interface AdminTransaction extends Transaction {
  username: string;
}

export async function getAllUserTransactions(): Promise<AdminTransaction[]> {
  try {
    const allUsers = await searchAllUsers();
    let allTxns: AdminTransaction[] = [];
    for (const u of allUsers) {
      const txns = await getUserTransactions(u.username);
      txns.forEach((t) => {
        allTxns.push({
          ...t,
          username: u.username
        });
      });
    }
    return allTxns.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error("Failed to query aggregate transactions:", error);
    return [];
  }
}

export async function approveUserDeposit(username: string, txnId: string, amount: number): Promise<void> {
  const normUser = username.trim().toLowerCase();
  
  // 1. Get the user's profile to check balance and check isFirstDeposit
  const profile = await getUserProfile(normUser);
  if (!profile) {
    throw new Error(`User @${username} not found!`);
  }

  // Calculate First Deposit Bonus (5% multiplier) if applicable
  const isFirst = !!profile.isFirstDeposit;
  const bonus = isFirst ? (amount * 0.05) : 0;
  const totalCredited = amount + bonus;
  const newBalance = (profile.balance || 0) + totalCredited;

  // 2. Update user's wallet balance in Firestore
  await updateUserBalance(normUser, newBalance);

  // 3. Mark first deposit flag as false if they received the bonus
  if (isFirst) {
    await updateUserFirstDepositFlag(normUser, false);
  }

  // 4. Handle Affiliate Referral Credit (10% of deposit credited to Referrer) on EVERY deposit
  if (profile.referredBy) {
    const referrerUser = profile.referredBy.toLowerCase().trim();
    const referrerProfile = await getUserProfile(referrerUser);
    if (referrerProfile) {
      const rewardAmount = amount * 0.10;
      const currentReferralBalance = referrerProfile.referralBalance || 0;
      const finalReferralBalance = currentReferralBalance + rewardAmount;

      // Update Referrer's balance
      await updateUserReferralBalance(referrerUser, finalReferralBalance);

      // Append Referral Ledger transaction to the Referrer
      const refTxnId = "REF_" + Math.floor(100000 + Math.random() * 900000).toString();
      const refTxn: Transaction = {
        id: refTxnId,
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        method: `Referral Code: 10% of @${username}'s Deposit`,
        utr: `Ref: @${username}`,
        amount: rewardAmount,
        status: "Completed"
      };
      await addUserTransaction(referrerUser, refTxn);
    }
  }

  // 5. Update transaction details to state Completed with welcome bonus in method
  const methodDesc = isFirst 
    ? `UPI Deposit + 5% Welcome Bonus Credit Added (₹${bonus.toFixed(2)})`
    : "UPI (paytm.manojkumar@paytm)";

  const approvedTxn: Transaction = {
    id: txnId,
    date: new Date().toISOString().replace("T", " ").substring(0, 19),
    method: methodDesc,
    utr: "", 
    amount: totalCredited,
    status: "Completed"
  };

  // Keep original UTR
  const existingTxns = await getUserTransactions(normUser);
  const matched = existingTxns.find(t => t.id === txnId);
  if (matched) {
    approvedTxn.utr = matched.utr;
  }

  await addUserTransaction(normUser, approvedTxn);
}

export async function rejectUserDeposit(username: string, txnId: string): Promise<void> {
  const normUser = username.trim().toLowerCase();

  // Fetch match to preserve trace
  const existingTxns = await getUserTransactions(normUser);
  const matched = existingTxns.find(t => t.id === txnId);

  const rejectedTxn: Transaction = {
    id: txnId,
    date: new Date().toISOString().replace("T", " ").substring(0, 19),
    method: matched?.method || "UPI Deposit (Rejected)",
    utr: matched?.utr || "",
    amount: matched?.amount || 0,
    status: "Failed"
  };

  await addUserTransaction(normUser, rejectedTxn);
}
