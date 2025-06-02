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
import {getConfiguration, getDiscoveryJSON, getMeterDiscovory} from "./discovery_json";
import {getSystemJson} from "./system_json"
import channelSelector from "./my-repo/src/lib/types/ChannelSelector";
import {syncEntities, syncTalkback, setConfiguration, syncMuteGroups} from "./sync";

let clientPresonus: Client | null = null; // Initialize as null

async function startMeters(){
    clientPresonus.meterSubscribe()

    clientPresonus.on('meter', (meterData) => {

        if (meterData.input) {
             console.log("All Input Levels:", meterData.input);
        }

        // console.log("Main Mix Levels:", meterData.main);
        // console.log("Aux Bus Levels:", meterData.aux_metering);
    });
}

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
    let hex: string

    if (topic.includes("rgb")) {
        const colorChannels = state.split(",")
        const red = Number(colorChannels[0]).toString(16)
        const green = Number(colorChannels[1]).toString(16)
        const blue = Number(colorChannels[2]).toString(16)
        hex = red + green + blue
    }

    else if (topic.includes("power")) {
        if (state == "ON") {
            hex = "ffffffff"
        }  else if (state = "OFF") {
            hex = "00000000"
        }
    }

    console.log(selected, hex, state, topic);
    clientPresonus.setColor(selected, hex);
}

export async function updatePresonusPan(topic: string, state: string) {
    const selected: channelSelector = getChannelSelector(topic)

    clientPresonus.setPan(selected, state);
}

export async function updatePresonusLink(topic: string, state: string){

    const selected = getChannelSelector(topic)

    let soloState: boolean;
    if(state == "linked"){
        soloState = true;
    } else if(state == "unlinkeded"){
        soloState = false;
    }

    clientPresonus.setLink(selected, soloState);
}

export async function updatePresonusSolo(topic: string, state: string){

    const selected = getChannelSelector(topic)

    let soloState: boolean;
    if(state == "soloed"){
        soloState = true;
    } else if(state == "unsoloed"){
        soloState = false;
    }

    clientPresonus.setSolo(selected, soloState);
}

export async function updatePresonusFader(topic: string, state: string){
    //Ex: Topic : presonus/main1/line/1/fader/set State: 11.3

    const selected = getChannelSelector(topic)
    const level: number = Number(state)

    await clientPresonus.setChannelVolumeLinear(selected, level)
}

export async function updatePresonusMute(topic: string, state: string){
    // Example Data: Topic : presonus/main/1/line/1/mute/state State : Unmuted

    const selected = getChannelSelector(topic)

    let muteState: boolean;
    if(state == "muted"){
        muteState = true;
    } else if(state == "unmuted"){
        muteState = false;
    }

    clientPresonus.setMute(selected, muteState)
}

export function getChannelSelector(topic: string){
    //example topic: presonus/main/1/line/1/mute/state
    const topics: string[] = topic.split("/")
    const mix: string = topics[1].toUpperCase();
    const mixCh: number = Number(topics[2]);
    let inputType: string = topics[3].toUpperCase()
    const inputCh: number = Number(topics[4])

    let selected: channelSelector = null;

    if (inputType == "SOLO" || inputType == "COLOR"){
        inputType = "LINE"
    }

    if (mix == "FX" || mix == "AUX"){
        selected = {
            type: inputType,
            channel: inputCh,
            mixType: mix,
            mixNumber: mixCh
        }
    } else {
        selected = {
            type: inputType,
            channel: inputCh
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
        autoreconnect: options.autoreconnect,
        logLevel: process.env.DEBUG ? 'debug' : 'info'
    });

    clientPresonus.on('reconnecting', function () {
        updateSensor('system/status', 'Reconnecting', false);
        console.log('evt: Presonus Reconnecting');
    });

    clientPresonus.on('closed', function () {
        updateSensor('avaliable', 'Offline', true);
        updateSensor('system/status', 'Disconnected', false);
        console.log('evt: Presonus Connection closed');

        if (options.autoreconnect){
            const delayMs = options.reconnectPeriod || 5000; // Default to 5000ms (5 seconds) if reconnectPeriod is not set
            console.log(`Waiting ${delayMs} ms before trying again`);
            setTimeout(() => {
                connectPresonus(options);
            }, delayMs);
        }
    });

    clientPresonus.on('connected', async function () {
        await updateSensor('system/status', 'Connected', false);
        const channels = clientPresonus.channelCounts;

        await updateSensor('system/status', 'Configuring', false);
        const configData = getConfiguration(channels, options);

        setConfiguration(configData)

        //publish data for system
        const systemDiscovoryJSON = getSystemJson()
        await publishDiscoveryData(systemDiscovoryJSON)

        for (const mix in configData.mixes){
            const mixConfig = configData.mixes[mix];
            for (let mixIndex = 0; mixIndex < mixConfig.size; mixIndex++) {
                if (mixConfig.features.length > 0){
                    const publishgroup: any[] = getDiscoveryJSON(mixConfig, mixIndex + 1, mixConfig.size);
                    await publishDiscoveryData(publishgroup)
                    await syncEntities(mixConfig, mixIndex + 1)
                }
            }
        }

        //publish data for masters
        if (configData.masters.enabled){
            const masterDiscovoryJSON = getDiscoveryJSON(configData.masters, 1, 1)
            await publishDiscoveryData(masterDiscovoryJSON)
            await syncEntities(configData.masters, 1)
        }

        //publish data for meters
        if (configData.meters.enabled){
            const meterDiscovoryJSON = getMeterDiscovory(configData.meters)
            await publishDiscoveryData(meterDiscovoryJSON)
            //todo fix meters
            //startMeters()
        }

        await updateSensor('system/status', 'Ready', false);
        await updateSensor('available', 'Online', false);
    });

    clientPresonus.on('data', function ({ code, data }) {
        console.log(`Received ${code}:`);
        console.dir(data);

        //todo update names???
        //disconnect on code: PV name softpower/softPowerProgress
        //value: Buffer(4) [Uint8Array] [0,0,128,63]
        // index 2 goes from 0 to 128 where 128 is fully ready to shutdown


        if (code == "PV" && data.name.includes("select")){
            updateMQTTSelect(data);
        } else if (code == "PV" && data.name.includes("mutegroup")){
            syncMuteGroups(data);
        } else if (code == "PV" && data.name.includes("talkback")){
            syncTalkback(data);
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