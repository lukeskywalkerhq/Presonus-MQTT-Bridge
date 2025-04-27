export function getChannelType(channelType: string): string | undefined {
    switch (channelType.toLowerCase()) {
        case "line":
        case "fxreturn":
        case "talkback":
        case "return":
            return "input";
        case "aux":
        case "fx":
        case "main":
            return "mix";
        case "sub":
            return "none"
        default:
            console.warn(`Unknown channel type: ${channelType}`);
            return undefined; // Or you could return a default group
    }
}
export function getSupportedFeatures(mix: string): string[] | undefined {
    const lowerMix = mix.toLowerCase();
    if (lowerMix === "main") {
        return [
            'line',
            'return',
            'fxreturn',
            'talkback',
            'solo',
            'color'
        ];
    } else if (lowerMix === "aux") {
        return [
            'line',
            'return',
            'fxreturn',
            'talkback',
        ];
    } else if (lowerMix === "fx") {
        return [
            'line',
            'return',
            'talkback',
        ];
    }
    // If 'mix' doesn't match any of the above, explicitly return undefined
    return undefined;
}
export function getSpecialInputConfig(inputType: string): Record<string, any> | undefined {
    switch (inputType.toLowerCase()) {
        case "line":
            return {
                "icon": "mdi:audio-input-line",
                // Add any other specific properties for 'line' inputs here
            };
        case "return":
            return {
                "icon": "mdi:import",
                // Add any other specific properties for 'return' inputs here
            };
        case "fxreturn":
            return {
                "icon": "mdi:audio-output-variant", // Or a more specific FX icon
                // Add any other specific properties for 'fxreturn' inputs here
            };
        case "talkback":
            return {
                "icon": "mdi:microphone",
                // Add any other specific properties for 'talkback' inputs here
            };
        default:
            return undefined; // Return undefined if the inputType is not one of the special cases
    }
}