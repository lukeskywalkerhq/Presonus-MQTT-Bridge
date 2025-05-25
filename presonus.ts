import { Client } from './my-repo/src/api';
import {
    enableChannels,
    updateMQTTColor,
    updateMQTTAuxFader,
    updateMQTTAuxMute, updateMQTTLastAction, updateMQTTMainFader,
    updateMQTTMainMute, updateMQTTPeak,
    updateMQTTProject,
    updateMQTTScene, updateMQTTScreen,
    updateMQTTSelect,
    updateSensor,
    updateMQTTSolo, publishDiscoveryData
} from "./mqtt";
import {getConfiguration, getDiscoveryJSON} from "./discovery_json";
import channelSelector from "./my-repo/src/lib/types/ChannelSelector";
import {syncEntities} from "./sync";

let clientPresonus: Client | null = null; // Initialize as null

export async function getPan(channelSelector: channelSelector) :Promise<number> {
    //todo link function missing from api
    return 50
}

export async function getLink(channelSelector: channelSelector) :Promise<boolean> {
    //todo link function missing from api
    return false
}

export async function getMute(channelSelector: channelSelector) :Promise<boolean> {
    return clientPresonus.getMute(channelSelector)
}

export async function getSolo(channelSelector: channelSelector) :Promise<boolean> {
    return clientPresonus.getSolo(channelSelector)
}

export async function getLevel(channelSelector: channelSelector) :Promise<number> {
    return clientPresonus.getLevel(channelSelector)
}

export async function getColor(channelSelector: channelSelector) :Promise<string> {
    return clientPresonus.getColour(channelSelector)
}

//todo convert all topics to channelselectors in functions

export async function updatePresonusColor(topic: string, state: string) {
    const selected: channelSelector = getChannelSelector(topic)
    const colorChannels = state.split(",")
    const red = Number(colorChannels[0]).toString(16)
    const green = Number(colorChannels[1]).toString(16)
    const blue = Number(colorChannels[2]).toString(16)
    const hex = red + green + blue

    clientPresonus.setColor(selected, hex);
}

export async function updatePresonusSolo(topic: string, state: string){

    const selected = getChannelSelector(topic)

    let soloState: boolean;
    if(state == "Soloed"){
        soloState = true;
    } else if(state == "Unsoloed"){
        soloState = false;
    }

    clientPresonus.setSolo(selected, soloState);
}

export async function updatePresonusFader(topic: string, state: string){
    //Ex: Topic : presonus/main1/line/1/fader/set State: 11.3
    //todo add mix, main, mono

    const selected = getChannelSelector(topic)
    const level: number = Number(state)

    await clientPresonus.setChannelVolumeLinear(selected, level)
}

export async function updatePresonusMute(topic: string, state: string){
    //todo add mute options for auxs, fx
    // Example Data: Topic : presonus/main1/line/1/mute/state State : Unmuted

    const selected = getChannelSelector(topic)

    let muteState: boolean;
    if(state == "Muted"){
        muteState = true;
    } else if(state == "Unmuted"){
        muteState = false;
    }

    clientPresonus.setMute(selected, muteState)
}

export function getChannelSelector(topic: string){
    const topics: string[] = topic.split("/")
    const mix: string = topics[1].replace(/[0-9]/g, '').toUpperCase();
    const mixCh: number = Number(topics[1].replace(/\D/g,''));
    let type: string = topics[2].toUpperCase()
    const ch: number = Number(topics[3])

    let selected: channelSelector = null;

    if (type == "SOLO" || type == "COLOR"){
        type = "LINE"
    }

    if (mix == "FX" || mix == "AUX"){
        selected = {
            type: type,
            channel: ch,
            mixType: mix,
            mixNumber: mixCh
        }
    } else {
        selected = {
            type: type,
            channel: ch
        }
    }
    return selected;
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
        const channels = clientPresonus.channelCounts;

        await updateSensor('system/status', 'Configuring', false);
        const configData = getConfiguration(channels, options);


        for (const mix in configData.mixes){
            const mixConfig = configData.mixes[mix];
            for (let mixIndex = 0; mixIndex < mixConfig.size; mixIndex++) {
                if (mixConfig.features.length > 0){
                    const publishgroup: any[] = getDiscoveryJSON(mixConfig, mixIndex + 1);
                    await publishDiscoveryData(publishgroup)
                    await syncEntities(mixConfig, mixIndex + 1)
                }
            }

            await updateSensor(`${mixConfig.name}`, "Online", false)
        }

        //await updateSensor('system/status', 'Syncing', false);
        //await updateMQTTScene(clientPresonus.currentScene)
        //await updateMQTTProject(clientPresonus.currentProject)
        //await sync(channels, options);
        //await updateSensor('system/status', 'Enabling', false);
        //await enableChannels(options);
        //await updateSensor('system/status', 'Ready', false);
    });

    clientPresonus.on('data', function ({ code, data }) {
        console.log(`Received ${code}:`);
        console.dir(data);

        //todo add mutegroups
        //todo change to (topic, state) format


        if (code == "PV" && data.name.includes("select")){
            updateMQTTSelect(data);
        } else if (code == "PV" && data.name.includes("mute")){
            updateMQTTMainMute(data);
        } else if (code == "PV" && data.name.includes("assign")){
            updateMQTTAuxMute(data);
        } else if (code == "PV" && data.name.includes("solo")){
            updateMQTTSolo(data);
        } else if (code == "PV" && data.name.includes("mainscreen")){
            updateMQTTScreen(data);
        } else if (code == "PV" && data.name.includes("clip")){
            updateMQTTPeak(data);
        } else if (code == "PV" && data.name.includes("ch")){
            updateMQTTAuxFader(data);
        } else if (code == "PC" && data.name.includes("color")){
            updateMQTTColor(data);
        } else if (code == "MS"){
            updateMQTTMainFader(data);
        } else {
            updateMQTTLastAction(data);
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

