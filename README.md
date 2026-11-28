# CO Monitoring Realtime with ESP32 and MQ-7 Sensor

This project involves using an **ESP32** microcontroller and **MQ-7 CO sensor** to monitor CO (Carbon Monoxide) levels in real-time. The data is continuously updated and pushed to a GitHub repository using the GitHub API. The system also uses the **NTP** server to synchronize time and ensures data updates at regular intervals.

## Features
- Real-time CO monitoring using the MQ-7 sensor.
- Widget Application in Android Device
- Data updates every 5 seconds and pushes the results to a GitHub repository.
- Data is stored as JSON files within the repository.
- Time synchronization using NTP for accurate timestamps.
- Secure access to GitHub using personal access tokens.
- Data encoding to Base64 before updating the repository to ensure correct transmission.

## Requirements
- **Hardware:**
  - ESP32 Dev Board
  - MQ-7 CO Sensor
  - Jumper wires
- **Software:**
  - Arduino IDE with ESP32 core installed
  - GitHub account with a repository set up for storing the data
  - Personal access token from GitHub with permissions to access repository contents.

## Setup Instructions

### 1. Clone the Repository
Clone the repository where the data will be stored:
```bash
git clone https://github.com/4211421036/qualityair.git
```
## 2. Arduino IDE Configuration

1. **Install ESP32 in Arduino IDE**:
   - Go to **File > Preferences** and add `https://dl.espressif.com/dl/package_esp32_index.json` in the **Additional Boards Manager URLs**.
   - Install the ESP32 board through **Tools > Board > Boards Manager**.

2. **Install Libraries**:
   Install the following libraries in Arduino IDE:
   - **WiFi**: For connecting the ESP32 to a Wi-Fi network.
   - **HTTPClient**: For making HTTP requests to the GitHub API.
   - **Base64**: For encoding the data before pushing it to GitHub.
   - **ArduinoJson**: For handling JSON data format.

   You can install these libraries from **Sketch > Include Library > Manage Libraries** in Arduino IDE.

3. **Configure the Code**:
   - Replace `xxxxxxxxx` with your Wi-Fi SSID and password in the code.
   - Replace `Bearer Fine-grained personal access tokens` with your **GitHub personal access token** in the code.
   - Replace `your-github-username` and `your-repo` with your **GitHub username** and **repository name** respectively.

4. **Upload the Code**:
   - Connect your ESP32 to the computer and select the correct **board** and **port** in the **Tools** menu in Arduino IDE.
   - Click the **Upload** button to upload the code to your ESP32.

## 3. GitHub Workflow Integration
The project utilizes **GitHub's API** to update the repository with new sensor data. The workflow performs the following steps:
- Reads the CO sensor data (in ppm) from the MQ-7 sensor.
- Sends the sensor data to a GitHub repository as a JSON file with a timestamp.
- Encodes the data in Base64 and sends it via a PUT request to update the repository.
- Retrieves the current SHA (file hash) to ensure data consistency.
- If the data changes significantly, it updates the repository with the new values.

## 4. GitHub Authentication
The script uses a **GitHub personal access token** for authentication. Ensure your token has appropriate permissions (like `repo` scope) to allow the program to modify the content in your repository.

## 5. Code Walkthrough

### WiFi Setup:
The ESP32 connects to your Wi-Fi network using the provided SSID and password.

### Time Synchronization:
The ESP32 synchronizes with an NTP server to retrieve the correct timestamp for each data entry.

### MQ-7 Sensor Reading:
The MQ-7 sensor is used to measure CO concentration. The analog value from the sensor is read and converted into **PPM** (parts per million).

### GitHub API Integration:
The data is pushed to your GitHub repository every 5 seconds. It is stored as a JSON file, with the timestamp, CO concentration in PPM, and the raw sensor reading. The data is first encoded in Base64 before being sent via an HTTP PUT request.

### SHA Check:
The script checks the **SHA hash** of the file before updating it to prevent conflicts or data overwriting.

## 6. Example Data Format
The data stored in the repository is in JSON format and follows this structure:
```json
{
  "timestamp": "2025-01-28 12:45:30",
  "data": {
    "ppm": 15.6,
    "raw_value": 500
  }
}
```
## 7. Troubleshooting

- **Wi-Fi Issues**:
  - If the ESP32 is not connecting to Wi-Fi, double-check the SSID and password. Also, make sure the ESP32 is in range of the Wi-Fi router.
  - You can monitor the Wi-Fi connection status via the serial monitor. If the connection fails, try increasing the timeout limit or check the router’s configuration.

- **GitHub API Issues**:
  - Ensure the **personal access token** has the required permissions (`repo` scope).
  - If you encounter 403 errors, it could be due to rate limiting on the GitHub API. Wait for a period and try again.
  - If the repository is private, confirm that the token has access to the repository.

- **Sensor Calibration**:
  - The MQ-7 sensor needs proper calibration to provide accurate readings. Ensure the sensor is correctly connected to the specified pin (GPIO 32 in the example).
  - Allow the sensor to warm up for 24 hours for stable readings.

- **Base64 Encoding Errors**:
  - Make sure that the payload data sent to GitHub is encoded correctly in Base64. If issues arise during encoding, check the size of the payload and consider splitting large data into smaller chunks.

## 8. License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 9. Contact

For any questions or suggestions, feel free to open an issue on the [GitHub Repository](https://github.com/4211421036/qualityair).

[WhatsApp GALIH RIDHO UTOMO](https://wa.me/+6281932279615)
