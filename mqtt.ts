import * as mqtt from 'mqtt';

let mqttClient: mqtt.MqttClient | null = null;
let mqttStatus = "disconnected";

let prefix:string = null;

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

// Example function to publish a message
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

// Example function to subscribe to a topic
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

// Example function to disconnect
export function disconnectMQTT(): void {
    if (mqttClient) {
        mqttClient.end();
        mqttClient = null;
        mqttStatus = "disconnected";
        console.log('Disconnected from MQTT broker');
    }
}