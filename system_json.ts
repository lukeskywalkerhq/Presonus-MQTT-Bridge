import {publishLayout} from "./interfaces"
const manufacturer: string = "presonus"
let header: string = "presonus/generic"
let model: string = "generic"

export function setSystemHeader(newModel: string){
    header = `presonus/${newModel}`;
    model = newModel;
}

function getLastAction(): publishLayout{
    return {
        type: "sensor",
        mixName: "system",
        commandType: "last_action",
        config: {
            unique_id: "system/last_action",
            state_topic: `${header}/system/last_action`,
            name: "Last Action",
            icon: "mdi:history",
            availability_topic: `${header}/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: model
            }
        }
    };
}

function getScene(){
    return {
        type: "sensor",
        mixName: "system",
        commandType: "current_scene",
        config: {
            unique_id: "system/scene",
            state_topic: `${header}/system/scene`,
            name: "Current Scene",
            icon: "mdi:movie-roll",
            availability_topic: `${header}/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: model
            }
        }
    };
}

function getProject(){
    return {
        type: "sensor",
        mixName: "system",
        commandType: "current_project",
        config: {
            unique_id: "system/project",
            state_topic: `${header}/system/project`,
            name: "Current Project",
            icon: "mdi:folder",
            availability_topic: `${header}/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: model
            }
        }
    };
}

function getSelectedChannel(){
    return {
        type: "sensor",
        mixName: "system",
        commandType: "selected_channel",
        config: {
            unique_id: "system/selected_channel",
            state_topic: `${header}/system/selected_channel`,
            name: "Selected Channel",
            icon: "mdi:target",
            availability_topic: `${header}/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: model
            }
        }
    };
}

function getStatus(){
    return {
        type: "sensor",
        mixName: "system",
        commandType: "status",
        config: {
            unique_id: "system/status",
            state_topic: `${header}/system/status`,
            name: "Status",
            icon: "mdi:information",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: model
            }
        }
    };
}

function getScreen(){
    return {
        type: "sensor",
        mixName: "system",
        commandType: "screen",
        config: {
            unique_id: "system/screen",
            state_topic: `${header}/system/screen`,
            name: "Current Screen",
            icon: "mdi:overscan",
            availability_topic: `${header}/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: model
            }
        }
    };
}

function getPeak(){
    return {
        type: "sensor",
        mixName: "system",
        commandType: "peak",
        config: {
            unique_id: "system/peak",
            state_topic: `${header}/system/peak`,
            name: "Last Channel Peak",
            icon: "mdi:alert",
            availability_topic: `${header}/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: model
            }
        }
    };
}

export function getSystemJson(){
    //need to return last action, scene, project, selected channel, status, screen
    //json data for publish needs to be in this publish layout interface
    // json data needs to be in homeassistant entity config

    let json_data: publishLayout[] = []

    json_data.push(getLastAction())
    json_data.push(getScene())
    json_data.push(getProject())
    json_data.push(getSelectedChannel())
    json_data.push(getStatus())
    json_data.push(getScreen())
    json_data.push(getPeak())

    return json_data;
}