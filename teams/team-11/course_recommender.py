import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_udemy_courses():
    """Load Udemy courses dataset."""
    path = os.path.join(DATA_DIR, "udemy_courses.csv")
    try:
        df = pd.read_csv(path, encoding="utf-8")
        return df
    except Exception as e:
        print(f"Error loading Udemy courses: {e}")
        return pd.DataFrame()

def get_course_recommendations(gap_df, top_n=3):
    """
    For each skill gap, find matching Udemy courses.
    Returns dict: {skill_name: [list of course dicts]}
    """
    courses_df = load_udemy_courses()
    recommendations = {}

    if courses_df.empty or gap_df.empty:
        return recommendations

    # Only recommend for skills with actual gaps
    gaps_only = gap_df[gap_df["Gap Score"] > 0]

    # Identify title column
    title_col = None
    for col in ["course_title", "title", "Title", "Course Title", "name"]:
        if col in courses_df.columns:
            title_col = col
            break

    if not title_col:
        return recommendations

    # Identify subject/category column
    subject_col = None
    for col in ["subject", "category", "Subject", "Category", "topic"]:
        if col in courses_df.columns:
            subject_col = col
            break

    # Identify level column
    level_col = None
    for col in ["level", "difficulty", "Level", "Difficulty"]:
        if col in courses_df.columns:
            level_col = col
            break

    # Identify URL column
    url_col = None
    for col in ["url", "course_url", "URL", "link"]:
        if col in courses_df.columns:
            url_col = col
            break

    # Identify subscribers/rating column
    rating_col = None
    for col in ["num_subscribers", "rating", "subscribers", "Rating"]:
        if col in courses_df.columns:
            rating_col = col
            break

    for _, row in gaps_only.iterrows():
        skill = row["Skill"]
        gap_score = row["Gap Score"]

        if gap_score == 0:
            continue

        # Search for courses matching this skill
        keywords = skill.lower().split()
        mask = courses_df[title_col].str.lower().str.contains(keywords[0], na=False)

        # Try additional keywords
        for kw in keywords[1:]:
            if len(kw) > 3:  # skip short words
                mask = mask | courses_df[title_col].str.lower().str.contains(kw, na=False)

        # Also search in subject column if available
        if subject_col:
            mask = mask | courses_df[subject_col].str.lower().str.contains(keywords[0], na=False)

        matched = courses_df[mask].copy()

        # Sort by rating/subscribers if available
        if rating_col and rating_col in matched.columns:
            matched = matched.sort_values(rating_col, ascending=False)

        # Build course list
        course_list = []
        for _, course in matched.head(top_n).iterrows():
            course_dict = {
                "title": course.get(title_col, "Unknown Course"),
                "level": course.get(level_col, "All Levels") if level_col else "All Levels",
                "url": course.get(url_col, "#") if url_col else "#",
                "subscribers": int(course.get(rating_col, 0)) if rating_col and pd.notna(course.get(rating_col)) else 0
            }
            course_list.append(course_dict)

        # If no match found, add a generic recommendation
        if not course_list:
            course_list.append({
                "title": f"Search '{skill}' on Udemy",
                "level": "Beginner to Intermediate",
                "url": f"https://www.udemy.com/courses/search/?q={skill.replace(' ', '+')}",
                "subscribers": 0
            })

        recommendations[skill] = course_list

    return recommendations