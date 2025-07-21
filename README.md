This is a Program / docker container that translate Presonus StudioLive Commands to MQTT and vice versa.
This is Specifically made to work with HomeAssistant. It will automatically create the configuration json and
import it into HomeAssistant via MQTT. Currently Tested with StudioLive Series III 64s, but should work with all models

Still a work in progress

This is my First Major Project!!!!
Constructive Criticism would be greatly appreciated

# Instructions

There is a docker container you can download and run

https://hub.docker.com/r/shoffluke/presonus-mqtt-bridge

For more help setting up a docker container, please refer to docker's set up guide.

You can also run the main.ts file if you wanted to run it without a docker container, but I wouldn't recommend it.

## Configuration

Make sure you create a bind mount located at /app/config/. Inside the bind mount create a single file called, config.json and copy and change this section to match your needs.

```angular2html
/app/config/
```

```
{
"presonusOptions": {
"ip": "192.168.1.10",
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
"url": "mqtt://192.168.1.11:1883",
"username": "username",
"password": "password",
"clientId": "13c2841c",
"model": "studiolive_64s",
"publishDelay": 1000,
"connectTimeout": 5000,
"reconnectPeriod": 2000,
"prefix": "homeassistant"
}
}
```

Also make sure you either expose the network though host network, or both the presonus port, and the mqtt port.
```angular2html
Default Presonus port: 53000
Default MQTT port: 1883
```

After that it should be ready to go, If your having issues check your HomeAssistant MQTT configuration, or logs. On first connection it publishes a lot of configuration data. I added a small delay after every batch to give HomeAssistant some breathing room. If your still having issues increase the pause time. Because it also has to push all the configuration data it will also take a minute or two before it's ready, this should only happen on first connection after the image is running. If you want to speed up the Initialization Process, disable parts you don't need.

Controls are only used if both inputs and mixes are enabled. For example if you wanted to be able to control the mute on line 1, aux 1; then aux, lines, and mutes all need to enabled. If anyone of those are disabled it won't work.

If you have multiple images running, be sure to change the model and the client id. Model needs to be different and makes to change to how it performs, clientID just needs to be a random set of letters and numbers

 ## ToDo

Meter Data is still not working

Bug with Selected Channel