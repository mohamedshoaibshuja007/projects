import requests
import re
from collections import Counter
import json
from datetime import datetime
import base64

class GithubProfileAnalyzer:
    def __init__(self):
        self.tech_categories = {
            'frontend': {
                'languages': {'HTML', 'CSS', 'JavaScript', 'TypeScript'},
                'frameworks': {
                    'react': ['react', 'jsx', 'next.js'],
                    'angular': ['angular', 'ng'],
                    'vue': ['vue', 'nuxt'],
                    'svelte': ['svelte'],
                    'bootstrap': ['bootstrap'],
                    'tailwind': ['tailwind'],
                }
            },
            'backend': {
                'languages': {'Python', 'Java', 'PHP', 'Ruby', 'Go', 'C#', 'Node.js'},
                'frameworks': {
                    'django': ['django'],
                    'flask': ['flask'],
                    'fastapi': ['fastapi'],
                    'spring': ['spring boot', 'spring framework'],
                    'express': ['express.js', 'express'],
                    'laravel': ['laravel'],
                    'rails': ['ruby on rails'],
                }
            },
            'database': {
                'technologies': {
                    'sql': ['mysql', 'postgresql', 'sqlite', 'sql server'],
                    'nosql': ['mongodb', 'redis', 'cassandra', 'firebase'],
                    'orm': ['sqlalchemy', 'hibernate', 'prisma', 'sequelize']
                }
            },
            'devops': {
                'technologies': {
                    'containerization': ['docker', 'kubernetes', 'container'],
                    'ci_cd': ['github actions', 'jenkins', 'travis', 'gitlab ci'],
                    'cloud': ['aws', 'azure', 'gcp', 'cloud'],
                }
            },
            'ai_ml': {
                'libraries': {
                    'ml': ['tensorflow', 'pytorch', 'scikit-learn', 'keras'],
                    'data': ['pandas', 'numpy', 'matplotlib', 'seaborn'],
                    'nlp': ['nltk', 'spacy', 'transformers', 'huggingface']
                }
            }
        }

    def analyze_repository(self, repo_data, readme_content=""):
        """Analyze a single repository for technologies and complexity"""
        tech_stack = set()
        
        # Add primary language
        if repo_data['language']:
            tech_stack.add(repo_data['language'])
        
        # Analyze readme content for technologies
        if readme_content:
            decoded_content = base64.b64decode(readme_content).decode('utf-8').lower()
            tech_stack.update(self._find_technologies(decoded_content))
        
        # Calculate repository score (0-10)
        score = self._calculate_repo_score(repo_data, len(tech_stack))
        
        return {
            'tech_stack': list(tech_stack),
            'score': score
        }

    def _find_technologies(self, content):
        """Find all technologies mentioned in the content"""
        found_tech = set()
        
        for category in self.tech_categories.values():
            # Check languages
            if 'languages' in category:
                found_tech.update(lang for lang in category['languages'] 
                                if lang.lower() in content)
            
            # Check frameworks
            if 'frameworks' in category:
                for framework, keywords in category['frameworks'].items():
                    if any(keyword in content for keyword in keywords):
                        found_tech.add(framework)
            
            # Check technologies
            if 'technologies' in category:
                for tech_type, technologies in category['technologies'].items():
                    for tech in technologies:
                        if tech in content:
                            found_tech.add(tech)
            
            # Check libraries
            if 'libraries' in category:
                for lib_type, libraries in category['libraries'].items():
                    for lib in libraries:
                        if lib in content:
                            found_tech.add(lib)
        
        return found_tech

    def _calculate_repo_score(self, repo, tech_count):
        """Calculate a score (0-10) for a single repository"""
        score = 0
        
        # Size and complexity (0-3 points)
        size_score = min(repo['size'] / 5000, 3)  # 3 points for repos > 5MB
        
        # Technology diversity (0-2 points)
        tech_score = min(tech_count / 3, 2)
        
        # Activity and engagement (0-3 points)
        stars_score = min(repo['stargazers_count'] / 10, 1)
        forks_score = min(repo['forks_count'] / 5, 1)
        watchers_score = min(repo['watchers_count'] / 5, 1)
        
        # Updates and maintenance (0-2 points)
        last_update = datetime.strptime(repo['updated_at'], '%Y-%m-%dT%H:%M:%SZ')
        now = datetime.utcnow()
        months_since_update = (now - last_update).days / 30
        update_score = 2 if months_since_update < 1 else (1 if months_since_update < 6 else 0)
        
        score = size_score + tech_score + stars_score + forks_score + watchers_score + update_score
        return round(min(score, 10), 1)

    def analyze_profile(self, username):
        """Analyze entire GitHub profile"""
        try:
            # Get user's repositories
            repos_url = f"https://api.github.com/users/{username}/repos"
            repos_response = requests.get(repos_url)
            if repos_response.status_code != 200:
                return {"error": "Unable to fetch repository data"}
            
            repos = repos_response.json()
            
            # Get user profile
            user_url = f"https://api.github.com/users/{username}"
            user_response = requests.get(user_url)
            user_data = user_response.json() if user_response.status_code == 200 else {}
            
            # Analyze each repository
            repo_analyses = []
            all_tech_stack = set()
            total_score = 0
            
            # Track problem solving indicators
            problem_solving_indicators = {
                'algorithms': 0,
                'leetcode': 0,
                'hackerrank': 0,
                'competitive': 0,
                'problem': 0
            }
            
            for repo in repos:
                # Get readme content
                readme_url = f"https://api.github.com/repos/{username}/{repo['name']}/readme"
                readme_response = requests.get(readme_url)
                readme_content = readme_response.json()['content'] if readme_response.status_code == 200 else ""
                
                # Check for problem-solving indicators in readme
                if readme_content:
                    decoded_content = base64.b64decode(readme_content).decode('utf-8').lower()
                    for indicator in problem_solving_indicators:
                        if indicator in decoded_content:
                            problem_solving_indicators[indicator] += 1
                
                # Analyze repository
                analysis = self.analyze_repository(repo, readme_content)
                repo_analyses.append({
                    'name': repo['name'],
                    'score': analysis['score'],
                    'tech_stack': analysis['tech_stack']
                })
                all_tech_stack.update(analysis['tech_stack'])
                total_score += analysis['score']
            
            # Calculate final profile score (1-10)
            num_repos = len(repos)
            if num_repos == 0:
                return {"error": "No repositories found"}
            
            # Average repository score (70% weight)
            avg_repo_score = total_score / num_repos * 0.7
            
            # Technology diversity score (30% weight)
            tech_diversity_score = min(len(all_tech_stack) / 5, 1) * 3
            
            final_score = round(avg_repo_score + tech_diversity_score)
            final_score = max(1, min(10, final_score))
            
            # Calculate years of experience based on first contribution
            years_of_experience = 0
            if 'created_at' in user_data:
                created_date = datetime.strptime(user_data['created_at'], '%Y-%m-%dT%H:%M:%SZ')
                years_of_experience = round((datetime.utcnow() - created_date).days / 365, 1)
            
            # Calculate problem-solving score
            problem_solving_score = min(sum(problem_solving_indicators.values()) * 2, 10)
            
            # Prepare model input features
            model_features = {
                'Problem-Solving Score': problem_solving_score if problem_solving_score > 0 else 5,
                'Coding Experience (Years)': years_of_experience,
                'Work_Experience': years_of_experience,
                'Project Experience': final_score,
                'Technical_Skills': ', '.join(sorted(all_tech_stack)),
                'Soft_Skills': 'Team Player' if any('team' in repo['name'].lower() for repo in repos) else 'Unknown',
                'Academic Background': 'Unknown',  # Cannot determine from GitHub
                'Personality Type': 'Unknown',     # Cannot determine from GitHub
                'Work Preference': 'Remote' if any('remote' in repo['name'].lower() for repo in repos) else 'Unknown'
            }
            
            # Categorize technologies
            tech_categories = {
                'frontend': [],
                'backend': [],
                'database': [],
                'devops': [],
                'ai_ml': []
            }
            
            for tech in all_tech_stack:
                for category, content in self.tech_categories.items():
                    if (('languages' in content and tech in content['languages']) or
                        ('frameworks' in content and tech in content['frameworks']) or
                        ('technologies' in content and any(tech in techs for techs in content['technologies'].values())) or
                        ('libraries' in content and any(tech in libs for libs in content['libraries'].values()))):
                        tech_categories[category].append(tech)
            
            return {
                'profile_score': final_score,
                'repositories': repo_analyses,
                'tech_stack_summary': {
                    'total_technologies': len(all_tech_stack),
                    'categories': {k: v for k, v in tech_categories.items() if v}
                },
                'model_features': model_features
            }
            
        except Exception as e:
            return {"error": str(e)}

def extract_username(input_string):
    """Extract username from GitHub URL or return the input if it's just a username"""
    github_patterns = [
        r"github\.com/([^/]+)/?.*",
        r"github\.com/([^/]+)/.*"
    ]
    
    for pattern in github_patterns:
        match = re.search(pattern, input_string)
        if match:
            return match.group(1)
    return input_string

def main():
    user_input = input("Enter GitHub username or profile URL: ")
    username = extract_username(user_input)
    print(f"\nAnalyzing GitHub profile for user: {username}")
    
    analyzer = GithubProfileAnalyzer()
    result = analyzer.analyze_profile(username)
    
    if "error" in result:
        print(f"\nError: {result['error']}")
    else:
        print("\nAnalysis Result:")
        print(json.dumps(result, indent=2))
        
        print("\nScore Explanation:")
        print("1-3: Beginner (Few repos, basic technologies)")
        print("4-6: Intermediate (Multiple repos, diverse tech stack)")
        print("7-8: Advanced (Active projects, comprehensive tech stack)")
        print("9-10: Expert (Significant projects, mastery across multiple domains)")

if __name__ == "__main__":
    main()
