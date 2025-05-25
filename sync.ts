import {getLink, getMute, getSolo, getLevel, getPan, getColor} from "./presonus";
import channelSelector from "./my-repo/src/lib/types/ChannelSelector";
import {updateSensor} from "./mqtt";

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

    if (mixconfig.name == "fx" || mixconfig.mix == "aux"){
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