import {publishLayout} from "./interfaces"
const manufacturer: string = "presonus"

function getLastAction(): publishLayout{
    return {
        type: "sensor",
        mixName: "system",
        commandType: "last_action",
        config: {
            unique_id: "system/last_action",
            state_topic: "system/last_action/state",
            name: "Last Action",
            icon: "mdi:history",
            availability_topic: `presonus/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: "My Model"
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
            state_topic: "system/scene/state",
            name: "Current Scene",
            icon: "mdi:movie-roll",
            availability_topic: `presonus/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: "My Model"
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
            state_topic: "system/project/state",
            name: "Current Project",
            icon: "mdi:folder",
            availability_topic: `presonus/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: "My Model"
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
            state_topic: "system/selected_channel/state",
            name: "Current Scene",
            icon: "mdi:target",
            availability_topic: `presonus/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: "My Model"
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
            state_topic: "system/status/state",
            name: "Current Scene",
            icon: "mdi:information",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: "My Model"
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
            state_topic: "system/screen/state",
            name: "Current Scene",
            icon: "mdi:overscan",
            availability_topic: `presonus/system`,
            payload_available: "Online",
            payload_not_available: "Offline",
            device: {
                name: "System",
                identifiers: ["system"],
                manufacturer: manufacturer,
                model: "My Model"
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

    return json_data;
}