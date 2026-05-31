from groq import Groq


def call_llm(prompt, api_key):

    try:

        client = Groq(api_key=api_key)

        completion = client.chat.completions.create(

            model="llama-3.3-70b-versatile",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.7,
            max_tokens=2500
        )

        result = completion.choices[0].message.content

        return result.strip()

    except Exception as e:

        return f"Groq Error: {str(e)}"


def generate_learning_path(
    employee_name,
    target_role,
    gap_df,
    course_recommendations,
    api_key
):

    gap_summary = ""

    if not gap_df.empty:

        gaps_only = gap_df[gap_df["Gap Score"] > 0]

        for _, row in gaps_only.iterrows():

            gap_summary += (
                f"- {row['Skill']}: "
                f"Current Level = {row['Current Level']}, "
                f"Required Level = {row['Required Level']}\n"
            )

    course_info = ""

    for skill, courses in course_recommendations.items():

        if courses:

            course_info += f"\n{skill}:\n"

            for c in courses[:2]:

                title = c.get("title", "Unknown Course")
                level = c.get("level", "All Levels")

                course_info += f"- {title} ({level})\n"

    prompt = f"""
You are an expert HR learning and development specialist.

Employee Name: {employee_name}

Target Role: {target_role}

Skill Gaps Identified:
{gap_summary if gap_summary else "Minor gaps only"}

Recommended Courses:
{course_info if course_info else "General online learning resources"}

Create a personalised 6-month learning roadmap.

STRICT FORMAT:

# 6-Month Learning Path

## Goal
Briefly explain the career objective.

## Month 1 - Foundation Building
Week 1:
Week 2:
Week 3:
Week 4:
Milestone:

## Month 2 - Core Skills Development
Week 1:
Week 2:
Week 3:
Week 4:
Milestone:

## Month 3 - Intermediate Mastery
Week 1:
Week 2:
Week 3:
Week 4:
Milestone:

## Month 4 - Advanced Application
Week 1:
Week 2:
Week 3:
Week 4:
Milestone:

## Month 5 - Projects and Practice
Week 1:
Week 2:
Week 3:
Week 4:
Milestone:

## Month 6 - Interview Preparation and Job Readiness
Week 1:
Week 2:
Week 3:
Week 4:
Milestone:

## Success Metrics
- Metric 1
- Metric 2
- Metric 3

Make the roadmap practical, realistic, and aligned with the identified skill gaps.
"""

    try:

        result = call_llm(prompt, api_key)

        if result:
            return result

        return "Groq returned an empty response."

    except Exception as e:

        return f"Error generating learning path: {str(e)}"


def generate_gap_insights(target_role, gap_df, api_key):

    if gap_df.empty:
        return "No gap data available."

    gaps_only = gap_df[gap_df["Gap Score"] > 0]

    if gaps_only.empty:

        return (
            f"Great news! "
            f"The employee already meets most requirements "
            f"for the role of {target_role}."
        )

    top_gaps = gaps_only.head(5)["Skill"].tolist()

    prompt = f"""
Summarise the major skill gaps for someone targeting the role:

{target_role}

Top missing skills:
{', '.join(top_gaps)}

Give professional, encouraging, and practical advice
in 4-5 sentences.
"""

    try:

        result = call_llm(prompt, api_key)

        if result:
            return result

        return "Groq returned an empty response."

    except Exception as e:

        return f"Could not generate insights: {str(e)}"