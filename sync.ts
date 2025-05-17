import {getLink, getMute} from "./presonus";
import channelSelector from "./my-repo/src/lib/types/ChannelSelector";
import {updateSensor} from "./mqtt";


async function syncMute(topic: string, channelselector: channelSelector): Promise<void> {
    const state = await getMute(channelselector)

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
    //todo may not be working
    const state = await getLink(channelselector)

    let publishState: string
    if (state)
    {
        publishState = "Linked"
    } else {
        publishState = "Unlinked"
    }

    await updateSensor(topic, publishState)
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

        }
    }
}