#include <WiFi.h>
#include <HTTPClient.h>
#include <Base64.h>
#include <ArduinoJson.h>
#include <time.h>

const char* ssid = "xxxxxxxxx";
const char* password = "xxxxxxxx";

// Konfigurasi GitHub
const char* serverUrl = "https://api.github.com/repos/your-github-username/your-repo/contents/data.json";
const char* token = "Bearer Fine-grained personal access tokens";

// Konfigurasi waktu
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 25200;  // GMT+7 untuk Indonesia
const int daylightOffset_sec = 0;

// Pin sensor
const int mq7Pin = 32;

// Variabel untuk tracking perubahan data
float lastPpm = 0;
String lastSHA = "";
unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 5000; // Update setiap 5 detik

String getCurrentSHA() {
  HTTPClient http;
  String sha = "";
  
  http.begin(serverUrl);
  http.addHeader("Authorization", token);
  http.addHeader("Cache-Control", "no-cache");
  
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, http.getString());
    
    if (!error) {
      sha = doc["sha"].as<String>();
      Serial.println("Current SHA: " + sha);
    }
  }
  
  http.end();
  return sha;
}

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {
    delay(500);
    Serial.print(".");
    wifiTimeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected to WiFi");
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  } else {
    Serial.println("\nFailed to connect WiFi");
    ESP.restart();
  }
}

String getFormattedTime() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    return "Failed to obtain time";
  }
  char timeStringBuff[50];
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(timeStringBuff);
}

void updateGitHub(float ppm, int sensorValue, String timestamp) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", token);
  http.addHeader("Cache-Control", "no-cache");

  // Buat JSON data
  DynamicJsonDocument doc(512);
  doc["timestamp"] = timestamp;
  JsonObject data = doc.createNestedObject("data");
  data["ppm"] = ppm;
  data["raw_value"] = sensorValue;
  
  String jsonStr;
  serializeJsonPretty(doc, jsonStr);
  
  String encodedData = base64::encode(jsonStr);
  
  String payload = "{\n";
  payload += "  \"message\": \"Update data.json - " + timestamp + "\",\n";
  payload += "  \"content\": \"" + encodedData + "\",\n";
  payload += "  \"sha\": \"" + lastSHA + "\"\n";
  payload += "}";

  int httpResponseCode = http.PUT(payload);
  
  if (httpResponseCode == HTTP_CODE_OK || httpResponseCode == HTTP_CODE_CREATED) {
    String response = http.getString();
    StaticJsonDocument<1024> respDoc;
    deserializeJson(respDoc, response);
    lastSHA = respDoc["content"]["sha"].as<String>();
    
    Serial.println("Data updated successfully!");
    Serial.println("Time: " + timestamp);
    Serial.println("PPM: " + String(ppm));
    Serial.println("Raw Value: " + String(sensorValue));
  } else {
    Serial.printf("Update failed: %d\n", httpResponseCode);
  }
  
  http.end();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
    delay(5000);
    return;
  }

  unsigned long currentTime = millis();
  if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
    int sensorValue = analogRead(mq7Pin);
    float ppm = sensorValue / 1023.0 * 100;
    
    // Update hanya jika ada perubahan signifikan atau belum ada SHA
    if (abs(ppm - lastPpm) >= 0.1 || lastSHA == "") {
      String timestamp = getFormattedTime();
      
      if (lastSHA == "") {
        lastSHA = getCurrentSHA();
      }
      
      updateGitHub(ppm, sensorValue, timestamp);
      lastPpm = ppm;
    }
    
    lastUpdateTime = currentTime;
  }
}
