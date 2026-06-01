import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, CreditCard, Ticket, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Category, Service, Currency, Order } from "../types";
import { CATEGORIES_DATA, INR_TO_USD_RATE } from "../servicesData";

interface NewOrderProps {
  balance: number;
  currency: Currency;
  ticketsCount: number;
  onPlaceOrder: (orderData: {
    categoryName: string;
    serviceId: number;
    serviceName: string;
    link: string;
    quantity: number;
    charge: number;
  }) => void;
  ordersCount: number;
  categories?: Category[];
  isLoadingCategories?: boolean;
  providerActive?: boolean | null;
  providerBalance?: string | null;
}

export const NewOrder: React.FC<NewOrderProps> = ({
  balance,
  currency,
  ticketsCount,
  onPlaceOrder,
  ordersCount,
  categories = CATEGORIES_DATA,
  isLoadingCategories = false,
  providerActive = null,
  providerBalance = null
}) => {
  // Filterable categories/services
  const [searchQuery, setSearchQuery] = useState("");
  
  // Set default state parameters safely
  const initialCategory = categories[0] || CATEGORIES_DATA[0];
  const initialService = (initialCategory.services && initialCategory.services[0]) || CATEGORIES_DATA[0].services[0];

  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategory.id);
  const [selectedServiceId, setSelectedServiceId] = useState<number>(initialService ? initialService.id : 0);

  const [linkValue, setLinkValue] = useState("");
  const [quantityValue, setQuantityValue] = useState<number | "">("");
  const [chargeValue, setChargeValue] = useState(0);

  // Error and success alerts
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync category selection whenever the categories prop updates (e.g. loads from API or default lists)
  useEffect(() => {
    if (categories && categories.length > 0) {
      if (!categories.some(cat => cat.id === selectedCategoryId)) {
        const firstCat = categories[0];
        setSelectedCategoryId(firstCat.id);
        if (firstCat.services && firstCat.services.length > 0) {
          setSelectedServiceId(firstCat.services[0].id);
        }
      }
    }
  }, [categories, selectedCategoryId]);

  // Filter Categories / Services based on search query
  const getFilteredCategories = (): Category[] => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories.map((category) => {
      // Check if category name matches or any services name matches
      const categoryMatches = category.name.toLowerCase().includes(query);
      const matchedServices = (category.services || []).filter((service) =>
        service.name.toLowerCase().includes(query) || service.id.toString().includes(query)
      );

      if (categoryMatches || matchedServices.length > 0) {
        return {
          ...category,
          // If category matched but services didn't, show all services, else show matched ones
          services: matchedServices.length > 0 ? matchedServices : category.services
        };
      }
      return null;
    }).filter(Boolean) as Category[];
  };

  const filteredCategories = getFilteredCategories();

  // Pick active category details
  const activeCategory =
    filteredCategories.find((cat) => cat.id === selectedCategoryId) ||
    filteredCategories[0] ||
    categories[0] ||
    CATEGORIES_DATA[0];

  const activeService =
    activeCategory && activeCategory.services && activeCategory.services.length > 0
      ? (activeCategory.services.find((serv) => serv.id === selectedServiceId) || activeCategory.services[0])
      : CATEGORIES_DATA[0].services[0];

  // Auto-adjust selections when search or active category lists update
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const firstCatId = filteredCategories[0].id;
      // If current category isn't in filtered list, reset it
      if (!filteredCategories.some((cat) => cat.id === selectedCategoryId)) {
        setSelectedCategoryId(firstCatId);
      }
    }
  }, [searchQuery, filteredCategories, selectedCategoryId]);

  useEffect(() => {
    if (activeCategory && activeCategory.services && activeCategory.services.length > 0) {
      if (!activeCategory.services.some((serv) => serv.id === selectedServiceId)) {
        setSelectedServiceId(activeCategory.services[0].id);
      }
    }
  }, [selectedCategoryId, activeCategory, selectedServiceId]);

  // Recalculate charges dynamically
  useEffect(() => {
    if (activeService && typeof quantityValue === "number") {
      const baseCost = (quantityValue * activeService.rate) / 1000;
      setChargeValue(baseCost);
    } else {
      setChargeValue(0);
    }
  }, [quantityValue, activeService]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedServiceId(Number(e.target.value));
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!activeService) {
      setErrorMsg("Please select a valid service.");
      return;
    }

    if (!linkValue.trim()) {
      setErrorMsg("Link cannot be empty. Please enter URL or username.");
      return;
    }

    if (quantityValue === "" || quantityValue <= 0) {
      setErrorMsg("Please provide a valid quantity.");
      return;
    }

    if (quantityValue < activeService.min) {
      setErrorMsg(`Minimum quantity limit for this service is ${activeService.min}.`);
      return;
    }

    if (quantityValue > activeService.max) {
      setErrorMsg(`Maximum quantity limit for this service is ${activeService.max}.`);
      return;
    }

    // Convert balance check to INR
    const costInI_N_R = chargeValue;
    if (balance < costInI_N_R) {
      setErrorMsg(
        `Insufficient wallet balance! Cost is ₹${costInI_N_R.toFixed(
          2
        )} (${formatCost(costInI_N_R)}) while your balance is ₹${balance.toFixed(2)} (${formatCost(balance)}). Please add funds.`
      );
      return;
    }

    // Execute order
    onPlaceOrder({
      categoryName: activeCategory.name,
      serviceId: activeService.id,
      serviceName: activeService.name,
      link: linkValue,
      quantity: quantityValue,
      charge: chargeValue
    });

    setSuccessMsg(
      `🎉 Congratulations! Order for ${quantityValue}x ${activeService.name} has been placed successfully.`
    );
    setLinkValue("");
    setQuantityValue("");
  };

  // Convert and format cost
  const formatCost = (valInI_N_R: number) => {
    if (currency === Currency.USD) {
      return `$ ${(valInI_N_R * INR_TO_USD_RATE).toFixed(4)}`;
    }
    return `₹ ${valInI_N_R.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-sky-100 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
              Total SMM Orders
            </p>
            <h3 className="text-2xl font-black text-slate-900 leading-tight">
              {ordersCount.toLocaleString()}
            </h3>
            <span className="text-[10px] font-medium text-slate-400">All platforms processed</span>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" id="total-orders-card" />
          </div>
        </div>

        {/* Card 2: Current Balance */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 flex items-center justify-between shadow-xs">
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
              Wallet Balance
            </p>
            <h3 className="text-2xl font-black text-emerald-600 leading-tight">
              {formatCost(balance)}
            </h3>
            <span className="text-[10px] font-medium text-emerald-600 block">
              🟢 Ready to spend
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Tickets */}
        <div className="bg-white p-5 rounded-xl border border-indigo-100 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
              Support Tickets
            </p>
            <h3 className="text-2xl font-black text-indigo-700 leading-tight">
              {ticketsCount} Open
            </h3>
            <span className="text-[10px] font-medium text-indigo-500">Your helpdesk cases</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Provider API Integration Connection Status */}
      {providerActive !== null && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          providerActive
            ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
            : "bg-amber-50/50 border-amber-105 text-amber-800"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${providerActive ? "bg-emerald-400" : "bg-amber-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${providerActive ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            </span>
            <span className="font-bold">
              {providerActive 
                ? "Live Provider API Synchronized"
                : "Standalone Demo Mode — Displaying cached offline catalogues"}
            </span>
          </div>
        </div>
      )}

      {/* 2. Order Submission Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-50 pb-3 flex items-center gap-2">
          <span className="p-1 px-2.5 bg-indigo-50 text-indigo-600 text-xs font-extrabold rounded-md">1</span>
          Place High-Speed Campaign
        </h3>

        {/* Live Search Input */}
        <div className="relative">
          <label htmlFor="service-search-input" className="sr-only">Search services</label>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="service-search-input"
            type="text"
            placeholder="Search for Instagram, YouTube, Telegram services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-55 border border-slate-150 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-colors"
          />
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Category Dropdown */}
          <div className="space-y-1">
            <label htmlFor="order-category" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Category
            </label>
            <select
              id="order-category"
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option value="">No categories found matching your query</option>
              )}
            </select>
          </div>

          {/* Service Dropdown */}
          <div className="space-y-1">
            <label htmlFor="order-service" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Service
            </label>
            <select
              id="order-service"
              value={selectedServiceId}
              onChange={handleServiceChange}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              disabled={!activeCategory || activeCategory.services.length === 0}
            >
              {activeCategory && activeCategory.services.length > 0 ? (
                activeCategory.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    ({service.id}) {service.name} — [ {formatCost(service.rate)} /K ]
                  </option>
                ))
              ) : (
                <option value="">No services available</option>
              )}
            </select>
          </div>

          {/* Service Instructions / Description Box */}
          {activeService && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Service Description & Setup Instructions
              </h4>
              <p className="text-xs text-emerald-700 font-semibold whitespace-pre-wrap leading-relaxed">
                {activeService.description}
              </p>
            </div>
          )}

          {/* Core inputs panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target Link input */}
            <div className="space-y-1">
              <label htmlFor="campaign-link" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Link (Profile username / URL)
              </label>
              <input
                id="campaign-link"
                type="text"
                placeholder="https://instagram.com/p/... or @username"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                Ensure accounts are public before ordering.
              </span>
            </div>

            {/* Quantity Input */}
            <div className="space-y-1">
              <label htmlFor="campaign-quantity" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
                <span>Quantity</span>
                {activeService && (
                  <span className="text-[10px] font-bold text-slate-400 lowercase leading-tight">
                    Min: {activeService.min} - Max: {activeService.max}
                  </span>
                )}
              </label>
              <input
                id="campaign-quantity"
                type="number"
                placeholder={`Limits: ${activeService?.min} to ${activeService?.max}`}
                value={quantityValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantityValue(val === "" ? "" : Number(val));
                }}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Charges calculate instantly based on item count.
              </span>
            </div>
          </div>

          {/* Cost Charges Display (Disables manual inputs, automatically computed) */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-150 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 uppercase">Estimated Total Charge:</span>
            <div className="text-right">
              <span className="text-xl font-black text-indigo-700" id="campaign-charge-display">
                {formatCost(chargeValue)}
              </span>
              <p className="text-[9px] font-bold text-slate-400 leading-none mt-1">
                Rate used: {formatCost(activeService?.rate || 0)} per 1000 items
              </p>
            </div>
          </div>

          {/* Feedback logs */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit action button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:from-indigo-800 active:to-indigo-900 text-white font-extrabold text-sm rounded-xl select-none transition-all shadow-md active:scale-[0.99] cursor-pointer"
          >
            Submit Campaign Order
          </button>
        </form>
      </div>
    </div>
  );
};
