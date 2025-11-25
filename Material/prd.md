# **📌 PRODUCT REQUIREMENTS DOCUMENT (PRD)**

**Project:** Personal Development Operating System (PD-OS)
**Type:** Multi-module tracking platform (daily evaluation, learning, financial, fitness, wellness, career, master prep)
**Owner:** Ghiffarin
**Version:** 1.0

---

# **1. Overview**

PD-OS is a personal growth platform that helps users track, measure, and improve every aspect of their daily life: learning, skills, fitness, wellness, finance, career, and academic preparation.
The platform centralizes all life data into a **single dashboard**, creates trends, highlights insights, and guides the user through small improvements daily.

The big idea:
**A system that makes you self-aware, consistent, and future-ready.**

---

# **2. Problem Statement**

People want to improve but can’t stay consistent because:

* data about their life is scattered
* no system tells them what’s working or failing
* no feedback loop for reflection
* no long-term prep tracking (IELTS, career, Master’s)
* no unified way to measure skills, habits, and overall progress
* tools like Notion/Sheets require too much manual setup

There is no platform that gives a **360° daily-to-long-term life management system**.

---

# **3. Solution Summary**

PD-OS provides:

* one unified dashboard
* modular activity sheets
* daily evaluation engine
* smart insights
* automated analytics
* career + academic preparation tracker
* fitness + wellness monitor
* financial discipline system
* long-term growth pipeline

Everything updates automatically as the user logs actions.

---

# **4. Core Modules**

The platform has **10 major modules**:

1. Daily Evaluation
2. IELTS & Learning
3. Journal Reading
4. Skill Building
5. Workout Tracking
6. Wellness Tracking
7. Financial Management
8. Reflection Engine
9. Career Tracker
10. Master’s Degree Preparation

Each module has its own inputs, views, analytics, and insights.

---

# **5. User Personas**

### **Primary: High-performing individual (like you)**

* age: 18–35
* ambitious, disciplined
* preparing for career/academic growth
* wants a structured daily system
* prefers clear metrics, fast feedback

### **Secondary: Students & early-career professionals**

* preparing for Master’s, job applications
* wants to measure progress
* needs accountability

---

# **6. User Goals**

* stay consistent
* measure progress
* prepare for IELTS
* prepare for career opportunities
* maintain health and fitness
* track money
* build strong academic foundation for Master’s
* understand patterns in mood, performance, and habits

---

# **7. Functional Requirements (Detailed)**

## **7.1 Daily Evaluation Module**

User can:

* log daily focus
* track mood, energy, score
* record wins + problems
* set “fix for tomorrow”
* auto-sync data to dashboard

System will:

* compute daily score
* detect patterns
* send insights (e.g., “Low energy days correlate with poor sleep”)

---

## **7.2 IELTS & Learning Module**

User can:

* log study sessions by skill
* record raw score
* track mistakes
* add vocabulary
* set macro-goals
* track estimated band

System will:

* create skill distribution
* recommend weak skills
* generate improvement insights

---

## **7.3 Journal Reading Module**

User can:

* input paper title + summary
* record methodology
* save data points (kinetics, CO₂ fixation, etc.)
* log insights & unanswered questions

System will:

* categorize readings
* track total papers per month
* identify knowledge gaps
* generate a research notes library

---

## **7.4 Skill Building Module**

User can:

* track skill category
* log practice hours
* save outputs (file links)
* rate difficulty + mastery

System will:

* show progress per skill
* recommend areas to improve
* track output count

---

## **7.5 Workout Module**

User can:

* input type, duration, distance
* track pace, HR zone, intensity
* log steps
* log post-workout mood

System will:

* show pace trend
* show weekly activity
* highlight recovery needs

---

## **7.6 Wellness Module**

User can:

* track sleep, hydration, stress, mood
* log diet discipline
* log screen time
* record wellness notes

System will:

* generate a wellness score
* show graphs for sleep, energy, clarity
* detect burnout patterns

---

## **7.7 Financial Module**

User can:

* record expenses
* classify as necessary or not
* log investments
* track savings rate

System will:

* show spending trends
* alert overspending
* compute savings rate
* generate category breakdown

---

## **7.8 Reflection Module**

User can:

* reflect on what went well/wrong
* give integrity score
* set next-day fix

System will:

* generate insights
* show reflection trend
* create weekly reflection summary

---

## **7.9 Career Tracker**

User can:

* track career tasks
* log outputs (CV, portfolio, projects)
* manage job application pipeline
* track learning & networking

System will:

* show weekly career effort
* show application status
* highlight portfolio progress

---

## **7.10 Master’s Prep Tracker**

User can:

* track readiness components
* add academic preparation tasks
* track research skills
* track technical skill foundation
* track document readiness (CV, writing samples, recommendations)

System will:

* compute readiness score
* generate gap analysis
* offer weekly prep roadmap

---

# **8. Platform Architecture**

## **8.1 Data Model (High-level)**

Each module = table
Master Dashboard = combined view

### Core tables:

* daily_log
* ielts_log
* journal_log
* skill_log
* workout_log
* wellness_log
* financial_log
* reflection_log
* career_log
* masters_prep_log

## **8.2 Dashboard Engine**

* pulls data from all sheets
* generates metrics
* creates visualizations
* shows weekly + monthly summaries
* insights generated from correlations

---

# **9. Key Metrics**

### **Daily Metrics**

* daily score
* mood, energy
* total hours worked/learned
* finance for the day
* wellness score

### **Weekly Metrics**

* learning hours
* IELTS performance
* workout distance
* wellness average
* financial discipline
* career hours
* reflection integrity
* Master’s prep readiness

### **Monthly Metrics**

* paper count
* skill outputs
* financial breakdown
* long-term progress graphs

---

# **10. Insight Engine (Smart Features)**

The system compares modules to detect patterns:

* low sleep → low skill output
* high screen time → low reflection integrity
* high stress → poor IELTS performance
* high wellness → strong workout pace
* financial unnecessary spend → lower mood

Insights appear in dashboard as simple sentences.

---

# **11. User Stories (Clear & Direct)**

### **As a user, I want to:**

* record my day fast
* see my progress without thinking
* know what slows me down
* build consistent habits
* prepare for my Master’s
* track finances simply
* track my learning with accuracy
* track my workouts
* monitor my wellness
* keep career preparation on track
* get weekly summaries

### **As a user, I want the platform to:**

* show trends
* correlate data
* warn burnout
* highlight improvements
* generate simple insights

---

# **12. Non-Functional Requirements**

### **Performance**

* daily input must take < 1 minute
* dashboard loads under 2 seconds

### **Simplicity**

* clean UI
* minimal input fields
* mostly dropdowns
* mobile-friendly

### **Reliability**

* logs must never be lost
* data auto-saves

### **Security**

* no sharing by default
* user controls export

---

# **13. Success Metrics**

### **Engagement**

* daily usage rate > 70%

### **Learning**

* IELTS score improvement
* increased reading consistency

### **Wellness**

* better sleep and energy

### **Career**

* number of tasks completed
* portfolio progress

### **Finance**

* reduced unnecessary spending

### **Master’s Prep**

* readiness score increases monthly

---

# **14. Roadmap (Phases)**

### **Phase 1 — MVP**

* Daily log
* Dashboard
* Wellness
* Financial
* Workout

### **Phase 2 — Learning + Skill**

* IELTS module
* Journal reading
* Skill building

### **Phase 3 — Career + Master’s Prep**

* career tracker
* master prep system
* automated insights

### **Phase 4 — Intelligence Layer**

* recommendations
* correlations
* weekly summary engine

---
