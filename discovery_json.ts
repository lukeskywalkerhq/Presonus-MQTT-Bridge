import {getInputFeatures, getMixFeatures, getMixInputs} from "./dataTypes";
import {mixJSONGroup, SwitchConfig} from "./interfaces";

const manufacturer = "Presonus"

interface configuration{
    mixes: mixGroup[]
    meters: meterGroup
    masters: mixGroup
}

interface meterGroup{
    name: string;
    features: inputControl[],
    enabled: boolean,
}

interface mixGroup{
    name: string;
    size: number;
    supported_inputs: string[];
    supported_controls: any;
    enabled?: boolean,
    features: inputControl[]
}

interface inputControl {
    name: string;
    size: number;
    type: string;
}

const testchannels = {
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

function getLinkJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number): any {
    const baseURL = `${mixName}/${mixIndex}/${feature.name}/${feature.type}/${entityIndex}`;

    return {
        unique_id: `${mixName}_${mixIndex}_${feature.name}_${feature.type}_${entityIndex}`,
        component: 'switch',
        device_class: "switch",
        command_topic: baseURL + "/command",
        state_topic: baseURL + "/set",
        availability_topic: `presonus/${mixName}`,
        payload_available: "Online",
        payload_not_available: "Offline",
        payload_on: "linked",
        payload_off: "unlinked",
        state_on: "Linked",
        state_off: "Unlinked",
        icon: "mdi:link-variant",
        device: {
            name: `${mixName} ${mixIndex}`,
            identifiers: [`${mixName}_${mixIndex}`],
            manufacturer: manufacturer,
            model: "unknown"
        }
    };
}

function getSoloJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number): any {
    const baseURL = `${mixName}/${mixIndex}/${feature.name}/${feature.type}/${entityIndex}`;

    return {
        unique_id: `${mixName}_${mixIndex}_${feature.name}_${feature.type}_${entityIndex}`,
        component: 'switch',
        device_class: "switch",
        command_topic: baseURL + "/command",
        state_topic: baseURL + "/set",
        availability_topic: `presonus/${mixName}`,
        payload_available: "Online",
        payload_not_available: "Offline",
        payload_on: "soloed",
        payload_off: "unsoloed",
        state_on: "Soloed",
        state_off: "Unsoloed",
        icon: "mdi:speaker",
        device: {
            name: `${mixName} ${mixIndex}`,
            identifiers: [`${mixName}_${mixIndex}`],
            manufacturer: manufacturer,
            model: "unknown"
        }
    };
}

function getMuteJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number): any {
    const baseURL = `${mixName}/${mixIndex}/${feature.name}/${feature.type}/${entityIndex}`;

    return {
        unique_id: `${mixName}_${mixIndex}_${feature.name}_${feature.type}_${entityIndex}`,
        component: 'switch',
        device_class: "switch",
        command_topic: baseURL + "/command",
        state_topic: baseURL + "/set",
        availability_topic: `presonus/${mixName}`,
        payload_available: "Online",
        payload_not_available: "Offline",
        payload_on: "muted",
        payload_off: "unmuted",
        state_on: "Muted",
        state_off: "Unmuted",
        icon: "mdi:volume-mute",
        device: {
            name: `${mixName} ${mixIndex}`,
            identifiers: [`${mixName}_${mixIndex}`],
            manufacturer: manufacturer,
            model: "unknown"
        }
    };
}

export function getDiscovoryJSON(config: mixGroup, index: number): any {

    const mixName: string = config.name;
    const mixIndex: number = index;

    let json: mixJSONGroup = {
        type: mixName + "_" + mixIndex,
        config: []
    }

    for (const feature of config.features) {
        if(feature.type == "mute"){
            json.config.push(getMuteJSON(mixName, mixIndex, feature, 1))
        }
        else if (feature.type == "fader"){

        }
        else if (feature.type == "solo"){
            json.config.push(getSoloJSON(mixName, mixIndex, feature, 1))
        }
        else if (feature.type == "pan"){

        }
        else if (feature.type == "link"){
            json.config.push(getLinkJSON(mixName, mixIndex, feature, 1))
        }
        else if (feature.type == "color"){

        }
    }

    return json;
}

function getMeterConfig(channels: any, options: any): inputControl[] {
    let meterConfig: inputControl[] = []

    if (!options.meter) {
        return meterConfig
    }

    for (const input in options.inputs){
        if (options.inputs[input] && channels[input.toUpperCase()] > 0){
            const newInput: inputControl = {
                name: "input",
                size: channels[input.toUpperCase()],
                type: input
            }
            meterConfig.push(newInput)
        }
    }

    for (const mix in options.mixes){
        if (options.mixes[mix] && channels[mix.toUpperCase()] > 0){
            const newInput: inputControl = {
                name: "mix",
                size: channels[mix.toUpperCase()],
                type: mix
            }
            meterConfig.push(newInput)
        }
    }

    return meterConfig
}

function getMasterConfig(channels: any, options: any): inputControl[] {
    let masterConfig: inputControl[] = []
    if (!options.masters) {
        return masterConfig
    }

    for (const mix in options.mixes){
        if (options.mixes[mix] && channels[mix.toUpperCase()] > 0){
            const newInput: inputControl = {
                name: "master",
                size: channels[mix.toUpperCase()],
                type: mix
            }
            masterConfig.push(newInput)
        }
    }
    return masterConfig
}

export function getConfiguration(channels: any, options: any): configuration {
    let config: configuration = {
        mixes: [],
        meters: { name: 'meters', enabled: options.meter, controls: getMeterConfig(channels, options)}, // Initialize meters
        masters: { name: 'masters', size: 1, enabled: options.masters, features: getMasterConfig(channels, options) } // Initialize masters
    };



    // Process mixes based on options.mixes
    if (options.mixes) {
        for (const mixType in options.mixes) {
            if (options.mixes[mixType] && channels[mixType.toUpperCase()]) {
                config.mixes.push({
                    name: mixType,
                    size: channels[mixType.toUpperCase()],
                    supported_inputs: getMixInputs(mixType),
                    supported_controls: getMixFeatures(mixType),
                    features: [] // You'll likely populate this later
                });
            }
        }
    }

    for (const mixType in config.mixes) {
        const mix = config.mixes[mixType];

        for (const input in mix.supported_inputs) {
            const inputName = mix.supported_inputs[input];

            if (options.inputs[inputName]) {
                const inputFeatures = getInputFeatures(inputName);

                for (const feature in  inputFeatures) {
                    const featureName = inputFeatures[feature];

                    if (mix.supported_controls[featureName]){
                        const mixFeature: inputControl = {
                            name: inputName,
                            size: channels[inputName.toUpperCase()],
                            type: featureName,
                        }

                        mix.features.push(mixFeature)
                    }
                }
            }
        }
    }

    return config;
}

const data = getConfiguration(testchannels, testOptions);
//console.log(JSON.stringify(data, null, 2));

for (const mix in data.mixes){
    const mixConfig = data.mixes[mix];
    for (let mixIndex = 0; mixIndex < mixConfig.size; mixIndex++) {
        const json = getDiscovoryJSON(mixConfig, mixIndex);
        console.log(JSON.stringify(json, null, 2));
    }
}