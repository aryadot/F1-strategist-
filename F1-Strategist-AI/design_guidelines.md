# F1 Strategist Assistant - Design Guidelines

## Design Approach

**Design System Foundation:** Material Design 3 principles with F1-specific customization
- Emphasizes information density and data clarity
- Supports real-time updates with subtle motion
- Optimized for rapid scanning of technical information

**F1 Branding Integration:**
- Racing-inspired typography with bold headers
- Sharp, angular components reflecting motorsport precision
- Data-dense layouts prioritizing information accessibility

## Typography System

**Font Selection:**
- Primary: Inter (via Google Fonts CDN) - for superior readability in data contexts
- Accent: Space Grotesk - for headers and F1-themed emphasis

**Hierarchy:**
- H1: Bold, 3xl-4xl - Main page titles
- H2: Semibold, 2xl-3xl - Section headers, race names
- H3: Semibold, xl-2xl - Data categories, driver names
- Body: Regular, base-lg - Chat messages, analysis text
- Caption: Medium, sm - Timestamps, source citations, metadata
- Code/Data: Mono font, sm - Technical specs, lap times, telemetry

## Layout System

**Spacing Primitives:**
Use Tailwind units: 2, 4, 6, 8, 12, 16, 24
- Compact data: p-2, gap-2
- Standard spacing: p-4, gap-4, m-6
- Section separation: py-12, py-16, py-24

**Core Layout Structure:**

**Split-Screen Application:**
- Left Panel (40%): Chat interface with query input
- Right Panel (60%): Retrieved context, sources, and data visualization
- Collapsible sidebar for document management

**Responsive Breakpoints:**
- Mobile: Stack panels vertically, chat-first
- Tablet: 50/50 split or tabbed interface
- Desktop: Asymmetric split favoring content panel

## Component Library

**Navigation:**
- Top Bar: Logo, document upload, settings, real-time race indicator
- Secondary Nav: Filter tabs (Articles, Rules, Analysis, Breaking News, Performance Data)

**Chat Interface Components:**
- Message Bubbles: Distinct styling for user vs assistant
- Query Input: Prominent text area with autocomplete suggestions
- Quick Actions: Preset F1 strategy questions as chips
- Loading States: Typing indicators with retrieval status

**Data Display Components:**
- Source Cards: Compact cards showing retrieved documents with relevance scores
- Citation Badges: Inline reference numbers linking to sources
- Data Tables: Race results, driver standings, lap time comparisons
- Timeline View: Race event sequences, strategy decisions
- Stat Panels: Key metrics in grid layout (fastest lap, pit stops, positions)

**F1-Specific Components:**
- Race Calendar Widget: Upcoming/past races with quick filters
- Driver/Team Cards: Compact info cards with performance metrics
- Strategy Breakdown: Visual representation of pit strategies
- Rule Reference Panel: Collapsible FIA regulation viewer
- Breaking News Banner: Dismissible top banner for urgent updates

**Forms & Inputs:**
- Search Bar: Large, prominent with advanced filter options
- Document Upload: Drag-and-drop zone for adding new F1 materials
- Filter Dropdowns: Multi-select for teams, drivers, seasons, circuits

**Data Visualization:**
- Line Charts: Lap time progressions, tire degradation
- Bar Charts: Comparative driver/team statistics
- Position Maps: Track position changes throughout race
- Keep visualizations minimal and data-focused

## Animation Guidelines

**Use Sparingly:**
- Chat message appearance: Subtle fade-in only
- Loading states: Simple spinner, no elaborate animations
- Data updates: Brief highlight flash for new information
- Page transitions: None - prioritize speed
- Avoid scroll-triggered animations entirely

## Page-Specific Guidelines

**Main Application (Single-Page):**
- No hero section needed - this is a tool, not marketing
- Immediate access to chat interface on load
- Persistent navigation and context panels
- Focus on information density over visual storytelling

**Chat Panel:**
- Full-height scrollable message history
- Sticky input at bottom
- Quick action chips above input
- Source attribution visible inline with responses

**Context/Sources Panel:**
- Tabbed interface: Sources | Data | News
- Grid layout for multiple retrieved documents
- Expandable cards for detailed views
- Download/export options for retrieved content

**Document Management Sidebar:**
- Tree structure for organized F1 materials
- Filter by type, date, relevance
- Batch upload capability
- Progress indicators for processing

## Accessibility Implementation

- High contrast for data readability
- Keyboard navigation throughout chat interface
- Screen reader support for all data tables and charts
- ARIA labels for dynamic content updates
- Focus indicators on all interactive elements
- Alt text for any F1 imagery or icons

## Icon System

**Use Heroicons (via CDN) for:**
- Document/file icons
- Navigation elements
- Action buttons (download, share, filter)
- Status indicators (loading, success, error)

**F1-Specific Icons:**
- Use placeholder comments for: `<!-- CUSTOM ICON: checkered flag -->`, `<!-- CUSTOM ICON: racing helmet -->`, `<!-- CUSTOM ICON: pit stop -->`, `<!-- CUSTOM ICON: track circuit -->`

## Asset Guidelines

**No Images Needed for Core Application:**
This is a data-focused tool where images would distract from functionality

**Possible Optional Enhancements:**
- Team logos in data tables (small, 16x16px)
- Circuit diagrams for race-specific queries (functional, not decorative)
- Driver headshots in comparative views (thumbnail size only)

If images are used, keep them minimal and functional, never decorative.

## Critical Design Constraints

- **Information First:** Every pixel serves data delivery
- **Scan-Friendly:** Users should find answers in seconds
- **Dense but Clear:** Pack information without overwhelming
- **Responsive Data:** Tables, charts must work on all screens
- **Real-Time Ready:** Design accommodates live updates without disruption
- **No Marketing Fluff:** This is a professional tool, not a landing page