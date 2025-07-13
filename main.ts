import * as fs from 'fs'; // For sync operations
import {MQTTEvent, subscribeMQTT, publishDiscoveryData} from "./mqtt";
import {getSystemJson} from "./system_json"
import {getDiscoveryJSON, getMeterDiscovory} from "./discovery_json"
import {connectPresonus} from "./presonus"

let options: any = null; // Declare options in main.ts
let configuration: any

export function setMainConfiguration(newConfiguration: any): void {
    configuration = newConfiguration;
}

function readConfigFile(filePath: string): any {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return parseConfigData(data);
    } catch (err) {
        console.error('Error reading config file:', err);
        return null;
    }
}

function parseConfigData(data: string): any {
    try {
        return JSON.parse(data);
    } catch (jsonError) {
        const config: { [key: string]: string } = {};
        const lines = data.split('\n');
        lines.forEach((line) => {
            const parts = line.split('=');
            if (parts.length === 2) {
                config[parts[0].trim()] = parts[1].trim();
            }
        });
        return config;
    }
}

async function configure(): Promise<void>{
    while (!configuration){
        console.log("waiting for config file");
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const systemDiscovoryJSON = getSystemJson()
    await publishDiscoveryData(systemDiscovoryJSON)

    for (const mix in configuration.mixes){
        const mixConfig = configuration.mixes[mix];
        for (let mixIndex = 0; mixIndex < mixConfig.size; mixIndex++) {
            if (mixConfig.features.length > 0){
                const publishgroup: any[] = getDiscoveryJSON(mixConfig, mixIndex + 1, mixConfig.size);
                await publishDiscoveryData(publishgroup)
            }
        }
    }

    //publish data for masters
    if (configuration.masters.enabled){
        const masterDiscovoryJSON = getDiscoveryJSON(configuration.masters, 1, 1)
        await publishDiscoveryData(masterDiscovoryJSON)
    }

    //publish data for meters
    if (configuration.meters.enabled){
        const meterDiscovoryJSON = getMeterDiscovory(configuration.meters)
        await publishDiscoveryData(meterDiscovoryJSON)
    }
}

async function main(): Promise<void> {
    options = await readConfigFile("config/config.json");

    if (options) {
        const { connectMQTT, updateSensor } = await import("./mqtt");
        await connectMQTT(options.mqttOptions);
        await updateSensor('available', 'Offline', false);
        await updateSensor('system/status', 'Connecting', false);
        try {
            await connectPresonus(options.presonusOptions)
                .catch((error) => console.error("Can't Connect to Presonus: ", error));
        } catch (error) {
            console.error("Can't Connect: ", error);
        }

        await updateSensor('available', 'Offline', false);
        await updateSensor('system/status', 'Configuring', false);
        await configure()

        const topic = `presonus/${options.mqttOptions.model}/#`;
        subscribeMQTT(topic, MQTTEvent);

        await updateSensor('system/status', 'Ready', false);
        await updateSensor('available', 'Online', false);
    } else {
        console.error("Failed to load configuration");
    }
}

if (require.main === module) {
    main();
}