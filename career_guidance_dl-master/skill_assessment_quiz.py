import random
import numpy as np

class SkillAssessmentQuiz:
    def __init__(self):
        self.problem_solving_questions = [
            {
                "question": "How do you typically approach a complex programming problem?",
                "options": [
                    "Jump straight into coding",
                    "Break it down into smaller sub-problems",
                    "Look for existing solutions to copy",
                    "Ask someone else to solve it"
                ],
                "weights": [0.3, 0.9, 0.4, 0.2]
            },
            {
                "question": "When faced with a bug, what's your first step?",
                "options": [
                    "Use print statements everywhere",
                    "Use a debugger and set breakpoints",
                    "Read documentation and error messages carefully",
                    "Start over from scratch"
                ],
                "weights": [0.4, 0.8, 0.7, 0.2]
            },
            {
                "question": "How do you handle algorithm optimization?",
                "options": [
                    "Ignore it if the code works",
                    "Profile the code and identify bottlenecks",
                    "Add more hardware resources",
                    "Only optimize if someone complains"
                ],
                "weights": [0.2, 0.9, 0.4, 0.3]
            },
            {
                "question": "What's your approach to code organization?",
                "options": [
                    "Keep everything in one file",
                    "Use design patterns and modular structure",
                    "Copy-paste similar code",
                    "No specific organization"
                ],
                "weights": [0.3, 0.8, 0.2, 0.1]
            },
            {
                "question": "How do you validate your solution?",
                "options": [
                    "Manual testing only",
                    "Comprehensive test cases and edge cases",
                    "Basic happy path testing",
                    "Let users find bugs"
                ],
                "weights": [0.4, 0.9, 0.5, 0.1]
            },
            {
                "question": "When working on a new feature, you...",
                "options": [
                    "Start coding immediately",
                    "Plan architecture and design first",
                    "Copy from similar features",
                    "Wait for detailed instructions"
                ],
                "weights": [0.3, 0.8, 0.4, 0.2]
            },
            {
                "question": "How do you handle technical debt?",
                "options": [
                    "Ignore it",
                    "Regular refactoring and improvements",
                    "Only fix when broken",
                    "Complete rewrite when messy"
                ],
                "weights": [0.1, 0.9, 0.4, 0.3]
            },
            {
                "question": "When learning a new technology, you...",
                "options": [
                    "Copy-paste examples",
                    "Build small projects to experiment",
                    "Read documentation thoroughly",
                    "Watch video tutorials only"
                ],
                "weights": [0.3, 0.8, 0.7, 0.4]
            },
            {
                "question": "How do you handle project requirements?",
                "options": [
                    "Start coding immediately",
                    "Analyze and clarify requirements first",
                    "Make assumptions",
                    "Follow orders exactly"
                ],
                "weights": [0.2, 0.9, 0.3, 0.4]
            },
            {
                "question": "When reviewing code, you focus on...",
                "options": [
                    "Syntax only",
                    "Logic, performance, and maintainability",
                    "Formatting",
                    "Finding any issues"
                ],
                "weights": [0.3, 0.9, 0.2, 0.5]
            }
        ]
        
        self.coding_experience_questions = [
            {
                "question": "How often do you code?",
                "options": [
                    "Daily",
                    "Few times a week",
                    "Occasionally",
                    "Rarely"
                ],
                "weights": [0.9, 0.7, 0.4, 0.2]
            },
            {
                "question": "What's the largest project you've worked on?",
                "options": [
                    "Enterprise application",
                    "Medium-sized application",
                    "Small projects",
                    "Practice exercises"
                ],
                "weights": [0.9, 0.7, 0.4, 0.2]
            },
            {
                "question": "How many programming languages are you proficient in?",
                "options": [
                    "4 or more",
                    "2-3",
                    "1",
                    "Learning first language"
                ],
                "weights": [0.9, 0.7, 0.4, 0.2]
            },
            {
                "question": "Have you contributed to open source?",
                "options": [
                    "Regular contributor",
                    "Few contributions",
                    "No, but familiar with process",
                    "Never"
                ],
                "weights": [0.9, 0.6, 0.3, 0.1]
            },
            {
                "question": "How comfortable are you with debugging tools?",
                "options": [
                    "Expert level",
                    "Comfortable with most features",
                    "Basic usage",
                    "Minimal experience"
                ],
                "weights": [0.9, 0.7, 0.4, 0.2]
            },
            {
                "question": "Experience with version control (e.g., Git)?",
                "options": [
                    "Advanced (branching, merging, resolving conflicts)",
                    "Intermediate (basic operations)",
                    "Basic (commit, push, pull)",
                    "No experience"
                ],
                "weights": [0.9, 0.6, 0.3, 0.1]
            },
            {
                "question": "How often do you learn new technologies?",
                "options": [
                    "Constantly learning",
                    "When needed for projects",
                    "Occasionally",
                    "Rarely"
                ],
                "weights": [0.9, 0.7, 0.4, 0.2]
            },
            {
                "question": "Experience with code review?",
                "options": [
                    "Regular reviewer and contributor",
                    "Occasional participation",
                    "Submitted for review only",
                    "No experience"
                ],
                "weights": [0.9, 0.6, 0.3, 0.1]
            },
            {
                "question": "How do you test your code?",
                "options": [
                    "TDD and comprehensive testing",
                    "Unit tests for critical parts",
                    "Basic testing",
                    "Manual testing only"
                ],
                "weights": [0.9, 0.7, 0.4, 0.2]
            },
            {
                "question": "Experience with deployment and CI/CD?",
                "options": [
                    "Set up and maintained pipelines",
                    "Used existing pipelines",
                    "Basic understanding",
                    "No experience"
                ],
                "weights": [0.9, 0.6, 0.3, 0.1]
            }
        ]

    def run_quiz(self):
        print("\nSkill Assessment Quiz")
        print("-" * 50)
        
        # Select random questions
        problem_solving_selected = random.sample(self.problem_solving_questions, 3)
        coding_exp_selected = random.sample(self.coding_experience_questions, 3)
        
        scores = {
            'problem_solving': [],
            'coding_experience': []
        }
        
        print("\nProblem Solving Questions:")
        for i, q in enumerate(problem_solving_selected, 1):
            score = self._ask_question(q, i)
            scores['problem_solving'].append(score)
        
        print("\nCoding Experience Questions:")
        for i, q in enumerate(coding_exp_selected, 1):
            score = self._ask_question(q, i)
            scores['coding_experience'].append(score)
        
        # Calculate final scores
        problem_solving_score = self._normalize_score(np.mean(scores['problem_solving']))
        coding_exp_score = self._normalize_score(np.mean(scores['coding_experience']))
        
        print("\nAssessment Results:")
        print("-" * 50)
        print(f"Problem-Solving Score: {problem_solving_score:.2f}")
        print(f"Coding Experience Score: {coding_exp_score:.2f}")
        
        return {
            'Problem-Solving Score': problem_solving_score,
            'Coding Experience (Years)': coding_exp_score * 5  # Scale to years (0-5)
        }

    def _ask_question(self, question, num):
        print(f"\nQ{num}. {question['question']}")
        for i, option in enumerate(question['options'], 1):
            print(f"{i}. {option}")
        
        while True:
            try:
                answer = int(input("\nYour answer (1-4): "))
                if 1 <= answer <= 4:
                    return question['weights'][answer-1]
                print("Please enter a number between 1 and 4.")
            except ValueError:
                print("Please enter a valid number.")

    def _normalize_score(self, score):
        # Normalize score to match the sample variation range (0.35-0.92)
        min_score, max_score = 0.35, 0.92
        return min_score + score * (max_score - min_score)

def main():
    quiz = SkillAssessmentQuiz()
    results = quiz.run_quiz()

if __name__ == "__main__":
    main()
