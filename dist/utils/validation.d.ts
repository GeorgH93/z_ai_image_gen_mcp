/**
 * Validation utilities for Z.AI image generation parameters.
 */
import { type SupportedModel } from '../config.js';
/**
 * Parse a size string into width and height.
 */
export declare function parseSize(size: string): {
    width: number;
    height: number;
} | null;
/**
 * Validate image size for a specific model.
 * @throws ZaiValidationError if size is invalid
 */
export declare function validateSize(size: string, model: SupportedModel): void;
/**
 * Validate quality parameter for a specific model.
 * @throws ZaiValidationError if quality is invalid
 */
export declare function validateQuality(quality: string, model: SupportedModel): void;
/**
 * Validate user_id parameter.
 * @throws ZaiValidationError if user_id is invalid
 */
export declare function validateUserId(userId: string): void;
/**
 * Validate prompt parameter.
 * @throws ZaiValidationError if prompt is invalid
 */
export declare function validatePrompt(prompt: string): void;
/**
 * Get recommended sizes for a model.
 */
export declare function getRecommendedSizes(model: SupportedModel): string[];
/**
 * Check if a size is a recommended size for a model.
 */
export declare function isRecommendedSize(size: string, model: SupportedModel): boolean;
/**
 * Format size validation error with suggestions.
 */
export declare function formatSizeError(size: string, model: SupportedModel): string;
import { type VideoSupportedModel } from '../config.js';
/**
 * Validate video prompt.
 * @throws ZaiValidationError if prompt is invalid
 */
export declare function validateVideoPrompt(prompt: string, model: VideoSupportedModel): void;
/**
 * Validate video resolution for a specific model.
 * @throws ZaiValidationError if resolution is invalid
 */
export declare function validateVideoResolution(resolution: string, model: VideoSupportedModel): void;
/**
 * Validate video duration for a specific model.
 * @throws ZaiValidationError if duration is invalid
 */
export declare function validateVideoDuration(duration: number, model: VideoSupportedModel): void;
/**
 * Validate video aspect ratio for models that support it.
 * @throws ZaiValidationError if aspect ratio is invalid
 */
export declare function validateVideoAspectRatio(aspectRatio: string, model: VideoSupportedModel): void;
/**
 * Validate movement amplitude for models that support it.
 * @throws ZaiValidationError if movement amplitude is invalid
 */
export declare function validateMovementAmplitude(amplitude: string): void;
/**
 * Validate style for models that support it.
 * @throws ZaiValidationError if style is invalid
 */
export declare function validateVideoStyle(style: string): void;
/**
 * Validate image URL(s) for video generation.
 * @throws ZaiValidationError if image URL is invalid
 */
export declare function validateVideoImageUrl(imageUrl: string | string[], model: VideoSupportedModel): void;
/**
 * Validate FPS for models that support it.
 * @throws ZaiValidationError if FPS is invalid
 */
export declare function validateVideoFps(fps: number): void;
/**
 * Validate quality for CogVideoX-3.
 * @throws ZaiValidationError if quality is invalid
 */
export declare function validateVideoQuality(quality: string): void;
//# sourceMappingURL=validation.d.ts.map