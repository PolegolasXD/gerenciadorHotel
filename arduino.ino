#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define SS_PIN 21
#define RST_PIN 22
#define LED_PIN 12

MFRC522 rfid(SS_PIN, RST_PIN);

const char* ssid = "FLAVIO.";  // Insira o nome da sua rede Wi-Fi
const char* password = "AgsTr245h";  // Insira a senha da sua rede Wi-Fi
const char* serverAddress = "192.168.1.46";  // Insira o endereço do seu servidor
const int serverPort = 3000;  // Insira a porta do seu servidor

bool isFirstInteraction = true;  // Variável para controlar a primeira interação

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  
  pinMode(LED_PIN, OUTPUT);  // Configura o pino do LED como saída

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      String cardId = "";
      for (byte i = 0; i < rfid.uid.size; i++) {
        cardId.concat(String(rfid.uid.uidByte[i] < 0x10 ? "0" : ""));
        cardId.concat(String(rfid.uid.uidByte[i], HEX));
      }

      Serial.println("Card ID: " + cardId);

      HTTPClient http;

      String url = "http://" + String(serverAddress) + ":" + String(serverPort) + "/dados";
      http.begin(url);

      String postData = "{\"conteudo\":\"" + cardId + "\"}";
      http.addHeader("Content-Type", "application/json");

      int httpCode = http.POST(postData);

      if (httpCode > 0) {
        String response = http.getString();
        Serial.println("Server response: " + response);

        // Verifica se a interação com o servidor foi bem-sucedida
        if (response.indexOf("\"success\":true") != -1) {
          if (isFirstInteraction) {
            digitalWrite(LED_PIN, HIGH);  // Acende o LED
            isFirstInteraction = false;
          } else {
            digitalWrite(LED_PIN, LOW);  // Desliga o LED
            isFirstInteraction = true;
          }
        }
      } else {
        Serial.println("Error on sending request");
      }

      http.end();

      delay(3000);
    }
  }

  delay(500);
}
