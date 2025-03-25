import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input, Embedding, Flatten, Concatenate
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
from sklearn.metrics import classification_report, precision_score, recall_score, f1_score

def prepare_data(df):
    # Rename categorical features to remove spaces
    column_rename_map = {
        'Technical_Skills': 'TechnicalSkills',
        'Soft_Skills': 'SoftSkills',
        'Academic Background': 'AcademicBackground',
        'Personality Type': 'PersonalityType',
        'Work Preference': 'WorkPreference'
    }
    df.rename(columns=column_rename_map, inplace=True)

    # Define numerical and categorical features
    numerical_features = ['Problem-Solving Score', 'Coding Experience (Years)', 
                          'Work_Experience', 'Project Experience']
    categorical_features = list(column_rename_map.values())  # Use renamed columns

    # Scale numerical features
    scaler = StandardScaler()
    X_numerical = scaler.fit_transform(df[numerical_features])

    # Encode categorical features using Label Encoding
    encoders = {}
    X_categorical_encoded = []
    vocab_sizes = {}

    for feature in categorical_features:
        encoder = LabelEncoder()
        df[feature] = encoder.fit_transform(df[feature])
        vocab_size = df[feature].nunique() + 1  # Unique categories + 1 for padding
        vocab_sizes[feature] = vocab_size
        X_categorical_encoded.append(df[feature].values)
        encoders[feature] = encoder

    # Convert categorical features to NumPy array
    X_categorical_encoded = np.column_stack(X_categorical_encoded)

    # Encode target labels
    target_encoder = LabelEncoder()
    y = target_encoder.fit_transform(df['Recommended Career'])
    y = keras.utils.to_categorical(y)  # Convert to one-hot encoding

    return X_numerical, X_categorical_encoded, y, encoders, target_encoder, scaler, vocab_sizes

def build_model(numeric_dim, categorical_vocab_sizes, num_classes):
    # Input layers
    numerical_input = Input(shape=(numeric_dim,), name="numerical_input")
    categorical_inputs = []

    # Embedding layers for categorical features
    embeddings = []
    for feature, vocab_size in categorical_vocab_sizes.items():
        safe_feature_name = feature.replace(" ", "_")  # Ensure no spaces in names
        inp = Input(shape=(1,), name=f"{safe_feature_name}_input")
        emb = Embedding(input_dim=vocab_size, output_dim=min(10, vocab_size // 2), name=f"{safe_feature_name}_embedding")(inp)
        emb = Flatten()(emb)
        embeddings.append(emb)
        categorical_inputs.append(inp)

    # Concatenate numerical and categorical embeddings
    merged = Concatenate()([numerical_input] + embeddings)

    # Deep Neural Network
    x = Dense(256, activation='relu')(merged)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)

    x = Dense(128, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)

    x = Dense(64, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)

    output = Dense(num_classes, activation='softmax', name="output_layer")(x)

    model = Model(inputs=[numerical_input] + categorical_inputs, outputs=output)
    model.compile(optimizer=tf.keras.optimizers.AdamW(learning_rate=0.001),
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    
    return model

def train_model():
    print("Loading data...")
    df = pd.read_csv("synthetic_career_data_gan.csv")

    print("Preparing data...")
    X_numerical, X_categorical_encoded, y, encoders, target_encoder, scaler, vocab_sizes = prepare_data(df)

    # Split data
    X_numerical_train, X_numerical_test, X_categorical_train, X_categorical_test, y_train, y_test = train_test_split(
        X_numerical, X_categorical_encoded, y, test_size=0.2, random_state=42, stratify=y
    )

    # Build model
    model = build_model(X_numerical.shape[1], vocab_sizes, y.shape[1])

    # Train model with early stopping
    early_stopping = keras.callbacks.EarlyStopping(monitor='val_loss', patience=7, restore_best_weights=True)

    print("Training deep learning model...")
    history = model.fit(
        [X_numerical_train] + [X_categorical_train[:, i] for i in range(X_categorical_train.shape[1])], 
        y_train,
        validation_data=(
            [X_numerical_test] + [X_categorical_test[:, i] for i in range(X_categorical_test.shape[1])], 
            y_test
        ),
        epochs=50,
        batch_size=32,
        callbacks=[early_stopping],
        verbose=1
    )

    # Evaluate model
    y_pred_proba = model.predict([X_numerical_test] + [X_categorical_test[:, i] for i in range(X_categorical_test.shape[1])])
    y_pred = np.argmax(y_pred_proba, axis=1)
    y_test_labels = np.argmax(y_test, axis=1)

    # Calculate metrics
    precision = precision_score(y_test_labels, y_pred, average='weighted')
    recall = recall_score(y_test_labels, y_pred, average='weighted')
    f1 = f1_score(y_test_labels, y_pred, average='weighted')

    print("\nDetailed Model Performance Metrics:")
    print("-" * 40)
    print(f"Weighted Precision: {precision:.4f}")
    print(f"Weighted Recall: {recall:.4f}")
    print(f"Weighted F1-Score: {f1:.4f}")
    print("\nDetailed Classification Report:")
    print(classification_report(y_test_labels, y_pred, target_names=target_encoder.classes_))

    # Get test accuracy
    test_loss, test_accuracy = model.evaluate([X_numerical_test] + [X_categorical_test[:, i] for i in range(X_categorical_test.shape[1])], y_test)
    print(f"\nImproved Deep Learning Model Accuracy: {test_accuracy:.4f}")

    # Save model and encoders
    model.save("career_predictor_dl.keras")
    joblib.dump({'encoders': encoders, 'target_encoder': target_encoder, 'scaler': scaler}, "career_preprocessors.joblib")

    return model, encoders, target_encoder, scaler, test_accuracy

def predict_career(model, encoders, target_encoder, scaler, input_data):
    # Rename categorical features in input data
    column_rename_map = {
        'Technical_Skills': 'TechnicalSkills',
        'Soft_Skills': 'SoftSkills',
        'Academic Background': 'AcademicBackground',
        'Personality Type': 'PersonalityType',
        'Work Preference': 'WorkPreference'
    }
    input_data.rename(columns=column_rename_map, inplace=True)

    # Define numerical and categorical feature names
    numerical_features = ['Problem-Solving Score', 'Coding Experience (Years)', 
                          'Work_Experience', 'Project Experience']
    categorical_features = list(column_rename_map.values())

    # Scale numerical features
    X_numerical = scaler.transform(input_data[numerical_features])

    # Encode categorical features
    X_categorical_encoded = []
    for feature in categorical_features:
        encoder = encoders[feature]
        encoded_feature = encoder.transform([input_data[feature].iloc[0]])
        X_categorical_encoded.append(encoded_feature)

    # Convert categorical data to NumPy array
    X_categorical_encoded = np.column_stack(X_categorical_encoded)

    # Make prediction
    prediction = model.predict([X_numerical] + [X_categorical_encoded[:, i] for i in range(X_categorical_encoded.shape[1])])
    predicted_label = np.argmax(prediction, axis=1)
    predicted_career = target_encoder.inverse_transform(predicted_label)

    return predicted_career, prediction

if __name__ == "__main__":
    # Train deep learning model
    model, encoders, target_encoder, scaler, accuracy = train_model()

    # Example prediction if accuracy is high
    if accuracy >= 0.90:
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

        predicted_career, probabilities = predict_career(model, encoders, target_encoder, scaler, example_data)
        print(f"Predicted Career: {predicted_career[0]}")
