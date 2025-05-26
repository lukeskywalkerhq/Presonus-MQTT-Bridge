import {getConfiguration, getDiscoveryJSON} from "./discovery_json";

const testChannels = {
    LINE: 64,
    AUX: 32,
    FX: 8,
    FXRETURN: 8,
    RETURN: 3,
    TALKBACK: 1,
    MAIN: 1,
    SUB: 0,
    MASTER: 1,
    MONO: 1
}

const testOptions = {
    "system": {
        "HomeAssistantAutoConfig": true,
        "periodicResync": true,
        "rapidConnect": true
    },
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
            "master": true,
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
        "publishDelay": 100,
        "connectTimeout": 5000,
        "reconnectPeriod": 2000,
        "prefix": "mqtt"
    }
}

const data = getConfiguration(testChannels, testOptions.presonusOptions);
console.log(JSON.stringify(data, null, 2));

for (const mix in data.mixes){
    const mixConfig = data.mixes[mix];
    for (let mixIndex = 0; mixIndex < mixConfig.size; mixIndex++) {
        const json = getDiscoveryJSON(mixConfig, mixIndex);
       //console.log(JSON.stringify(json, null, 2));
    }
}