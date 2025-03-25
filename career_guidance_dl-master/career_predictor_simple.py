import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

def prepare_data(df):
    # Prepare numerical features
    numerical_features = ['Problem-Solving Score', 'Coding Experience (Years)', 
                         'Work_Experience', 'Project Experience']
    X_numerical = df[numerical_features].values
    
    # Prepare categorical features
    categorical_features = ['Technical_Skills', 'Soft_Skills', 'Academic Background', 
                          'Personality Type', 'Work Preference']
    
    # Initialize label encoders
    encoders = {}
    X_categorical_encoded = []
    
    for feature in categorical_features:
        encoder = LabelEncoder()
        encoded_feature = encoder.fit_transform(df[feature])
        X_categorical_encoded.append(encoded_feature)
        encoders[feature] = encoder
    
    # Combine features
    X = np.column_stack([X_numerical] + X_categorical_encoded)
    
    # Encode target
    target_encoder = LabelEncoder()
    y = target_encoder.fit_transform(df['Recommended Career'])
    
    # Scale features
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    
    return X, y, encoders, target_encoder, scaler

def train_model():
    print("Loading data...")
    df = pd.read_csv("realistic_career_data.csv")
    
    print("Preparing data...")
    X, y, encoders, target_encoder, scaler = prepare_data(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Create and train model
    print("Training model...")
    model = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy:.4f}")
    
    # Print classification report
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, 
                              target_names=target_encoder.classes_))
    
    # Save model and preprocessors
    model_data = {
        'model': model,
        'encoders': encoders,
        'target_encoder': target_encoder,
        'scaler': scaler
    }
    joblib.dump(model_data, 'career_predictor_simple.joblib')
    print("\nModel saved as 'career_predictor_simple.joblib'")
    
    return model_data, accuracy

def predict_career(model_data, input_data):
    # Prepare input features
    numerical_features = ['Problem-Solving Score', 'Coding Experience (Years)', 
                         'Work_Experience', 'Project Experience']
    categorical_features = ['Technical_Skills', 'Soft_Skills', 'Academic Background', 
                          'Personality Type', 'Work Preference']
    
    # Extract numerical features
    X_numerical = input_data[numerical_features].values
    
    # Encode categorical features
    X_categorical_encoded = []
    for feature in categorical_features:
        encoder = model_data['encoders'][feature]
        encoded_feature = encoder.transform([input_data[feature].iloc[0]])
        X_categorical_encoded.append(encoded_feature)
    
    # Combine features
    X = np.column_stack([X_numerical] + X_categorical_encoded)
    
    # Scale features
    X = model_data['scaler'].transform(X)
    
    # Make prediction
    prediction = model_data['model'].predict(X)
    probabilities = model_data['model'].predict_proba(X)
    
    return prediction, probabilities

if __name__ == "__main__":
    # Train model
    model_data, accuracy = train_model()
    
    # Example prediction if accuracy is good
    if accuracy >= 0.70:
        print("\nExample Prediction:")
        example_data = pd.DataFrame({
            'Problem-Solving Score': [85],
            'Coding Experience (Years)': [3],
            'Work_Experience': [2],
            'Project Experience': [5],
            'Technical_Skills': ['Python, NLP, PyTorch'],
            'Soft_Skills': ['Problem Solving, Critical Thinking'],
            'Academic Background': ['Computer Science'],
            'Personality Type': ['INTJ'],
            'Work Preference': ['Remote']
        })
        
        prediction, probabilities = predict_career(model_data, example_data)
        predicted_career = model_data['target_encoder'].inverse_transform(prediction)[0]
        print(f"Predicted Career: {predicted_career}")
        print("\nConfidence Scores:")
        for career, prob in zip(model_data['target_encoder'].classes_, probabilities[0]):
            if prob > 0.1:  # Only show significant probabilities
                print(f"{career}: {prob:.4f}")
