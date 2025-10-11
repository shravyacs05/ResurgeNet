import pandas as pd
import nltk
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.multioutput import MultiOutputClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import pickle

nltk.download("punkt")
nltk.download("punkt_tab")
nltk.download("stopwords")

messages_url = "https://raw.githubusercontent.com/prateeksawhney97/Disaster-Response-Pipeline/master/data/disaster_messages.csv"
categories_url = "https://raw.githubusercontent.com/prateeksawhney97/Disaster-Response-Pipeline/master/data/disaster_categories.csv"

messages = pd.read_csv(messages_url)
categories = pd.read_csv(categories_url)

categories_expanded = categories['categories'].str.split(';', expand=True)
row = categories_expanded.iloc[0]
category_colnames = row.apply(lambda x: x.split('-')[0])
categories_expanded.columns = category_colnames

for column in categories_expanded:
    categories_expanded[column] = categories_expanded[column].str[-1].astype(int)

df = pd.concat([messages, categories_expanded], axis=1)
X = df['message']
Y = df.iloc[:, 4:]

valid_columns = [col for col in Y.columns if len(Y[col].unique()) > 1]
Y = Y[valid_columns]

# Save category names for later use
with open('category_names.pkl', 'wb') as f:
    pickle.dump(valid_columns, f)

X_train, X_test, Y_train, Y_test = train_test_split(
    X, Y, test_size=0.2, random_state=42
)

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english')),
    ('clf', MultiOutputClassifier(LogisticRegression(max_iter=1000, solver='lbfgs')))
])

print("🚀 Training model...")
pipeline.fit(X_train, Y_train)
print("✅ Training complete")

with open("disaster_model.pkl", "wb") as f:
    pickle.dump(pipeline, f)

print("💾 Model saved as disaster_model.pkl")

Y_pred = pipeline.predict(X_test)

for i, col in enumerate(Y.columns):
    print(f"\nCategory: {col}")
    print(classification_report(Y_test[col], Y_pred[:, i]))