import * as fsPromises from 'fs/promises'; // For async operations
import * as fs from 'fs'; // For sync operations
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as path from 'path';
import {MQTTEvent, subscribeMQTT} from "./mqtt";

let options: any = null; // Declare options in main.ts


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

async function connect(): Promise<void> {
    options = getOptions();

    if (options) {
        const { connectMQTT, updateSensor } = await import("./mqtt");
        await connectMQTT(options.mqttOptions);
        await updateSensor('system/status', 'Connecting', false);

        const { connectPresonus } = await import("./presonus");
        await connectPresonus(options.presonusOptions); // Pass the loaded option

        const topic = "presonus/#";
        subscribeMQTT(topic, MQTTEvent);
    } else {
        console.error("Failed to load configuration");
    }

    const { updateSensor } = await import("./mqtt"); // Import again if needed outside the if block
    await updateSensor('system/availability', 'Online', false);
}

function main() {

    const repositoryUrl = 'https://github.com/featherbear/presonus-studiolive-api.git'; // Replace with your repository URL
    const downloadDirectory = path.join(__dirname, 'my-repo'); // Adjust the destination path as needed

    try {
        downloadLatestRepo(repositoryUrl, downloadDirectory).then(connect());
        console.log('Repository is now up to date in:', downloadDirectory);
    } catch (error) {
        console.error('Failed to download/update the repository.');
    }
}

if (require.main === module) {
    main();
}