import { Client, MessageCode, SettingType } from './my-repo/src/api';
import {getMQTTStatus, publishDiscoveryData, updateSensor} from "./mqtt";
import { json } from "node:stream/consumers";
import { createJson } from "./discovery_json";
import channelCount from "./my-repo/src/lib/types/ChannelCount";
import { strictEqual } from "node:assert";
import {after} from "node:test";
import {getChannelType} from "./dataTypes";

let clientPresonus: Client | null = null; // Initialize as null

async function updateSelect(data: any): Promise<void> {
    const names = data.name.split("/");
    const name = names[0] + " " + names[1];
    await updateSensor('system/selected_channel', name, false);
}

async function sync(channels, options): Promise<boolean> {

    let scene = clientPresonus.currentScene;
    let project = clientPresonus.currentProject;

    await updateSensor("system/scene", scene);
    await updateSensor("system/project", project);
}

async function enableChannels(options: any) {
    await updateSensor('fx', options.fx ? 'Online' : 'Offline', true);
    await updateSensor('aux', options.aux ? 'Online' : 'Offline', true);
    await updateSensor('main', options.main ? 'Online' : 'Offline', true);
}

export async function connectPresonus(options: any): Promise<boolean> {
    if (!options) {
        console.error("Options not provided. Cannot connect to Presonus.");
        await updateSensor('system/status', 'Syncing', false);
        return false;
    }

    clientPresonus = new Client({
        host: options.ip,
        port: options.port
    }, {
        autoReconnect: options.autoreconnect,
        logLevel: process.env.DEBUG ? 'debug' : 'info'
    });

    clientPresonus.on('reconnecting', function () {
        updateSensor('system/status', 'Reconnecting', false);
        console.log('evt: Presonus Reconnecting');
    });

    clientPresonus.on('closed', function () {
        updateSensor('system/status', 'Disconnected', false);
        console.log('evt: Presonus Connection closed');
    });

    clientPresonus.on('connected', async function () {
        await updateSensor('system/status', 'Connected', false);
        console.log('evt: Presonus Connected');

        let channels = clientPresonus.channelCounts;
        console.log(`Channels: `);
        console.dir(channels);

        await updateSensor('system/status', 'Configuring', false);
        createJson(channels, options);
        await updateSensor('system/status', 'Syncing', false);
        await sync(channels, options);
        await updateSensor('system/status', 'Enabling', false);
        await enableChannels(options);
        await updateSensor('system/status', 'Ready', false);
    });

    clientPresonus.on('data', function ({ code, data }) {
        console.log(`Received ${code}:`);
        console.dir(data);

        if (code == "PV" && data.name.includes("select")){
            updateSelect(data);
        }

    });

    clientPresonus.connect().then(() => {
        console.log('Presonus Idle');
    }).catch(error => {
        console.error("Error connecting to Presonus:", error);
        updateSensor('system/status', 'Error', false);
    });

    return true;
}

