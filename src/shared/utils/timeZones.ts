// =====================================
// 📁 src/shared/utils/timeZones.ts
// =====================================

/**
 * Mapa krajów / regionów na prawdziwe strefy czasowe IANA
 * Używamy ich zamiast offsetów (obsługa DST działa automatycznie)
 */
export const countryToTimeZone: Record<string, string> = {
  // 🇪🇺 EUROPA
  "Portugal (Lisbon)": "Europe/Lisbon",
  "United Kingdom (London)": "Europe/London",
  "Ireland (Dublin)": "Europe/Dublin",
  "Spain (Madrid)": "Europe/Madrid",
  "France (Paris)": "Europe/Paris",
  "Germany (Berlin)": "Europe/Berlin",
  "Italy (Rome)": "Europe/Rome",
  "Netherlands (Amsterdam)": "Europe/Amsterdam",
  "Belgium (Brussels)": "Europe/Brussels",
  "Sweden (Stockholm)": "Europe/Stockholm",
  "Norway (Oslo)": "Europe/Oslo",
  "Denmark (Copenhagen)": "Europe/Copenhagen",
  "Poland (Warsaw)": "Europe/Warsaw",
  "Czech Republic (Prague)": "Europe/Prague",
  "Austria (Vienna)": "Europe/Vienna",
  "Switzerland (Zurich)": "Europe/Zurich",
  "Greece (Athens)": "Europe/Athens",
  "Finland (Helsinki)": "Europe/Helsinki",
  "Turkey (Istanbul)": "Europe/Istanbul",

  // 🇷🇺 ROSJA (kilka stref)
  "Russia (Kaliningrad)": "Europe/Kaliningrad",
  "Russia (Moscow)": "Europe/Moscow",
  "Russia (Yekaterinburg)": "Asia/Yekaterinburg",
  "Russia (Omsk)": "Asia/Omsk",
  "Russia (Krasnoyarsk)": "Asia/Krasnoyarsk",
  "Russia (Irkutsk)": "Asia/Irkutsk",
  "Russia (Yakutsk)": "Asia/Yakutsk",
  "Russia (Vladivostok)": "Asia/Vladivostok",
  "Russia (Magadan)": "Asia/Magadan",
  "Russia (Kamchatka)": "Asia/Kamchatka",

  // 🇺🇸 USA
  "USA (Eastern - New York)": "America/New_York",
  "USA (Central - Chicago)": "America/Chicago",
  "USA (Mountain - Denver)": "America/Denver",
  "USA (Pacific - Los Angeles)": "America/Los_Angeles",

  // 🇨🇦 KANADA
  "Canada (Eastern - Toronto)": "America/Toronto",
  "Canada (Central - Winnipeg)": "America/Winnipeg",
  "Canada (Mountain - Calgary)": "America/Edmonton",
  "Canada (Pacific - Vancouver)": "America/Vancouver",
  "Canada (Newfoundland - St. John's)": "America/St_Johns",

  // 🇧🇷 AMERYKA POŁUDNIOWA
  "Brazil (Brasilia)": "America/Sao_Paulo",
  "Brazil (Manaus)": "America/Manaus",
  "Argentina (Buenos Aires)": "America/Argentina/Buenos_Aires",
  "Chile (Santiago)": "America/Santiago",

  // 🌏 AZJA
  "China (Beijing)": "Asia/Shanghai",
  "Japan (Tokyo)": "Asia/Tokyo",
  "South Korea (Seoul)": "Asia/Seoul",
  "India (New Delhi)": "Asia/Kolkata",
  "Thailand (Bangkok)": "Asia/Bangkok",
  "Vietnam (Hanoi)": "Asia/Ho_Chi_Minh",
  "Indonesia (Jakarta)": "Asia/Jakarta",
  "Indonesia (Bali)": "Asia/Makassar",
  "Indonesia (Papua)": "Asia/Jayapura",
  "Malaysia (Kuala Lumpur)": "Asia/Kuala_Lumpur",
  "Singapore (Singapore)": "Asia/Singapore",
  "Philippines (Manila)": "Asia/Manila",
  "Bangladesh (Dhaka)": "Asia/Dhaka",
  "Pakistan (Karachi)": "Asia/Karachi",
  "Nepal (Kathmandu)": "Asia/Kathmandu",
  "Sri Lanka (Colombo)": "Asia/Colombo",
  "Kazakhstan (Almaty)": "Asia/Almaty",

  // 🌍 AFRYKA
  "South Africa (Cape Town)": "Africa/Johannesburg",
  "Egypt (Cairo)": "Africa/Cairo",
  "Kenya (Nairobi)": "Africa/Nairobi",

  // 🇦🇺 OCEANIA
  "Australia (Sydney)": "Australia/Sydney",
  "Australia (Perth)": "Australia/Perth",
  "New Zealand (Wellington)": "Pacific/Auckland"
};