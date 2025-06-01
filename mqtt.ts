import * as mqtt from 'mqtt';
import {setDiscoveryHeader} from './discovery_json';
import {setSystemHeader} from './system_json'
import {updatePresonusColor, updatePresonusFader, updatePresonusMute, updatePresonusSolo, updatePresonusPan, updatePresonusLink} from "./presonus";

let mqttClient: mqtt.MqttClient | null = null;

let prefix:string = null;
let mqttOptions = null;

export async function updateMQTTColor(data: any){
    const names: string[] = data.name.split("/");
    const inputType: string = names[0];
    const inputChannel: string = names[1].slice(2);
    const topic: string = `main/1/${inputType}/${inputChannel}/color/state`

    let color: string;
    let powerState: string;

    if (!data.value) {
        color = "0,0,0";
        powerState = "OFF"
    } else {
        if (typeof data.value === 'string' && data.value.length >= 6) {
            try {
                const red = parseInt(data.value.substring(0, 2), 16);
                const green = parseInt(data.value.substring(2, 4), 16);
                const blue = parseInt(data.value.substring(4, 6), 16);
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
            console.warn("Unexpected state format:", data.value);
            color = "0,0,0";
            powerState = "OFF"
        }
    }
    await updateSensor(topic + "/rgb", color);
    await updateSensor(topic + "/power", powerState);
}

export async function updateMQTTPeak(data: any){
    const names = data.name.split("/")
    const type = names[0]
    const ch = names[1].slice(2)
    const value = type + " " + ch
    const topic = "system/peak"
    await updateSensor(topic, value, false)
}

export async function updateMQTTLastAction(data: any){
    const name = data.name
    const topic = "system/last_action"
    await updateSensor(topic, name, false)
}

export async function updateMQTTScreen(data: any){
    const name = data.name.split("/")[1]
    const topic = "system/screen"
    await updateSensor(topic, name, false)
}

export async function updateMQTTMainFader(data: any) {
    //todo add checks
    const mixlist = ["line", "return", "fxreturn", "talkback", "aux", "fx", "main", "mono", "master"];

    for (let i = 0; i < mixlist.length; i++) {
        const type = mixlist[i].toUpperCase(); // Assuming keys in 'data' are uppercase

        if (data.hasOwnProperty(type)) {
            const channels = data[type];

            if (channels && Array.isArray(channels)) {
                for (let ch = 1; ch <= channels.length; ch++) {
                    const topic = `main/1/${mixlist[i]}/${ch}/fader/state`;
                    const value = channels[ch - 1].toFixed(1);
                    await updateSensor(topic, value, false);
                }
            }
        }
    }
}

export async function updateMQTTAuxFader(data){
    const names: string[] = data.name.split("/")
    const inputType: string = names[0]
    const inputChannel: string = names[1].slice(2)
    const mixType: string = names[2].replace(/\d/g, "");
    const mixChannel: string = names[2].replace(/[a-zA-Z]/g, "");
    const topic: string = `${mixType}/${mixChannel}/${inputType}/${inputChannel}/fader/state`;
    const value: string = (data.value * 100).toFixed(1)
    await updateSensor(topic, value, false)
}

export async function updateMQTTSolo(data){

    if (data.name.includes("ch")){
        const names: string[] = data.name.split("/")
        const inputChannel: string = names[1].slice(2)
        const inputType: string = names[0]
        const topic :string = `main/1/${inputType}/${inputChannel}/solo/state`
        await updateSensor(topic, data.value ? 'Soloed' : 'Unsoloed', false)
    }
}

export async function updateMQTTAuxMute(data: any){
    const names: string[] = data.name.split("/")
    const inputType: string = names[0]
    const inputChannel: string = names[1].slice(2)

    const mix: string = names[2].split("_")[1]
    const mixType: string = mix.replace(/\d/g, "");
    const mixChannel: string = mix.replace(/[a-zA-Z]/g, "");


    const topic: string = `${mixType}/${mixChannel}/${inputType}/${inputChannel}/mute/state`;
    await updateSensor(topic, data.value ? 'Unmuted' : 'Muted', false)
}

export async function updateMQTTMainMute(data: any){
    const names = data.name.split("/")
    const channel = names[1].slice(2)
    const topic :string = 'main/1/line/' + channel + '/mute/state'
    await updateSensor(topic, data.value ? 'Muted' : 'Unmuted', false)
}

export async function updateMQTTSelect(data: any): Promise<void> {
    const names = data.name.split("/");
    const name = names[0] + " " + names[1].slice(2);
    await updateSensor('system/selected_channel', name, false);
}

export async function updateMQTTScene(scene: string){
    await updateSensor("system/scene", scene);
}

export async function updateMQTTProject(project: string){
    await updateSensor("system/project", project);
}

export async function enableChannels(options: any) {
    await updateSensor('fx', options.fx ? 'Online' : 'Offline', true);
    await updateSensor('aux', options.aux ? 'Online' : 'Offline', true);
    await updateSensor('main', options.main ? 'Online' : 'Offline', true);
}

export async function publishDiscoveryData(discoveryPayload: any[]) {
    if (!mqttClient || !mqttClient.connected) {
        console.error('MQTT client is not connected. Cannot publish discovery data.');
        return;
    }

    const batchPayload: { topic: string; payload: string }[] = [];

    for (const device of discoveryPayload) {

        let node_id: string
        let object_id: string

        if (device.mixName == "system"){
            node_id = device.mixName;
            object_id = device.commandType;
        }else{
            node_id= `${device.mixName}_${device.input}`;
            object_id = `${device.commandType}_${device.index + 1}`;
        }

        let discoveryTopic: string = `${device.type}/${node_id}/${object_id}/config`;
        if (prefix) {
            discoveryTopic = `${prefix}/${discoveryTopic}`;
        }

        const configPayload: string = JSON.stringify(device.config);

        batchPayload.push({ topic: discoveryTopic, payload: configPayload });
    }

    for (const item of batchPayload) {
        try {
            await publishMQTT(item.topic, item.payload, { retain: true });
            console.log(`Published discovery config to ${item.topic}`);
            const publishDelay: number = mqttOptions.publishDelay;
            await new Promise(resolve => setTimeout(resolve, publishDelay));
        } catch (error) {
            console.error(`Error publishing to ${item.topic}:`, error);
            return error;
        }
    }

    return true;
}


export async function connectMQTT(mqttConfig: any): Promise<void> {
    if (!mqttConfig || !mqttConfig.url) {
        console.error("MQTT configuration is missing or invalid.");
        return;
    }

    mqttOptions = mqttConfig;

    setDiscoveryHeader(mqttOptions.model)
    setSystemHeader(mqttOptions.model)

    const options: mqtt.IClientOptions = {
        clientId: mqttConfig.clientId || `mqttjs_${Math.random().toString(16).substr(2, 8)}`,
        username: mqttConfig.username,
        password: mqttConfig.password,
        clean: true,
        connectTimeout: mqttConfig.connectTimeout || 4000,
        reconnectPeriod: mqttConfig.reconnectPeriod || 1000,
    };

    prefix = mqttConfig.prefix;

    return new Promise((resolve, reject) => {
        mqttClient = mqtt.connect(mqttConfig.url, options);

        mqttClient.on('connect', () => {
            console.log('Connected to MQTT broker');
            resolve();
        });

        mqttClient.on('error', (err) => {
            console.error('MQTT connection error:', err);
            reject(err);
        });

        mqttClient.on('offline', () => {
            console.log('MQTT client offline');
        });
    });
}

export async function updateSensor(location: string, message: string, retain: boolean = false): Promise<void> {
    const topic = `presonus/${mqttOptions.model}/${location}`;
    await publishMQTT(topic, message, retain);
    console.log(`Published to ${topic}: ${message} (retain: ${retain})\n`);
}

async function publishMQTT(topic: string, message: string, retain: boolean = false): Promise<void> {
    if (mqttClient && mqttClient.connected) {
        return new Promise((resolve, reject) => {
            mqttClient!.publish(topic, message, { qos: 0, retain: retain }, (err) => {
                if (err) {
                    console.error('Failed to publish message:', err);
                    reject(err);
                } else {
                    //console.log(`Published to ${topic}: ${message} (retain: ${retain})\n`);
                    resolve();
                }
            });
        });
    } else {
        console.error('MQTT client is not connected.');
        throw new Error('MQTT client not connected');
    }
}

export function subscribeMQTT(topic: string, messageCallback: (topic: string, message: Buffer) => void): void {
    if (mqttClient && mqttClient.connected) {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error(`Failed to subscribe to ${topic}:`, err);
            } else {
                console.log(`Subscribed to ${topic}`);
            }
        });

        mqttClient.on('message', messageCallback);
    } else {
        console.error('MQTT client is not connected. Cannot subscribe.');
    }
}

export async function MQTTEvent(topic: string, message: Buffer){
    if (topic.includes("command")){
        console.log("topic : " + topic + " Updated to : " + message);

        if (topic.includes("mute")) {
            await updatePresonusMute(topic, message.toString('utf-8'));
        }
        else if (topic.includes("fader")) {
            await updatePresonusFader(topic, message.toString('utf-8'))
        }
        else if (topic.includes("solo")) {
            await updatePresonusSolo(topic, message.toString('utf-8'))
        }
        else if (topic.includes("color")) {
            await updatePresonusColor(topic, message.toString('utf-8'))
        }
        else if (topic.includes("link")) {
            await updatePresonusLink(topic, message.toString('utf-8'))
        }
        else if (topic.includes("pan")) {
            await updatePresonusPan(topic, message.toString('utf-8'))
        }
    }
}

// Example function to disconnect
export function disconnectMQTT(): void {
    if (mqttClient) {
        mqttClient.end();
        mqttClient = null;
        console.log('Disconnected from MQTT broker');
    }
}

