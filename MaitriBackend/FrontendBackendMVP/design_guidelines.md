# Maitri ASHA Dashboard Design Guidelines

## Design Approach
**Selected System**: Material Design 3  
**Rationale**: This is a data-intensive, mission-critical health monitoring dashboard requiring clear information hierarchy, strong visual feedback for emergency states, and proven patterns for data visualization and real-time alerts.

## Core Design Principles
1. **Clarity Over Aesthetics**: Information must be instantly scannable
2. **Alert Hierarchy**: Emergency states must dominate attention immediately
3. **Data Density**: Maximize information display without overwhelming users
4. **Accessibility**: High contrast, clear typography for varying tech literacy levels

---

## Typography System

**Font Family**: Roboto (primary), Roboto Mono (data/metrics)

**Scale**:
- Page Titles: 32px, Medium (500)
- Section Headers: 24px, Medium (500)
- Card Titles: 18px, Medium (500)
- Body Text: 16px, Regular (400)
- Data Labels: 14px, Regular (400)
- Metrics/Numbers: 28px, Bold (700) - Roboto Mono
- Captions/Timestamps: 12px, Regular (400)

---

## Layout System

**Spacing Units**: Tailwind units of 4, 6, 8, 12, 16
- Component padding: p-6
- Section spacing: gap-8, space-y-8
- Card margins: m-4
- Tight elements: gap-4
- Micro-spacing: gap-2

**Grid Structure**:
- Dashboard uses 12-column grid system
- Stats overview: 3-column grid (lg:grid-cols-3) showing key metrics
- Charts section: 2-column grid (lg:grid-cols-2)
- Alert feed: Single column, full-width sidebar on large screens

**Container Widths**:
- Main content: max-w-7xl mx-auto
- Stat cards: Equal width within grid
- Modal overlays: max-w-2xl

---

## Component Library

### Navigation
**Top App Bar** (Fixed):
- Height: h-16
- Logo left, user profile/notifications right
- Contains: App title "Maitri Dashboard", notification bell (badge count), user avatar/dropdown
- Shadow: shadow-md for elevation

### Dashboard Sections

**Statistics Overview** (Hero Section):
- 3 metric cards in grid layout
- Each card displays: Large number (calls today, active alerts, trend percentage)
- Icon + metric + trend indicator (↑↓)
- Card elevation: shadow-sm with hover:shadow-md

**Heat Map/Trends Section**:
- Section header with time filter dropdown (Today/Week/Month)
- Large area chart or heat map visualization
- District/village filtering sidebar
- Legend positioned bottom-right

**Category Breakdown**:
- Horizontal bar chart showing symptom categories
- Labels: Maternal, Infant, Menstrual, General
- Percentage bars with count labels

**Recent Calls Table**:
- Data table with columns: Time, Category, Severity (1-5 visual indicator), Status
- Severity shown as colored badges (not specifying colors, but 5 distinct visual weights)
- Row hover state for interactivity
- Pagination controls at bottom

### Emergency Alert System

**Alert Modal** (Break-Glass State):
- Full-screen overlay with backdrop blur
- Centered card: w-full max-w-2xl
- Pulsing border to indicate urgency
- Content structure:
  - Alert icon (large, 64px)
  - "Emergency Alert" header (32px bold)
  - Caller details grid (2 columns):
    - Left: Phone number, Village name, Timestamp
    - Right: Severity level, Risk category, AI reasoning
  - Primary action button: "Mark as Responded" (full width, h-12)
  - Secondary text link: "View full call transcript"

**Alert Feed Sidebar** (Persistent):
- Right sidebar: w-80
- Scrollable list of pending alerts
- Each item shows: timestamp, severity badge, village, quick-view button
- "All Clear" empty state with illustration placeholder

### Data Visualization

**Chart Containers**:
- White cards with shadow-sm
- Padding: p-6
- Header with title + info icon tooltip
- Chart occupies 80% of card height
- Footer with data source timestamp

---

## Interaction Patterns

**Loading States**:
- Skeleton loaders for data tables and charts
- Shimmer animation on metric cards during refresh

**Empty States**:
- Centered illustration placeholder
- Descriptive text: "No alerts at this time"
- Height: min-h-64

**Notifications**:
- Toast notifications slide from top-right
- Auto-dismiss after 5 seconds
- Stack vertically with gap-2

**Button Hierarchy**:
- Primary actions: Filled, h-10, px-6, rounded-lg
- Secondary: Outlined, same dimensions
- Tertiary: Text-only with underline on hover

---

## Responsive Strategy

**Desktop (lg:)**: Full dashboard with sidebar, 3-column stats
**Tablet (md:)**: Stacked sections, 2-column stats, collapsible sidebar
**Mobile (base)**: Single column, bottom navigation bar, stats carousel

**Breakpoint Adjustments**:
- App bar: Hamburger menu on mobile
- Alert modal: Full screen on mobile (w-full h-full)
- Tables: Horizontal scroll container on small screens

---

## Accessibility Requirements

- All interactive elements: min 44px tap target
- Focus indicators: 2px solid outline with offset
- Screen reader labels on all icons
- ARIA live regions for alert notifications
- Keyboard navigation: Tab order follows visual hierarchy
- Form inputs: Consistent h-12, clear labels above fields

---

## Images

**No hero images required** - this is a functional dashboard.

**Icon Usage**:
- Material Icons CDN for consistency
- Icons at 24px for inline elements, 64px for modal headers
- Emergency alert icon, chart icons, category icons (stethoscope, baby, etc.)

---

## Special States

**Emergency Mode**:
- Modal dominates viewport with high elevation (z-50)
- Backdrop prevents interaction with background
- Audio/visual notification (browser notification API)

**Normal Monitoring Mode**:
- Clean, minimal interface
- Soft elevations (shadow-sm)
- Organized information hierarchy

This dashboard prioritizes rapid information access and emergency response over aesthetic experimentation. Every element serves a functional purpose in the health worker's workflow.