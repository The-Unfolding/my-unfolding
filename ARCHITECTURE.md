# My Unfolding - Application Architecture & Functionality Breakdown

## 🎯 Application Overview

**My Unfolding** is a journaling app designed for women leaders, built around "The Unfolding's" CORE framework (Confront, Own, Rewire, Embed). It combines traditional journaling with AI-powered insights, pattern analysis, and intention tracking.

---

## 📁 Architecture Layers

### **1. Entry Point & Setup**
- **[main.jsx](src/main.jsx)** - React app initialization with Supabase integration
- **[index.css](src/index.css)** - Global styles

### **2. Constants Layer** (`src/constants/`)
Configuration and static content that never changes:

- **[brand.js](src/constants/brand.js)** - Color palette (BRAND.charcoal, cream, chartreuse, etc.)
- **[prompts.js](src/constants/prompts.js)** - CORE framework journaling prompts for each phase
- **[messages.js](src/constants/messages.js)** - Affirmations and celebration messages

### **3. Utilities Layer** (`src/utils/`)
Pure functions with no side effects:

- **[dateUtils.js](src/utils/dateUtils.js)** - Date formatting, time filtering, printing
- **[markdownUtils.jsx](src/utils/markdownUtils.jsx)** - Renders markdown text to HTML
- **[storageUtils.js](src/utils/storageUtils.js)** - localStorage save/load operations

### **4. Hooks Layer** (`src/hooks/`)
Business logic and state management:

- **[useJournal.js](src/hooks/useJournal.js)** - Centralized journal state manager
  - Manages 40+ state variables
  - Syncs to localStorage automatically
  - Returns all state + setters as one object

### **5. Components Layer** (`src/components/`)

#### UI Components (`src/components/ui/`)
Reusable presentational components:
- **Confetti.jsx** - Celebration animation
- **VesselLogo.jsx** - App logo
- **TimeFilter.jsx** - Date range filter (week/month/year/all)
- **NavButton.jsx** - Navigation tab button
- **InstallAppPrompt.jsx** - PWA install banner

#### Auth Components (`src/components/auth/`)
Authentication and onboarding flow:
- **SignInScreen.jsx** - Email/password login
- **SignUpScreen.jsx** - New account creation
- **ChoosePlanScreen.jsx** - Plan selection + invite code entry
- **WelcomeScreen.jsx** - First-time user welcome
- **OnboardingWriteScreen.jsx** - Onboarding step 1: Writing intro
- **OnboardingBeforeScreen.jsx** - Onboarding step 2: "Before" journaling
- **AccessEndedScreen.jsx** - Subscription expired message

#### Journal Components (`src/components/journal/`)
Main app functionality views:
- **WriteView.jsx** - Text entry with prompts, voice, image upload
- **HistoryView.jsx** - Entry list with filtering
- **PatternsView.jsx** - AI pattern analysis display
- **ChatView.jsx** - "Ask my journal" Q&A
- **IntentionsView.jsx** - Goal tracking
- **SettingsView.jsx** - Privacy info and data management

### **6. Application Controller** (`src/App.jsx`)
The brain of the app - coordinates everything:
- Manages auth state (separate from journal state)
- Routes between auth screens and main app
- Handles all business logic functions
- Passes state/callbacks to components

---

## 🔄 Data Flow Architecture

```
User Interaction
      ↓
Component (View)
      ↓
App.jsx (calls business logic function)
      ↓
useJournal hook (updates state)
      ↓
localStorage sync (automatic via useEffect)
      ↓
Component re-renders with new data
```

---

## 🧩 Feature Breakdown by Functionality

### **1. Authentication System**
**Files involved:**
- `App.jsx` - Auth state & handlers
- `src/components/auth/*` - All auth screens
- `/api/auth/signin` - Backend endpoint
- `/api/auth/signup` - Backend endpoint
- `/api/validate-code` - Backend endpoint

**Flow:**
1. User lands on SignInScreen
2. Sign up → ChoosePlanScreen → Enter invite code or pay
3. Code validation → Create account → WelcomeScreen
4. Complete onboarding → Main app
5. Auth persists in localStorage

**Key Functions in App.jsx:**
- `handleSignUp()` - Stores credentials, moves to plan selection
- `handleSignIn()` - Authenticates user, loads access type
- `handleInviteCode()` - Validates code, creates account with access
- `handleSelectPlan()` - Stripe payment (placeholder)
- `handleOnboardingComplete()` - Marks user as ready for app

---

### **2. Writing & Entry Creation**
**Files involved:**
- `WriteView.jsx` - Main writing interface
- `useJournal.js` - Entry state
- `App.jsx` - Save logic

**Features:**
- **🎯 CORE Phase Prompts** - Select C/O/R/E for themed prompts
- **💡 Intention Reflection** - Write about your goals
- **🎙️ Voice Recording** - Speech-to-text via Web Speech API
- **📸 Image Upload** - Transcribe handwritten journal pages
- **💬 Guided Reflection** - AI coaching chat that saves as journal entry

**Key Functions in App.jsx:**
- `selectPhase()` - Activates CORE phase, shows random prompt
- `selectIntentionReflection()` - Switches to intention writing mode
- `shufflePrompt()` - Gets new random prompt for selected phase
- `saveEntry()` - Saves entry to journal, shows affirmation
- `startGuidedReflection()` - Opens AI chat interface
- `sendGuidedMessage()` - Sends message to AI, gets response
- `saveGuidedReflection()` - Converts chat to journal entry
- `handleImageUpload()` - Transcribes image via `/api/transcribe-image`
- `startRecording()` / `stopRecording()` - Voice recording

---

### **3. Entry History & Management**
**Files involved:**
- `HistoryView.jsx` - Display entries
- `useJournal.js` - Entry storage
- `dateUtils.js` - Filtering logic

**Features:**
- Time-based filtering (week/month/year/all)
- Expand/collapse entries
- Delete entries
- Visual indicators for prompt type

**Key Functions in App.jsx:**
- `deleteEntry()` - Removes entry from array

---

### **4. Pattern Analysis (AI-Powered)**
**Files involved:**
- `PatternsView.jsx` - Display analysis results
- `useJournal.js` - Pattern state
- `/api/analyze` - Backend AI analysis

**Features:**
- Analyze entries across time periods
- Break down patterns by CORE phase
- Activity graph visualization
- Printable report
- Intention alignment check

**Key Functions in App.jsx:**
- `analyzePatterns()` - Sends entries to AI, gets analysis back

**API Flow:**
```javascript
POST /api/analyze
Body: { entries[], intentions[], timeFilter }
Returns: {
  data: { C: analysis, O: analysis, R: analysis, E: analysis },
  text: overall_summary,
  generatedAt: timestamp,
  entryCount: number,
  chart: { data for visualization }
}
```

---

### **5. Chat ("Ask My Journal")**
**Files involved:**
- `ChatView.jsx` - Chat interface
- `useJournal.js` - Chat state
- `/api/chat` - Backend AI chat

**Features:**
- Ask questions about your journal
- Get insights from past entries
- Request charts/visualizations
- Context-aware responses

**Key Functions in App.jsx:**
- `sendChatMessage()` - Sends question + recent entries to AI

**API Flow:**
```javascript
POST /api/chat
Body: { message, entries[], wantsChart: boolean }
Returns: { text: response, chart?: visualization_data }
```

---

### **6. Intentions (Goal Tracking)**
**Files involved:**
- `IntentionsView.jsx` - Display intentions
- `useJournal.js` - Intention state

**Features:**
- Create intentions with timeframes
- Mark as complete (triggers celebration)
- Undo completion
- Delete intentions
- View active vs completed

**Key Functions in App.jsx:**
- `addIntention()` - Creates new intention
- `completeIntention()` - Moves to completed, shows confetti
- `uncompleteIntention()` - Moves back to active
- `deleteIntention()` - Removes intention

---

### **7. Settings & Data Management**
**Files involved:**
- `SettingsView.jsx` - Settings UI
- `storageUtils.js` - Data export/import

**Features:**
- Privacy information
- Export all data (JSON)
- Delete all data
- Calendar integration info (future)

**No business logic in App.jsx** - SettingsView is mostly self-contained

---

### **8. Feedback System**
**Files involved:**
- `App.jsx` - Feedback modal & submission
- `/api/feedback` - Backend email via Resend

**Key Functions in App.jsx:**
- `submitFeedback()` - Sends feedback email to team

---

## 🎨 UI State Management

**App-level UI state** (in App.jsx):
- `showWelcome` - Show welcome screen on first load
- `view` - Current main view (write/history/patterns/chat/intentions/settings)
- `showFeedback` - Feedback modal visibility

**Journal UI state** (in useJournal hook):
- `showConfetti` - Celebration animation trigger
- `showCelebration` - Milestone celebration modal
- `showAffirmation` - Quick affirmation toast
- `showAboutCore` - CORE framework explainer modal
- `showReflectionOffer` - Post-chat insight offer
- `expandedEntry` - Currently expanded history entry
- `showGraph` - Pattern analysis graph toggle

---

## 🔌 Backend API Endpoints

Your app expects these API routes (not shown in code):

1. **`/api/auth/signin`** - POST - Authenticate user
2. **`/api/auth/signup`** - POST - Create new account  
3. **`/api/validate-code`** - POST - Check invite code validity
4. **`/api/chat`** - POST - AI chat responses (guided reflection & ask journal)
5. **`/api/analyze`** - POST - AI pattern analysis
6. **`/api/transcribe-image`** - POST - OCR for handwritten journals
7. **`/api/feedback`** - POST - Send feedback email

---

## 🧪 Testing Strategy (Future)

**Suggested test coverage:**

### Unit Tests
- `dateUtils.js` - All date functions
- `markdownUtils.jsx` - Markdown rendering
- `storageUtils.js` - localStorage operations
- `useJournal.js` - State updates

### Integration Tests
- Auth flow (signup → code → onboarding → app)
- Entry creation → save → display in history
- Pattern analysis → display results
- Intention complete → celebration trigger

### E2E Tests
- Full user journey: signup → write entry → analyze patterns → set intention

---

## 📋 Tackling Individual Features

Here's the recommended order for future work:

### ✅ **Phase 1: Core Functionality (DONE)**
- ✅ Authentication system
- ✅ Entry creation & saving
- ✅ History display
- ✅ Basic UI/UX

### 🎯 **Phase 2: AI Enhancement (Current)**
- Pattern analysis refinement
- Chat response quality
- Better prompt suggestions
- Reflection insights

### 🚀 **Phase 3: Features to Build Next**
1. **Stripe Payment Integration** - `handleSelectPlan()` currently just alerts
2. **Calendar Integration** - Add entries to Google Calendar
3. **Search Functionality** - Search across all entries
4. **Tags/Categories** - User-defined entry tags
5. **Reminders/Notifications** - Daily writing prompts
6. **Export Options** - PDF, CSV export
7. **Themes** - Dark mode, color customization
8. **Voice Playback** - Listen to past entries
9. **Streaks** - Track writing consistency
10. **Sharing** - Share entries with coaches

---

## 🔧 How to Work on Individual Features

**Example: Adding Search Functionality**

1. **Add state** to `useJournal.js`:
   ```javascript
   const [searchQuery, setSearchQuery] = useState('');
   ```

2. **Create utility** in `dateUtils.js`:
   ```javascript
   export const searchEntries = (entries, query) => {
     return entries.filter(e => 
       e.text.toLowerCase().includes(query.toLowerCase())
     );
   };
   ```

3. **Add UI** to `HistoryView.jsx`:
   ```jsx
   <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
   ```

4. **Filter results** in `HistoryView.jsx`:
   ```javascript
   const filteredEntries = searchEntries(entries, searchQuery);
   ```

5. **Test** - Write, search, verify

---

## 📊 State Structure Reference

**Auth State (App.jsx):**
- `authView` - Current auth screen
- `user` - User object
- `accessType` - 'coaching' | 'paid' | 'none'
- `authError` - Error message

**Journal State (useJournal.js):**
```javascript
{
  // Core data
  entries: [],
  intentions: [],
  completedIntentions: [],
  patterns: null,
  hasConsented: false,
  
  // Write view
  currentEntry: '',
  selectedPhase: null,
  currentPrompt: null,
  reflectOnIntentions: false,
  
  // Guided reflection
  isGuidedReflection: false,
  guidedMessages: [],
  guidedInput: '',
  
  // Chat
  chatMessages: [],
  chatInput: '',
  chatChart: null,
  
  // UI toggles
  showConfetti: false,
  showCelebration: false,
  showAffirmation: false,
  expandedEntry: null,
  
  // Loading states
  isAnalyzing: false,
  isTranscribing: false,
  isRecording: false,
  isChatLoading: false,
  
  // Filters
  historyTimeFilter: 'all',
  patternTimeFilter: 'all',
  
  // Refs
  fileInputRef: useRef(null),
  recognitionRef: useRef(null)
}
```

---

## 🎓 Key Learnings for Future Development

1. **Separation of Concerns** - Constants, utils, hooks, components all have clear roles
2. **Single Source of Truth** - useJournal hook owns all journal state
3. **Prop Drilling is OK** - Components receive individual props for clarity
4. **Keep App.jsx Light** - Business logic lives here, but state in hook
5. **API Abstraction** - All backend calls go through fetch in App.jsx
6. **Optimistic UI** - Update state immediately, sync with server later

---

This breakdown should give you a clear map to tackle any feature independently! Each piece is modular and can be enhanced without affecting others. 🚀