import { Category, ServiceUpdate } from "./types";

// Default Rate conversions: 1 USD = 83 INR (for conversion in UI)
export const INR_TO_USD_RATE = 1 / 83;

export const CATEGORIES_DATA: Category[] = [
  {
    id: "ig-followers-stable",
    name: "Instagram Followers - [ Ultra Stable Server ] 🔥",
    icon: "Users2",
    services: [
      {
        id: 1998,
        name: "IG Followers | 365 Days | 0 to 5% Drop Normally",
        rate: 70.68,
        min: 100,
        max: 100000,
        description: "🌟 Service Grade - A+ Grade\n🌟 Philippines Special Import\n🌟 Good support Available in this service\n\n➕Additional Information\nStart in - 0 - 5 Minutes\nSpeed After Start - 60K - 70K/Day\nQuality - Supper High"
      },
      {
        id: 1986,
        name: "IG Followers | Lifetime Guaranteed -[ Non Drop ] 🔥",
        rate: 72.50,
        min: 100,
        max: 50000,
        description: "⚡ Start style - Instant to 10 Minutes\n⚡ Speed - 50K/Day\n⚡ Quality - Mix Real Look Profiles\n⚡ Refill - Lifetime refill guarantee on click"
      },
      {
        id: 1987,
        name: "IG Followers | Lifetime | Market Most - [ Non Drop ] 🔥",
        rate: 76.14,
        min: 100,
        max: 5000000,
        description: "🌟 Best for organic business pages\n🌟 Lifetime stable refill guarantee\n🌟 Speed: 40k per day\n🌟 No drops experienced on past test groups"
      }
    ]
  },
  {
    id: "ig-followers-indian",
    name: "Instagram Followers 🇮🇳 - [ Indian ]",
    icon: "Compass",
    services: [
      {
        id: 1978,
        name: "Instagram Indian Followers 🇮🇳 | Lifetime Refill ♻️",
        rate: 109.75,
        min: 100,
        max: 25000,
        description: "📊 Service Grade - A+ Grade\n📊 Finest Indian Quality\n📊 All Profiles Have 100+ Followers\n📊 30 to 60% Profiles have Stories\n\n➕Additional Information\nStart in - 5 - 30 Minutes Normally\nQuality - Premium Indian Quality\nSpeed After Start - Approx 10K/Day"
      },
      {
        id: 1945,
        name: "Instagram Indian Followers 🇮🇳 [ Active Accounts ] - Slow Speed",
        rate: 145.20,
        min: 50,
        max: 10000,
        description: "📊 real active Indian users who like stories.\n📊 Start Time: 1 hour\n📊 Speed: 1k - 2k/day"
      }
    ]
  },
  {
    id: "ig-likes-indian",
    name: "IG Likes 🇮🇳 - [ Indian / Ultra ]",
    icon: "Heart",
    services: [
      {
        id: 1919,
        name: "Instagram Likes 🇮🇳 | Lifetime Refill | INDIAN MIX",
        rate: 21.99,
        min: 100,
        max: 100000,
        description: "❤️ Quick Indian profile Likes\n❤️ Zero Drop rate reported\n❤️ Start Time: Instant\n❤️ Speed: High (20k/day)"
      },
      {
        id: 1878,
        name: "Instagram Likes | 🇮🇳 Only Indians - Super Fast",
        rate: 31.73,
        min: 100,
        max: 50000,
        description: "❤️ 100% Core Indian profiles liking your posts.\n❤️ Super Stable\n❤️ Refill: Lifetime Guaranteed"
      }
    ]
  },
  {
    id: "ig-views-fast",
    name: "IG Views |- Supper Fast ⚡",
    icon: "Eye",
    services: [
      {
        id: 2032,
        name: "IG Reel Views |- 2 Million Per Hour - Fastest Services",
        rate: 0.31,
        min: 100,
        max: 100000000,
        description: "⚡ Service Grade - A+\n⚡ Fastest Views service in market\n⚡ This Service Always Works Instantly\n\n➕Additional Information\nStart - In 5-10 Seconds\nSpeed After Start - Approx 50 Million/Day\nDrop Ratio - Non Drop"
      },
      {
        id: 1886,
        name: "IG Story Views - ⚡ Instant",
        rate: 15.11,
        min: 100,
        max: 5000,
        description: "🌟 Start - Normally 0 - 10 Minutes\n🌟 Speed - 50K/Day\n🌟 Quality - Mix\n🌟 Refill - No\n\n✔️ Correct Link - smm_viraj\n✖️ Wrong Link - @smm_viraj\n✖️ Wrong Link - https://instagram.com/stories/smm_viraj/587Utm\n\n🔗 Link - PUT ONLY USERNAME - WITHOUT @\n\n➕Additional Information\nService Grade - A Grade\nRecommended By Admin"
      }
    ]
  },
  {
    id: "telegram-members",
    name: "Telegram Members - [ Zero Drop & Stable ] ✈️",
    icon: "MessageSquare",
    services: [
      {
        id: 2041,
        name: "Telegram Channels/Groups Members | Non Drop | Lifetime Stable",
        rate: 89.40,
        min: 100,
        max: 200000,
        description: "✈️ Real organic Telegram Telegram members\n✈️ Works for both Public & Private Channels\n✈️ No drops recorded\n⚡ Instant startup"
      },
      {
        id: 2045,
        name: "Telegram Posts Views | Last 10 Posts | Super Fast",
        rate: 2.10,
        min: 100,
        max: 500000,
        description: "⚡ Auto-views for your last 10 channels posts.\n⚡ Speed: Instant\n⚡ Multi-view system"
      }
    ]
  },
  {
    id: "youtube-subscribers",
    name: "YouTube Subscriber - Non Drop ♻️",
    icon: "Youtube",
    services: [
      {
        id: 1968,
        name: "YouTube Subscribers | Lifetime Stable - No Drop [ Slow/Safe speed ]",
        rate: 328.23,
        min: 50,
        max: 50000,
        description: "📺 Organic safe subscription methods\n📺 Start time: 12-24 hours\n📺 Guaranteed 100% Lifetime Refill\n📺 Drop Rate: 0-2%"
      },
      {
        id: 1966,
        name: "YouTube Subscribers | Ultra Fast - [ 500-1K/Day ]",
        rate: 440.20,
        min: 100,
        max: 100000,
        description: "📺 Fast-track monetization boost\n📺 Start: Instant\n📺 Non-Drop Guaranteed"
      }
    ]
  },
  {
    id: "tiktok-stats",
    name: "Tiktok Followers / Likes / Views 🎵",
    icon: "Music",
    services: [
      {
        id: 1957,
        name: "Tiktok Followers High Quality [ Non-Drop ] | 300k days",
        rate: 294.80,
        min: 50,
        max: 100000,
        description: "🎵 Global active TikTok accounts\n🎵 Start: 0-30m\n🎵 Guaranteed Refill 365 Days"
      },
      {
        id: 1959,
        name: "Tiktok Likes Super Stable [ Non-Drop ]",
        rate: 9.06,
        min: 50,
        max: 100000,
        description: "🎵 Video likes boost from active streams\n🎵 Quick delivery"
      },
      {
        id: 1960,
        name: "Emergency Tiktok Views [ 10M - 20M / Hr ]",
        rate: 1.91,
        min: 100,
        max: 217545,
        description: "🎵 Rocket-speed view injection\n🎵 Non-Drop views\n⚡ Start: instant"
      }
    ]
  },
  {
    id: "facebook-services",
    name: "Facebook Followers & Likes Page / Profile 👥",
    icon: "Facebook",
    services: [
      {
        id: 2024,
        name: "Facebook Followers | Page and Profile | Day Speed 10K | 30 Days Refill",
        rate: 33.23,
        min: 50,
        max: 100000,
        description: "👥 High-quality profiles matching targeted audience.\n👥 Safe for pages and profiles.\n👥 Start in: 10-30 minutes."
      },
      {
        id: 1811,
        name: "Facebook Video / Reels Views | 3 Sec - 200K/Day - Instant Start",
        rate: 3.22,
        min: 500,
        max: 214748,
        description: "⚡ Instant video view metrics booster.\n⚡ Drop-free views"
      }
    ]
  }
];

export const SERVICE_UPDATES: ServiceUpdate[] = [
  {
    id: 1,
    serviceId: 1886,
    serviceName: "IG Story Views - ⚡ Instant",
    date: "2026-05-20 13:22:18",
    type: "INCREASE",
    oldRate: 14.11,
    newRate: 15.11
  },
  {
    id: 2,
    serviceId: 1959,
    serviceName: "Tiktok Likes Super Stable [ Non-Drop ]",
    date: "2026-05-20 13:09:18",
    type: "DECREASE",
    oldRate: 11.50,
    newRate: 9.06
  },
  {
    id: 3,
    serviceId: 1958,
    serviceName: "Tiktok Followers High Quality",
    date: "2026-05-20 13:09:18",
    type: "INCREASE",
    oldRate: 280.12,
    newRate: 294.80
  },
  {
    id: 4,
    serviceId: 2032,
    serviceName: "IG Reel Views |- 2 Million Per Hour",
    date: "2026-05-20 12:45:00",
    type: "NEW",
    newRate: 0.31
  }
];
