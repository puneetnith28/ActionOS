# UI & Design System

ActionOS leverages a highly polished, custom-tailored frontend architecture. Because the system is designed to replace chat interfaces with autonomous execution, the UI acts as a **Mission Control Console** rather than a conversational wrapper.

---

## 1. The "Calm > Flashy" Philosophy

The design system is heavily inspired by professional developer tools and enterprise dashboards (e.g., Linear, Vercel, Raycast). 

* **Dark Mode First:** The application relies on deep charcoal and slate backgrounds, reducing eye strain for operators monitoring long-running background tasks.
* **Semantic Colors Only:** Bright colors (Red, Green, Blue) are strictly reserved for state changes (Failed, Done, Running). They are never used decoratively, ensuring that when an error occurs, it instantly draws the operator's attention.
* **Information Density:** Components are designed to present complex, nested data (like JSON parameters and timeline events) cleanly using collapsible areas and monospaced typography.

---

## 2. Technology Stack

The ActionOS Operations Console is built on modern web standards:

1. **Next.js 15 (App Router):** Utilizes React Server Components (RSC) for fast initial page loads and secure data fetching, alongside Client Components for rich interactivity.
2. **Tailwind CSS:** The utility-first CSS framework powers the entire styling engine, ensuring zero dead CSS and rapid layout adjustments.
3. **Shadcn UI:** Rather than using a bloated, pre-packaged component library, ActionOS uses Shadcn UI. Components like Buttons, Dropdowns, and Dialogs are generated directly into the `components/ui` folder, providing 100% control over the DOM and styling.
4. **Framer Motion:** Used exclusively for micro-interactions (e.g., the smooth sliding of timeline events, layout transitions, and subtle pulse animations for active tasks).

---

## 3. Core Architectural Components

### The Global Layout (`app/(workspace)/layout.tsx`)
The application is wrapped in a consistent, persistent shell:
* **Sidebar (`app-sidebar.tsx`):** A responsive, collapsible navigation menu detailing active missions, system health, and secure logout mechanisms.
* **Workspace Header (`workspace-header.tsx`):** A dynamic breadcrumb and status bar that pings the Firebase backend on mount to display a live "SYSTEM ONLINE" / "SYSTEM OFFLINE" heartbeat.

### Glassmorphism & Depth
ActionOS avoids flat, boring designs by utilizing layered depth:
* **`GridBackground` & `NeonMesh`:** Subtle, animated background layers that provide texture without distracting from the data.
* **`GlassCard`:** A reusable container component utilizing CSS backdrop-filters (`backdrop-blur`) and semi-transparent borders to create a premium, frosted-glass effect for mission details and forms.

### The Event Timeline (`mission-result.tsx`)
Because missions run asynchronously over hours or days, the UI must visualize the passage of time and state changes clearly.
* Uses Framer Motion to animate new events as they arrive from the Firestore ledger.
* Icons dynamically map to Genkit actions (e.g., Brain icon for Planning, Mail icon for Email Capabilities, Alert icon for Interventions).

---

## 4. Typography

ActionOS relies on a modern, highly legible font stack:
* **Headers & UI Elements:** Inter (or system sans-serif like SF Pro).
* **Code & Logs:** JetBrains Mono (or similar monospaced fonts) to ensure JSON schemas, IDs, and raw model outputs are perfectly aligned and easy to read.
