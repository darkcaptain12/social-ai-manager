:::writing{variant="document" id="91842"}
# CLAUDE.MD — SOCIAL AI MANAGER (INSTAGRAM AI MARKETING SYSTEM)

## 1. PROJECT OVERVIEW

This project is an AI-powered Instagram marketing and content automation system designed for a single brand.

The system’s purpose is to:
- Analyze Instagram presence
- Analyze competitors
- Identify target audience
- Detect trends and viral content patterns
- Generate content strategy
- Generate posts, stories, reels
- Generate visual creatives automatically
- Manage CRM and potential leads
- Schedule and publish content
- Continuously improve via memory-based learning

This system is NOT a chatbot. It is an autonomous marketing intelligence and content production engine.

---

## 2. CORE ARCHITECTURE PRINCIPLES

### 2.1 Agent-Based System (LangGraph Style)

Each function is an isolated AI agent:

- Brand Analysis Agent
- Competitor Analysis Agent
- Audience Analysis Agent
- Trend/Viral Analysis Agent
- Content Strategy Agent
- Copywriting Agent
- Visual Generation Agent
- Design Editor Agent
- CRM Agent
- Lead Generation Agent
- Scheduling Agent
- Analytics Agent

Each agent:
- Cannot access full system memory
- Only receives relevant structured memory slices
- Outputs structured JSON only

---

### 2.2 TOKEN OPTIMIZATION RULES

Critical system rule:

- NEVER load full conversation history
- NEVER pass raw chat logs between agents
- ALWAYS use structured memory files
- ALWAYS summarize before storing
- ALWAYS cache repeated computations
- ALWAYS reuse previous analysis if still valid
- Each request must be minimal context scoped

---

## 3. USER SYSTEM

### 3.1 Authentication
- Email + password login
- Single user system (no multi-tenant SaaS)

### 3.2 Brand Scope
- Only ONE brand per system instance
- No multi-brand support

---

## 4. INSTAGRAM INTEGRATION

Supported via Instagram Graph API:

Capabilities:
- Fetch profile insights
- Fetch post performance
- Fetch engagement data
- Schedule posts
- Publish posts (if API permissions granted)

If API is not connected:
- System works in “analysis + planning mode only”

---

## 5. CORE AI CAPABILITIES

### 5.1 Brand Intelligence
Stores:
- Brand identity
- Logo
- Color palette
- Tone of voice
- Target audience
- Keywords
- Positioning

---

### 5.2 Competitor Intelligence
- Identify competitors (or manual input fallback)
- Analyze content style
- Analyze engagement rates
- Detect content gaps
- Extract opportunities

---

### 5.3 Audience Intelligence
- Demographics estimation
- Interests clustering
- Buying intent signals
- Pain points
- Content preferences

---

### 5.4 Viral Content Engine
- Detect trending Instagram formats
- Analyze viral posts in niche
- Extract hooks and patterns
- Generate reusable viral templates

---

### 5.5 Content Strategy Engine
Outputs:
- Weekly content plan
- Monthly strategy
- Content pillars
- Campaign ideas
- Posting frequency optimization

---

## 6. CONTENT GENERATION PIPELINE

### FULL PIPELINE (MANDATORY FLOW)

User triggers post generation:

1. Content Strategy Agent
2. Copywriting Agent
3. Visual Generation Agent
4. Design Editor Agent
5. CRM Tagging Agent
6. Scheduling Agent

---

### 6.1 COPY OUTPUT

Includes:
- Caption
- Hook
- CTA
- Hashtags
- Post objective

---

### 6.2 VISUAL SYSTEM (CRITICAL DESIGN RULE)

Flow:

User Request
→ AI Content Generation
→ AI Image Generation (automatic)
→ Image sent to Editor Canvas
→ User edits (optional)
→ Publish / Schedule

Supported providers:
- OpenAI Image Models
- Ideogram (text-heavy visuals)
- Flux (cost-efficient)
- Stability AI
- Replicate models

---

## 7. DESIGN EDITOR SYSTEM (CANVA-LIKE)

Features:
- Drag & Drop canvas
- Layers system
- Text editing
- Brand kit auto-apply
- Template system
- Resize formats (IG post/story/reel cover)

Template types:
- Promotional post
- Educational post
- Announcement
- Testimonial
- Product showcase
- Engagement post

---

## 8. CRM SYSTEM

Stores:
- Leads
- Potential customers
- Contact info (manual or imported)
- Notes
- Follow-up status
- Tasks
- Reminders

CRM is tightly linked with content strategy.

---

## 9. LEAD GENERATION ENGINE

System actively identifies:
- Local businesses in niche
- Instagram accounts with high engagement potential
- Industry-related prospects

Outputs:
- Lead list
- Priority score
- Contact suggestions

If automation fails → manual input fallback enabled.

---

## 10. CONTENT MEMORY SYSTEM

### 10.1 MEMORY RULES

System stores ONLY structured data:

- content_history.json
- brand.json
- competitors.json
- leads.json
- calendar.json

Rules:
- Never store raw conversations
- Only store summaries
- Prevent duplicate content generation
- Enforce uniqueness of posts

---

## 11. CONTENT DUPLICATION PREVENTION

System must:
- Check last 90 days content
- Detect semantic similarity
- Block repeated post ideas
- Suggest alternative angles

---

## 12. AUTOMATION SYSTEM

### Nightly Jobs:
- Competitor scan
- Trend analysis
- Viral content detection
- New content idea generation
- CRM updates
- Lead refresh

Runs automatically without user interaction.

---

## 13. SCHEDULING SYSTEM

Calendar features:
- Daily / Weekly / Monthly view
- Drag & drop scheduling
- Auto-scheduling suggestions
- Optimal posting time prediction

---

## 14. ANALYTICS ENGINE

Tracks:
- Engagement rate
- Reach growth
- Follower growth
- Post performance
- Content type success rate

Outputs:
- Weekly summary
- Actionable insights

---

## 15. SETTINGS SYSTEM

User configurable:
- API keys (OpenAI, Claude, Gemini, etc.)
- Image generation provider selection
- Instagram connection
- Brand settings
- Posting preferences
- Language settings

No API key is hardcoded.

---

## 16. SECURITY RULES

- API keys encrypted at rest
- No external exposure of secrets
- Role-based access control (even if single user, system role separation exists internally)
- All AI outputs validated before execution

---

## 17. PERFORMANCE RULES

- Cache all AI responses
- Reuse analysis results for 7 days
- Avoid redundant API calls
- Use embeddings for similarity checks
- Batch requests when possible

---

## 18. UI / UX REQUIREMENTS

- Modern SaaS dashboard
- Dark / Light mode
- Mobile responsive
- Fast navigation
- Minimal clutter
- Focus on productivity
- Canva-like editor embedded

---

## 19. SUCCESS METRICS

System optimizes for:

- Follower growth
- Engagement increase
- Lead generation
- Conversion potential
- Content production speed
- Reduced manual workload

---

## 20. FINAL SYSTEM BEHAVIOR RULE

This system is NOT a chatbot.

It is a:
- Marketing intelligence engine
- Content production factory
- Growth automation system

Every output must serve:
- Growth
- Efficiency
- Conversion
- Automation

---
:::