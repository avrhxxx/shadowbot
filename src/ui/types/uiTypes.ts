// =====================================
// 📁 src/ui/types/uiTypes.ts
// =====================================

/**
 * 🧠 ROLE:
 * Centralne typy dla UI Engine:
 * - View, Button, Modal, Interaction
 * - Używane zarówno w engine jak i w publicznym API
 * 
 * 📥 INPUT:
 * - Dev/API przekazuje state, opcje, akcje
 * 
 * 📤 OUTPUT:
 * - Typy dla store, engine i trace
 */

// =====================================
// 🔹 UI ID
// =====================================

export type UIId = string; // unikalne ID dla widoków, buttonów, modalów

// =====================================
// 🔹 BUTTONS
// =====================================

export type ButtonStyle = "primary" | "secondary" | "danger" | "link";

export type ButtonAction = (state?: Record<string, any>) => void | Promise<void>;

export type Button = {
  id: UIId;
  label: string;
  style?: ButtonStyle;
  action: ButtonAction;
  disabled?: boolean;
  state?: Record<string, any>;
};

// =====================================
// 🔹 MODALS
// =====================================

export type ModalFieldType = "text" | "number" | "select" | "checkbox" | "textarea";

export type ModalField = {
  id: string;
  label: string;
  type: ModalFieldType;
  required?: boolean;
  default?: any;
  options?: string[]; // dla select
};

export type ModalDefinition = {
  id: UIId;
  title: string;
  fields: ModalField[];
  state?: Record<string, any>;
  onSubmit?: (data: Record<string, any>, state?: Record<string, any>) => void | Promise<void>;
};

// =====================================
// 🔹 VIEWS
// =====================================

export type ViewType = "default" | "ephemeral" | "wizard";

export type ViewOptions = {
  ephemeral?: boolean;      // czy widok jest tymczasowy
  ttl?: number;             // czas życia w ms dla ephemeral
  parentId?: UIId;          // do follow-up / wizard
};

export type View = {
  id: UIId;
  type?: ViewType;
  title?: string;
  content?: string;            // tekst / embed
  buttons?: Button[];
  modals?: ModalDefinition[];
  state?: Record<string, any>;
  options?: ViewOptions;
};

// =====================================
// 🔹 INTERACTIONS
// =====================================

export type InteractionType = "button" | "modal" | "view";

export type Interaction = {
  id: UIId;                   // customId dla Discord API
  type: InteractionType;
  targetId?: UIId;            // powiązany view / modal
  state?: Record<string, any>;
  metadata?: Record<string, any>;
};

// =====================================
// 🔹 INTERNALS / STACK
// =====================================

export type ViewStackItem = {
  view: View;
  timestamp: number;         // do TTL / expiration
};