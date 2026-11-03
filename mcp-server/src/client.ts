import { randomUUID } from "crypto";

export interface OmniaClientConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface InferenceParams {
  prompt: string;
  seedImage?: string; // URL, Base64, or Data URI
  strength?: number;  // 0.1 to 1.0
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  model?: string;
}

export interface MattingParams {
  imageUrl: string;
  outputFormat?: "PNG" | "WEBP";
}

export interface StagingParams {
  productImageUrl: string;
  sceneDescription: string;
  environmentPreset?: "marble" | "nordic" | "botanical" | "cyber" | "luxury_studio";
  aspectRatio?: "1:1" | "4:5" | "16:9" | "9:16";
  strength?: number;
}

export interface GenerationResult {
  imageUrl: string;
  taskUUID: string;
  latencySeconds: number;
  model: string;
  dimensions: { width: number; height: number };
}

export class OmniaClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: OmniaClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.RUNWARE_API_KEY || "";
    this.baseUrl = config.baseUrl || "https://api.runware.ai/v1";
    this.timeoutMs = config.timeoutMs || 30000;

    if (!this.apiKey) {
      console.warn(
        "[omnia-media-mcp] Warning: No RUNWARE_API_KEY provided. Tool calls requiring inference will prompt for a key."
      );
    }
  }

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public hasKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length >= 20);
  }

  /**
   * Universal diffusion text2img or img2img via Runware edge
   */
  public async generateImage(params: InferenceParams): Promise<GenerationResult> {
    if (!this.hasKey()) {
      throw new Error(
        "RUNWARE_API_KEY missing. Please set RUNWARE_API_KEY environment variable or pass an API key."
      );
    }

    const t0 = Date.now();
    const taskUUID = randomUUID();
    const width = params.width || 1024;
    const height = params.height || 1024;
    const model = params.model || "runware:100@1"; // FLUX.1 Schnell default

    const taskPayload: Record<string, any> = {
      taskType: "imageInference",
      taskUUID,
      positivePrompt: params.prompt,
      model,
      width,
      height,
      steps: params.steps || 4,
      CFGScale: params.cfgScale || 1.5,
      numberResults: 1
    };

    if (params.seedImage) {
      taskPayload.seedImage = params.seedImage;
      taskPayload.strength = params.strength ?? 0.75;
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify([taskPayload]),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const message =
        (errBody as any)?.errors?.[0]?.message ||
        `Inference failed with HTTP status ${response.status}`;
      throw new Error(message);
    }

    const data = (await response.json()) as any;
    const resultUrl = data.data?.[0]?.imageURL;

    if (!resultUrl) {
      throw new Error("No imageURL returned from inference provider.");
    }

    const latencySeconds = parseFloat(((Date.now() - t0) / 1000).toFixed(2));

    return {
      imageUrl: resultUrl,
      taskUUID,
      latencySeconds,
      model,
      dimensions: { width, height }
    };
  }

  /**
   * High-precision background removal (Alpha Matting)
   */
  public async removeBackground(params: MattingParams): Promise<{ imageUrl: string; latencySeconds: number }> {
    if (!this.hasKey()) {
      throw new Error("RUNWARE_API_KEY missing for background removal task.");
    }

    const t0 = Date.now();
    const taskUUID = randomUUID();

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify([
        {
          taskType: "imageBackgroundRemoval",
          taskUUID,
          inputImage: params.imageUrl,
          outputFormat: params.outputFormat || "PNG"
        }
      ]),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error((errBody as any)?.errors?.[0]?.message || `Matting failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as any;
    const resultUrl = data.data?.[0]?.imageURL;

    if (!resultUrl) {
      throw new Error("No imageURL returned from background removal task.");
    }

    const latencySeconds = parseFloat(((Date.now() - t0) / 1000).toFixed(2));
    return { imageUrl: resultUrl, latencySeconds };
  }

  /**
   * Automated e-commerce product staging pipeline
   */
  public async stageProduct(params: StagingParams): Promise<GenerationResult> {
    const presetPrompts: Record<string, string> = {
      marble: "Luxury white Italian Carrara marble vanity, soft morning directional sunlight, elegant shallow depth of field, high-end cosmetic editorial shoot, 8k",
      nordic: "Nordic natural oak wood kitchen table, warm ambient morning light, organic minimalist Scandinavian interior, studio product lighting, 8k",
      botanical: "Lush tropical greenhouse botanical garden, dewy river stones, soft dappled natural sunlight, organic spa aesthetic, ultra photorealistic commercial",
      cyber: "Futuristic dark studio, reflective matte black pedestal, subtle neon cyan and magenta edge rim lighting, luxury tech cinematic product shot",
      luxury_studio: "Commercial product photography studio, seamless gradient infinity backdrop, crisp softbox diffuser lighting, floor reflection, 8k uhd"
    };

    const ratioDimensions: Record<string, { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "4:5": { width: 832, height: 1024 },
      "16:9": { width: 1024, height: 576 },
      "9:16": { width: 576, height: 1024 }
    };

    const dims = ratioDimensions[params.aspectRatio || "1:1"] || { width: 1024, height: 1024 };
    const baseScene = params.environmentPreset ? presetPrompts[params.environmentPreset] || "" : "";
    const finalPrompt = [params.sceneDescription, baseScene, "commercial product photography, sharp focus, 8k uhd"]
      .filter(Boolean)
      .join(", ");

    return this.generateImage({
      prompt: finalPrompt,
      seedImage: params.productImageUrl,
      strength: params.strength ?? 0.70,
      width: dims.width,
      height: dims.height,
      steps: 4,
      cfgScale: 1.5
    });
  }
}
