import React, { useState } from "react";
import { PlusCircle, Search, HelpCircle, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { SupportTicket, TicketMessage } from "../types";

interface TicketsProps {
  tickets: SupportTicket[];
  onCreateTicket: (ticketData: {
    subject: string;
    requestType: "Order" | "Payment" | "Refill" | "Other";
    orderId?: string;
    message: string;
  }) => void;
  onAddTicketReply: (ticketId: number, message: string) => void;
}

export const Tickets: React.FC<TicketsProps> = ({ tickets, onCreateTicket, onAddTicketReply }) => {
  const [subject, setSubject] = useState("");
  const [requestType, setRequestType] = useState<"Order" | "Payment" | "Refill" | "Other">("Order");
  const [orderId, setOrderId] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
    tickets.length > 0 ? tickets[0].id : null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!subject.trim()) {
      setError("Please specify a subject for your support ticket.");
      return;
    }

    if (!initialMessage.trim()) {
      setError("Please describe your issue in the message area.");
      return;
    }

    onCreateTicket({
      subject,
      requestType,
      orderId: orderId.trim() ? orderId.trim() : undefined,
      message: initialMessage
    });

    setSuccess("🎉 Support Ticket created successfully! Check the status list.");
    setSubject("");
    setInitialMessage("");
    setOrderId("");
    
    // Set active ticket to newly created one
    if (tickets.length > 0) {
      setSelectedTicketId(tickets[0].id);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    onAddTicketReply(selectedTicket.id, replyMessage);
    setReplyMessage("");

    // Simulate SMM Support Automated Agent responding to message
    const keyword = replyMessage.toLowerCase();
    let botReply = "Thank you for contacting Dadhich SMM support. Our administrators are looking into this case and will issue a response within 15 minutes. Thank you!";
    
    if (keyword.includes("refill")) {
      botReply = "Understood! We have queued a system refill trigger with our servers for your designated post link. You should notice the count resuming shortly.";
    } else if (keyword.includes("payment") || keyword.includes("money") || keyword.includes("utr") || keyword.includes("add")) {
      botReply = "Payment validation query received. If you have provided a valid 12-digit UTR bank code, our automated system checks accounting structures to apply credits instantly. Rest assured, your payment is completely safe.";
    } else if (keyword.includes("cancel") || keyword.includes("refund")) {
      botReply = "Standard order cancellation and partial budget refund checks take 5 to 10 minutes to sync with provider protocols. Order status will update online.";
    }

    setTimeout(() => {
      onAddTicketReply(selectedTicket.id, botReply);
    }, 1500);
  };

  // Filter existing ticket list
  const getFilteredTickets = () => {
    return tickets.filter((ticket) => {
      const q = searchQuery.toLowerCase();
      return (
        ticket.id.toString().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.requestType.toLowerCase().includes(q)
      );
    });
  };

  const filteredTickets = getFilteredTickets();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Column Left: Ticket Creation & List (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Sub-Card: Create Support Ticket */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-650" />
            Raise SMM Support Case
          </h3>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Request Type */}
              <div className="space-y-1">
                <label htmlFor="ticket-type" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Issue Topic
                </label>
                <select
                  id="ticket-type"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as any)}
                  className="w-full p-3 bg-white border border-slate-250 rounded-lg text-xs font-bold focus:outline-hidden"
                >
                  <option value="Order">Campaign / Order Issue</option>
                  <option value="Payment">Payment / Adding Funds Dispute</option>
                  <option value="Refill">Refill Trigger Request</option>
                  <option value="Other">General Helpline Query</option>
                </select>
              </div>

              {/* Order ID Link */}
              <div className="space-y-1">
                <label htmlFor="ticket-order-id" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Associated Order ID (Optional)
                </label>
                <input
                  id="ticket-order-id"
                  type="text"
                  placeholder="e.g. 1062089"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value.replace(/\D/g, ""))}
                  className="w-full p-3 bg-white border border-slate-250 rounded-lg text-xs font-bold focus:outline-hidden"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label htmlFor="ticket-subject" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Brief Subject Heading *
              </label>
              <input
                id="ticket-subject"
                type="text"
                placeholder="e.g. Payment not credited yet or Instagram follow logs stuck"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 bg-white border border-slate-250 rounded-lg text-xs font-bold focus:outline-hidden"
              />
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label htmlFor="ticket-message" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Detailed Message Description *
              </label>
              <textarea
                id="ticket-message"
                rows={3}
                placeholder="Please explain the details of your issue, campaign link, or paid transaction UTR..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full p-3 bg-white border border-slate-250 rounded-lg text-xs font-bold focus:outline-hidden"
              ></textarea>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-sm cursor-pointer"
            >
              Submit Support Ticket
            </button>
          </form>
        </div>

        {/* Sub-Card: Existing Tickets List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              My Support History Cases ({tickets.length})
            </h4>

            {/* Local tickets Search */}
            <div className="relative w-full sm:w-48">
              <label htmlFor="ticket-search" className="sr-only">Search tickets</label>
              <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                id="ticket-search"
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-semibold focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => {
                const isSelected = selectedTicketId === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full p-3.5 text-left rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-slate-50 border-indigo-200 shadow-xs"
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-slate-400 block leading-none">
                          #{ticket.id}
                        </span>
                        <span className="font-extrabold text-[10px] uppercase text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded leading-none">
                          {ticket.requestType}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {ticket.subject}
                      </h5>
                      <span className="text-[9px] font-bold text-slate-400 block mt-1">
                        Updated: {ticket.lastUpdated}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wide leading-none shrink-0 ${
                        ticket.status === "Open"
                          ? "bg-amber-100 text-amber-800"
                          : ticket.status === "Answered"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ticket.status.toUpperCase()}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-[11px] font-bold text-slate-400">
                You haven't filed any support tickets yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column Right: Live Conversation bubble Thread Chat (5 cols) */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-[480px] flex flex-col justify-between overflow-hidden">
          {/* Header Case Details */}
          <div className="bg-slate-50 p-4 border-b border-indigo-50/60 shrink-0">
            {selectedTicket ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-700 tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded">
                      #{selectedTicket.id}
                    </span>
                    <span className="text-xs font-black text-slate-900 truncate">
                      {selectedTicket.subject}
                    </span>
                  </div>
                  <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                    Topic Category: {selectedTicket.requestType}
                  </p>
                </div>

                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse tracking-wider shrink-0" title="Online Admin Support"></span>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-400 text-center py-2">
                No Active Conversations
              </div>
            )}
          </div>

          {/* Central message thread area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
            {selectedTicket ? (
              selectedTicket.messages.map((m, idx) => {
                const isUser = m.sender === "user";
                return (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-3xs ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white text-slate-800 border border-slate-105 rounded-tl-none font-bold"
                      }`}
                    >
                      {m.message}
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 mt-1 px-1">{m.time}</span>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <HelpCircle className="w-10 h-10 text-slate-350" />
                <p className="text-xs font-bold text-slate-400">
                  Select a raised ticket on the left menu to view, reply, or read status responses from our administrators.
                </p>
              </div>
            )}
          </div>

          {/* Bottom input replies bar */}
          <div className="p-3 border-t border-slate-100 bg-white shrink-0">
            <form onSubmit={handleSendReply} className="flex gap-2">
              <label htmlFor="support-chat-input" className="sr-only">Type your reply</label>
              <input
                id="support-chat-input"
                type="text"
                disabled={!selectedTicket || selectedTicket.status === "Closed"}
                placeholder={
                  selectedTicket
                    ? selectedTicket.status === "Closed"
                      ? "This ticket has been marked Closed."
                      : "Type reply to support admin..."
                    : "Raise a ticket first..."
                }
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!selectedTicket || selectedTicket.status === "Closed" || !replyMessage.trim()}
                aria-label="Send Support Message"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
