import {getInputFeatures, getMixFeatures, getMixInputs} from "./dataTypes";
import {publishLayout, configuration, mixGroup, inputControl} from "./interfaces";

const manufacturer: string = "Presonus"
let header: string = "presonus/generic"
let model: string = "generic"

export function setDiscoveryHeader(newModel: string){
    header = `presonus/${newModel}`;
    model = newModel;
}

function getEntityFreindlyName(name: string, index: number, size: number, type: string): string {
    const paddedIndex: string = String(index).padStart(String(size).length, '0');
    return `${name} ${paddedIndex} ${type}`;
}

function getMixFreindlyName(name: string, index: number, size: number): string {
    const capitalizedName: string = name.charAt(0).toUpperCase() + name.slice(1);

    if (size === 1) {
        return capitalizedName;
    } else if (size > 1) {
        const paddedIndex: string = String(index).padStart(2, '0');
        return `${capitalizedName} ${paddedIndex}`;
    }
    return capitalizedName;
}

function getPanJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number, mixSize: number, featureSize: number): any {
    const baseURL = `${header}/${mixName}/${mixIndex}/${feature.name}/${entityIndex}/${feature.type}`;
    const mixFreindlyName: string = getMixFreindlyName(mixName, mixIndex, mixSize)
    const entityFreindlyName: string = getEntityFreindlyName(feature.name, entityIndex, featureSize, feature.type)

    return {
            unique_id: `${mixName}_${mixIndex}_${feature.name}_${entityIndex}_${feature.type}`,
            name: `${mixFreindlyName} ${entityFreindlyName}`,
            component: 'number',
            command_topic: baseURL + "/command",
            state_topic: baseURL + "/state",
            availability_topic: `${header}/available`,
            payload_available: "Online",
            payload_not_available: "Offline",
            min: 0,
            max: 100,
            step: 0.1,
            unit_of_measure: "°",
            icon: "mdi:knob",
            device: {
                name: mixFreindlyName,
                identifiers: [`${mixName}_${mixIndex}`],
                manufacturer: manufacturer,
                model: model
            }
        }
}

function getLightJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number, mixSize: number, featureSize: number): any {
    const baseURL = `${header}/${mixName}/${mixIndex}/${feature.name}/${entityIndex}/${feature.type}`;
    const mixFreindlyName: string = getMixFreindlyName(mixName, mixIndex, mixSize)
    const entityFreindlyName: string = getEntityFreindlyName(feature.name, entityIndex, featureSize, feature.type)

    return {
        unique_id: `${mixName}_${mixIndex}_${feature.name}_${entityIndex}_${feature.type}`,
        name: `${mixFreindlyName} ${entityFreindlyName}`,
        command_topic: baseURL + "/command/power",
        state_topic: baseURL + "/state/power",
        availability_topic: `${header}/available`,
        payload_available: "Online",
        payload_not_available: "Offline",
        rgb_state_topic: `${baseURL}/state/rgb`,
        rgb_command_topic: `${baseURL}/command/rgb`,
        rgb_value_template: "{{ value_json.rgb }}",
        supported_color_modes: ["rgb"],
        icon: "mdi:equalizer",
        device: {
            name: mixFreindlyName,
            identifiers: [`${mixName}_${mixIndex}`],
            manufacturer: manufacturer,
            model: model
        }
    };
}

function getFaderJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number, mixSize: number, featureSize: number): any {
    const baseURL = `${header}/${mixName}/${mixIndex}/${feature.name}/${entityIndex}/${feature.type}`;
    const mixFreindlyName: string = getMixFreindlyName(mixName, mixIndex, mixSize)
    const entityFreindlyName: string = getEntityFreindlyName(feature.name, entityIndex, featureSize, feature.type)

    return {
        unique_id: `${mixName}_${mixIndex}_${feature.name}_${entityIndex}_${feature.type}`,
        name: `${mixFreindlyName} ${entityFreindlyName}`,
        component: 'number',
        command_topic: baseURL + "/command",
        state_topic: baseURL + "/state",
        availability_topic: `${header}/available`,
        payload_available: "Online",
        payload_not_available: "Offline",
        min: 0,
        max: 100,
        step: 0.1,
        unit_of_measure: "%",
        icon: "mdi:knob",
        device: {
            name: mixFreindlyName,
            identifiers: [`${mixName}_${mixIndex}`],
            manufacturer: manufacturer,
            model: model
        }
    };
}

function getLinkJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number, mixSize: number, featureSize: number): any {
    const baseURL = `${header}/${mixName}/${mixIndex}/${feature.name}/${entityIndex}/${feature.type}`;
    const mixFreindlyName: string = getMixFreindlyName(mixName, mixIndex, mixSize)
    const entityFreindlyName: string = getEntityFreindlyName(feature.name, entityIndex, featureSize, feature.type)

    return {
        unique_id: `${mixName}_${mixIndex}_${feature.name}_${entityIndex}_${feature.type}`,
        name: `${mixFreindlyName} ${entityFreindlyName}`,
        component: 'switch',
        device_class: "switch",
        command_topic: baseURL + "/command",
        state_topic: baseURL + "/state",
        availability_topic: `${header}/available`,
        payload_available: "Online",
        payload_not_available: "Offline",
        payload_on: "linked",
        payload_off: "unlinked",
        state_on: "Linked",
        state_off: "Unlinked",
        icon: "mdi:link-variant",
        device: {
            name: mixFreindlyName,
            identifiers: [`${mixName}_${mixIndex}`],
            manufacturer: manufacturer,
            model: model
        }
    };
}

function getSoloJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number, mixSize: number, featureSize: number): any {
    const baseURL = `${header}/${mixName}/${mixIndex}/${feature.name}/${entityIndex}/${feature.type}`;
    const mixFreindlyName: string = getMixFreindlyName(mixName, mixIndex, mixSize)
    const entityFreindlyName: string = getEntityFreindlyName(feature.name, entityIndex, featureSize, feature.type)

    return {
        unique_id: `${mixName}_${mixIndex}_${feature.name}_${entityIndex}_${feature.type}`,
        name: `${mixFreindlyName} ${entityFreindlyName}`,
        component: 'switch',
        device_class: "switch",
        command_topic: baseURL + "/command",
        state_topic: baseURL + "/state",
        availability_topic: `${header}/available`,
        payload_available: "Online",
        payload_not_available: "Offline",
        payload_on: "soloed",
        payload_off: "unsoloed",
        state_on: "Soloed",
        state_off: "Unsoloed",
        icon: "mdi:speaker",
        device: {
            name: mixFreindlyName,
            identifiers: [`${mixName}_${mixIndex}`],
            manufacturer: manufacturer,
            model: model
        }
    };
}

function getMeterJSON(name: any, entityIndex: number, size: number): any {
    const baseURL = `${header}/meter/${name}/${entityIndex}`;
    const entityFreindlyName: string = getMixFreindlyName(name, entityIndex, size)

    return {
        unique_id: `meter_${name}_${entityIndex}`,
        name: `meter ${entityFreindlyName}`,
        state_topic: baseURL + "/state",
        availability_topic: `${header}/available`,
        payload_available: "Online",
        payload_not_available: "Offline",
        device: {
            name: `Meters`,
            identifiers: ["meters"],
            manufacturer: manufacturer,
            model: model
        }
    }
}

function getMuteJSON(mixName: string, mixIndex: number, feature: any, entityIndex: number, mixSize: number, featureSize: number): any {
    const baseURL = `${header}/${mixName}/${mixIndex}/${feature.name}/${entityIndex}/${feature.type}`;
    const mixFreindlyName: string = getMixFreindlyName(mixName, mixIndex, mixSize)
    const entityFreindlyName: string = getEntityFreindlyName(feature.name, entityIndex, featureSize, feature.type)

    return {
        unique_id: `${mixName}_${mixIndex}_${feature.name}_${entityIndex}_${feature.type}`,
        name: `${mixFreindlyName} ${entityFreindlyName}`,
        component: 'switch',
        device_class: "switch",
        command_topic: baseURL + "/command",
        state_topic: baseURL + "/state",
        availability_topic: `${header}/available`,
        payload_available: "Online",
        payload_not_available: "Offline",
        payload_on: "muted",
        payload_off: "unmuted",
        state_on: "Muted",
        state_off: "Unmuted",
        icon: "mdi:volume-mute",
        device: {
            name: mixFreindlyName,
            identifiers: [`${mixName}_${mixIndex}`],
            manufacturer: manufacturer,
            model: model
        }
    };
}

export function getDiscoveryJSON(config: mixGroup, index: number, mixsize: number): any {

    const mixName: string = config.name;
    const mixIndex: number = index;

    let publishGroup: any[] = []

    for (const feature of config.features) {
        for (let inputIndex: number = 0; inputIndex < feature.size; inputIndex++) {
            let data: any = {};
            let  type: string
            let commandType: string

            if(feature.type == "mute"){
                data = getMuteJSON(mixName, mixIndex, feature, inputIndex + 1, mixsize, feature.size)
                type = "switch"
                commandType = "mute"
            }
            else if (feature.type == "fader"){
                data = getFaderJSON(mixName, mixIndex, feature, inputIndex + 1, mixsize, feature.size)
                type = "number"
                commandType = "fader"
            }
            else if (feature.type == "solo"){
                data = getSoloJSON(mixName, mixIndex, feature, inputIndex + 1, mixsize,  feature.size)
                type = "switch"
                commandType = "solo"
            }
            else if (feature.type == "pan"){
                //todo find limits
                data = getPanJSON(mixName, mixIndex, feature, inputIndex + 1, mixsize, feature.size)
                type = "number"
                commandType = "pan"
            }
            else if (feature.type == "link"){
                data = getLinkJSON(mixName, mixIndex, feature, inputIndex + 1, mixsize, feature.size)
                type = "switch"
                commandType = "link"
            }
            else if (feature.type == "color"){
                data = getLightJSON(mixName, mixIndex, feature, inputIndex + 1, mixsize, feature.size)
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
                commandType: commandType,
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
            if (options.controls.mute && mix != "master"){
                const masterMute: inputControl = {
                    name: mix,
                    size: channels[mix.toUpperCase()],
                    type: "mute"
                }
                masterConfig.push(masterMute)
            }
            if (options.controls.fader && mix != "master"){
                const masterFader: inputControl = {
                    name: mix,
                    size: channels[mix.toUpperCase()],
                    type: "fader"
                }
                masterConfig.push(masterFader)
            }
        }
    }
    return masterConfig
}

export function getMeterDiscovory(meterGroup: any){
    let json: any[] = []
    for (const meter in meterGroup.controls){
        const currentInput = meterGroup.controls[meter]
        for (let i = 0; i < currentInput.size; i++) {
            //console.log(`meter/${currentInput.name}/${i + 1}`)
            const jsonData = getMeterJSON(currentInput.name, i + 1, currentInput.size)

            const publish: publishLayout = {
                type: "sensor",
                mixName: `meter`,
                input: currentInput.name,
                commandType: currentInput.name,
                index: i + 1,
                config: jsonData
            }

            json.push(publish)
        }
    }

    return json;
}

export function getConfiguration(channels: any, options: any): configuration {
    //todo missing return
    let config: configuration = {
        mixes: [],
        meters: { name: 'meters', enabled: options.meter, features: getMeterConfig(channels, options)}, // Initialize meters
        masters: { name: 'masters', size: 1, enabled: options.masters, features: getMasterConfig(channels, options) } // Initialize masters
    };

    // Process mixes based on options.mixes
    if (options.mixes) {
        for (const mixType in options.mixes) {
            if (options.mixes[mixType] && channels[mixType.toUpperCase()] && mixType != "master") {
                config.mixes.push({
                    name: mixType,
                    size: channels[mixType.toUpperCase()],
                    supported_inputs: getMixInputs(mixType),
                    supported_controls: getMixFeatures(mixType),
                    features: []
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
                            enabled: options.controls && options.controls[featureName] !== undefined ? options.controls[featureName] : false
                        }

                        mix.features.push(mixFeature)
                    }
                }
            }
        }
    }

    return config;
}