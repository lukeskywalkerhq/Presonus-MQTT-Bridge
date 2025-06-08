import {getLink, getMute, getSolo, getLevel, getPan, getColor} from "./presonus";
import channelSelector from "./my-repo/src/lib/types/ChannelSelector";
import {updateSensor} from "./mqtt";
import {mainLayout} from "./interfaces"
import {updateMQTTMainFader} from "./mqtt"

let configuration: any = null
let localMain: any

export function setSyncConfiguration(localConfiguration: any){
    configuration = localConfiguration
}

export function clearLocalMain(){
    localMain = null
}

export async function updateMainFaders(dataList: any){
    if(!localMain){
        localMain = dataList
        updateMQTTMainFader(dataList)
        //todo add function to update Masters
        //todo fix update for init main
    }
    else{
        for (const ch in dataList.LINE){
            if (dataList.LINE[ch] != localMain.LINE[ch]){
                localMain.LINE[ch] = dataList.LINE[ch]
            }
        }
        for (const ch in dataList.RETURN){
            if (dataList.RETURN[ch] != localMain.RETURN[ch]){
                localMain.RETURN[ch] = dataList.RETURN[ch]
            }
        }
        for (const ch in dataList.FXRETURN){
            if (dataList.FXRETURN[ch] != localMain.FXRETURN[ch]){
                localMain.FXRETURN[ch] = dataList.FXRETURN[ch]
            }
        }
        for (const ch in dataList.TALKBACK){
            if (dataList.TALKBACK[ch] != localMain.TALKBACK[ch]){
                localMain.TALKBACK[ch] = dataList.TALKBACK[ch]
            }
        }
        for (const ch in dataList.AUX){
            if (dataList.AUX[ch] != localMain.AUX[ch]){
                localMain.AUX[ch] = dataList.AUX[ch]
            }
        }
        for (const ch in dataList.FX){
            if (dataList.FX[ch] != localMain.FX[ch]){
                localMain.FX[ch] = dataList.FX[ch]
            }
        }
        for (const ch in dataList.MAIN){
            if (dataList.MAIN[ch] != localMain.MAIN[ch]){
                localMain.MAIN[ch] = dataList.MAIN[ch]
            }
        }
        for (const ch in dataList.MONO){
            if (dataList.MONO[ch] != localMain.MONO[ch]){
                localMain.MONO[ch] = dataList.MONO[ch]
            }
        }
        for (const ch in dataList.MASTER){
            if (dataList.MASTER[ch] != localMain.MASTER[ch]){
                localMain.MASTER[ch] = dataList.MASTER[ch]
            }
        }
    }
}

export async function syncTalkback(data: any){
    for (const mix in configuration.mixes){
        const mixConfig = configuration.mixes[mix];

        if (mixConfig.supported_inputs && mixConfig.supported_inputs.includes("talkback")){
            for (let mixIndex = 0; mixIndex < mixConfig.size; mixIndex++) {
                const topic: string = `${mixConfig.name}/${mixIndex + 1}/talkback/1/mute/state`
                await updateSensor(topic, data.value ? 'Unmuted' : 'Muted', false)
            }
        }

    }
}

export async function syncMuteGroups(data: any){
    for (const mix in configuration.mixes){
        const mixConfig = configuration.mixes[mix];

        if (mixConfig.supported_controls && mixConfig.supported_controls.mute){
            for (let mixIndex: number = 0; mixIndex < mixConfig.size; mixIndex++) {

                for (const input in mixConfig.supported_inputs){ //loop thu inputs
                    const inputType: string =  mixConfig.supported_inputs[input];

                    let inputSize: number = 0;

                    for(const feature in mixConfig.features){ //get the size of input
                        const currentFeature: any = mixConfig.features[feature];
                        if (currentFeature.name == inputType && currentFeature.type == "mute"){
                            inputSize = currentFeature.size;
                            break;
                        }
                    }

                    for (let i: number = 0; i < inputSize; i++){ //loop thu all mutes channels

                        const topic: string = `${mixConfig.name}/${mixIndex + 1}/${inputType}/${i + 1}/mute/state`
                        const channelSelector: channelSelector = getChannelSelector(mixConfig, mixIndex + 1, i + 1, inputType)

                        await syncMute(topic, channelSelector)
                    }
                }
            }
        }

    }
}

async function syncPan(topic: string, channelselector: channelSelector): Promise<void> {
    //API does not have getPan function
    // leaving this here in case changes are made to support function
    //todo add check to see if value exists before overwriting
    /*
    const state: string = await getPan(channelselector).toString()

    await updateSensor(topic, state)

     */
    await updateSensor(topic, "50");
}

async function syncColor(topic: string, channelselector: channelselector): Promise<void> {
    const state: string | null | undefined = await getColor(channelselector);
    let color: string;
    let powerState: string;

    if (!state) {
        color = "0,0,0";
        powerState = "OFF"
    } else {
        if (typeof state === 'string' && state.length >= 6) {
            try {
                const red = parseInt(state.substring(0, 2), 16);
                const green = parseInt(state.substring(2, 4), 16);
                const blue = parseInt(state.substring(4, 6), 16);
                color = `${red},${green},${blue}`;

                if (red > 0 || green > 0 || blue > 0){
                    powerState = "ON"
                } else {
                    powerState = "OFF"
                }
            } catch (error) {
                console.error("Error converting hex to RGB:", error);
                color = "0,0,0";
                powerState = "OFF"
            }
        } else {
            console.warn("Unexpected state format:", state);
            color = "0,0,0";
            powerState = "OFF"
        }
    }
    await updateSensor(topic + "/rgb", color);
    await updateSensor(topic + "/power", powerState);
}

async function syncFaders(topic: string, channelselector: channelSelector): Promise<void> {
    const state: number = await getLevel(channelselector);
    const roundedState: string = state.toFixed(1);
    await updateSensor(topic, roundedState);
}


async function syncSolo(topic: string, channelselector: channelSelector): Promise<void> {
    const state: boolean = await getSolo(channelselector)

    let publishState: string
    if (state)
    {
        publishState = "Soloed"
    } else {
        publishState = "Unsoloed"
    }

    await updateSensor(topic, publishState)
}

async function syncMute(topic: string, channelselector: channelSelector): Promise<void> {
    const state: boolean = await getMute(channelselector)

    let publishState: string
    if (state)
    {
        publishState = "Muted"
    } else {
        publishState = "Unmuted"
    }

    await updateSensor(topic, publishState)
}

async function syncLink(topic: string, channelselector: channelSelector): Promise<void> {
    //API Does not have getLink function
    // leaving this here just in case it gets added later
    /*
    const state: boolean = await getLink(channelselector)

    let publishState: string
    if (state)
    {
        publishState = "Linked"
    } else {
        publishState = "Unlinked"
    }

    await updateSensor(topic, publishState)

     */
    await updateSensor(topic, "Unlinked")
}

function getChannelSelector(mixconfig: any, mixChannel: number, inputChannel: number, feature: string): channelSelector {
    let selected: channelSelector = null;

    if (mixconfig.name == "fx" || mixconfig.name == "aux"){
        selected = {
            type: feature.toUpperCase(),
            channel: inputChannel,
            mixType: mixconfig.name.toUpperCase(),
            mixNumber: mixChannel
        }
    } else {
        selected = {
            type: feature.toUpperCase(),
            channel: inputChannel
        }
    }

    return selected;
}

export async function syncEntities(mixConfig: any, mixIndex: number): Promise<void>{
    for (const feature in  mixConfig.features) {
        const currentFeature = mixConfig.features[feature];
        for (let i = 0; i < currentFeature.size; i++) {
            const topic: string = `${mixConfig.name}/${mixIndex}/${currentFeature.name}/${i + 1}/${currentFeature.type}/state`
            const channel: channelSelector = getChannelSelector(mixConfig, mixIndex, i + 1, currentFeature.name)

            if (currentFeature.type == "mute") {
                await syncMute(topic, channel);
            }
            else if (currentFeature.type == "link") {
                await syncLink(topic, channel);
            }
            else if (currentFeature.type == "solo"){
                await syncSolo(topic, channel);
            }
            else if (currentFeature.type == "fader"){
                await syncFaders(topic, channel);
            }
            else if (currentFeature.type == "pan"){
                await syncPan(topic, channel);
            }
            else if (currentFeature.type == "color"){
                await syncColor(topic, channel);
            }

        }
    }
}