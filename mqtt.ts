import * as mqtt from 'mqtt';
import {updatePresonusMute} from "./presonus";

let mqttClient: mqtt.MqttClient | null = null;
let mqttStatus = "disconnected";

let prefix:string = null;

export async function updatePeak(data:any ){
    const names = data.name.split("/")
    const type = names[0]
    const ch = names[1].slice(2)
    const value = type + " " + ch
    const topic = "system/peak"
    await updateSensor(topic, value, false)
}

export async function updateLastAction(data: any){
    const name = data.name
    const topic = "system/last_action"
    await updateSensor(topic, name, false)
}

export async function updateScreen(data: any){
    const name = data.split("/")[1]
    const topic = "system/screen"
    await updateSensor(topic, name, false)
}

export async function updateMainFader(data: any) {
    //todo add checks
    const mixlist = ["line", "return", "fxreturn", "talkback", "aux", "fx", "main", "mono", "master"];

    for (let i = 0; i < mixlist.length; i++) {
        const type = mixlist[i].toUpperCase(); // Assuming keys in 'data' are uppercase

        if (data.hasOwnProperty(type)) {
            const channels = data[type];

            if (channels && Array.isArray(channels)) {
                for (let ch = 1; ch <= channels.length; ch++) {
                    const topic = `main1/${mixlist[i]}/${ch}/level/state`;
                    const value = (channels[ch - 1] * 100).toFixed(1);
                    await updateSensor(topic, value, false);
                }
            }
        }
    }
}

export async function updateAuxFader(data){
    const names = data.name.split("/")
    const type = names[0]
    const channel = names[1].slice(2)
    const mix = names[2]
    const topic = mix + '/' +  type + '/' + channel + '/level/state'
    const value = (data.value * 100).toFixed(1)
    await updateSensor(topic, value, false)
}

export async function updateSolo(data){
    //todo add masters and returns
    // fx and fxreturns dont have solo
    //todo check for options to see if enabled
    const names = data.name.split("/")
    const channel = names[1].slice(2)
    const topic :string = 'main1/solo/' + channel + '/solo/state'
    await updateSensor(topic, data.value ? 'Soloed' : 'Unsoloed', false)
}

export async function updateAuxMute(data: any){
    //todo add check
    const names = data.name.split("/")
    const channel = names[1].slice(2)
    const mix = names[2].split("_")[1]
    const topic :string = mix + '/line/' + channel + '/mute/state'
    await updateSensor(topic, data.value ? 'Muted' : 'Unmuted', false)
}

export async function updateMainMute(data: any){
    //todo check for options to see if enabled
    const names = data.name.split("/")
    const channel = names[1].slice(2)
    const topic :string = 'main1/line/' + channel + '/mute/state'
    await updateSensor(topic, data.value ? 'Muted' : 'Unmuted', false)
    //todo add check to see if muted on all other mixes
}

export async function updateSelect(data: any): Promise<void> {
    const names = data.name.split("/");
    const name = names[0] + " " + names[1].slice(2);
    await updateSensor('system/selected_channel', name, false);
}

export async function updateScene(scene: string){
    await updateSensor("system/scene", scene);
}

export async function updateProject(project: string){
    await updateSensor("system/project", project);
}

export async function sync(channels, options): Promise<boolean> {
    //todo get state of board and push to mqtt
}

export async function enableChannels(options: any) {
    await updateSensor('fx', options.fx ? 'Online' : 'Offline', true);
    await updateSensor('aux', options.aux ? 'Online' : 'Offline', true);
    await updateSensor('main', options.main ? 'Online' : 'Offline', true);
}

export function getMQTTStatus(): string {
    return mqttStatus;
}

export async function publishDiscoveryData(discoveryPayload: any) {
    if (!mqttClient || !mqttClient.connected) {
        console.error('MQTT client is not connected. Cannot publish discovery data.');
        return;
    }

    const batchPayload: { topic: string; payload: string }[] = [];

    for (const deviceGroup of discoveryPayload.device_groups) {
        const groupName = deviceGroup.name.toLowerCase().replace(/ /g, '_');

        for (const device of deviceGroup.devices) {
            //const jsonString = JSON.stringify(device, null, 2);
            console.log("Published Config for " + device.config.name);

            const component = device.type;
            const config = device.config;
            const objectId = config.unique_id;
            const nodeId = groupName;

            let discoveryTopic = `${component}/${nodeId}/${objectId}/config`;
            if (prefix) {
                discoveryTopic = `${prefix}/${discoveryTopic}`;
            }

            const configPayload = JSON.stringify(config);

            batchPayload.push({ topic: discoveryTopic, payload: configPayload });
        }
    }

    // Publish the entire batch with a single delay
    const publishDelay = 1000; // Adjust this delay as needed
    await new Promise(resolve => setTimeout(resolve, publishDelay));

    for (const item of batchPayload) {
        try {
            await publishMQTT(item.topic, item.payload, {retain: true});
            console.log(`Published discovery config to ${item.topic}`);
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
        mqttStatus = "error";
        return;
    }

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
            mqttStatus = "connected";
            resolve();
        });

        mqttClient.on('error', (err) => {
            console.error('MQTT connection error:', err);
            mqttStatus = "error";
            reject(err);
        });

        mqttClient.on('offline', () => {
            console.log('MQTT client offline');
            mqttStatus = "offline";
        });
    });
}

export async function updateSensor(location: string, message: string, retain: boolean = false): Promise<void> {
    const topic = "presonus/" + location;
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
    console.log("topic : " + topic + " Updated to : " + message);
    if (topic.includes("mute") && topic.includes("set")) {
        await updatePresonusMute(topic, message.toString('utf-8'));
    }
}

// Example function to disconnect
export function disconnectMQTT(): void {
    if (mqttClient) {
        mqttClient.end();
        mqttClient = null;
        mqttStatus = "disconnected";
        console.log('Disconnected from MQTT broker');
    }
}