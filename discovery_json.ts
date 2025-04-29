import {getChannelType, getSpecialInputConfig, getSupportedFeatures} from "./dataTypes";
import {type} from "node:os";
import {publishDiscoveryData} from "./mqtt";

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
        brightness_state_topic?: string;
        brightness_command_topic?: string;
        supported_color_modes?: string[];
        position_topic?: string;
        set_position_topic?: string;
        optimistic?: boolean;
    }
    device?: { // Add the device property for grouping
        name: string;
        identifiers: string[];
        manufacturer?: string;
        model?: string;
    };
    [key: string]: any; // Allow arbitrary properties
}

interface DeviceGroupConfig {
    name: string;
    devices: {
    }[];
}

interface ConfigFile {
    device_groups: DeviceGroupConfig[];
}

interface mixGroup{
    name: string;
    size: number;
    enabled: boolean;
    features: string[]
}

interface inputInterfaces{
    name: string;
    size: number;
    enabled: boolean;
}


async function staticJson(){
    const systemGroup: { device_groups: DeviceGroupConfig[] } = { // Explicitly type the outer object
        device_groups: [
            {
                name: "System", // Add a name for this group of system sensors
                devices: [ // Wrap the sensor configs in a 'devices' array
                    {
                        type: "sensor",
                        config: {
                            name: "Status",
                            unique_id: "system_status",
                            state_topic: "presonus/system/status",
                            availability_topic: "presonus/system/availability",
                            payload_available: "Online",
                            payload_not_available: "Offline",
                            icon: "mdi:information",
                            device: {
                                name: "System",
                                identifiers: ["system"],
                                manufacturer: manufacturer,
                                model: "TO DO"
                            }
                        },
                    },
                    {
                        type: "sensor",
                        config: {
                            name: "Project",
                            unique_id: "system_project",
                            state_topic: "presonus/system/project",
                            availability_topic: "presonus/system/availability",
                            payload_available: "Online",
                            payload_not_available: "Offline",
                            icon: "mdi:folder",
                            device: {
                                name: "System",
                                identifiers: ["system"],
                                manufacturer: manufacturer,
                                model: "My Model"
                            }
                        },
                    },
                    {
                        type: "sensor",
                        config: {
                            name: "Scene",
                            unique_id: "system_scene",
                            state_topic: "presonus/system/project",
                            availability_topic: "presonus/system/availability",
                            payload_available: "Online",
                            payload_not_available: "Offline",
                            icon: "mdi:movie-roll",
                            device: {
                                name: "System",
                                identifiers: ["system"],
                                manufacturer: manufacturer,
                                model: "My Model"
                            }

                        },
                    },
                    {
                        type: "sensor",
                        config: {
                            name: "Selected Channel",
                            unique_id: "selected_channel",
                            state_topic: "presonus/system/selected_channel",
                            availability_topic: "presonus/system/availability",
                            payload_available: "Online",
                            payload_not_available: "Offline",
                            icon: "mdi:target",
                            device: {
                                name: "System",
                                identifiers: ["system"],
                                manufacturer: manufacturer,
                                model: "My Model"
                            }

                        },
                    },
                    {
                        type: "sensor",
                        config: {
                            name: "Last Action",
                            unique_id: "last_action",
                            state_topic: "presonus/system/last_action",
                            availability_topic: "presonus/system/availability",
                            payload_available: "Online",
                            payload_not_available: "Offline",
                            icon: "mdi:history",
                            device: {
                                name: "System",
                                identifiers: ["system"],
                                manufacturer: manufacturer,
                                model: "My Model"
                            }

                        },
                    },

                ],
            },
        ]}
    await publishDiscoveryData(systemGroup);
}

function getColor(mix: string, mixNumber: number, type: string, typeNumber: number): DeviceConfig[] {
    const allJson: DeviceConfig[] = [];

    const baseId = `${mix.toLowerCase()}_${mixNumber}_${type.toLowerCase()}_${typeNumber}`;
    const mixNumberString: string = mixNumber.toString().padStart(2, '0');
    const typeNumberString: string = typeNumber.toString().padStart(2, '0');

    const friendlyName = `${mix.charAt(0).toUpperCase() + mix.slice(1)} ${mixNumberString} ${type.charAt(0).toUpperCase() + type.slice(1)} ${typeNumberString} Color`;

    // Add JSON data for RGB light
    const lightDevice: DeviceConfig = {
        type: "light",
        config: {
            name: `${friendlyName}`,
            unique_id: `${baseId}_color`,
            state_topic: `presonus/${mix.toLowerCase()}${mixNumber}/${type.toLowerCase()}/${typeNumber}/color/state`,
            command_topic: `presonus/${mix.toLowerCase()}${mixNumber}/${type.toLowerCase()}/${typeNumber}/color/set`,
            availability_topic: `presonus/${mix}`,
            payload_available: "Online",
            payload_not_available: "Offline",
            brightness_state_topic: `presonus/${mix.toLowerCase()}_${mixNumber}/${type.toLowerCase()}/${typeNumber}/brightness/state`,
            brightness_command_topic: `presonus/${mix.toLowerCase()}_${mixNumber}/${type.toLowerCase()}/${typeNumber}/brightness/set`,
            rgb_state_topic: `presonus/${mix.toLowerCase()}_${mixNumber}/${type.toLowerCase()}/${typeNumber}/rgb/state`,
            rgb_command_topic: `presonus/${mix.toLowerCase()}_${mixNumber}/${type.toLowerCase()}/${typeNumber}/rgb/set`,
            state_value_template: "{{ value_json.state }}",
            brightness_value_template: "{{ value_json.brightness }}",
            rgb_value_template: "{{ value_json.rgb }}",
            command_on_template: '{ "state": "ON"{% if brightness is defined %}, "brightness": {{ brightness }}{% endif %}{% if rgb is defined %}, "rgb": {{ rgb }}{% endif %} }',
            command_off_template: '{ "state": "OFF" }',
            supported_color_modes: ["rgb"],
            color_mode_state_topic: `presonus/${mix.toLowerCase()}_${mixNumber}/${type.toLowerCase()}/${typeNumber}/color_mode/state`,
            color_mode_value_template: "{{ value_json.color_mode }}",
            color_mode_command_topic: `presonus/${mix.toLowerCase()}_${mixNumber}/${type.toLowerCase()}/${typeNumber}/color_mode/set`,
            command_color_mode_template: '{ "color_mode": "{{ value }}" }'
        },
    };
    allJson.push(lightDevice);

    return allJson;
}

function getSolo(mix: string, mixNumber: number, type: string, typeNumber: number): DeviceConfig[] {
    const allJson: DeviceConfig[] = [];

    const baseId = `${mix.toLowerCase()}_${mixNumber}_${type.toLowerCase()}_${typeNumber}`;
    const mixNumberString:string = mixNumber.toString().padStart(2, '0');
    const typeNumberString:string = typeNumber.toString().padStart(2, '0');

    const friendlyName = `${mix.charAt(0).toUpperCase() + mix.slice(1)} ${mixNumberString} ${type.charAt(0).toUpperCase() + type.slice(1)} ${typeNumberString}`;

    // Add JSON data for mute
    const muteDevice: DeviceConfig = {
        type: "switch",
        config: {
            name: `${friendlyName}`,
            unique_id: `${baseId}`,
            state_topic: `presonus/${mix.toLowerCase()}${mixNumber}/${type.toLowerCase()}/${typeNumber}/solo/state`,
            command_topic: `presonus/${mix.toLowerCase()}${mixNumber}/${type.toLowerCase()}/${typeNumber}/solo/set`,
            availability_topic: `presonus/${mix}`,
            payload_available: "Online",
            payload_not_available: "Offline",
            payload_on: "Soloed",
            payload_off: "UnSoloed",
            state_on: "Soloed",
            state_off: "Unsoloed",
            device_class: "switch",
            icon: "mdi:speaker-single"
        },
    };
    allJson.push(muteDevice);

    return allJson
}

function getMuteAndFader(mix: string, mixNumber: number, type: string, typeNumber:number): DeviceConfig[] {
    const allJson: DeviceConfig[] = [];
    const specialJson = getSpecialInputConfig(type); // Special JSON that differs between types

    const baseId = `${mix.toLowerCase()}_${mixNumber}_${type.toLowerCase()}_${typeNumber}`;
    const mixNumberString:string = mixNumber.toString().padStart(2, '0');
    const typeNumberString:string = typeNumber.toString().padStart(2, '0');

    const friendlyName = `${mix.charAt(0).toUpperCase() + mix.slice(1)} ${mixNumberString} ${type.charAt(0).toUpperCase() + type.slice(1)} ${typeNumberString}`;

    // Add JSON data for mute
    const muteDevice: DeviceConfig = {
        type: "switch",
        config: {
            name: `${friendlyName} Mute`,
            unique_id: `${baseId}_mute`,
            state_topic: `presonus/${mix.toLowerCase()}${mixNumber}/${type.toLowerCase()}/${typeNumber}/mute/state`,
            command_topic: `presonus/${mix.toLowerCase()}${mixNumber}/${type.toLowerCase()}/${typeNumber}/mute/set`,
            availability_topic: `presonus/${mix}`,
            payload_available: "Online",
            payload_not_available: "Offline",
            payload_on: "Muted",
            payload_off: "Unmuted",
            state_on: "Muted",
            state_off: "Unmuted",
            device_class: "switch",
            icon: specialJson?.icon || "mdi:volume-mute",
            ...specialJson,
        },
    };
    allJson.push(muteDevice);

    // Add JSON data for fader level
    const faderDevice: DeviceConfig = {
        type: "number",
        config: {
            name: `${friendlyName} Level`,
            unique_id: `${baseId}_level`,
            state_topic: `presonus/${mix.toLowerCase()}${mixNumber}/${type.toLowerCase()}/${typeNumber}/level/state`,
            command_topic: `presonus/${mix.toLowerCase()}${mixNumber}/${type.toLowerCase()}/${typeNumber}/set`,
            availability_topic: `presonus/${mix}`,
            payload_available: "Online",
            payload_not_available: "Offline",
            min: 0,
            max: 100,
            step: 0.1,
            unit_of_measurement: "%",
            icon: specialJson?.icon || "mdi:knob",
            ...specialJson,
        },
    };
    allJson.push(faderDevice);
    return allJson;
}

async function jsonloop(mixes: mixGroup[], inputs: inputInterfaces[], options: any) {

    await staticJson()

    for (const mix of mixes) {
        if (mix.enabled) {
            for (let i = 0; i < mix.size; i++) {
                const channelNumber = (i + 1).toString().padStart(2, '0');
                const mixUniqueID = mix.size <= 2 ? mix.name : `${mix.name}_${channelNumber}`;

                let mixFriendlyName: string;
                if (mix.size == 1) {
                    mixFriendlyName = `${mix.name.charAt(0).toUpperCase() + mix.name.slice(1)}`;
                } else {
                    mixFriendlyName = `${mix.name.charAt(0).toUpperCase() + mix.name.slice(1)} ${channelNumber}`;
                }

                const devices: { type: string; config: DeviceConfig }[] = []; // Array to hold all devices for this mix channel

                if (mix.features) {
                    for (const feature of mix.features) {
                        const inputInfo = inputs.find(input => input.name === feature);

                        if (inputInfo?.name && inputInfo?.size && mix.enabled && inputInfo.enabled) {
                            for (let j = 0; j < inputInfo.size; j++) {
                                let deviceJSON: DeviceConfig[] = null; // Allow null if no match

                                if (feature.toLowerCase() == "line" || feature.toLowerCase() == "fxreturn" ||
                                    feature.toLowerCase() == "return" || feature.toLowerCase() == "talkback") {
                                    deviceJSON = getMuteAndFader(mix.name, i + 1, feature, j + 1);
                                } else if (feature.toLowerCase() == "solo"){
                                    deviceJSON = getSolo(mix.name, i + 1, feature, j + 1);
                                } else if (feature.toLowerCase() == "color"){
                                    deviceJSON = getColor(mix.name, i + 1, feature, j + 1);
                                }

                                if (deviceJSON) {
                                    deviceJSON.forEach(config => {
                                        devices.push({
                                            type: config.type,
                                            config: {
                                                ...config.config,
                                                device: { // Define the device for Home Assistant grouping
                                                    name: mixFriendlyName,
                                                    identifiers: [mixUniqueID.toLowerCase()], // Unique identifier for the mix channel
                                                    manufacturer: 'Presonus', // Or your preferred manufacturer
                                                    model: mix.model || 'Unknown', // Assuming 'mix' has a 'model' property
                                                },
                                            }
                                        });
                                    });
                                }
                            }
                        } else {
                            console.log(`  No matching and enabled input info found for feature: ${feature} for mix: ${mix.name}`);
                        }
                    }
                }

                // Structure the configFile with all devices under a single device_group (optional, but cleaner)
                const configFile: ConfigFile = {
                    device_groups: [
                        {
                            name: mixFriendlyName, // Optional group name
                            devices: devices,
                        },
                    ],
                };

                //console.log(JSON.stringify(configFile, null, 2));
                await publishDiscoveryData(configFile);
            }
        }
    }
    return true;
}

export function createJson(channels: Record<string, number>, options: any): ConfigFile {

    const inputs:inputInterfaces [] = [];
    const mixes:mixGroup[] = [];

    for (const channel in channels) {
        if (getChannelType(channel) === "mix"){
            const features = getSupportedFeatures(channel);
            let enabled: boolean
            if (channels[channel] > 0 ){
                enabled = options?.[channel.toLowerCase()]
            } else {
                enabled = false
            }
            const mix :mixGroup = {
                'name': channel.toLowerCase(),
                'size': channels[channel],
                'enabled': enabled,
                'features': features
            }
            mixes.push(mix);
        }
        else if (getChannelType(channel) === "input") {
            let enabled :boolean
            if (channels[channel] > 0) {
                enabled = options?.[channel.toLowerCase()]
            } else {
                enabled = false
            }
            const input :inputInterfaces = {
                'name': channel.toLowerCase(),
                'size': channels[channel],
                'enabled': enabled
            }
            inputs.push(input)

            if (channel === "LINE"){
                const soloInput :inputInterfaces = {
                    'name': "solo",
                    'size': channels[channel],
                        'enabled': options?.["solo"]
            }
                const colorInput :inputInterfaces = {
                    'name': "color",
                    'size': channels[channel],
                    'enabled': options?.["color"]
            }

                inputs.push(soloInput)
                inputs.push(colorInput)
            }
        }
    }

    //todo add catch
    jsonloop(mixes, inputs, options)
}

// Example Usage (replace with your actual channels and streams data)
/*
const sampleChannels = {
    LINE: 64,
    AUX: 32,
    FX: 8,
    FXRETURN: 8,
    RETURN: 3,
    TALKBACK: 1,
    MAIN: 1,
    SUB: 0,
};
const sampleoptions = {
    ip: '10.10.11.45',
    port: 53000,
    autoreconnect: true,
    line: true,
    aux: true,
    fx: true,
    fxreturn: true,
    return: true,
    talkback: true,
    main: true,
    solo: true,
    color: true,
    meter: true
}

const myJsonData = createJson(sampleChannels, sampleoptions);
console.log(JSON.stringify(myJsonData, null, 2));


 */
