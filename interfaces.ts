export interface mainLayout {
    id: string;
    value: string;
}

export interface publishLayout{
    type: string;
    mixName: string;
    input?: string;
    commandType: string;
    index?: number;
    config: HomeAssistantEntityConfig
}

export interface HomeAssistantEntityConfig {
    name?: string;
    unique_id: string;
    state_topic: string;
    availability_topic?: string;
    payload_available?: string;
    payload_not_available?: string;
    device?: {
        identifiers?: string[];
        name?: string;
        manufacturer?: string;
        model?: string;
        sw_version?: string;
        hw_version?: string;
        via_device?: string;
    };
    icon?: string;
    entity_category?: 'config' | 'diagnostic';
    unit_of_measurement?: string;
    value_template?: string;
    json_attributes_topic?: string;
    json_attributes_template?: string;
    object_id?: string;
    force_update?: boolean;
    optimistic?: boolean;
    qos?: 0 | 1 | 2;
    retain?: boolean;
    encoding?: string;
    entity_picture?: string;
    expire_after?: number;
    enabled_by_default?: boolean;
    original_name?: string;
    original_device_class?: string;
    has_entity_name?: boolean;
    device_automation?: any; // You might want a more specific type here later
    entity_namespace?: string;
    suggested_display_precision?: number; // For numeric entities
    command_topic?: string; // Common for controllable entities
}

export interface RgbLightConfig extends HomeAssistantEntityConfig {
    component: 'light';
    brightness?: boolean;
    brightness_state_topic?: string;
    brightness_command_topic?: string;
    brightness_value_template?: string;
    color_mode?: boolean;
    supported_color_modes?: ('rgb' | 'color_temp' | 'hs')[];
    rgb?: boolean;
    rgb_state_topic?: string;
    rgb_command_topic?: string;
    rgb_value_template?: string;
    effect?: boolean;
    effect_state_topic?: string;
    effect_command_topic?: string;
    effect_value_template?: string;
    white_value?: boolean;
    white_value_state_topic?: string;
    white_value_command_topic?: string;
    white_value_template?: string;
    xy?: boolean;
    xy_state_topic?: string;
    xy_command_topic?: string;
    xy_value_template?: string;
    color_temp?: boolean;
    color_temp_state_topic?: string;
    color_temp_command_topic?: string;
    color_temp_value_template?: string;
    hs?: boolean;
    hs_state_topic?: string;
    hs_command_topic?: string;
    hs_value_template?: string;
    on_command_type?: 'last' | 'brightness' | 'color';
    payload_on?: string;
    payload_off?: string;
}

export interface SensorConfig extends HomeAssistantEntityConfig {
    component: 'sensor';
    device_class?: 'battery' | 'carbon_dioxide' | 'carbon_monoxide' | 'current' | 'date' | 'device_temperature' | 'dew_point' | 'energy' | 'humidity' | 'illuminance' | 'power' | 'pressure' | 'signal_strength' | 'temperature' | 'timestamp' | 'voltage' | 'weight' | 'wind_speed' | 'wind_bearing' | 'precipitation' | 'precipitation_probability';
    state_class?: 'measurement' | 'total' | 'total_increasing';
    last_reset?: string; // For sensors with total increasing
}

export interface NumberConfig extends HomeAssistantEntityConfig {
    component: 'number';
    min?: number;
    max?: number;
    step?: number;
    mode?: 'auto' | 'box' | 'slider';
    command_template?: string;
}

export interface SwitchConfig extends HomeAssistantEntityConfig {
    component: 'switch';
    payload_on?: string;
    payload_off?: string;
    state_on?: string | number | boolean;
    state_off?: string | number | boolean;
    assumed_state?: boolean;
}

export interface configuration{
    mixes: mixGroup[]
    meters: meterGroup
    masters: mixGroup
}

export interface meterGroup{
    name: string;
    features: inputControl[],
    enabled: boolean,
}

export interface mixGroup{
    name: string;
    size: number;
    supported_inputs?: string[];
    supported_controls?: any;
    enabled?: boolean,
    features: inputControl[]
}

export interface inputControl {
    name: string;
    size: number;
    type: string;
    enabled?: boolean;
}