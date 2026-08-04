export interface Config {
    /** Z.AI API key (required) */
    apiKey: string;
    /** API base URL */
    baseUrl: string;
    /** Default model to use */
    defaultModel: SupportedModel;
    /** Default image size */
    defaultSize: string;
    /** Request timeout in milliseconds */
    timeout: number;
    /** Maximum retry attempts */
    maxRetries: number;
    /** Initial retry delay in milliseconds */
    retryDelay: number;
}
/**
 * Validates that a model name is supported.
 */
export declare const SUPPORTED_MODELS: readonly ["glm-image", "cogview-4-250304"];
export type SupportedModel = typeof SUPPORTED_MODELS[number];
export declare function isSupportedModel(model: string): model is SupportedModel;
/**
 * Load configuration from environment variables.
 * @throws Error if required configuration is missing or invalid
 */
export declare function loadConfig(): Config;
/**
 * Model capabilities and constraints.
 */
export declare const MODEL_CONFIGS: Record<SupportedModel, {
    displayName: string;
    description: string;
    supportsAsync: boolean;
    minSize: number;
    maxSize: number;
    sizeDivisor: number;
    maxPixels: number;
    recommendedSizes: string[];
    defaultQuality: 'hd' | 'standard';
    supportedQualities: ('hd' | 'standard')[];
}>;
/**
 * Video generation model codes.
 */
export declare const VIDEO_SUPPORTED_MODELS: readonly ["cogvideox-3", "viduq1-text", "viduq1-image", "viduq1-start-end", "vidu2-image", "vidu2-start-end", "vidu2-reference"];
export type VideoSupportedModel = typeof VIDEO_SUPPORTED_MODELS[number];
/**
 * Video model categories for easier selection.
 */
export declare const VIDEO_MODEL_CATEGORIES: {
    textToVideo: readonly ["viduq1-text"];
    imageToVideo: readonly ["cogvideox-3", "viduq1-image", "vidu2-image"];
    startEndFrame: readonly ["cogvideox-3", "viduq1-start-end", "vidu2-start-end"];
    reference: readonly ["vidu2-reference"];
};
export declare function isVideoSupportedModel(model: string): model is VideoSupportedModel;
/**
 * Video model capabilities and constraints.
 */
export declare const VIDEO_MODEL_CONFIGS: Record<VideoSupportedModel, {
    displayName: string;
    description: string;
    category: 'text-to-video' | 'image-to-video' | 'start-end-frame' | 'reference';
    duration: number[];
    resolutions: string[];
    aspectRatios?: string[];
    supportsAudio: boolean;
    supportsFps: boolean;
    supportsStyle: boolean;
    supportsMovementAmplitude: boolean;
    maxPromptLength: number;
    priceUsd: number;
}>;
//# sourceMappingURL=config.d.ts.map