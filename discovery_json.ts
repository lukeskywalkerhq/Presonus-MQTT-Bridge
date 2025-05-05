import {getInputFeatures, getMixFeatures, getMixInputs} from "./dataTypes";

const manufacturer = "Presonus"

interface DeviceConfig {
    type: string;
    config: {
        name: string;
        unique_id: string;
        state_topic?: string;
        command_topic?: string;
        availability_topic?: string;
        payload_available?: string;
        payload_not_available?: string;
        icon?: string;
        device_class?: string;
        unit_of_measurement?: string;
        value_template?: string;
        json_attributes_topic?: string;
        schema?: string;
        rgb_state_topic?: string;
        rgb_command_topic?: string;
        rgb_value_template?: string;
        color_mode_state_topic?: string;
        color_mode_value_template?: string;
        color_mode_command_topic?: string;
        command_color_mode_template?: string;
        supported_color_modes?: string[];
        position_topic?: string;
        set_position_topic?: string;
        optimistic?: boolean;
    }
    device: { // Add the device property for grouping
        name: string;
        identifiers: string[];
        manufacturer?: string;
        model?: string;
    };
}


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

export function getDiscovoryJSON(config: configuration) {

}

function getMeterConfig(channels: any, options: any): inputControl[] {
    let meterConfig: inputControl[] = []

    if (!options.meter) {
        return meterConfig
    }

    for (const input in options.inputs){
        if (options.inputs[input] && channels[input.toUpperCase()] > 0){
            const newInput: inputControl = {
                name: input,
                size: channels[input.toUpperCase()],
                type: "input"
            }
            meterConfig.push(newInput)
        }
    }

    for (const mix in options.mixes){
        if (options.mixes[mix] && channels[mix.toUpperCase()] > 0){
            const newInput: inputControl = {
                name: mix,
                size: channels[mix.toUpperCase()],
                type: "mix"
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
                name: mix,
                size: channels[mix.toUpperCase()],
                type: "master"
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
                    enabled: true,
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
                            name: featureName,
                            size: channels[inputName.toUpperCase()],
                            type: inputName,
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
console.log(JSON.stringify(data, null, 2));

//const json = getDiscovoryJSON(data);
//console.log(JSON.stringify(json, null, 2));