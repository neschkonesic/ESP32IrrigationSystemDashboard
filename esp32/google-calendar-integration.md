# Google Calendar Integracija za ESP32 Sistem za Navodnjavanje

## Pregled

Ova integracija omogućava automatsko zakazivanje navodnjavanja i održavanja na osnovu Google kalendara. Sistem može da čita događaje iz kalendara i automatski izvršava odgovarajuće akcije.

## Funkcionalnosti

### 📅 **Kalendarske Funkcije**
- **Automatsko čitanje** Google kalendara
- **Zakazivanje navodnjavanja** na osnovu događaja
- **Održavanje sistema** prema rasporedu
- **Đubrenje** po kalendaru
- **Ručno dodavanje** novih događaja

### 🔄 **Tipovi Događaja**
1. **Navodnjavanje** - Automatsko otvaranje ventila
2. **Održavanje** - Podsetnici za servis
3. **Đubrenje** - Zakazano dodavanje nutrijenata

### ⏰ **Upravljanje Rasporedom**
- **Real-time izvršavanje** događaja
- **Pregled nadolazećih** aktivnosti
- **Ručno upravljanje** nezavisno od rasporede
- **Status praćenje** aktivnih događaja

## Implementacija

### 1. Google Calendar API Setup

```javascript
// Google Calendar API konfiguracija
const GOOGLE_CALENDAR_CONFIG = {
  apiKey: 'YOUR_GOOGLE_API_KEY',
  calendarId: 'your-calendar-id@gmail.com',
  clientId: 'your-client-id.googleusercontent.com',
  scope: 'https://www.googleapis.com/auth/calendar.readonly'
};
```

### 2. ESP32 Kod Modifikacije

```cpp
// Dodati u main.cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Google Calendar funkcije
void checkCalendarEvents() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    http.addHeader("Authorization", "Bearer " + String(accessToken));
    
    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      parseCalendarEvents(payload);
    }
    http.end();
  }
}

void parseCalendarEvents(String jsonData) {
  DynamicJsonDocument doc(4096);
  deserializeJson(doc, jsonData);
  
  JsonArray events = doc["items"];
  for (JsonObject event : events) {
    String summary = event["summary"];
    String startTime = event["start"]["dateTime"];
    
    if (summary.indexOf("navodnjavanje") >= 0) {
      scheduleIrrigation(startTime);
    }
  }
}
```

### 3. Web Dashboard Integracija

Komponente su već implementirane:
- `CalendarIntegration.tsx` - Glavna kalendarska komponenta
- `ScheduleManager.tsx` - Upravljanje rasporedom

## Korišćenje

### 1. Povezivanje sa Google Calendar

1. **Kliknite "Poveži sa Google Calendar"**
2. **Autentifikujte se** sa Google nalogom
3. **Dozvolite pristup** kalendaru
4. **Kalendar se automatski sinhronizuje**

### 2. Dodavanje Događaja

```
Naziv: "Jutarnje navodnjavanje"
Vreme: 06:00 svaki dan
Trajanje: 30 minuta
Ventili: Ventil 1 + Ventil 2
Tip: Navodnjavanje
```

### 3. Automatsko Izvršavanje

Sistem automatski:
- **Čita kalendar** svakih 5 minuta
- **Izvršava događaje** u zakazano vreme
- **Otvara/zatvara ventile** prema rasporedu
- **Prikazuje status** izvršavanja

## Konfiguracija Događaja

### Navodnjavanje
```json
{
  "title": "Jutarnje navodnjavanje",
  "start": "2025-01-15T06:00:00",
  "duration": 30,
  "type": "irrigation",
  "valves": ["valve1", "valve2"]
}
```

### Održavanje
```json
{
  "title": "Čišćenje filtera",
  "start": "2025-01-16T10:00:00",
  "duration": 60,
  "type": "maintenance",
  "description": "Provera i čišćenje svih filtera"
}
```

### Đubrenje
```json
{
  "title": "Dodavanje nutrijenata",
  "start": "2025-01-17T08:00:00",
  "duration": 15,
  "type": "fertilizer",
  "valves": ["valve1"]
}
```

## Sigurnosne Mere

### 🛡️ **Zaštita Sistema**
- **Ručno prekidanje** uvek dostupno
- **Maksimalno trajanje** događaja (2 sata)
- **Konflikt rezolucija** između događaja
- **Backup raspored** u slučaju greške

### 🔐 **Bezbednost**
- **OAuth 2.0** autentifikacija
- **Enkriptovane komunikacije**
- **Lokalno čuvanje tokena**
- **Automatsko obnavljanje** pristupa

## Monitoring i Logovanje

### 📊 **Praćenje Aktivnosti**
- **Real-time status** izvršavanja
- **Istorija događaja** (poslednji mesec)
- **Greške i upozorenja**
- **Statistike navodnjavanja**

### 📝 **Log Fajlovi**
```
[2025-01-15 06:00:00] CALENDAR: Executing "Jutarnje navodnjavanje"
[2025-01-15 06:00:01] VALVE: Opening valve1, valve2
[2025-01-15 06:30:00] VALVE: Closing valve1, valve2
[2025-01-15 06:30:01] CALENDAR: Event completed successfully
```

## Troubleshooting

### Česti Problemi

1. **Kalendar se ne sinhronizuje**
   - Proverite internet konekciju
   - Obnovite Google token
   - Proverite dozvole kalendara

2. **Događaji se ne izvršavaju**
   - Proverite sistemsko vreme
   - Proverite format datuma
   - Proverite status ventila

3. **Dupli događaji**
   - Proverite kalendarske duplikate
   - Očistite cache
   - Restartujte sistem

### Debug Komande

```bash
# Provera kalendarske konekcije
curl -H "Authorization: Bearer TOKEN" \
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

# Test WebSocket konekcije
wscat -c ws://192.168.1.150:81

# MQTT test
mosquitto_pub -h localhost -t "irrigation/calendar/test" -m "test"
```

## Buduće Funkcionalnosti

### 🚀 **Planirana Poboljšanja**
- **Vremenska prognoza** integracija
- **Senzor-bazirano** prilagođavanje
- **Machine learning** optimizacija
- **Mobilne notifikacije**
- **Multi-kalendar** podrška

### 📱 **Mobilna Aplikacija**
- **Push notifikacije** za događaje
- **Brza kontrola** ventila
- **Kalendar pregled** na telefonu
- **Offline režim** rada

## Zaključak

Google Calendar integracija značajno poboljšava funkcionalnost ESP32 sistema za navodnjavanje omogućavajući:

✅ **Automatsko zakazivanje** svih aktivnosti
✅ **Centralizovano upravljanje** kroz poznati interfejs
✅ **Fleksibilno planiranje** sa ponavljajućim događajima
✅ **Timsko upravljanje** sa deljenim kalendarom
✅ **Istorija i analitika** svih aktivnosti

Sistem postaje potpuno autonoman uz mogućnost ručnog upravljanja kada je potrebno!