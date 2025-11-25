Nice, this is the fun part.
Let’s treat this like you’re actually going to implement it in a relational DB.

I’ll give you a **full, normalized data model** for all the capabilities we’ve talked about:

* Core / shared tables
* Daily evaluation
* IELTS
* Journal reading
* Book reading
* Skill building
* Workout
* Wellness
* Financial
* Reflection
* Career
* Master’s prep

You can map this straight into Postgres / MySQL / Supabase / Prisma / etc.

---

## 0. Core / Shared Tables

### **users**

| Field      | Type      | Notes               |
| ---------- | --------- | ------------------- |
| id         | UUID / PK | user_id             |
| email      | string    | unique              |
| name       | string    | optional            |
| timezone   | string    | e.g. "Asia/Jakarta" |
| created_at | datetime  |                     |
| updated_at | datetime  |                     |

---

### **projects** (optional but useful: “buckets” for work, study, etc.)

| Field       | Type      | Notes                                  |
| ----------- | --------- | -------------------------------------- |
| id          | UUID / PK |                                        |
| user_id     | FK→users  |                                        |
| name        | string    | e.g. "IELTS Prep", "Master Prep 2026"  |
| description | text      |                                        |
| type        | enum      | `personal`, `career`, `academic`, etc. |
| status      | enum      | `active`, `paused`, `completed`        |
| created_at  | datetime  |                                        |
| updated_at  | datetime  |                                        |

You can attach any log entry to a project if needed.

---

### **goals**

| Field        | Type        | Notes                                                 |
| ------------ | ----------- | ----------------------------------------------------- |
| id           | UUID / PK   |                                                       |
| user_id      | FK→users    |                                                       |
| project_id   | FK→projects | nullable                                              |
| title        | string      | e.g. "Reach IELTS 7.0 Overall"                        |
| description  | text        |                                                       |
| category     | enum        | `fitness`, `finance`, `learning`, `career`, `masters` |
| target_value | float       | e.g. 7.0, 100 hours, 10M IDR                          |
| unit         | string      | e.g. "band", "hours", "IDR"                           |
| due_date     | date        | optional                                              |
| status       | enum        | `not_started`, `in_progress`, `achieved`, `dropped`   |
| created_at   | datetime    |                                                       |
| updated_at   | datetime    |                                                       |

---

### **tags** (generic tagging for any entity)

| Field   | Type      | Notes                            |
| ------- | --------- | -------------------------------- |
| id      | UUID / PK |                                  |
| user_id | FK→users  |                                  |
| label   | string    | e.g. "microalgae", "high-impact" |
| color   | string    | optional                         |

### **tag_links**

| Field       | Type      | Notes                                         |
| ----------- | --------- | --------------------------------------------- |
| id          | UUID / PK |                                               |
| tag_id      | FK→tags   |                                               |
| entity_type | string    | e.g. `journal_entry`, `skill_session`, `goal` |
| entity_id   | UUID      | ID in that table                              |

---

## 1. Daily Evaluation

This is your “daily overview / raw daily input”.

### **daily_logs**

| Field           | Type      | Notes                               |
| --------------- | --------- | ----------------------------------- |
| id              | UUID / PK |                                     |
| user_id         | FK→users  |                                     |
| date            | date      | unique per user                     |
| main_focus      | text      | what today was about                |
| work_hours      | float     | total hours of work                 |
| learning_hours  | float     | total formal learning hours         |
| workout_minutes | int       | summary from workout_sessions       |
| money_spent     | float     | summary from financial_transactions |
| mood_score      | int       | 1–5                                 |
| energy_score    | int       | 1–5                                 |
| sleep_hours     | float     | can mirror from wellness            |
| steps           | int       |                                     |
| day_score       | int       | 1–10                                |
| notes           | text      | optional                            |
| created_at      | datetime  |                                     |
| updated_at      | datetime  |                                     |

---

## 2. IELTS Module

### **ielts_sessions**

| Field            | Type      | Notes                                                                |
| ---------------- | --------- | -------------------------------------------------------------------- |
| id               | UUID / PK |                                                                      |
| user_id          | FK→users  |                                                                      |
| date             | date      |                                                                      |
| skill_type       | enum      | `listening`, `reading`, `writing_task1`, `writing_task2`, `speaking` |
| sub_skill        | string    | e.g. "Listening Part 3", "Matching headings"                         |
| material_name    | string    | e.g. "Cambridge 16 Test 2"                                           |
| time_spent_min   | int       |                                                                      |
| raw_score        | float     | e.g. 32                                                              |
| raw_max_score    | float     | e.g. 40                                                              |
| estimated_band   | float     | e.g. 6.5                                                             |
| mistakes_summary | text      | bullet-style notes                                                   |
| new_vocab_count  | int       | quick metric                                                         |
| confidence_score | int       | 1–5                                                                  |
| notes            | text      |                                                                      |
| created_at       | datetime  |                                                                      |
| updated_at       | datetime  |                                                                      |

### **ielts_mistakes**

| Field            | Type              | Notes                                                                              |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------- |
| id               | UUID / PK         |                                                                                    |
| ielts_session_id | FK→ielts_sessions |                                                                                    |
| category         | enum              | `grammar`, `vocab`, `spelling`, `paraphrasing`, `logic`, `pronunciation`, `timing` |
| description      | text              |                                                                                    |
| example          | text              | optional                                                                           |

### **ielts_vocab**

| Field            | Type              | Notes                      |
| ---------------- | ----------------- | -------------------------- |
| id               | UUID / PK         |                            |
| user_id          | FK→users          |                            |
| ielts_session_id | FK→ielts_sessions | nullable                   |
| phrase           | string            |                            |
| meaning          | text              |                            |
| example_usage    | text              | optional                   |
| source_type      | enum              | `ielts`, `book`, `journal` |
| created_at       | datetime          |                            |

---

## 3. Journal / Research Reading

### **journal_entries**

| Field             | Type      | Notes                                                                 |
| ----------------- | --------- | --------------------------------------------------------------------- |
| id                | UUID / PK |                                                                       |
| user_id           | FK→users  |                                                                       |
| date              | date      |                                                                       |
| title             | string    | paper title                                                           |
| authors           | string    | optional                                                              |
| source            | string    | journal/conference/site                                               |
| category          | enum      | `microalgae`, `co2_fixation`, `bioprocess`, `sustainability`, `other` |
| content_type      | enum      | `review`, `original`, `thesis`, `book_chapter`, `report`              |
| time_spent_min    | int       |                                                                       |
| summary           | text      | short summary                                                         |
| key_insights      | text      | bullet-style                                                          |
| key_data_points   | text      | numbers/values in structured text                                     |
| methods_summary   | text      |                                                                       |
| models_equations  | text      | equation notes                                                        |
| limitations       | text      |                                                                       |
| open_question     | text      | unanswered question                                                   |
| project_relevance | text      | link to your own work                                                 |
| confidence_score  | int       | 1–5                                                                   |
| rating_usefulness | int       | 1–5                                                                   |
| created_at        | datetime  |                                                                       |
| updated_at        | datetime  |                                                                       |

---

## 4. Book Reading

### **books**

| Field       | Type      | Notes                    |
| ----------- | --------- | ------------------------ |
| id          | UUID / PK |                          |
| user_id     | FK→users  |                          |
| title       | string    |                          |
| author      | string    | optional                 |
| total_pages | int       | optional                 |
| genre       | string    | e.g. "fiction", "sci-fi" |
| language    | string    |                          |
| created_at  | datetime  |                          |

### **book_reading_sessions**

| Field          | Type      | Notes                                                     |
| -------------- | --------- | --------------------------------------------------------- |
| id             | UUID / PK |                                                           |
| user_id        | FK→users  |                                                           |
| book_id        | FK→books  |                                                           |
| date           | date      |                                                           |
| chapter_label  | string    | "Ch.4", "Part II", etc.                                   |
| pages_start    | int       | optional                                                  |
| pages_end      | int       | optional                                                  |
| pages_read     | int       |                                                           |
| time_spent_min | int       |                                                           |
| reading_speed  | float     | pages per hour (computed)                                 |
| summary        | text      |                                                           |
| key_ideas      | text      | bullet-style                                              |
| favorite_lines | text      |                                                           |
| new_vocab      | text      | comma-list or bullet-style                                |
| emotion_score  | int       | 1–5                                                       |
| emotion_label  | string    | "calm", "inspired", etc.                                  |
| purpose        | enum      | `language`, `leisure`, `inspiration`, `knowledge`, `rest` |
| focus_score    | int       | 1–5                                                       |
| notes          | text      |                                                           |
| created_at     | datetime  |                                                           |

---

## 5. Skill Building

### **skill_sessions**

| Field          | Type        | Notes                                                                       |
| -------------- | ----------- | --------------------------------------------------------------------------- |
| id             | UUID / PK   |                                                                             |
| user_id        | FK→users    |                                                                             |
| date           | date        |                                                                             |
| skill_category | enum        | `uiux`, `framer`, `writing`, `pm`, `data`, `engineering`, `career`, `other` |
| sub_skill      | string      | e.g. "auto-layout", "Framer animations"                                     |
| project_id     | FK→projects | optional                                                                    |
| time_spent_min | int         |                                                                             |
| output_summary | text        | what you built                                                              |
| output_link    | string      | URL to Figma, Framer, doc, etc.                                             |
| learned_points | text        | bullet-style                                                                |
| difficulty     | int         | 1–5                                                                         |
| mastery_level  | int         | 1–5                                                                         |
| mistakes       | text        |                                                                             |
| next_step      | text        | micro-action                                                                |
| energy_score   | int         | 1–5                                                                         |
| quality_score  | int         | 1–5 (portfolio-worthy?)                                                     |
| created_at     | datetime    |                                                                             |

---

## 6. Workout

### **workout_sessions**

| Field           | Type      | Notes                                                                                          |
| --------------- | --------- | ---------------------------------------------------------------------------------------------- |
| id              | UUID / PK |                                                                                                |
| user_id         | FK→users  |                                                                                                |
| date            | date      |                                                                                                |
| workout_type    | enum      | `jogging`, `walking`, `strength`, `hiit`, `swimming`, `cycling`, `stretching`, `yoga`, `other` |
| routine_name    | string    | e.g. "Full body", "Leg day"                                                                    |
| duration_min    | int       |                                                                                                |
| distance_km     | float     | nullable                                                                                       |
| pace_min_per_km | float     | computed if distance > 0                                                                       |
| steps           | int       | optional                                                                                       |
| avg_heart_rate  | int       | optional                                                                                       |
| calories        | int       | optional                                                                                       |
| intensity_level | int       | 1–5                                                                                            |
| focus           | enum      | `endurance`, `fat_burn`, `strength`, `core`, `mobility`, `recovery`                            |
| pre_energy      | int       | 1–5                                                                                            |
| post_mood       | string    | "calm", "motivated"                                                                            |
| workout_quality | int       | 1–5                                                                                            |
| notes           | text      | e.g. injury notes                                                                              |
| created_at      | datetime  |                                                                                                |

If you want deeper strength tracking, you can add:

### **workout_sets** (optional)

| Field              | Type                | Notes    |
| ------------------ | ------------------- | -------- |
| id                 | UUID / PK           |          |
| workout_session_id | FK→workout_sessions |          |
| exercise_name      | string              |          |
| set_number         | int                 |          |
| reps               | int                 |          |
| weight_kg          | float               | nullable |
| notes              | text                |          |

---

## 7. Wellness

### **wellness_entries**

| Field             | Type      | Notes                    |
| ----------------- | --------- | ------------------------ |
| id                | UUID / PK |                          |
| user_id           | FK→users  |                          |
| date              | date      | unique per user optional |
| sleep_hours       | float     |                          |
| sleep_quality     | int       | 1–5                      |
| energy_level      | int       | 1–5                      |
| appetite_control  | int       | 1–5                      |
| hydration_liters  | float     | or hydration_score 1–5   |
| physical_symptoms | text      | e.g. "headache", "none"  |
| sunlight_minutes  | int       |                          |
| mood_score        | int       | 1–5                      |
| stress_level      | int       | 1–5                      |
| mental_clarity    | int       | 1–5                      |
| anxiety_level     | int       | 1–5                      |
| screen_time_min   | int       |                          |
| social_time_min   | int       |                          |
| outdoor_time_min  | int       |                          |
| hygiene_score     | int       | 1–5                      |
| diet_discipline   | int       | 1–5                      |
| no_late_snacks    | boolean   |                          |
| morning_routine   | boolean   |                          |
| evening_routine   | boolean   |                          |
| wellness_note     | text      |                          |
| wellness_score    | float     | computed composite       |
| created_at        | datetime  |                          |

---

## 8. Financial

### **financial_transactions**

| Field           | Type      | Notes                                                                                                                                            |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| id              | UUID / PK |                                                                                                                                                  |
| user_id         | FK→users  |                                                                                                                                                  |
| date            | date      |                                                                                                                                                  |
| amount_idr      | float     | positive for income/invest, negative for spend or keep separate                                                                                  |
| direction       | enum      | `spend`, `invest`, `income`                                                                                                                      |
| category        | enum      | `food`, `transport`, `groceries`, `household`, `entertainment`, `health`, `phone`, `internet`, `subscription`, `family_support`, `work`, `other` |
| is_necessary    | boolean   |                                                                                                                                                  |
| payment_method  | enum      | `cash`, `debit`, `e_wallet`, `credit`                                                                                                            |
| investment_type | enum      | `bitcoin`, `savings`, `emergency_fund`, `stocks`, `business`, `other` (nullable unless direction = invest)                                       |
| notes           | text      |                                                                                                                                                  |
| created_at      | datetime  |                                                                                                                                                  |

If you want, you can separate income and investments into their own tables, but above is enough.

---

## 9. Reflection

### **reflection_entries**

| Field            | Type      | Notes              |
| ---------------- | --------- | ------------------ |
| id               | UUID / PK |                    |
| user_id          | FK→users  |                    |
| date             | date      |                    |
| went_well        | text      | bullet-style       |
| went_wrong       | text      |                    |
| root_cause       | text      | “why it happened?” |
| learned_today    | text      |                    |
| fix_for_tomorrow | text      | one action         |
| integrity_score  | int       | 1–5                |
| discipline_score | int       | 1–5                |
| emotional_state  | string    | short label        |
| gratitude        | text      | optional           |
| day_lesson       | text      | short one-liner    |
| notes            | text      |                    |
| created_at       | datetime  |                    |

---

## 10. Career

### **career_activities**

| Field          | Type        | Notes                                                                                                                                                      |
| -------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id             | UUID / PK   |                                                                                                                                                            |
| user_id        | FK→users    |                                                                                                                                                            |
| date           | date        |                                                                                                                                                            |
| activity_type  | enum        | `job_application`, `portfolio`, `cv`, `cover_letter`, `networking`, `linkedin_post`, `learning`, `interview_prep`, `company_research`, `strategy`, `other` |
| subcategory    | string      | e.g. "case study", "DM recruiter"                                                                                                                          |
| target_entity  | string      | company/program/project name                                                                                                                               |
| project_id     | FK→projects | optional                                                                                                                                                   |
| time_spent_min | int         |                                                                                                                                                            |
| description    | text        | what you did                                                                                                                                               |
| output_summary | text        |                                                                                                                                                            |
| output_link    | string      | optional                                                                                                                                                   |
| pipeline_stage | enum        | `not_applicable`, `not_started`, `in_progress`, `submitted`, `interview`, `follow_up`, `waiting`, `completed`, `rejected`                                  |
| priority       | int         | 1–3                                                                                                                                                        |
| confidence     | int         | 1–5                                                                                                                                                        |
| career_impact  | int         | 1–5                                                                                                                                                        |
| next_step      | text        |                                                                                                                                                            |
| notes          | text        |                                                                                                                                                            |
| created_at     | datetime    |                                                                                                                                                            |

### **job_applications** (optional, if you want a dedicated CRM)

| Field             | Type      | Notes                                                             |
| ----------------- | --------- | ----------------------------------------------------------------- |
| id                | UUID / PK |                                                                   |
| user_id           | FK→users  |                                                                   |
| company           | string    |                                                                   |
| role_title        | string    |                                                                   |
| link              | string    | application URL                                                   |
| status            | enum      | `draft`, `applied`, `interview`, `offer`, `rejected`, `withdrawn` |
| contact_name      | string    | optional                                                          |
| contact_email     | string    | optional                                                          |
| applied_date      | date      |                                                                   |
| expected_response | date      | optional                                                          |
| notes             | text      |                                                                   |
| created_at        | datetime  |                                                                   |

You can link career_activities → job_applications via `job_application_id` if needed.

---

## 11. Master’s Degree Preparation

### **masters_prep_items**

| Field            | Type      | Notes                                                                                                                                                   |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id               | UUID / PK |                                                                                                                                                         |
| user_id          | FK→users  |                                                                                                                                                         |
| category         | enum      | `ielts`, `journal`, `research_skills`, `technical`, `writing`, `portfolio`, `project_experience`, `cv_docs`, `recommendations`, `financial`, `strategy` |
| subcategory      | string    | e.g. "Monod kinetics", "CO₂ modeling"                                                                                                                   |
| task_title       | string    | "Summarize 20 papers", "Build academic CV"                                                                                                              |
| description      | text      |                                                                                                                                                         |
| related_goal_id  | FK→goals  | optional                                                                                                                                                |
| priority         | int       | 1–3                                                                                                                                                     |
| status           | enum      | `not_started`, `in_progress`, `halfway`, `almost_done`, `completed`                                                                                     |
| progress_percent | int       | 0–100                                                                                                                                                   |
| time_spent_min   | int       | accumulated or last entry                                                                                                                               |
| output_summary   | text      |                                                                                                                                                         |
| output_link      | string    |                                                                                                                                                         |
| readiness_score  | int       | 1–5 (self-assessment)                                                                                                                                   |
| next_step        | text      |                                                                                                                                                         |
| notes            | text      |                                                                                                                                                         |
| created_at       | datetime  |                                                                                                                                                         |
| updated_at       | datetime  |                                                                                                                                                         |

If you want more granularity (log multiple sessions against a prep item):

### **masters_prep_sessions** (optional)

| Field          | Type                  | Notes |
| -------------- | --------------------- | ----- |
| id             | UUID / PK             |       |
| user_id        | FK→users              |       |
| prep_item_id   | FK→masters_prep_items |       |
| date           | date                  |       |
| time_spent_min | int                   |       |
| notes          | text                  |       |
| created_at     | datetime              |       |

---

## 12. How It All Connects (Relationships Summary)

* **users** 1–N to all log tables

* **daily_logs** can be derived from other logs (or partially manual)

* **goals** can link to:

  * ielts_sessions (via derived metrics)
  * journal_entries
  * skill_sessions
  * career_activities
  * masters_prep_items

* **projects** can group:

  * skill_sessions
  * career_activities
  * masters_prep_items

* **tags / tag_links** can attach meaning across everything:

  * `microalgae` tag on journal_entries, skill_sessions, masters_prep_items
  * `high_impact` on career_activities

---

