import * as fsPromises from 'fs/promises'; // For async operations
import * as fs from 'fs'; // For sync operations
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as path from 'path';
import {MQTTEvent, subscribeMQTT, publishDiscoveryData, updateSensor} from "./mqtt";
import {getSystemJson} from "./system_json"
import {getDiscoveryJSON, getMeterDiscovory} from "./discovery_json"
import {connectPresonus} from "./presonus"

let options: any = null; // Declare options in main.ts
let configuration: any

export function setMainConfiguration(newConfiguration: any): void {
    configuration = newConfiguration;
}

async function downloadLatestRepo(repoUrl: string, destinationPath: string): Promise<void> {
    try {
        console.log(`Attempting to download the latest version of ${repoUrl} to ${destinationPath}`);

        // Check if the destination directory exists
        const destinationExists = await fsPromises.access(destinationPath).then(() => true).catch(() => false);

        const git: SimpleGit = simpleGit();

        if (destinationExists) {
            console.log(`Destination path exists. Attempting to update.`);
            await git.cwd(destinationPath);
            await git.checkout('master', ['--force']); // Or 'master', adjust based on repo's default branch
            await git.clean(CleanOptions.FORCE);
            const pullResult = await git.pull('origin', 'master'); // Or 'master'
            console.log('Repository updated successfully:', pullResult);
        } else {
            console.log(`Destination path does not exist. Cloning repository.`);
            await fsPromises.mkdir(destinationPath, { recursive: true });
            const cloneResult = await git.clone(repoUrl, destinationPath);
            console.log('Repository cloned successfully:', cloneResult);
        }

        console.log('Download/update process completed.');

    } catch (error) {
        console.error('Error downloading/updating repository:', error);
        throw error; // Re-throw the error for the calling function to handle
    }
}

export function readConfigFile(filePath: string): any {
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

function getOptions(): any {
    return readConfigFile("config.json");
}

async function configure(): Promise<void>{
    const systemDiscovoryJSON = getSystemJson()
    await publishDiscoveryData(systemDiscovoryJSON)

    for (const mix in configuration.mixes){
        const mixConfig = configuration.mixes[mix];
        for (let mixIndex = 0; mixIndex < mixConfig.size; mixIndex++) {
            if (mixConfig.features.length > 0){
                const publishgroup: any[] = getDiscoveryJSON(mixConfig, mixIndex + 1, mixConfig.size);
                await publishDiscoveryData(publishgroup)
                //await syncEntities(mixConfig, mixIndex + 1)
            }
        }
    }

    //publish data for masters
    if (configuration.masters.enabled){
        const masterDiscovoryJSON = getDiscoveryJSON(configuration.masters, 1, 1)
        await publishDiscoveryData(masterDiscovoryJSON)
        //await syncEntities(configData.masters, 1)
    }

    //publish data for meters
    if (configuration.meters.enabled){
        const meterDiscovoryJSON = getMeterDiscovory(configuration.meters)
        await publishDiscoveryData(meterDiscovoryJSON)
        //todo fix meters
        //startMeters()
    }
}

async function connect(): Promise<void> {
    options = getOptions();

    if (options) {
        const { connectMQTT, updateSensor } = await import("./mqtt");
        await connectMQTT(options.mqttOptions);
        await updateSensor('available', 'Offline', false);
        await updateSensor('system/status', 'Connecting', false);
        try {
            await connectPresonus(options.presonusOptions)
                .then(() => configure())
                .catch((error) => console.error("Can't Connect to Presonus: ", error));
        } catch (error) {
            console.error("Can't Connect: ", error);
        }

        await updateSensor('available', 'Offline', false);
        await updateSensor('system/status', 'Configuring', false);

        const topic = `presonus/${options.mqttOptions.model}/#`;
        subscribeMQTT(topic, MQTTEvent);

        await updateSensor('system/status', 'Ready', false);
        await updateSensor('available', 'Online', false);
    } else {
        console.error("Failed to load configuration");
    }
}

function main() {
    const repositoryUrl = 'https://github.com/featherbear/presonus-studiolive-api.git';
    const downloadDirectory = path.join(__dirname, 'my-repo');

    try {
        downloadLatestRepo(repositoryUrl, downloadDirectory)
            .then(() => connect()) // Pass a function that calls connect()
            .then(() => console.log('Repository is now up to date and services are connected in:', downloadDirectory))
            .catch((error) => console.error('Failed during repository download or service connection:', error));
    } catch (error) {
        console.error('An unexpected error occurred before Promise chaining:', error);
    }
}

if (require.main === module) {
    main();
}