import { ChannelSelector, Client, ChannelTypes, Channel } from 'presonus-studiolive-api';
import {
    updateMQTTColor, updateMQTTAuxFader, updateMQTTAuxMute,
    updateMQTTLastAction, updateMQTTMainMute, updateMQTTPeak,
    updateMQTTScreen, updateMQTTSelect, updateSensor, updateMQTTSolo
} from "./mqtt";
import {getConfiguration} from "./discovery_json";
import {
    syncTalkback, setSyncConfiguration, syncMuteGroups,
    updateMainFaders, clearLocalMain
} from "./sync";
import {setMainConfiguration} from "./main"

let clientPresonus: Client | null = null; // Initialize as null

export async function getScene(): Promise<string> {
    return clientPresonus.currentScene
}

export async function getProject(): Promise<string> {
    return clientPresonus.currentProject
}

export function getChannelType(channel: string): ChannelTypes { // Return type is now ChannelTypes (the keys)
    const upperCaseChannel = channel.toUpperCase();

    switch (upperCaseChannel) {
        case 'LINE': return 'LINE';
        case 'RETURN': return 'RETURN';
        case 'FXRETURN': return 'FXRETURN';
        case 'TALKBACK': return 'TALKBACK';
        case 'AUX': return 'AUX';
        case 'FX': return 'FX';
        case 'SUB': return 'SUB';
        case 'MAIN': return 'MAIN';
        case 'MONO': return 'MONO';
        case 'MASTER': return 'MASTER';
        default:
            throw new Error(`Unsupported channel value "${channel}" for API Channel type.`);
    }
}

export async function startMeters(){
    clientPresonus.meterSubscribe()

    clientPresonus.on('meter', (meterData) => {

        if (meterData) {
             console.log("All Input Levels:", meterData);
        }

        // console.log("Main Mix Levels:", meterData.main);
        // console.log("Aux Bus Levels:", meterData.aux_metering);
    });
}

export async function getPan(channelSelector: ChannelSelector) :Promise<number> {
    //todo link function missing from api
    return 50
}

export async function getLink(channelSelector: ChannelSelector) :Promise<boolean> {
    //todo link function missing from api
    return false
}

export async function getMute(channelSelector: ChannelSelector) :Promise<boolean> {
    return clientPresonus.getMute(channelSelector)
}

export async function getSolo(channelSelector: ChannelSelector) :Promise<boolean> {
    return clientPresonus.getSolo(channelSelector)
}

export async function getLevel(channelSelector: ChannelSelector) :Promise<number> {
    return clientPresonus.getLevel(channelSelector)
}

export async function getColor(channelSelector: ChannelSelector) :Promise<string> {
    return clientPresonus.getColour(channelSelector)
}

//todo convert all topics to channelselectors in functions

export async function updatePresonusColor(topic: string, state: string) {
    const selected: ChannelSelector = getChannelSelector(topic)
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
    const selected: ChannelSelector = getChannelSelector(topic)

    clientPresonus.setPan(selected, Number(state));
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
    const mix: string = topics[2].toUpperCase();
    const mixCh: number = Number(topics[3]);
    let inputType: string = topics[4].toUpperCase()
    const inputCh: number = Number(topics[5])

    //todo update to pull from types from API

    type ChannelTypes = "MONO" | "MASTER" | "LINE" | "RETURN" | "FXRETURN" | "TALKBACK" | "AUX" | "FX" | "SUB" | "MAIN";

    let selected: ChannelSelector = null;

    if (inputType == "SOLO" || inputType == "COLOR"){
        inputType = "LINE"
    }

    if (mix == "FX" || mix == "AUX"){
        selected = {
            type: inputType as ChannelTypes,
            channel: inputCh,
            mixType: mix,
            mixNumber: mixCh
        }
    } else {
        selected = {
            type: inputType as ChannelTypes,
            channel: inputCh
        }
    }
    return selected;
}

export async function connectPresonus(options: any): Promise<void> {
    if (!options) {
        console.error("Options not provided. Cannot connect to Presonus.");
        await updateSensor('system/status', 'Error', false);
        throw new Error("No Presonus Options Provided")
    }

    const connectionPromise = new Promise<void>((resolve, reject) => {
        const clientPresonus = new Client({
            host: options.ip,
            port: options.port
        }, {
            autoreconnect: options.autoreconnect,
            logLevel: process.env.DEBUG ? 'debug' : 'info'
        });

        clientPresonus.on('reconnecting', function () {
            updateSensor('available', 'Offline', false);
            updateSensor('system/status', 'Reconnecting', false);
            console.log('evt: Presonus Reconnecting');
        });

        clientPresonus.on('closed', function () {
            updateSensor('avaliable', 'Offline', true);
            updateSensor('system/status', 'Disconnected', false);
            clearLocalMain()
            console.log('evt: Presonus Connection closed');

            if (options.autoreconnect) {
                const delayMs = options.reconnectPeriod || 5000; // Default to 5000ms (5 seconds) if reconnectPeriod is not set
                console.log(`Waiting ${delayMs} ms before trying again`);
                setTimeout(() => {
                    connectPresonus(options);
                }, delayMs);
            }
        });

        clientPresonus.on('connected', async function () {
            const channels = clientPresonus.channelCounts;
            const configData = getConfiguration(channels, options);

            setSyncConfiguration(configData);
            setMainConfiguration(configData);

            resolve();
        });

        clientPresonus.on('data', function ({code, data}) {
            console.log(`Received ${code}:`);
            console.dir(data);

            //TODO update names???
            //todo add check configuration

            if (code == "PV" && data.name.includes("select")) {
                updateMQTTSelect(data);
            } else if (code == "PV" && data.name.includes("mutegroup")) {
                syncMuteGroups(data);
            } else if (code == "PV" && data.name.includes("talkback")) {
                syncTalkback(data);
            } else if (code == "PV" && data.name.includes("mute")) {
                updateMQTTMainMute(data);
            } else if (code == "PV" && data.name.includes("assign")) {
                updateMQTTAuxMute(data);
            } else if (code == "PV" && data.name.includes("solo")) {
                updateMQTTSolo(data);
            } else if (code == "PV" && data.name.includes("mainscreen")) {
                updateMQTTScreen(data);
            } else if (code == "PV" && data.name.includes("clip")) {
                updateMQTTPeak(data);
            } else if (code == "PV" && data.name.includes("ch")) {
                updateMQTTAuxFader(data);
            } else if (code == "PC" && data.name.includes("color")) {
                updateMQTTColor(data);
            } else if (code == "MS") {
                updateMainFaders(data);
            } else {
                updateMQTTLastAction(data);
            }

        });

        clientPresonus.connect().then(() => {
            console.log('Presonus Idle');
        }).catch(error => {
            console.error("Error connecting to Presonus:", error);
            updateSensor('system/status', 'Error', false);
            reject(error);
        });
    });

    const timeoutPromise = new Promise<void>((_, reject) => {
        const timeoutMs = 10000; // 10 seconds
        setTimeout(() => {
            reject(new Error(`Connection attempt timed out after ${timeoutMs / 1000} seconds.`));
        }, timeoutMs);
    });

    return Promise.race([connectionPromise, timeoutPromise]);
}