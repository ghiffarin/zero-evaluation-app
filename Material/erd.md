erDiagram

    %% =========================
    %% CORE ENTITIES
    %% =========================
    USERS {
        uuid id PK
        string email
        string name
        string timezone
        datetime created_at
        datetime updated_at
    }

    PROJECTS {
        uuid id PK
        uuid user_id FK
        string name
        string description
        string type
        string status
        datetime created_at
        datetime updated_at
    }

    GOALS {
        uuid id PK
        uuid user_id FK
        uuid project_id FK
        string title
        string description
        string category
        float target_value
        string unit
        date due_date
        string status
        datetime created_at
        datetime updated_at
    }

    TAGS {
        uuid id PK
        uuid user_id FK
        string label
        string color
    }

    TAG_LINKS {
        uuid id PK
        uuid tag_id FK
        string entity_type
        uuid entity_id
    }

    USERS ||--o{ PROJECTS : "owns"
    USERS ||--o{ GOALS : "owns"
    USERS ||--o{ TAGS : "owns"
    TAGS ||--o{ TAG_LINKS : "linked_to"


    %% =========================
    %% DAILY LOG
    %% =========================
    DAILY_LOGS {
        uuid id PK
        uuid user_id FK
        date date
        string main_focus
        float work_hours
        float learning_hours
        int workout_minutes
        float money_spent
        int mood_score
        int energy_score
        float sleep_hours
        int steps
        int day_score
        text notes
        datetime created_at
        datetime updated_at
    }

    USERS ||--o{ DAILY_LOGS : "has"


    %% =========================
    %% IELTS MODULE
    %% =========================
    IELTS_SESSIONS {
        uuid id PK
        uuid user_id FK
        date date
        string skill_type
        string sub_skill
        string material_name
        int time_spent_min
        float raw_score
        float raw_max_score
        float estimated_band
        text mistakes_summary
        int new_vocab_count
        int confidence_score
        text notes
        datetime created_at
        datetime updated_at
    }

    IELTS_MISTAKES {
        uuid id PK
        uuid ielts_session_id FK
        string category
        text description
        text example
    }

    IELTS_VOCAB {
        uuid id PK
        uuid user_id FK
        uuid ielts_session_id FK
        string phrase
        text meaning
        text example_usage
        string source_type
        datetime created_at
    }

    USERS ||--o{ IELTS_SESSIONS : "has"
    IELTS_SESSIONS ||--o{ IELTS_MISTAKES : "has"
    USERS ||--o{ IELTS_VOCAB : "has"
    IELTS_SESSIONS ||--o{ IELTS_VOCAB : "source_of"


    %% =========================
    %% JOURNAL / RESEARCH READING
    %% =========================
    JOURNAL_ENTRIES {
        uuid id PK
        uuid user_id FK
        date date
        string title
        string authors
        string source
        string category
        string content_type
        int time_spent_min
        text summary
        text key_insights
        text key_data_points
        text methods_summary
        text models_equations
        text limitations
        text open_question
        text project_relevance
        int confidence_score
        int rating_usefulness
        datetime created_at
        datetime updated_at
    }

    USERS ||--o{ JOURNAL_ENTRIES : "has"


    %% =========================
    %% BOOK READING
    %% =========================
    BOOKS {
        uuid id PK
        uuid user_id FK
        string title
        string author
        int total_pages
        string genre
        string language
        datetime created_at
    }

    BOOK_READING_SESSIONS {
        uuid id PK
        uuid user_id FK
        uuid book_id FK
        date date
        string chapter_label
        int pages_start
        int pages_end
        int pages_read
        int time_spent_min
        float reading_speed
        text summary
        text key_ideas
        text favorite_lines
        text new_vocab
        int emotion_score
        string emotion_label
        string purpose
        int focus_score
        text notes
        datetime created_at
    }

    USERS ||--o{ BOOKS : "owns"
    USERS ||--o{ BOOK_READING_SESSIONS : "has"
    BOOKS ||--o{ BOOK_READING_SESSIONS : "has_sessions"


    %% =========================
    %% SKILL BUILDING
    %% =========================
    SKILL_SESSIONS {
        uuid id PK
        uuid user_id FK
        date date
        string skill_category
        string sub_skill
        uuid project_id FK
        int time_spent_min
        text output_summary
        string output_link
        text learned_points
        int difficulty
        int mastery_level
        text mistakes
        text next_step
        int energy_score
        int quality_score
        datetime created_at
    }

    USERS ||--o{ SKILL_SESSIONS : "has"
    PROJECTS ||--o{ SKILL_SESSIONS : "groups"


    %% =========================
    %% WORKOUT
    %% =========================
    WORKOUT_SESSIONS {
        uuid id PK
        uuid user_id FK
        date date
        string workout_type
        string routine_name
        int duration_min
        float distance_km
        float pace_min_per_km
        int steps
        int avg_heart_rate
        int calories
        int intensity_level
        string focus
        int pre_energy
        string post_mood
        int workout_quality
        text notes
        datetime created_at
    }

    WORKOUT_SETS {
        uuid id PK
        uuid workout_session_id FK
        string exercise_name
        int set_number
        int reps
        float weight_kg
        text notes
    }

    USERS ||--o{ WORKOUT_SESSIONS : "has"
    WORKOUT_SESSIONS ||--o{ WORKOUT_SETS : "has_sets"


    %% =========================
    %% WELLNESS
    %% =========================
    WELLNESS_ENTRIES {
        uuid id PK
        uuid user_id FK
        date date
        float sleep_hours
        int sleep_quality
        int energy_level
        int appetite_control
        float hydration_liters
        text physical_symptoms
        int sunlight_minutes
        int mood_score
        int stress_level
        int mental_clarity
        int anxiety_level
        int screen_time_min
        int social_time_min
        int outdoor_time_min
        int hygiene_score
        int diet_discipline
        boolean no_late_snacks
        boolean morning_routine
        boolean evening_routine
        text wellness_note
        float wellness_score
        datetime created_at
    }

    USERS ||--o{ WELLNESS_ENTRIES : "has"


    %% =========================
    %% FINANCIAL
    %% =========================
    FINANCIAL_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        date date
        float amount_idr
        string direction
        string category
        boolean is_necessary
        string payment_method
        string investment_type
        text notes
        datetime created_at
    }

    USERS ||--o{ FINANCIAL_TRANSACTIONS : "has"


    %% =========================
    %% REFLECTION
    %% =========================
    REFLECTION_ENTRIES {
        uuid id PK
        uuid user_id FK
        date date
        text went_well
        text went_wrong
        text root_cause
        text learned_today
        text fix_for_tomorrow
        int integrity_score
        int discipline_score
        string emotional_state
        text gratitude
        text day_lesson
        text notes
        datetime created_at
    }

    USERS ||--o{ REFLECTION_ENTRIES : "has"


    %% =========================
    %% CAREER
    %% =========================
    CAREER_ACTIVITIES {
        uuid id PK
        uuid user_id FK
        date date
        string activity_type
        string subcategory
        string target_entity
        uuid project_id FK
        int time_spent_min
        text description
        text output_summary
        string output_link
        string pipeline_stage
        int priority
        int confidence
        int career_impact
        text next_step
        text notes
        datetime created_at
    }

    JOB_APPLICATIONS {
        uuid id PK
        uuid user_id FK
        string company
        string role_title
        string link
        string status
        string contact_name
        string contact_email
        date applied_date
        date expected_response
        text notes
        datetime created_at
    }

    USERS ||--o{ CAREER_ACTIVITIES : "has"
    USERS ||--o{ JOB_APPLICATIONS : "has"
    PROJECTS ||--o{ CAREER_ACTIVITIES : "groups"


    %% =========================
    %% MASTER'S DEGREE PREPARATION
    %% =========================
    MASTERS_PREP_ITEMS {
        uuid id PK
        uuid user_id FK
        string category
        string subcategory
        string task_title
        text description
        uuid related_goal_id FK
        int priority
        string status
        int progress_percent
        int time_spent_min
        text output_summary
        string output_link
        int readiness_score
        text next_step
        text notes
        datetime created_at
        datetime updated_at
    }

    MASTERS_PREP_SESSIONS {
        uuid id PK
        uuid user_id FK
        uuid prep_item_id FK
        date date
        int time_spent_min
        text notes
        datetime created_at
    }

    USERS ||--o{ MASTERS_PREP_ITEMS : "has"
    USERS ||--o{ MASTERS_PREP_SESSIONS : "has"
    GOALS ||--o{ MASTERS_PREP_ITEMS : "supports"
    MASTERS_PREP_ITEMS ||--o{ MASTERS_PREP_SESSIONS : "has_sessions"

