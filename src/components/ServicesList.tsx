import React, { useState } from "react";
import { Search, Info, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Category, Service, Currency } from "../types";
import { CATEGORIES_DATA, INR_TO_USD_RATE } from "../servicesData";

interface ServicesListProps {
  currency: Currency;
  onCopyServiceId?: (id: number) => void;
  categories?: Category[];
}

export const ServicesList: React.FC<ServicesListProps> = ({ 
  currency, 
  onCopyServiceId, 
  categories = CATEGORIES_DATA 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    // Expand first category by default
    const initial: Record<string, boolean> = {};
    if (categories.length > 0) {
      initial[categories[0].id] = true;
    }
    return initial;
  });
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<Service | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyId = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    if (onCopyServiceId) {
      onCopyServiceId(id);
    }
  };

  // Format currency value
  const formatCost = (valInI_N_R: number) => {
    if (currency === Currency.USD) {
      return `$ ${(valInI_N_R * INR_TO_USD_RATE).toFixed(4)}`;
    }
    return `₹ ${valInI_N_R.toFixed(2)}`;
  };

  // Filter service categories list
  const getFilteredCategories = (): Category[] => {
    const query = searchQuery.toLowerCase();
    if (!query) return categories;

    return categories.map((category) => {
      const matchCategory = category.name.toLowerCase().includes(query);
      const matchServices = (category.services || []).filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          service.id.toString().includes(query) ||
          service.description.toLowerCase().includes(query)
      );

      if (matchCategory || matchServices.length > 0) {
        return {
          ...category,
          services: matchServices.length > 0 ? matchServices : category.services
        };
      }
      return null;
    }).filter(Boolean) as Category[];
  };

  const filteredCategories = getFilteredCategories();

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Our SMM Campaigns List
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Compare services, rates, min / max limits, and find the perfect speed target for your socials.
          </p>
        </div>

        {/* Global Catalog Search */}
        <div className="relative w-full md:w-80">
          <label htmlFor="catalog-search" className="sr-only">Search services</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="catalog-search"
            type="text"
            placeholder="Search core services catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Services Categories Deck */}
      <div className="space-y-4">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => {
            const isExpanded = !!expandedCategories[category.id];
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden"
              >
                {/* Category Header Bar */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full bg-slate-50 p-4 font-extrabold text-xs flex items-center justify-between text-left text-indigo-950 border-b border-indigo-50 hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">
                      {category.services.length} Serv.
                    </span>
                    <span className="truncate pr-3 font-extrabold text-sm text-slate-800">{category.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {/* Services Table inside Expanded category */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-4 w-20">ID</th>
                          <th className="py-2.5 px-4">Service Details</th>
                          <th className="py-2.5 px-4 text-right">Rate / 1,000</th>
                          <th className="py-2.5 px-4 text-right">Min Order</th>
                          <th className="py-2.5 px-4 text-right">Max Order</th>
                          <th className="py-2.5 px-4 text-center">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {category.services.map((service) => (
                          <tr key={service.id} className="hover:bg-slate-50/30 transition-colors">
                            {/* Copyable Service ID */}
                            <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                              <button
                                onClick={() => handleCopyId(service.id)}
                                className="px-2 py-0.5 bg-slate-100 font-mono text-[10px] text-slate-500 rounded hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                title="Click to copy Service ID"
                              >
                                {copiedId === service.id ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                )}
                                <span>{service.id}</span>
                              </button>
                            </td>

                            <td className="py-3 px-4 max-w-md">
                              <p className="font-bold text-slate-800 leading-tight">{service.name}</p>
                            </td>

                            <td className="py-3 px-4 text-right font-black font-mono text-emerald-600 whitespace-nowrap">
                              {formatCost(service.rate)}
                            </td>

                            <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {service.min.toLocaleString()}
                            </td>

                            <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {service.max.toLocaleString()}
                            </td>

                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedServiceDetails(service)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5 text-indigo-500" />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-400 font-bold bg-white rounded-xl border border-slate-100">
            No service results match your catalog query.
          </div>
        )}
      </div>

      {/* Expanded Service Description Drawer Modal */}
      {selectedServiceDetails && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-indigo-50 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold font-mono rounded">
                  Service ID: #{selectedServiceDetails.id}
                </span>
                <h4 className="text-sm font-black text-slate-800 mt-1 leading-tight">
                  {selectedServiceDetails.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedServiceDetails(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1.5"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Core Limits Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Charge Rate</span>
                  <span className="text-xs font-black text-slate-800 mt-0.5 block">{formatCost(selectedServiceDetails.rate)}/K</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Min Limit</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedServiceDetails.min.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Limit</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedServiceDetails.max.toLocaleString()}</span>
                </div>
              </div>

              {/* Instructions and Description text */}
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Instructions</h5>
                <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-xl max-h-60 overflow-y-auto">
                  <p className="text-xs text-emerald-800 font-semibold whitespace-pre-wrap leading-relaxed">
                    {selectedServiceDetails.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedServiceDetails(null)}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
