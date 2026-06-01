import { useState, useEffect } from "react";
import { MessageCircle, Sun, Moon, Sparkles } from "lucide-react";
import { Currency, Order, OrderStatus, SupportTicket, Transaction } from "./types";
import { Header } from "./components/Header";
import { Sidebar, SidebarTab } from "./components/Sidebar";
import { NewOrder } from "./components/NewOrder";
import { OrdersList } from "./components/OrdersList";
import { ServicesList } from "./components/ServicesList";
import { AddFunds } from "./components/AddFunds";
import { ApiDocs } from "./components/ApiDocs";
import { UpdatesFeed } from "./components/UpdatesFeed";
import { Tickets } from "./components/Tickets";
import { Settings } from "./components/Settings";
import { CATEGORIES_DATA } from "./servicesData";
import { Auth } from "./components/Auth";
import { AdminPanel } from "./components/AdminPanel";
import { 
  getUserProfile, 
  getUserOrders, 
  addUserOrder, 
  getUserTransactions, 
  addUserTransaction, 
  getUserTickets, 
  addUserTicket, 
  updateTicketStatusAndReplies, 
  getGlobalConfig,
  updateUserBalance,
  updateUserFirstDepositFlag,
  updateUserReferralBalance
} from "./lib/firebaseService";
import { EarnNow } from "./components/EarnNow";

import { onSnapshot, doc } from "firebase/firestore";
import { db } from "./lib/firebase";
import { FESTIVAL_THEMES } from "./themeConfig";
import { FestivalParticles } from "./components/FestivalParticles";
import { FestivalGreetingBanner } from "./components/FestivalGreetingBanner";

// Generate unique alphanumeric API key
const generateApiKey = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "dad_";
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key + "_smm";
};

// Initial welcome ticket message
const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 304212,
    subject: "Welcome to Dadhich SMM panel!",
    requestType: "Other",
    status: "Answered",
    lastUpdated: "2026-05-20 12:15:30",
    messages: [
      {
        sender: "support",
        message: "Hello! Welcome to Dadhich SMM. We are thrilled to host your campaigns. Enjoy high speed, affordable rates, and 100% stable deliveries for all social networks. Need assistance adding funds? Drop a reply in this ticket thread anytime!",
        time: "2026-05-20 12:10:00"
      }
    ]
  }
];

// Initial pre-placed campaigns
const INITIAL_ORDERS: Order[] = [
  {
    id: 1062082,
    date: "2026-05-20 11:45:10",
    categoryName: "Instagram Followers - [ Ultra Stable Server ] 🔥",
    serviceId: 1998,
    serviceName: "IG Followers | 365 Days | 0 to 5% Drop Normally",
    link: "instagram.com/dadhich_creative",
    quantity: 1000,
    charge: 70.68,
    status: OrderStatus.COMPLETED,
    startCount: 4520,
    refillCount: 0
  },
  {
    id: 1062085,
    date: "2026-05-20 12:30:15",
    categoryName: "IG Views |- Supper Fast ⚡",
    serviceId: 1886,
    serviceName: "IG Story Views - ⚡ Instant",
    link: "smm_viral_handle",
    quantity: 500,
    charge: 7.555,
    status: OrderStatus.IN_PROGRESS,
    startCount: 120,
    refillCount: 1
  }
];

export default function App() {
  // Tab Routing
  const [activeTab, setActiveTab] = useState<SidebarTab>("new-order");

  // User Authentication Context
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem("dadhich_smm_logged_in_user") || null;
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return localStorage.getItem("dadhich_smm_logged_in_email") || "";
  });
  
  // Wallet & Meta configurations
  const [currency, setCurrency] = useState<Currency>(Currency.INR);
  const [balance, setBalance] = useState<number>(0); // Store balance in INR
  const [whatsappNumber, setWhatsappNumber] = useState("8955932061");
  const [apiKey, setApiKey] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live Festival configurations & Dark Mode controls
  const [festivalTheme, setFestivalTheme] = useState<string>("default");
  const [festivalGreetingsEnabled, setFestivalGreetingsEnabled] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("dadhich_smm_dark_mode") === "true";
  });

  // Lists persistence
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Live Provider integrations and status indicators
  const [categories, setCategories] = useState<any[]>(CATEGORIES_DATA);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [providerActive, setProviderActive] = useState<boolean | null>(null);
  const [providerBalance, setProviderBalance] = useState<string | null>(null);

  const fetchLiveDetails = async (margin: number) => {
    setIsLoadingCategories(true);
    try {
      const servicesRes = await fetch(`/api/provider/services?margin=${margin}`);
      if (servicesRes.ok) {
        const liveCats = await servicesRes.json();
        if (Array.isArray(liveCats) && liveCats.length > 0) {
          setCategories(liveCats);
          setProviderActive(true);
        } else {
          setProviderActive(false);
        }
      } else {
        setProviderActive(false);
      }
    } catch (e) {
      console.error("Failed to connect with active provider services API:", e);
      setProviderActive(false);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    // 1. Establish live configuration listener for instant settings synchronization
    const unsub = onSnapshot(doc(db, "settings", "global"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const activeMargin = data.marginPercent ?? 15;
        const activeTheme = data.festivalTheme ?? "default";
        const isBannerEnabled = data.festivalGreetingsEnabled ?? true;

        setFestivalTheme(activeTheme);
        setFestivalGreetingsEnabled(isBannerEnabled);
        
        // Instant price margin update
        fetchLiveDetails(activeMargin);
      } else {
        // Default fallback if no doc exists yet
        fetchLiveDetails(15);
      }
    });

    const fetchBalanceDetails = async () => {
      try {
        const balanceRes = await fetch("/api/provider/balance");
        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (data && data.balance !== undefined) {
             setProviderBalance(`${data.balance} ${data.currency || "INR"}`);
          }
        }
      } catch (e) {
        console.error("Failed to query provider ledger details:", e);
      }
    };

    fetchBalanceDetails();
    return () => unsub();
  }, []);

  // Load state from Firestore scoped specifically to the currentUser
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserFirebaseData = async () => {
      try {
        // 1. Fetch user profile from Firestore
        const profile = await getUserProfile(currentUser);
        if (profile) {
          setBalance(profile.balance);
          // Set an active API Key based on their username and password
          setApiKey(profile.password ? `dad_${profile.username}_${profile.password.substring(0, 3)}_smm` : generateApiKey());
          if (profile.email) {
            localStorage.setItem("dadhich_smm_logged_in_email", profile.email);
            setCurrentUserEmail(profile.email);
          }
        } else {
          setBalance(0);
        }

        // 2. Fetch scoped active SMM Campaign orders
        const userOrders = await getUserOrders(currentUser);
        if (userOrders && userOrders.length > 0) {
          setOrders(userOrders);
        } else {
          setOrders([]);
        }

        // 3. Fetch scoped payment transactions
        const userTxns = await getUserTransactions(currentUser);
        if (userTxns && userTxns.length > 0) {
          setTransactions(userTxns);
        } else {
          setTransactions([]);
        }

        // 4. Fetch scoped support tickets
        const dbTickets = await getUserTickets(currentUser);
        if (dbTickets && dbTickets.length > 0) {
          setTickets(dbTickets);
        } else {
          // Sync welcome ticket on first registration
          const welcomeTicket = INITIAL_TICKETS[0];
          await addUserTicket(currentUser, welcomeTicket);
          setTickets([welcomeTicket]);
        }
      } catch (e) {
        console.error("Failed to sync client data ledger from Firestore:", e);
      }
    };

    fetchUserFirebaseData();
  }, [currentUser]);

  // Sync utilities
  const syncBalanceState = async (newBal: number) => {
    setBalance(newBal);
    if (currentUser) {
      await updateUserBalance(currentUser, newBal);
    }
  };

  const handleUpdateWhatsapp = (num: string) => {
    setWhatsappNumber(num);
    localStorage.setItem("dadhich_smm_whatsapp", num);
  };

  const handleRegenerateApiKey = () => {
    const key = generateApiKey();
    setApiKey(key);
  };

  // Placing SMM order Campaign
  const handlePlaceOrder = async (orderData: {
    categoryName: string;
    serviceId: number;
    serviceName: string;
    link: string;
    quantity: number;
    charge: number;
  }) => {
    if (!currentUser) return;
    const cost = orderData.charge; // in INR
    const updatedBal = balance - cost;
    await syncBalanceState(updatedBal);

    let providerOrderId: number | null = null;
    let orderPlacementError: string | null = null;

    try {
      const res = await fetch("/api/provider/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: orderData.serviceId,
          link: orderData.link,
          quantity: orderData.quantity
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          providerOrderId = Number(data.order);
        } else if (data.error) {
          orderPlacementError = data.error;
        }
      } else {
        orderPlacementError = `HTTP error ${res.status}`;
      }
    } catch (e: any) {
      console.error("Failed to submit campaign order to SMM provider:", e);
      orderPlacementError = e.message || "Network Error";
    }

    const orderIdToRecord = providerOrderId || Math.floor(1000000 + Math.random() * 900000);

    const newOrder: Order = {
      id: orderIdToRecord,
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      categoryName: orderData.categoryName,
      serviceId: orderData.serviceId,
      serviceName: orderData.serviceName,
      link: orderData.link,
      quantity: orderData.quantity,
      charge: cost,
      status: orderPlacementError ? OrderStatus.CANCELLED : OrderStatus.PENDING,
      startCount: Math.floor(50 + Math.random() * 5000), // Random starting index
      refillCount: 0
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    await addUserOrder(currentUser, newOrder);

    // Log the transaction
    const newTxn: Transaction = {
      id: "DEB_" + Math.floor(100000 + Math.random() * 900000).toString(),
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      method: orderPlacementError 
        ? `Order Rejected: "${orderPlacementError}" - Refund Applied` 
        : "Campaign Placement Order Description",
      utr: `Order ID #${newOrder.id}`,
      amount: orderPlacementError ? 0 : cost,
      status: orderPlacementError ? "Failed" : "Completed"
    };

    if (orderPlacementError) {
      // Revert wallet balance
      await syncBalanceState(balance);
      alert(`⚠️ Campaign Submission Alert:\nProvider API error: "${orderPlacementError}".\nYour wallet charge was waived, and the transaction was archived as Cancelled/Refunded.`);
    }

    const updatedTxns = [newTxn, ...transactions];
    setTransactions(updatedTxns);
    await addUserTransaction(currentUser, newTxn);
  };

  // Increasing local funds recharge via UPI UTR checks - pending manual admin audit
  const handleAddFundsSuccess = async (amountInI_N_R: number, utr: string) => {
    if (!currentUser) return;

    try {
      const newTxnId = "DEP_" + Math.floor(100000 + Math.random() * 900000).toString();
      const newTxn: Transaction = {
        id: newTxnId,
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        method: "UPI (8955932061@axl)",
        utr: utr,
        amount: amountInI_N_R,
        status: "Pending"
      };

      const updatedTxns = [newTxn, ...transactions];
      setTransactions(updatedTxns);
      await addUserTransaction(currentUser, newTxn);

      alert(`✔️ भुगतान जमा हो गया है! (Deposit Submitted!)\nTransaction ID: ${newTxnId}\n\nहमारे प्रशासक आपके UTR नंबर को बैंक से सत्यापित कर 10 मिनट के भीतर आपके वॉलेट में फंड जोड़ देंगे। Thank you for cooperating!`);
    } catch (err) {
      console.error("Failed to commit pending deposit:", err);
    }
  };

  // Submission/Replying to Support Tickets
  const handleCreateTicket = async (ticketData: {
    subject: string;
    requestType: "Order" | "Payment" | "Refill" | "Other";
    orderId?: string;
    message: string;
  }) => {
    if (!currentUser) return;
    
    const newCase: SupportTicket = {
      id: Math.floor(100000 + Math.random() * 900000),
      subject: ticketData.subject,
      requestType: ticketData.requestType,
      orderId: ticketData.orderId,
      status: "Open",
      lastUpdated: new Date().toISOString().replace("T", " ").substring(0, 19),
      messages: [
        {
          sender: "user",
          message: ticketData.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    const updatedTickets = [newCase, ...tickets];
    setTickets(updatedTickets);
    await addUserTicket(currentUser, newCase);
  };

  const handleAddTicketReply = async (ticketId: number, msgText: string) => {
    if (!currentUser) return;

    const isSupportRep = currentUserEmail.toLowerCase().trim() === "tiwarigautam819@gmail.com";
    const updatedTickets = tickets.map((t) => {
      if (t.id === ticketId) {
        const replyMsg = {
          sender: isSupportRep ? ("support" as const) : ("user" as const),
          message: msgText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedMsgs = [...t.messages, replyMsg];
        const updatedStatus = isSupportRep ? ("Answered" as const) : ("Open" as const);
        
        // Push status changes to Firestore
        updateTicketStatusAndReplies(currentUser, ticketId, updatedMsgs, updatedStatus);

        return {
          ...t,
          status: updatedStatus,
          lastUpdated: new Date().toISOString().replace("T", " ").substring(0, 19),
          messages: updatedMsgs
        };
      }
      return t;
    });

    setTickets(updatedTickets);
  };

  // Simulated Campaign Refill trigger
  const handleRefillOrder = async (orderId: number) => {
    if (!currentUser) return;

    const updatedOrders = orders.map((ord) => {
      if (ord.id === orderId) {
        const updated = {
          ...ord,
          refillCount: ord.refillCount + 1
        };
        addUserOrder(currentUser, updated);
        return updated;
      }
      return ord;
    });
    setOrders(updatedOrders);
  };

  // Reset platform defaults and log out
  const handleResetData = () => {
    localStorage.removeItem("dadhich_smm_whatsapp");
    localStorage.removeItem("dadhich_smm_logged_in_user");
    localStorage.removeItem("dadhich_smm_logged_in_email");
    setCurrentUser(null);
    setCurrentUserEmail("");
  };

  // Select core content layout based on router tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case "new-order":
        return (
          <NewOrder
            balance={balance}
            currency={currency}
            ticketsCount={tickets.filter((t) => t.status === "Open").length}
            ordersCount={1062089 + orders.length}
            onPlaceOrder={handlePlaceOrder}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
            providerActive={providerActive}
            providerBalance={providerBalance}
          />
        );
      case "orders":
        return (
          <OrdersList
            orders={orders}
            currency={currency}
            onRefillOrder={handleRefillOrder}
          />
        );
      case "services":
        return (
          <ServicesList 
            currency={currency} 
            categories={categories}
          />
        );
      case "add-funds":
        return (
          <AddFunds
            onAddFundsSuccess={handleAddFundsSuccess}
            transactions={transactions}
            onOpenSupportTicket={() => setActiveTab("tickets")}
          />
        );
      case "earn":
        return (
          <EarnNow
            currentUser={currentUser}
            onBalanceUpdated={async () => {
              const profile = await getUserProfile(currentUser);
              if (profile) {
                setBalance(profile.balance);
              }
            }}
          />
        );
      case "api-docs":
        return (
          <ApiDocs
            apiKey={apiKey}
            onRegenerateKey={handleRegenerateApiKey}
            brandUrl={window.location.origin}
          />
        );
      case "transactions":
        return (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Wallet Transactions log</h3>
              <p className="text-xs text-slate-400 mt-1">A consolidated ledger of deposit approvals, orders debit, and system credit corrections.</p>
            </div>
            
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-4">Transaction ID</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Log Description</th>
                    <th className="py-2.5 px-4 text-center">Reference UTR</th>
                    <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                    <th className="py-2.5 px-4 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {transactions.length > 0 ? (
                    transactions.map((txn) => {
                      const isDeb = txn.id.startsWith("DEB");
                      return (
                        <tr key={txn.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900">{txn.id}</td>
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{txn.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{txn.method}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[11px] text-indigo-650 max-w-xs truncate">{txn.utr}</td>
                          <td className={`py-3 px-4 text-right font-black font-mono ${isDeb ? "text-rose-600" : "text-emerald-600"}`}>
                            {isDeb ? "-" : "+"} ₹{txn.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase">
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                        No transactions debited or credited in this account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "updates":
        return <UpdatesFeed currency={currency} />;
      case "tickets":
        return (
          <Tickets
            tickets={tickets}
            onCreateTicket={handleCreateTicket}
            onAddTicketReply={handleAddTicketReply}
          />
        );
      case "settings":
        return (
          <Settings
            whatsappNumber={whatsappNumber}
            onUpdateWhatsapp={handleUpdateWhatsapp}
            onResetData={handleResetData}
          />
        );
      case "admin":
        return (
          <AdminPanel
            currentUserEmail={currentUserEmail}
            onBalanceUpdated={async () => {
              if (currentUser) {
                const profile = await getUserProfile(currentUser);
                if (profile) {
                  setBalance(profile.balance);
                }
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  if (!currentUser) {
    return (
      <Auth
        whatsappNumber={whatsappNumber}
        onLoginSuccess={(uname, email) => {
          localStorage.setItem("dadhich_smm_logged_in_user", uname);
          localStorage.setItem("dadhich_smm_logged_in_email", email);
          setCurrentUser(uname);
          setCurrentUserEmail(email);
        }}
      />
    );
  }

  const themeConfig = FESTIVAL_THEMES[festivalTheme] || FESTIVAL_THEMES.default;

  return (
    <div className={`min-h-screen flex flex-col font-sans relative transition-all duration-500 overflow-hidden ${
      isDarkMode ? "dark text-slate-100 bg-[#0f172a]" : "text-slate-905 bg-slate-50"
    } ${isDarkMode ? themeConfig.darkBgClass : themeConfig.bgClass}`}>
      
      {/* 👑 Top Elite Partnership Announcement Banner */}
      <div className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-amber-500 via-[#eab308] to-orange-600 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 text-white py-2 px-3 sm:py-2.5 sm:px-4 font-black text-[10px] xs:text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase flex items-center justify-center gap-1.5 sm:gap-2.5 shadow-md z-[60] text-center select-none min-h-[40px] sm:min-h-[48px]">
        <Sparkles className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white animate-bounce shrink-0" />
        <span className="truncate xs:whitespace-normal">🤝 Partnership with Sanvariya Seth (साँवरिया सेठ) 🤝</span>
        <Sparkles className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white animate-bounce shrink-0" />
      </div>

      {/* Spacer to push down content below the fixed banner */}
      <div className="h-10 sm:h-12 shrink-0"></div>

      {/* Elegant Festival Theme Floating Decor and Sparkle Particles */}
      <FestivalParticles 
        emojis={themeConfig.decorEmojis} 
        animationType={themeConfig.particleAnimationType} 
      />

      {/* 1. Global Announcement Refill head and Header */}
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        brandName="Dadhich SMM"
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        onDarkModeToggle={() => {
          const next = !isDarkMode;
          setIsDarkMode(next);
          localStorage.setItem("dadhich_smm_dark_mode", String(next));
        }}
        onEarnClick={() => setActiveTab("earn")}
        onLogout={() => {
          localStorage.removeItem("dadhich_smm_logged_in_user");
          localStorage.removeItem("dadhich_smm_logged_in_email");
          setCurrentUser(null);
          setCurrentUserEmail("");
        }}
      />

      {/* 2. Side-By-Side Dashboard Grid */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Left: Sidebar navigation tabs layout */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currency={currency}
          onCurrencyChange={setCurrency}
          balance={balance}
          whatsappNumber={whatsappNumber}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentUserEmail={currentUserEmail}
        />

        {/* Right: Main Content view scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative z-10 pb-20">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Festival Greeting Banner (Toggled globally by Admin) */}
            {festivalGreetingsEnabled && (
              <FestivalGreetingBanner themeConfig={themeConfig} isDarkMode={isDarkMode} />
            )}

            {/* Custom wrapper adjusting card color context based on isDarkMode */}
            <div className={`transition-all duration-300`}>
              {renderTabContent()}
            </div>

            {/* Bottom Refill Guarantee Banner */}
            <div className="w-full bg-red-50/60 p-4 border border-red-100 rounded-3xl text-center shadow-xs mt-8">
              <div className="flex flex-col items-center justify-center gap-1.5 px-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight text-center">
                  IF You Found Any Drop In Any Order Use Refill Button Or Message In WhatsApp For Refill
                </h2>
                <div className="text-xs sm:text-sm font-black text-rose-600 uppercase tracking-wide">
                  We Give Guaranteed 100% Refill
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-semibold">
                  यदि आपको किसी ऑर्डर में कोई कमी नजर आए, तो रिफिल बटन का उपयोग करें या रिफिल के लिए व्हाट्सएप पर संदेश भेजें।
                </p>
                <p className="text-xs sm:text-sm font-bold text-red-600 mt-0.5">
                  हम 100% रिफिल की गारंटी देते हैं।
                </p>
                <a
                  href={`https://wa.me/91${whatsappNumber}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-bold shadow-xs transition-colors"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                    alt="WhatsApp" 
                    className="w-5 h-5 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  Contact WhatsApp for Support
                </a>
              </div>
            </div>

            {/* 🔒 Privacy Policy Quick Button Section */}
            <div className="w-full mt-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <span className="text-black dark:text-neutral-100 font-black text-sm uppercase tracking-wider select-none">
                🔒 Privacy Policy
              </span>
              <a
                href={`https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(
                  `मेरी ID (@${currentUser || ""}) में जो भी bug हैं उन्हें हटा दो`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 shadow-md cursor-pointer"
              >
                🚀 Check My Bugs
              </a>
            </div>
          </div>
        </main>
      </div>

      {/* Floating WhatsApp Contact Button in Bottom Right Corner */}
      <a
        href={`https://wa.me/91${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        id="whatsapp-floating-support-bubble"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
        title="Chat on WhatsApp"
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-25 animate-ping"></div>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
          alt="WhatsApp Logo" 
          className="w-10 h-10 shrink-0 relative z-10 transition-transform group-hover:rotate-12 object-contain"
          referrerPolicy="no-referrer"
        />
        <span className="max-w-0 overflow-hidden group-hover:max-w-28 transition-all duration-300 ease-out whitespace-nowrap text-xs font-black uppercase tracking-wider pl-0 group-hover:pl-2 relative z-10">
          WhatsApp
        </span>
      </a>
    </div>
  );
}
