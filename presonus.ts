import { Client } from './my-repo/src/api';
import { MessageCode } from './my-repo/src/api'
import {
    enableChannels,
    sync,
    updateAuxFader,
    updateAuxMute, updateLastAction, updateMainFader,
    updateMainMute, updatePeak,
    updateProject,
    updateScene, updateScreen,
    updateSelect,
    updateSensor,
    updateSolo
} from "./mqtt";
import { createJson } from "./discovery_json";
import channelSelector from "./my-repo/src/lib/types/ChannelSelector";

let clientPresonus: Client | null = null; // Initialize as null

export async function updatePresonusMute(topic: string, state: string){
    const topics: string[] = topic.split("/")
    const mix: string = topics[1]
    const type: string = topics[2].toUpperCase()
    const ch: number = Number(topics[3])

    let muteState: boolean;
    if(state == "Muted"){
        muteState = true;
    } else if(state == "Unmuted"){
        muteState = false;
    }

    const selected: channelSelector = {
        type: type,
        channel: ch
    }

    clientPresonus.setMute(selected, muteState)
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
        await updateScene(clientPresonus.currentScene)
        await updateProject(clientPresonus.currentProject)
        await sync(channels, options);
        await updateSensor('system/status', 'Enabling', false);
        await enableChannels(options);
        await updateSensor('system/status', 'Ready', false);
    });

    clientPresonus.on('data', function ({ code, data }) {
        console.log(`Received ${code}:`);
        console.dir(data);

        //todo add mutegroups
        if (code == "PV" && data.name.includes("select")){
            updateSelect(data);
        } else if (code == "PV" && data.name.includes("mute")){
            updateMainMute(data);
        } else if (code == "PV" && data.name.includes("assign")){
            updateAuxMute(data);
        } else if (code == "PV" && data.name.includes("solo")){
            updateSolo(data);
        } else if (code == "PV" && data.name.includes("mainscreen")){
            updateScreen(data);
        } else if (code == "PV" && data.name.includes("clip")){
            updatePeak(data);
        } else if (code == "PV"){
            updateAuxFader(data);
        } else if (code == "MS"){
            updateMainFader(data);
        } else {
            updateLastAction(data);
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

