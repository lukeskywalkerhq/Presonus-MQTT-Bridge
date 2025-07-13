This is a docker container that translate Presonus StudioLive Commands to MQTT and vice versa.
Currently Tested with StudioLive Series III 64s

Still a work in progress

This is my First Major Project!!!!
Constructive Citisism would be greatly apprciated

# Instructions

There is a docker container you can download and run

https://hub.docker.com/r/shoffluke/presonus-mqtt-bridge

For more help setting up a docker container, please refer to docker's set up guide.

## Configuration

Make sure you create a bind mount located at /app/config/. Inside the bind mount create a single file called, config.json and copy and change this section to match your needs.

After that it should be ready to go, If your having issues check your HomeAssistant MQTT configuration, or logs. On first connection it publishes a lot of configuration data. I added a small delay after every batch to give HomeAssistant some breathing room. If your still having issues increase the pause time. Because it also has to push all the configuration data it will also take a minute or two before its ready, this should only happen on first connection.
```
{
"presonusOptions": {
"ip": "10.10.11.45",
"port": 53000,
"autoreconnect": true,
"reconnectPeriod": 2000,
"meter": true,
"masters": true,
"controls": {
"mute": true,
"fader": true,
"pan": true,
"link": true,
"solo": true,
"color": true
},
"inputs": {
"line": true,
"return": true,
"fxreturn": true,
"talkback": true
},
"mixes": {
"main": true,
"mono": true,
"aux": true,
"fx": true
}
},
"mqttOptions": {
"url": "mqtt://10.10.11.3:1883",
"username": "pdlighthousemedia",
"password": "@Plaog16",
"clientId": "13c2841c",
"model": "studiolive_64s",
"publishDelay": 1000,
"connectTimeout": 5000,
"reconnectPeriod": 2000,
"prefix": "mqtt"
}
}
```
 ## ToDo

Meter Data is still not working