export function getMixInputs(mix: string): string[] {
    if (mix == "main" || mix == "aux") {
        return ["line", "return", "fxreturn", "talkback"]
    }
    else if (mix == "fx"){
        return ["line", "return"]
    }
}

export function getMixFeatures(mix: string) {
    if (mix == "main") {
        return{
            mute: true,
            fader: true,
            solo: true,
            pan: true,
            link: true,
            color: true
        }
    }
    //todo check if you can pan in aux
    else if (mix == "aux" || mix == "fx") {
        return{
            mute: true,
            fader: true,
            pan: true
        }
    }
}

export function getInputFeatures(input: string): string[] {
    if (input == "line") {
        return ["mute", "fader", "solo", "pan", "link", "color"]
    }
    else if (input == "return") {
        return ["mute", "fader", "solo", "color"]
    }
    else if (input == "fxreturn") {
        return ["mute", "fader"]
    }
    else if (input == "talkback") {
        return ["mute", "fader"]
    }
}