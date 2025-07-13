import * as fs from 'fs'; // For sync operations
import {connectMQTT, updateSensor, MQTTEvent, subscribeMQTT, publishDiscoveryData} from "./mqtt";
import {getSystemJson} from "./system_json"
import {getDiscoveryJSON, getMeterDiscovory} from "./discovery_json"
import {connectPresonus} from "./presonus"
import {syncEntities} from "./sync"

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

async function sync(): Promise<void> {
    for (const mix in configuration.mixes){
        const mixConfig = configuration.mixes[mix];
        for (let mixIndex = 0; mixIndex < mixConfig.size; mixIndex++) {
            if (mixConfig.features.length > 0){
                await syncEntities(mixConfig, mixIndex + 1)
            }
        }
    }

    //publish data for masters
    if (configuration.masters.enabled){
        await syncEntities(configuration.masters, 1)
    }

    //todo add scene an project sync
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function gracefullyMQTTConnect(options: any): Promise<boolean> {
    let attempt = 0;
    const maxRetries = 10;

    while (attempt < maxRetries) {
        attempt++;

        try {
            console.log(`Attempting to connect to MQTT Broker (Attempt #${attempt})...`);
            await connectMQTT(options);
            console.log("Successfully connected to MQTT Broker!");
            return true

        } catch (error) {
            console.error("Can't connect to MQTT Broker:", error);

            if (attempt < maxRetries) {
                const nextDelay = options.reconnectPeriod * Math.pow(2, attempt - 1);
                console.log(`Retrying in ${nextDelay / 1000} seconds...`);
                await delay(nextDelay); // Pause execution for the calculated delay
            } else {
                console.error("Maximum retry attempts reached. Giving up.");
                return false
            }
        }
    }
}


async function gracefulPresonusConnect(options: any): Promise<void> {
    while (true) {
        try {
            await updateSensor('system/status', 'Connecting', false);

            console.log("Attempting to connect to Presonus...");
            await connectPresonus(options);
            console.log("Connection to Presonus successful!");

            await updateSensor('system/status', 'Connected', true);
            break;

        } catch (error) {
            console.error("Can't Connect to Presonus:", error);
            await updateSensor('system/status', 'Disconnected', false);

            await delay(options.reconnectPeriod);
        }
    }
}

async function main(): Promise<void> {
    options = await readConfigFile("config/config.json");

    if (options) {
        if (await gracefullyMQTTConnect(options.mqttOptions)){
            await updateSensor('available', 'Offline', false);

            await updateSensor('system/status', 'Connecting', false);
            await gracefulPresonusConnect(options.presonusOptions)

            await updateSensor('system/status', 'Configuring', false);
            await configure();

            await updateSensor('system/status', 'Syncing', false);
            await sync();

            const topic = `presonus/${options.mqttOptions.model}/#`;
            subscribeMQTT(topic, MQTTEvent);

            await updateSensor('system/status', 'Ready', false);
            await updateSensor('available', 'Online', false);
        }
    } else {
        console.error("Failed to load configuration");
    }
}

if (require.main === module) {
    main();
}