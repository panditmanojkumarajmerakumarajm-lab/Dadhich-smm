import React, { useState } from "react";
import { Loader2, Search, ArrowUpRight, ArrowDownRight, Plus, Sparkles } from "lucide-react";
import { ServiceUpdate, Currency } from "../types";
import { SERVICE_UPDATES, INR_TO_USD_RATE } from "../servicesData";

interface UpdatesFeedProps {
  currency: Currency;
}

export const UpdatesFeed: React.FC<UpdatesFeedProps> = ({ currency }) => {
  const [updatesAndLogs, setUpdatesAndLogs] = useState<ServiceUpdate[]>(SERVICE_UPDATES);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "INCREASE" | "DECREASE" | "ADD" | "NEW">("ALL");

  const formatCost = (valInI_N_R: number) => {
    if (currency === Currency.USD) {
      return `$ ${(valInI_N_R * INR_TO_USD_RATE).toFixed(4)}`;
    }
    return `₹ ${valInI_N_R.toFixed(2)}`;
  };

  const getFilteredLogs = () => {
    return updatesAndLogs.filter((log) => {
      const matchFilter = activeFilter === "ALL" || log.type === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        log.serviceId.toString().includes(q) ||
        log.serviceName.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Real-Time Services Activity Log
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Stay up to date with core API list updates, market competitive rate adjustments, and newly introduced social services.
          </p>
        </div>

        {/* Local Feed Search */}
        <div className="relative w-full md:w-80">
          <label htmlFor="refill-search-logs" className="sr-only">Search updates</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="refill-search-logs"
            type="text"
            placeholder="Search log history by service id or terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Feed Filter tab choices */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-slate-150 rounded-lg w-fit">
        {(["ALL", "INCREASE", "DECREASE", "NEW"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeFilter === filter
                ? "bg-white text-indigo-700 shadow-xs border border-indigo-50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {filter === "ALL"
              ? "All Updates"
              : filter === "INCREASE"
              ? "Price Increases"
              : filter === "DECREASE"
              ? "Price Drops"
              : "Newly Added"}
          </button>
        ))}
      </div>

      {/* Activity Log Feed Stack */}
      <div className="space-y-3.5 max-w-4xl">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            return (
              <div
                key={log.id}
                className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-slate-200 transition-colors"
              >
                {/* Meta details */}
                <div className="flex items-start gap-3.5">
                  {/* Status Indicator Icon wrapper */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      log.type === "INCREASE"
                        ? "bg-rose-50 text-rose-500"
                        : log.type === "DECREASE"
                        ? "bg-emerald-50 text-emerald-500"
                        : "bg-indigo-50 text-indigo-500"
                    }`}
                  >
                    {log.type === "INCREASE" ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : log.type === "DECREASE" ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs">
                        Service #{log.serviceId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">•</span>
                      <span className="text-[10px] text-slate-400 font-bold">{log.date}</span>
                    </div>

                    <h4 className="text-sm font-black text-slate-800 mt-1 leading-tight">
                      {log.serviceName}
                    </h4>
                  </div>
                </div>

                {/* Rates adjustments pill badges */}
                <div className="flex items-center gap-2 max-w-fit shrink-0 sm:self-center">
                  {log.type === "INCREASE" && (
                    <span className="inline-flex flex-col items-end">
                      <span className="px-3 py-1 bg-rose-55 hover:bg-rose-105 rounded-full text-[10px] font-black text-rose-700 tracking-wider">
                        PRICE INCREASED TO {formatCost(log.newRate)}
                      </span>
                      {log.oldRate && (
                        <span className="text-[9px] font-bold text-slate-400 mt-1">
                          Old Rate: {formatCost(log.oldRate)} / 1000
                        </span>
                      )}
                    </span>
                  )}

                  {log.type === "DECREASE" && (
                    <span className="inline-flex flex-col items-end">
                      <span className="px-3 py-1 bg-emerald-55 hover:bg-emerald-105 rounded-full text-[10px] font-black text-emerald-700 tracking-wider">
                        MEGA PRICE DROP TO {formatCost(log.newRate)}
                      </span>
                      {log.oldRate && (
                        <span className="text-[9px] font-bold text-slate-400 mt-1 line-through">
                          Old Rate: {formatCost(log.oldRate)} / 1000
                        </span>
                      )}
                    </span>
                  )}

                  {(log.type === "ADD" || log.type === "NEW") && (
                    <span className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-750 tracking-wider">
                      NEW SERVICE REGISTERED TO {formatCost(log.newRate)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-400 font-bold bg-white rounded-xl border border-slate-100">
            No service update records found in this category filter.
          </div>
        )}
      </div>
    </div>
  );
};
