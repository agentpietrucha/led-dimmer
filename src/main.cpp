#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <DNSServer.h>

DNSServer dnsServer;
bool dns = false;

#define LEDSIGNAL 2
#define ledPin 16

int pinVoltage = 10;
int lastPinVoltage = 10;

String authToken;
const String deviceKey = "sawicki";
bool loginStatus = false;

IPAddress localIP(192, 168, 1, 184);
IPAddress gateway(192, 168, 0, 1);
IPAddress subnet(255, 255, 255, 0);

const int freq = 60000;
const int ledChannel = 0;
const int resolution = 8;

WebServer server(80);

Preferences preferences;

String defaultSHIT = "default shit";

int time1 = 0;
bool shouldRestart = false;

bool wifiConnected = false;

const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>setup wifi config</title>
    <style>
        input[type=text] {
            font-size: 50px; 
            border: 5px solid gray;
            margin-top: 0;
            margin-bottom: 0;
            padding-top: 0;
            padding-bottom: 0
        }
        input[name="passwd"] {
            border-top: 0;
        }
        input[type=submit] {
            font-size: 50px; 
            margin-top: 50px;
        }
        form {
                width: 40%;
                display: flex; 
                flex-direction: column;
            }
        @media screen and (max-width: 400px) {
            input[type=text] {
                font-size: 30px; 
                border: 4px solid gray;
            }
            input[name="passwd"] {
                border-top: 0;
            }
            input[type=submit] {
                font-size: 30px; 
                margin-top: 25px;
            }
            form {
                width: 75%;
                display: flex; 
                flex-direction: column;
            }
        }
        
    </style>
</head>
<body>
    <main style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw;">
        <form action="/setup" method="get">
            <input type="text" name="ssid" id="ssid" placeholder="ssid">
            <input type="text" name="passwd" id="passwd" placeholder="password">
            <input type="submit" value="submit">
        </form>
    </main>
</body>
</html>)rawliteral";

void root(){
  Serial.println("root");
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendContent(index_html);
}

void switchOff(){
  if(loginStatus && server.arg("token") == authToken){
    lastPinVoltage = pinVoltage;
    pinVoltage = 0;
    server.setContentLength(3);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", "off");
    Serial.println("off");
  }
}
void switchOn(){
  if(loginStatus == true && server.arg("token") == authToken){
    pinVoltage = lastPinVoltage;
    server.setContentLength(((String) pinVoltage).length());
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", (String) pinVoltage);
    Serial.println("turn on");
  }
}

void dimm(){
  if(server.arg("dimmval") != "" && loginStatus && server.arg("token") == authToken){
    pinVoltage = server.arg("dimmval").toInt();
    server.setContentLength(3);
    server.sendHeader("Access-Control-Allow-Origin", "*");
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
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", authToken + ":" + (String) pinVoltage);
  } else{
    loginStatus = false;
    server.setContentLength(1);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(100, "text/plain", "F");
  }
}

void handleSetup(){
  Serial.println("setup request");
  Serial.print("arguments:");
  Serial.println(server.arg("ssid"));
  Serial.println(server.arg("passwd"));

  String userSSID = server.arg("ssid");
  String userPASSWD = server.arg("passwd");

  preferences.putString("userSSID", userSSID);
  preferences.putString("userPASSWD", userPASSWD);
  
  server.send(200, "text/plain", "data set");
  
  ESP.restart();
}

void blinkLED(int count){
  for(int i = 0; i < count; i++){
    digitalWrite(LEDSIGNAL, HIGH);
    delay(1000);
    digitalWrite(LEDSIGNAL, LOW);
    delay(1000);
  }
}

void IRAM_ATTR buttonPressHandler(){
  detachInterrupt(0);
  Serial.println("button pressed");
  Serial.print("time1: ");
  Serial.print(time1);
  
  if(time1 == 0){ // first press
    time1 = millis();
  } else{

    int diff = millis() - time1;
    if(diff <= 2000){
      shouldRestart = true;
      time1 = 0;
      attachInterrupt(0, buttonPressHandler, HIGH);
      return;
    } else{
      time1 = millis();
      attachInterrupt(0, buttonPressHandler, HIGH);
      return;
    }

  }
  attachInterrupt(0, buttonPressHandler, HIGH);
}

void setup() {
  Serial.begin(115200);
  Serial.println("SETUP BEGIN");
  
  preferences.begin("dupa", false);

  pinMode(LEDSIGNAL, OUTPUT);
  pinMode(0, INPUT);
  attachInterrupt(0, buttonPressHandler, HIGH);

  if(preferences.getString("userSSID", defaultSHIT) != defaultSHIT){ // there is wifi login data, start normal server
    if(!WiFi.config(localIP, gateway, subnet)){
      Serial.println("STA failed to connect");
    }

    int wifiConnectionCount = 0;
    WiFi.begin(preferences.getString("userSSID").c_str(), preferences.getString("userPASSWD").c_str());
    while(WiFi.status() != WL_CONNECTED && wifiConnectionCount < 20){
      delay(500);
      Serial.print(".");
      wifiConnectionCount++;
    }
    if(wifiConnectionCount >= 20){ // connection failure
      blinkLED(3);
      preferences.clear();
      ESP.restart();
    } else{ // connection successful
      blinkLED(1);
      wifiConnected = true;
    }

    ledcSetup(ledChannel, freq, resolution);
    ledcAttachPin(ledPin, ledChannel);

    Serial.println("\nWiFi connected");
    server.on("/auth", HTTP_GET, authenticate);
    server.on("/switch/on", HTTP_GET, switchOn);
    server.on("/switch/off", HTTP_GET, switchOff);
    server.on("/dimm", HTTP_GET, dimm);

  } else{ // no login data, create AP
    WiFi.mode(WIFI_AP);
    WiFi.softAP("LED dimmer");
    Serial.println("Wait 100 ms for AP_START...");
    delay(100);
    
    Serial.println("Set softAPConfig");
    IPAddress Ip(192, 168, 1, 1);
    IPAddress NMask(255, 255, 255, 0);
    WiFi.softAPConfig(Ip, Ip, NMask);
    Serial.print("Wifi ip: ");
    dnsServer.start(53, "*", Ip);
    dns = true;
    
    IPAddress myIP = WiFi.softAPIP();
    Serial.print("AP IP address: ");
    Serial.println(myIP);

    server.onNotFound(root);
    server.on("/", HTTP_GET, root);
    server.on("/setup", HTTP_GET, handleSetup);
  }
  server.begin();
}

void loop() {
  if(dns){
    dnsServer.processNextRequest();
  }
  server.handleClient();
  if(shouldRestart){
    blinkLED(2);
    Serial.print("RESTART: ");
    Serial.println(preferences.clear());
    ESP.restart();
  }
  if(wifiConnected){
    ledcWrite(ledChannel, pinVoltage);
  }
}