import {getConfiguration, getDiscovoryJSON} from "./discovery_json";

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
        "fx": true,
        "sub": true
    }
}

const data = getConfiguration(testChannels, testOptions);
//console.log(JSON.stringify(data, null, 2));

for (const mix in data.mixes){
    const mixConfig = data.mixes[mix];
    for (let mixIndex = 0; mixIndex < mixConfig.size; mixIndex++) {
        const json = getDiscovoryJSON(mixConfig, mixIndex);
        console.log(JSON.stringify(json, null, 2));
    }
}