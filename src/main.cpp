#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>

#define LEDSIGNAL 2
#define ledPin 16

int pinVoltage = 10;
int lastPinVoltage = 10;

const char *ssid = "s1";
const char *password = "siemanko";

String authToken;
const String deviceKey = "sawicki";
bool loginStatus = false;

WebServer server(80);

IPAddress localIP(192, 168, 1, 184);
// IPAddress localIP(192, 168, 0, 184);
IPAddress gateway(192, 168, 0, 1);
IPAddress subnet(255, 255, 255, 0);

const int freq = 60000;
const int ledChannel = 0;
const int resolution = 8;

void blinkLed(int x){
  for(int i = 0; i < x; i++){
    digitalWrite(LEDSIGNAL, HIGH);
    delay(1000);
    digitalWrite(LEDSIGNAL, LOW);
    delay(1000);
  }
}

void switchOff(){
  if(loginStatus && server.arg("token") == authToken){
    lastPinVoltage = pinVoltage;
    pinVoltage = 0;
    server.setContentLength(3);
    server.send(200, "text/plain", "off");
    Serial.println("off");
  }
}
void switchOn(){
  if(loginStatus == true && server.arg("token") == authToken){
    pinVoltage = lastPinVoltage;
    server.setContentLength(((String) pinVoltage).length());
    server.send(200, "text/plain", (String) pinVoltage);
    Serial.println("turn on");
  }
}

void dimm(){
  if(server.arg("dimmval") != "" && loginStatus && server.arg("token") == authToken){
    pinVoltage = server.arg("dimmval").toInt();
    server.setContentLength(3);
    server.send(200, "text/plain", "dim");
    Serial.print("dimming: ");
    Serial.println(server.arg("dimmval"));
  }
}

String generateToken(){
  authToken.clear();
  authToken = (String) esp_random();

  Serial.println(authToken);

  return authToken + ":";
}

void authenticate(){
  if(server.arg("key") == deviceKey){
    loginStatus = true;
    generateToken();
    server.setContentLength(authToken.length() + ((String) pinVoltage).length() + 1);
    server.send(200, "text/plain", authToken + ":" + (String) pinVoltage);
    blinkLed(2);
  } else{
    loginStatus = false;
    server.setContentLength(1);
    server.send(100, "text/plain", "F");
    blinkLed(5);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LEDSIGNAL, OUTPUT);
  ledcSetup(ledChannel, freq, resolution);
  ledcAttachPin(ledPin, ledChannel);

  Serial.print("connecting to: ");
  Serial.println(ssid);
  if(!WiFi.config(localIP, gateway, subnet)){
    Serial.println("STA failed to connect");
  }
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }

  server.on("/auth", HTTP_GET, authenticate);
  server.on("/switch/on", HTTP_GET, switchOn);
  server.on("/switch/off", HTTP_GET, switchOff);
  server.on("/dimm", HTTP_GET, dimm);
  server.begin();

  blinkLed(3);

  Serial.println("done setup");
}

void loop() {
  delay(1);
  server.handleClient();
  ledcWrite(ledChannel, pinVoltage);
}