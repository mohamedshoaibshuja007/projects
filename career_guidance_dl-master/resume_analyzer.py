import re
import PyPDF2
from pathlib import Path
import json

class ResumeAnalyzer:
    def __init__(self):
        # Define patterns for feature extraction
        self.patterns = {
            'education': {
                'degree': r'Bachelor|Master|B\.[A-Za-z]+|M\.[A-Za-z]+|Ph\.D',
                'major': r'Computer Science|Engineering|Information Technology|Data Science|AI|ML',
                'gpa': r'[0-9]+\.[0-9]+\s*(?:CGPA|GPA|CPI)',
            },
            'technical_skills': {
                'programming': r'Python|Java|C\+\+|JavaScript|TypeScript|HTML|CSS|SQL',
                'frameworks': r'React|Angular|Vue|Django|Flask|Spring|Express|Node\.js',
                'ml_tools': r'TensorFlow|PyTorch|Scikit-learn|Keras|Pandas|NumPy',
                'databases': r'MySQL|MongoDB|PostgreSQL|SQLite|Redis',
                'devops': r'Docker|Kubernetes|AWS|Azure|GCP|Git',
            },
            'soft_skills': r'Leadership|Communication|Team Player|Problem.Solving|Analytical|Critical Thinking|Time Management',
            'project_keywords': r'Machine Learning|Deep Learning|Web Development|Full Stack|Database|API|Algorithm|System Design',
            'experience': r'\d+\+?\s*(?:year|yr|month)s?\s*(?:of experience)?',
        }
        
        # Define scoring weights for project experience
        self.project_scoring = {
            'hackathon': 2,
            'competition': 2,
            'research': 3,
            'development': 2,
            'team': 1,
            'award': 2,
        }

    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ''
                for page in pdf_reader.pages:
                    text += page.extract_text() + '\n'
                return text
        except Exception as e:
            return f"Error reading PDF: {str(e)}"

    def calculate_project_score(self, text):
        """Calculate project experience score (1-10)"""
        score = 0
        text_lower = text.lower()
        
        # Count project indicators
        project_count = len(re.findall(r'project|developed|created|built|implemented', text_lower))
        hackathon_count = len(re.findall(r'hackathon|competition|contest', text_lower))
        team_count = len(re.findall(r'team|collaborated|led', text_lower))
        award_count = len(re.findall(r'won|winner|award|place', text_lower))
        
        # Calculate base score
        score += min(project_count * self.project_scoring['development'], 4)
        score += min(hackathon_count * self.project_scoring['hackathon'], 3)
        score += min(team_count * self.project_scoring['team'], 2)
        score += min(award_count * self.project_scoring['award'], 1)
        
        return min(max(round(score), 1), 10)

    def extract_features(self, text):
        """Extract relevant features from resume text"""
        text = text.replace('\n', ' ')
        features = {
            'education': {
                'degree': [],
                'major': [],
                'gpa': None
            },
            'technical_skills': {
                'programming': set(),
                'frameworks': set(),
                'ml_tools': set(),
                'databases': set(),
                'devops': set()
            },
            'soft_skills': set(),
            'project_keywords': set(),
            'experience_years': None,
            'project_experience_score': None
        }
        
        # Extract education details
        for edu_type, pattern in self.patterns['education'].items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            if edu_type == 'gpa':
                gpa_match = re.search(pattern, text)
                if gpa_match:
                    gpa_text = gpa_match.group()
                    features['education']['gpa'] = float(re.search(r'[0-9]+\.[0-9]+', gpa_text).group())
            else:
                features['education'][edu_type] = [match.group() for match in matches]
        
        # Extract technical skills
        for category, pattern in self.patterns['technical_skills'].items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            features['technical_skills'][category].update(match.group() for match in matches)
        
        # Extract soft skills
        soft_skills_matches = re.finditer(self.patterns['soft_skills'], text, re.IGNORECASE)
        features['soft_skills'].update(match.group() for match in soft_skills_matches)
        
        # Extract project keywords
        project_matches = re.finditer(self.patterns['project_keywords'], text, re.IGNORECASE)
        features['project_keywords'].update(match.group() for match in project_matches)
        
        # Extract experience years
        exp_match = re.search(self.patterns['experience'], text, re.IGNORECASE)
        if exp_match:
            exp_text = exp_match.group()
            years = float(re.search(r'\d+', exp_text).group())
            if 'month' in exp_text.lower():
                years = years / 12
            features['experience_years'] = round(years, 1)
        
        # Calculate project experience score
        features['project_experience_score'] = self.calculate_project_score(text)
        
        # Convert sets to lists for JSON serialization
        features['technical_skills'] = {k: list(v) for k, v in features['technical_skills'].items()}
        features['soft_skills'] = list(features['soft_skills'])
        features['project_keywords'] = list(features['project_keywords'])
        
        return features

    def analyze_resume(self, pdf_path):
        """Analyze resume and extract features"""
        # Extract text from PDF
        text = self.extract_text_from_pdf(pdf_path)
        if text.startswith("Error"):
            return {"error": text}
        
        # Extract features
        features = self.extract_features(text)
        
        # Prepare model input features
        model_features = {
            'Problem-Solving Score': 8 if 'Problem Solving' in features['soft_skills'] else 5,
            'Coding Experience (Years)': features['experience_years'] if features['experience_years'] else 0,
            'Work_Experience': features['experience_years'] if features['experience_years'] else 0,
            'Project Experience': features['project_experience_score'],
            'Technical_Skills': ', '.join(
                features['technical_skills']['programming'] + 
                features['technical_skills']['frameworks'] +
                features['technical_skills']['ml_tools']
            ),
            'Soft_Skills': ', '.join(features['soft_skills']),
            'Academic Background': features['education']['major'][0] if features['education']['major'] else 'Unknown',
            'Personality Type': 'Unknown',  # Would need additional analysis
            'Work Preference': 'Unknown'    # Would need additional analysis
        }
        
        return {
            'extracted_features': features,
            'model_features': model_features
        }

def main():
    analyzer = ResumeAnalyzer()
    
    print("Resume Feature Analyzer")
    print("-" * 50)
    
    # Get PDF path
    pdf_path = input("\nEnter path to your resume PDF: ")
    
    if not Path(pdf_path).exists():
        print(f"Error: File not found at {pdf_path}")
        return
    
    # Analyze resume
    print("\nAnalyzing resume...")
    result = analyzer.analyze_resume(pdf_path)
    
    if "error" in result:
        print(f"\nError: {result['error']}")
        return
    
    # Print results
    print("\nExtracted Features:")
    print(json.dumps(result['extracted_features'], indent=2))
    
    print("\nModel Input Features:")
    print(json.dumps(result['model_features'], indent=2))

if __name__ == "__main__":
    main()
