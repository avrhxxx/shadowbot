// =====================================
// 📁 src/ui/types/uiOptions.ts
// =====================================

/**
 * 🧠 ROLE:
 * Opcje i konfiguracje dla UI Engine:
 * - Dynamic state, ephemeral, TTL
 * - Follow-up / wizard / stack
 * - Button / modal / view rendering
 * 
 * 📥 INPUT:
 * - Dev/API podaje opcje przy tworzeniu / aktualizacji widoków
 * 
 * 📤 OUTPUT:
 * - Typy dla store, engine i API
 */

// =====================================
// 🔹 GLOBAL OPTIONS DLA VIEW
// =====================================

export type UIOptions = {
  ephemeral?: boolean;        // tymczasowy widok
  ttl?: number;               // czas życia w ms dla ephemeral
  parentId?: string;          // do follow-up / wizard
  allowUndo?: boolean;        // możliwość powrotu do poprzedniego kroku
  autoFocus?: boolean;        // automatyczne ustawienie focus na pierwszy element
};

// =====================================
// 🔹 DYNAMIC STATE
// =====================================

export type DynamicState = {
  label?: string;             // zmiana label buttona
  style?: "primary" | "secondary" | "danger" | "link"; // zmiana style
  disabled?: boolean;         // w locie klikalność
  state?: Record<string, any>; // dodatkowy stan buttona / modala / view
};

// =====================================
// 🔹 BUTTON OPTIONS
// =====================================

export type ButtonOptions = DynamicState & {
  row?: number;               // numer rzędu w widoku
  groupId?: string;           // grupa buttonów dla batch update
};

// =====================================
// 🔹 MODAL OPTIONS
// =====================================

export type ModalOptions = {
  title?: string;             // dynamiczna zmiana tytułu
  state?: Record<string, any>;
  dynamicFields?: Record<string, Partial<FieldDynamic>>; // zmiana pól input
};

export type FieldDynamic = {
  label?: string;
  default?: any;
  required?: boolean;
  options?: string[];
};

// =====================================
// 🔹 INTERACTION OPTIONS
// =====================================

export type InteractionOptions = {
  defer?: boolean;            // czy odroczyć odpowiedź
  ephemeral?: boolean;        // odpowiedź ephemeral
  followUp?: boolean;         // chain / follow-up
  state?: Record<string, any>;
};

// =====================================
// 🔹 WIZARD / NEXT VIEW STACK
// =====================================

export type WizardOptions = {
  stackable?: boolean;        // automatyczne stackowanie widoków
  followUp?: boolean;         // ephemeral follow-up
  maxStackDepth?: number;     // limit stacku
};