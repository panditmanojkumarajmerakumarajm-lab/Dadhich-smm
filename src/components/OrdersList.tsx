import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import { Order, OrderStatus, Currency } from "../types";
import { INR_TO_USD_RATE } from "../servicesData";

interface OrdersListProps {
  orders: Order[];
  currency: Currency;
  onRefillOrder: (orderId: number) => void;
}

type OrderFilter = "All" | OrderStatus;

export const OrdersList: React.FC<OrdersListProps> = ({ orders, currency, onRefillOrder }) => {
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter orders
  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const matchesFilter = activeFilter === "All" || order.status === activeFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        order.id.toString().includes(query) ||
        order.link.toLowerCase().includes(query) ||
        order.serviceName.toLowerCase().includes(query) ||
        order.categoryName.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  };

  const filteredOrders = getFilteredOrders();
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  // Paginated chunk
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCost = (valInI_N_R: number) => {
    if (currency === Currency.USD) {
      return `$ ${(valInI_N_R * INR_TO_USD_RATE).toFixed(4)}`;
    }
    return `₹ ${valInI_N_R.toFixed(2)}`;
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case OrderStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            In Progress
          </span>
        );
      case OrderStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case OrderStatus.PARTIAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
            <AlertTriangle className="w-3.5 h-3.5" />
            Partial
          </span>
        );
      case OrderStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
    }
  };

  const refillStates: Record<number, boolean> = {};

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-4">
        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          Campaign Deployment Logs
        </h3>

        {/* Filter Tab Row */}
        <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-lg border border-slate-150">
          {(["All", OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED, OrderStatus.CANCELLED] as const).map(
            (filterType) => (
              <button
                key={filterType}
                onClick={() => {
                  setActiveFilter(filterType);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeFilter === filterType
                    ? "bg-white text-indigo-700 shadow-xs border border-indigo-50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {filterType}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table search & pagination counts */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <label htmlFor="order-logs-search" className="sr-only">Search orders by ID or link</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="order-logs-search"
            type="text"
            placeholder="Search orders by ID, Link or platform terms..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold shrink-0">
          Total Found: {filteredOrders.length} Campaign(s)
        </div>
      </div>

      {/* Orders Grid/Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Deployment Date</th>
              <th className="py-3 px-4">Description Name</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Start Count</th>
              <th className="py-3 px-4 text-right">Quantity</th>
              <th className="py-3 px-4 text-right">Campaign Charge</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">#{order.id}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-400 whitespace-nowrap">
                    {order.date}
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-bold text-slate-800 leading-tight">{order.serviceName}</p>
                    <a
                      href={order.link.startsWith("http") ? order.link : `https://${order.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline mt-1 font-semibold truncate block max-w-xs"
                    >
                      {order.link}
                    </a>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[11px]">
                    {order.startCount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[11px]">
                    {order.quantity.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-900 font-bold font-mono">
                    {formatCost(order.charge)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {order.status === OrderStatus.COMPLETED || order.status === OrderStatus.IN_PROGRESS ? (
                      <button
                        onClick={() => {
                          onRefillOrder(order.id);
                          alert(
                            `Refill request for Order #${order.id} has been submitted! Queue starts shortly.`
                          );
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-md transition-all cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Refill ({order.refillCount})
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-normal italic">Locked</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                  No campaigns registered in this selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-slate-50 pt-4 text-xs font-bold text-slate-600">
        <span>
          Showing page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 px-2.5 border border-slate-250 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 px-2.5 border border-slate-250 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
