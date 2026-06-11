#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

static const char *DEVICE_NAME = "CityWag Smart Cabin";
static const char *SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
static const char *CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

static const int I2C_SDA_PIN = 21;
static const int I2C_SCL_PIN = 22;
static const unsigned long SAMPLE_INTERVAL_MS = 1000;
static const float MOTION_DELTA_SCALE = 5.0f;
static const float BUMP_DELTA_SCALE = 8.0f;

Adafruit_SHT31 sht31 = Adafruit_SHT31();
Adafruit_MPU6050 mpu;
BLECharacteristic *statusCharacteristic = nullptr;

bool bleClientConnected = false;
bool sht31Ready = false;
bool mpuReady = false;
float lastAccMagnitude = NAN;
float smoothedMotionLevel = 0.0f;
unsigned long lastSampleAt = 0;

class CabinServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    bleClientConnected = true;
    Serial.println("BLE client connected.");
  }

  void onDisconnect(BLEServer *server) override {
    bleClientConnected = false;
    Serial.println("BLE client disconnected. Advertising restarted.");
    BLEDevice::startAdvertising();
  }
};

float clampFloat(float value, float minValue, float maxValue) {
  if (value < minValue) return minValue;
  if (value > maxValue) return maxValue;
  return value;
}

int clampInt(int value, int minValue, int maxValue) {
  if (value < minValue) return minValue;
  if (value > maxValue) return maxValue;
  return value;
}

float normalizeDelta(float delta, float scale) {
  return clampFloat(delta / scale, 0.0f, 1.0f);
}

int calculateComfortScore(float temp, float humidity, float motionLevel, float bumpLevel, bool sensorsOk) {
  if (!sensorsOk) return 0;

  int score = 100;

  if (temp > 34.0f) score -= 45;
  else if (temp >= 30.0f) score -= 25;
  else if (temp >= 26.0f) score -= 10;
  else if (temp < 10.0f) score -= 30;
  else if (temp < 18.0f) score -= 10;

  if (humidity > 75.0f) score -= 20;
  else if (humidity > 65.0f) score -= 10;
  else if (humidity < 30.0f) score -= 10;

  if (bumpLevel > 0.55f) score -= 25;
  else if (bumpLevel >= 0.25f) score -= 10;

  if (motionLevel > 0.6f) score -= 15;
  else if (motionLevel >= 0.3f) score -= 5;

  return clampInt(score, 0, 100);
}

const char *calculatePetStatus(float motionLevel, bool sensorsOk) {
  if (!sensorsOk) return "unknown";
  if (motionLevel < 0.25f) return "calm";
  if (motionLevel < 0.6f) return "active";
  return "anxious";
}

const char *calculateRiskLevel(float temp, float humidity, float bumpLevel, int comfortScore, bool sensorsOk) {
  if (!sensorsOk) return "warning";
  if (temp > 34.0f || comfortScore < 50) return "danger";
  if (temp > 30.0f || humidity > 75.0f || bumpLevel > 0.55f || comfortScore < 70) return "warning";
  return "normal";
}

const char *buildMessage(const char *riskLevel, float temp, float bumpLevel, float motionLevel, bool sensorsOk) {
  if (!sensorsOk) return "Sensor data unavailable. Please check the smart module.";
  if (strcmp(riskLevel, "danger") == 0 && temp > 34.0f) {
    return "Cabin temperature may be unsafe. Please take action immediately.";
  }
  if (strcmp(riskLevel, "warning") == 0 && temp > 30.0f) {
    return "Cabin temperature is getting high. Please check ventilation.";
  }
  if (strcmp(riskLevel, "warning") == 0 && bumpLevel > 0.55f) {
    return "Frequent bumps detected. Consider slowing down or taking a short break.";
  }
  if (motionLevel > 0.6f) {
    return "High pet activity detected. Your pet may feel anxious.";
  }
  return "Cabin environment looks comfortable.";
}

bool readEnvironment(float &temp, float &humidity) {
  temp = sht31.readTemperature();
  humidity = sht31.readHumidity();
  return !isnan(temp) && !isnan(humidity);
}

bool readMotion(float &motionLevel, float &bumpLevel) {
  if (!mpuReady) return false;

  float maxDelta = 0.0f;
  float latestDelta = 0.0f;

  // A small burst inside the 1-second cycle gives bumpLevel a peak reading.
  for (int i = 0; i < 10; i++) {
    sensors_event_t accel;
    sensors_event_t gyro;
    sensors_event_t tempEvent;
    mpu.getEvent(&accel, &gyro, &tempEvent);

    float magnitude = sqrt(
      accel.acceleration.x * accel.acceleration.x +
      accel.acceleration.y * accel.acceleration.y +
      accel.acceleration.z * accel.acceleration.z
    );

    if (!isnan(lastAccMagnitude)) {
      latestDelta = fabs(magnitude - lastAccMagnitude);
      if (latestDelta > maxDelta) maxDelta = latestDelta;
    }

    lastAccMagnitude = magnitude;
    delay(8);
  }

  float normalizedMotion = normalizeDelta(latestDelta, MOTION_DELTA_SCALE);
  smoothedMotionLevel = (smoothedMotionLevel * 0.7f) + (normalizedMotion * 0.3f);

  motionLevel = clampFloat(smoothedMotionLevel, 0.0f, 1.0f);
  bumpLevel = normalizeDelta(maxDelta, BUMP_DELTA_SCALE);
  return true;
}

String buildStatusJson() {
  float temp = NAN;
  float humidity = NAN;
  float motionLevel = 0.0f;
  float bumpLevel = 0.0f;

  bool environmentOk = sht31Ready && readEnvironment(temp, humidity);
  bool motionOk = readMotion(motionLevel, bumpLevel);
  bool sensorsOk = environmentOk && motionOk;

  if (!environmentOk) {
    temp = -99.0f;
    humidity = -1.0f;
  }

  int comfortScore = calculateComfortScore(temp, humidity, motionLevel, bumpLevel, sensorsOk);
  const char *petStatus = calculatePetStatus(motionLevel, sensorsOk);
  const char *riskLevel = calculateRiskLevel(temp, humidity, bumpLevel, comfortScore, sensorsOk);
  const char *message = buildMessage(riskLevel, temp, bumpLevel, motionLevel, sensorsOk);

  StaticJsonDocument<256> doc;
  doc["temp"] = round(temp * 10.0f) / 10.0f;
  doc["humidity"] = round(humidity);
  doc["motionLevel"] = round(motionLevel * 100.0f) / 100.0f;
  doc["bumpLevel"] = round(bumpLevel * 100.0f) / 100.0f;
  doc["comfortScore"] = comfortScore;
  doc["petStatus"] = petStatus;
  doc["riskLevel"] = riskLevel;
  doc["message"] = message;
  doc["timestamp"] = millis() / 1000;

  String output;
  serializeJson(doc, output);
  return output;
}

void setupSensors() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  sht31Ready = sht31.begin(0x44);
  if (sht31Ready) {
    Serial.println("SHT31 detected at 0x44.");
  } else {
    Serial.println("SHT31 not found. Check wiring, power, and I2C address.");
  }

  mpuReady = mpu.begin(0x68);
  if (mpuReady) {
    Serial.println("MPU6050 detected at 0x68.");
    mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  } else {
    Serial.println("MPU6050 not found. Check wiring, power, and I2C address.");
  }
}

void setupBle() {
  BLEDevice::init(DEVICE_NAME);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new CabinServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);
  statusCharacteristic = service->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  statusCharacteristic->addDescriptor(new BLE2902());
  statusCharacteristic->setValue("{\"riskLevel\":\"normal\",\"message\":\"CityWag Smart Cabin ready.\"}");

  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->setMinPreferred(0x06);
  advertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE advertising started.");
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("CityWag Smart Cabin 0.1 starting...");
  setupSensors();
  setupBle();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSampleAt < SAMPLE_INTERVAL_MS) return;
  lastSampleAt = now;

  String json = buildStatusJson();
  Serial.println(json);

  // Keep this first-version JSON compact for reliable BLE notification size.
  // For longer payloads, split the string into chunks or negotiate larger MTU.
  if (bleClientConnected && statusCharacteristic != nullptr) {
    statusCharacteristic->setValue(json.c_str());
    statusCharacteristic->notify();
  }
}

