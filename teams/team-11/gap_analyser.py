import pandas as pd
import os

# ─────────────────────────────────────────────
# DATA DIRECTORY
# ─────────────────────────────────────────────

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# ─────────────────────────────────────────────
# PROFICIENCY LEVELS
# ─────────────────────────────────────────────

PROFICIENCY_LEVELS = {
    "None": 0,
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3,
    "Expert": 4
}

# ─────────────────────────────────────────────
# CUSTOM SKILL MAPPING
# ─────────────────────────────────────────────

CUSTOM_SKILL_MAPPING = {

    "Python": "Programming",

    "Java": "Programming",

    "C": "Programming",

    "C++": "Programming",

    "JavaScript": "Programming",

    "SQL": "Databases",

    "Git": "Version Control",

    "Machine Learning": "Machine Learning",

    "Deep Learning": "Deep Learning",

    "TensorFlow": "Deep Learning",

    "PyTorch": "Deep Learning",

    "AWS": "Cloud Computing",

    "Docker": "DevOps",

    "Cloud Computing": "Cloud Computing",

    "Communication": "Communication",

    "Leadership": "Leadership",

    "Critical Thinking": "Critical Thinking",

    "Problem Solving": "Problem Solving",

    "Project Management": "Project Management",

    "Excel": "Data Analysis",

    "Power BI": "Data Visualization",

    "Statistics": "Statistics",

    "Data Analysis": "Data Analysis",

    "React": "Frontend Development",

    "Node.js": "Backend Development",

    "MongoDB": "Databases",

    "DevOps": "DevOps",

    "API Development": "Backend Development"
}

# ─────────────────────────────────────────────
# ROLE-BASED REQUIRED SKILLS
# ─────────────────────────────────────────────

ROLE_SKILLS = {

    "Software Developer": [

        {"skill": "Programming", "required_level": 3, "category": "Technical"},
        {"skill": "Databases", "required_level": 2, "category": "Technical"},
        {"skill": "Version Control", "required_level": 2, "category": "Technical"},
        {"skill": "Backend Development", "required_level": 2, "category": "Technical"},
        {"skill": "Frontend Development", "required_level": 2, "category": "Technical"},
        {"skill": "DevOps", "required_level": 1, "category": "Technical"},
        {"skill": "Cloud Computing", "required_level": 1, "category": "Technical"},
        {"skill": "Critical Thinking", "required_level": 2, "category": "Soft Skill"},
        {"skill": "Problem Solving", "required_level": 3, "category": "Soft Skill"},
        {"skill": "Communication", "required_level": 2, "category": "Soft Skill"}
    ],

    "Data Scientist": [

        {"skill": "Programming", "required_level": 3, "category": "Technical"},
        {"skill": "Machine Learning", "required_level": 3, "category": "Technical"},
        {"skill": "Deep Learning", "required_level": 2, "category": "Technical"},
        {"skill": "Statistics", "required_level": 3, "category": "Technical"},
        {"skill": "Data Analysis", "required_level": 3, "category": "Technical"},
        {"skill": "Databases", "required_level": 2, "category": "Technical"},
        {"skill": "Cloud Computing", "required_level": 1, "category": "Technical"},
        {"skill": "Critical Thinking", "required_level": 2, "category": "Soft Skill"},
        {"skill": "Problem Solving", "required_level": 3, "category": "Soft Skill"},
        {"skill": "Communication", "required_level": 2, "category": "Soft Skill"}
    ],

    "Machine Learning Engineer": [

        {"skill": "Programming", "required_level": 3, "category": "Technical"},
        {"skill": "Machine Learning", "required_level": 3, "category": "Technical"},
        {"skill": "Deep Learning", "required_level": 3, "category": "Technical"},
        {"skill": "TensorFlow", "required_level": 2, "category": "Technical"},
        {"skill": "Cloud Computing", "required_level": 2, "category": "Technical"},
        {"skill": "DevOps", "required_level": 2, "category": "Technical"},
        {"skill": "Databases", "required_level": 2, "category": "Technical"},
        {"skill": "Critical Thinking", "required_level": 2, "category": "Soft Skill"},
        {"skill": "Problem Solving", "required_level": 3, "category": "Soft Skill"}
    ]
}

# ─────────────────────────────────────────────
# GET JOB TITLES
# ─────────────────────────────────────────────

def get_all_job_titles():

    return sorted(ROLE_SKILLS.keys())

# ─────────────────────────────────────────────
# GET REQUIRED SKILLS
# ─────────────────────────────────────────────

def get_required_skills_for_role(target_role):

    return ROLE_SKILLS.get(target_role, [])

# ─────────────────────────────────────────────
# COMPUTE GAP MATRIX
# ─────────────────────────────────────────────

def compute_gap_matrix(current_skills: dict, target_role: str):

    required_skills = get_required_skills_for_role(target_role)

    if not required_skills:

        return pd.DataFrame()

    mapped_skills = {}

    # ─────────────────────────────
    # MAP USER SKILLS
    # ─────────────────────────────

    for skill, level in current_skills.items():

        mapped_name = CUSTOM_SKILL_MAPPING.get(skill)

        if mapped_name:

            existing_level = mapped_skills.get(mapped_name)

            if existing_level:

                existing_score = PROFICIENCY_LEVELS.get(existing_level, 0)

                new_score = PROFICIENCY_LEVELS.get(level, 0)

                if new_score > existing_score:

                    mapped_skills[mapped_name] = level

            else:

                mapped_skills[mapped_name] = level

    rows = []

    level_labels = {
        v: k for k, v in PROFICIENCY_LEVELS.items()
    }

    # ─────────────────────────────
    # GAP ANALYSIS
    # ─────────────────────────────

    for req in required_skills:

        skill = req["skill"]

        required_level = req["required_level"]

        category = req["category"]

        current_level_str = mapped_skills.get(skill, "None")

        current_level = PROFICIENCY_LEVELS.get(current_level_str, 0)

        gap = max(0, required_level - current_level)

        # STATUS

        if gap == 0:

            status = "✅ Met"

        elif gap == 1:

            status = "⚠️ Partial"

        else:

            status = "❌ Gap"

        rows.append({

            "Skill": skill,

            "Category": category,

            "Current Level": level_labels.get(current_level, "None"),

            "Required Level": level_labels.get(required_level, "Beginner"),

            "Current Score": current_level,

            "Required Score": required_level,

            "Gap Score": gap,

            "Status": status
        })

    df = pd.DataFrame(rows)

    df = df.sort_values(
        by="Gap Score",
        ascending=False
    )

    return df