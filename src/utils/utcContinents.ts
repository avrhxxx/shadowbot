// src/utils/utcContinents.ts
import { countryToTimeZone } from "./timeZones";

/**
 * Kontynenty → lista krajów (do select menu)
 */
export const continentToCountries: Record<string, string[]> = {
  "Europe": Object.keys(countryToTimeZone).filter(c =>
    c.includes("Portugal") ||
    c.includes("United Kingdom") ||
    c.includes("Ireland") ||
    c.includes("Spain") ||
    c.includes("France") ||
    c.includes("Germany") ||
    c.includes("Italy") ||
    c.includes("Netherlands") ||
    c.includes("Belgium") ||
    c.includes("Sweden") ||
    c.includes("Norway") ||
    c.includes("Denmark") ||
    c.includes("Poland") ||
    c.includes("Czech") ||
    c.includes("Austria") ||
    c.includes("Switzerland") ||
    c.includes("Greece") ||
    c.includes("Finland") ||
    c.includes("Turkey") ||
    c.includes("Russia")
  ),
  "North America": Object.keys(countryToTimeZone).filter(c => c.includes("USA") || c.includes("Canada")),
  "South America": Object.keys(countryToTimeZone).filter(c => c.includes("Brazil") || c.includes("Argentina") || c.includes("Chile")),
  "Asia": Object.keys(countryToTimeZone).filter(c =>
    c.includes("China") ||
    c.includes("Japan") ||
    c.includes("South Korea") ||
    c.includes("India") ||
    c.includes("Thailand") ||
    c.includes("Vietnam") ||
    c.includes("Indonesia") ||
    c.includes("Malaysia") ||
    c.includes("Singapore") ||
    c.includes("Philippines") ||
    c.includes("Bangladesh") ||
    c.includes("Pakistan") ||
    c.includes("Nepal") ||
    c.includes("Sri Lanka") ||
    c.includes("Kazakhstan")
  ),
  "Africa": Object.keys(countryToTimeZone).filter(c =>
    c.includes("South Africa") ||
    c.includes("Egypt") ||
    c.includes("Kenya")
  ),
  "Oceania": Object.keys(countryToTimeZone).filter(c =>
    c.includes("Australia") ||
    c.includes("New Zealand")
  ),
};