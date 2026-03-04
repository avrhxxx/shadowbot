// src/utils/utcOffsets.ts

/**
 * Baza najważniejszych stref czasowych na świecie
 * ⚠️ Offset w godzinach, półgodzinne wartości uwzględnione
 */
export const countryToUTCOffset: Record<string, number> = {
  // 🇪🇺 Europa
  "Portugal (Lisbon)": 0,
  "United Kingdom (London)": 0,
  "Ireland (Dublin)": 0,
  "Spain (Madrid)": 1,
  "France (Paris)": 1,
  "Germany (Berlin)": 1,
  "Italy (Rome)": 1,
  "Netherlands (Amsterdam)": 1,
  "Belgium (Brussels)": 1,
  "Sweden (Stockholm)": 1,
  "Norway (Oslo)": 1,
  "Denmark (Copenhagen)": 1,
  "Poland (Warsaw)": 1,
  "Czech Republic (Prague)": 1,
  "Austria (Vienna)": 1,
  "Switzerland (Zurich)": 1,
  "Greece (Athens)": 2,
  "Finland (Helsinki)": 2,
  "Turkey (Istanbul)": 3,

  // 🇷🇺 Rosja – kilka reprezentatywnych stref
  "Russia (Kaliningrad)": 2,
  "Russia (Moscow)": 3,
  "Russia (Samara)": 4,
  "Russia (Yekaterinburg)": 5,
  "Russia (Omsk)": 6,
  "Russia (Krasnoyarsk)": 7,
  "Russia (Irkutsk)": 8,
  "Russia (Yakutsk)": 9,
  "Russia (Vladivostok)": 10,
  "Russia (Magadan)": 11,
  "Russia (Kamchatka)": 12,

  // 🇺🇸 USA + Kanada
  "USA (Eastern - New York)": -5,
  "USA (Central - Chicago)": -6,
  "USA (Mountain - Denver)": -7,
  "USA (Pacific - Los Angeles)": -8,
  "Canada (Eastern - Toronto)": -5,
  "Canada (Central - Winnipeg)": -6,
  "Canada (Mountain - Calgary)": -7,
  "Canada (Pacific - Vancouver)": -8,
  "Canada (Newfoundland - St. John's)": -3.5,

  // 🇧🇷 Brazylia – kilka stref
  "Brazil (Brasilia)": -3,
  "Brazil (Manaus)": -4,
  "Brazil (Fernando de Noronha)": -2,
  "Argentina (Buenos Aires)": -3,
  "Chile (Santiago)": -4,

  // 🇨🇳 Azja i inne duże kraje
  "China (Beijing)": 8,
  "Japan (Tokyo)": 9,
  "South Korea (Seoul)": 9,
  "India (New Delhi)": 5.5,
  "Thailand (Bangkok)": 7,
  "Vietnam (Hanoi)": 7,
  "Indonesia (Jakarta)": 7,
  "Indonesia (Bali)": 8,
  "Indonesia (Papua)": 9,
  "Malaysia (Kuala Lumpur)": 8,
  "Singapore (Singapore)": 8,
  "Philippines (Manila)": 8,
  "Bangladesh (Dhaka)": 6,
  "Pakistan (Karachi)": 5,
  "Nepal (Kathmandu)": 5.75,
  "Sri Lanka (Colombo)": 5.5,
  "Kazakhstan (Almaty)": 6,
  "Kazakhstan (Nur-Sultan)": 5,

  // 🇦🇺 Australia / Oceania
  "Australia (Sydney)": 10,
  "Australia (Perth)": 8,
  "New Zealand (Wellington)": 12,

  // 🇿🇦 Afryka
  "South Africa (Cape Town)": 2,
  "Egypt (Cairo)": 2,
  "Kenya (Nairobi)": 3
};