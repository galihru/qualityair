import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM
from flask import Flask, jsonify
import json

# Flask App
app = Flask(__name__)

def generate_data():
    # Replace this with actual sensor data
    dates = pd.date_range(start='2025-01-01', periods=30, freq='D').strftime('%Y-%m-%d').tolist()
    ppm_values = np.random.randint(50, 150, size=30).tolist()  # Example PPM values
    return dates, ppm_values

# Train Model and Predict
def train_and_predict(dates, ppm_values):
    # Prepare Data
    data = np.array(ppm_values).reshape(-1, 1)
    X, y = [], []
    for i in range(len(data) - 5):
        X.append(data[i:i+5])
        y.append(data[i+5])
    X, y = np.array(X), np.array(y)

    # Define Model
    model = Sequential([
        LSTM(50, activation='relu', input_shape=(5, 1)),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    model.fit(X, y, epochs=10, verbose=0)

    # Predict Next 5 Days
    predictions = model.predict(data[-5:].reshape(1, 5, 1)).flatten().tolist()
    return predictions

# API Endpoint
@app.route('/data.json', methods=['GET'])
def get_data():
    dates, ppm_values = generate_data()
    predictions = train_and_predict(dates, ppm_values)
    result = {
        "history": [{"date": dates[i], "ppm": ppm_values[i]} for i in range(len(dates))],
        "predictions": predictions
    }
    with open('data.json', 'w') as f:
        json.dump(result, f)  # Save to file
    return jsonify(result)

# Run Server
if __name__ == '__main__':
    app.run(debug=True)
