import {getInputFeatures, getMixFeatures, getMixInputs} from "./dataTypes";
import {publishLayout, SwitchConfig} from "./interfaces";

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


function getPanJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number): any {
    const baseURL = `presonus/${mixName}/${mixIndex}/${feature.name}/${feature.type}/${entityIndex}`;

    return {
            unique_id: `${mixName}_${mixIndex}_${feature.name}_${feature.type}_${entityIndex}`,
            component: 'number',
            device_class: "number",
            command_topic: baseURL + "/command",
            state_topic: baseURL + "/set",
            availability_topic: `presonus/${mixName}`,
            payload_available: "Online",
            payload_not_available: "Offline",
            min: -50,
            max: 50,
            step: 1,
            unit_of_measure: "°",
            icon: "mdi:knob",
            device: {
                name: `${mixName} ${mixIndex}`,
                identifiers: [`${mixName}_${mixIndex}`],
                manufacturer: manufacturer,
                model: "unknown"
            }
        }
}

function getLightJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number): any {
    const baseURL = `presonus/${mixName}/${mixIndex}/${feature.name}/${feature.type}/${entityIndex}`;

    return {
        type: "light",
        config: {
            name: `${mixName}_${mixIndex}_${feature.name}_${feature.type}_${entityIndex}\``,
            unique_id: `${baseURL}_color`,
            command_topic: baseURL + "/command",
            state_topic: baseURL + "/set",
            availability_topic: `presonus/${mixName}`,
            payload_available: "Online",
            payload_not_available: "Offline",
            rgb_state_topic: `${baseURL}/rgb/state`,
            rgb_command_topic: `${baseURL}/rgb/set`,
            rgb_value_template: "{{ value_json.rgb }}",
            supported_color_modes: ["rgb"]
        },
    };
}

function getFaderJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number): any {
    const baseURL = `presonus/${mixName}/${mixIndex}/${feature.name}/${feature.type}/${entityIndex}`;

    return {
        unique_id: `${mixName}_${mixIndex}_${feature.name}_${feature.type}_${entityIndex}`,
        component: 'number',
        device_class: "number",
        command_topic: baseURL + "/command",
        state_topic: baseURL + "/set",
        availability_topic: `presonus/${mixName}`,
        payload_available: "Online",
        payload_not_available: "Offline",
        min: 0,
        max: 100,
        step: 0.1,
        unit_of_measure: "%",
        icon: "mdi:knob",
        device: {
            name: `${mixName} ${mixIndex}`,
            identifiers: [`${mixName}_${mixIndex}`],
            manufacturer: manufacturer,
            model: "unknown"
        }
    };
}

function getLinkJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number): any {
    const baseURL = `presonus/${mixName}/${mixIndex}/${feature.name}/${feature.type}/${entityIndex}`;

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
    const baseURL = `presonus/${mixName}/${mixIndex}/${feature.name}/${feature.type}/${entityIndex}`;

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
    const baseURL = `presonus/${mixName}/${mixIndex}/${feature.name}/${feature.type}/${entityIndex}`;

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

export function getDiscoveryJSON(config: mixGroup, index: number): any {

    const mixName: string = config.name;
    const mixIndex: number = index;

    let publishGroup: any[] = []

    for (const feature of config.features) {
        for (let inputIndex: number = 0; inputIndex < feature.size; inputIndex++) {
            let data: any = {};
            let  type: string
            let commandType: string

            if(feature.type == "mute"){
                data = getMuteJSON(mixName, mixIndex, feature, inputIndex + 1)
                type = "switch"
                commandType = "mute"
            }
            else if (feature.type == "fader"){
                data = getFaderJSON(mixName, mixIndex, feature, inputIndex + 1)
                type = "number"
                commandType = "fader"
            }
            else if (feature.type == "solo"){
                data = getSoloJSON(mixName, mixIndex, feature, inputIndex + 1)
                type = "switch"
                commandType = "solo"
            }
            else if (feature.type == "pan"){
                //todo find limits
                data = getPanJSON(mixName, mixIndex, feature, inputIndex + 1)
                type = "number"
                commandType = "pan"
            }
            else if (feature.type == "link"){
                data = getLinkJSON(mixName, mixIndex, feature, inputIndex + 1)
                type = "switch"
                commandType = "link"
            }
            else if (feature.type == "color"){
                data = getLightJSON(mixName, mixIndex, feature, inputIndex + 1)
                type = "light"
                commandType = "color"
            }
            else {
                console.error("feature Type: " + feature.type + "does not exist")
            }

            const publish: publishLayout = {
                type: type,
                mixName: `${mixName}_${mixIndex}`,
                input: feature.name,
                commandType: commandType = "mute",
                index: inputIndex,
                config: data
            }
            publishGroup.push(publish)
        }
    }

    return publishGroup;
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