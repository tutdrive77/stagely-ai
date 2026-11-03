#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { OmniaClient } from "./client.js";

// Initialize client
const client = new OmniaClient();

// Create MCP server instance
const server = new Server(
  {
    name: "omnia-media-mcp",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {},
      prompts: {}
    }
  }
);

/**
 * Available MCP Tools exposed to Claude / Cursor
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_image",
        description:
          "Generate high-fidelity photorealistic images using FLUX.1 diffusion models on the Runware edge cluster in ~1.5 to 2.5 seconds.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Detailed descriptive visual prompt for diffusion synthesis."
            },
            aspect_ratio: {
              type: "string",
              enum: ["1:1", "4:5", "16:9", "9:16"],
              description: "Image aspect ratio. Defaults to 1:1."
            },
            steps: {
              type: "number",
              description: "Inference step count (e.g. 4 for Schnell, 25 for Dev). Defaults to 4."
            },
            model: {
              type: "string",
              description: "Target model ID. Defaults to 'runware:100@1' (FLUX.1 Schnell)."
            }
          },
          required: ["prompt"]
        }
      },
      {
        name: "recreate_from_seed",
        description:
          "Recreate or transform an existing image using an image-to-image diffusion pipeline with controllable strength.",
        inputSchema: {
          type: "object",
          properties: {
            seed_image: {
              type: "string",
              description: "Public HTTP/HTTPS URL, Base64 string, or Data URI of the starting image."
            },
            prompt: {
              type: "string",
              description: "Description of the target aesthetic, lighting, environment, or alterations."
            },
            strength: {
              type: "number",
              minimum: 0.1,
              maximum: 1.0,
              description:
                "Transformation intensity (0.35 preserves close details, 0.75 is balanced, 0.90 is radical reimagining). Defaults to 0.75."
            },
            aspect_ratio: {
              type: "string",
              enum: ["1:1", "4:5", "16:9", "9:16"],
              description: "Output aspect ratio."
            }
          },
          required: ["seed_image", "prompt"]
        }
      },
      {
        name: "remove_background",
        description:
          "Execute sub-second alpha matting (BiRefNet/U-2-Net) on a product photo to produce a clean, transparent PNG cutout.",
        inputSchema: {
          type: "object",
          properties: {
            image_url: {
              type: "string",
              description: "Public HTTP/HTTPS URL of the product or subject to isolate."
            },
            output_format: {
              type: "string",
              enum: ["PNG", "WEBP"],
              description: "Output file format. Defaults to PNG."
            }
          },
          required: ["image_url"]
        }
      },
      {
        name: "stage_product",
        description:
          "End-to-end automated e-commerce staging: places a raw product image into a photorealistic commercial advertising scene (marble, nordic, botanical, cyber, or custom).",
        inputSchema: {
          type: "object",
          properties: {
            product_image_url: {
              type: "string",
              description: "URL or Data URI of the product image."
            },
            scene_description: {
              type: "string",
              description: "Fine-tune scene description (e.g. 'Morning sunlight with water droplets and tropical ferns')."
            },
            preset: {
              type: "string",
              enum: ["marble", "nordic", "botanical", "cyber", "luxury_studio"],
              description: "Commercial lighting and backdrop preset."
            },
            aspect_ratio: {
              type: "string",
              enum: ["1:1", "4:5", "16:9", "9:16"],
              description: "Target platform format (1:1 Shopify, 4:5 Instagram, 16:9 Web Banner, 9:16 Stories)."
            },
            strength: {
              type: "number",
              description: "Product preservation vs background regeneration ratio (defaults to 0.70)."
            }
          },
          required: ["product_image_url", "scene_description"]
        }
      },
      {
        name: "batch_render_catalog",
        description:
          "Batch process multiple product images across a list of prompts or presets for automated merchandising catalogs.",
        inputSchema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  product_url: { type: "string" },
                  scene_prompt: { type: "string" }
                },
                required: ["product_url", "scene_prompt"]
              },
              description: "List of items to stage in parallel."
            }
          },
          required: ["items"]
        }
      }
    ]
  };
});

/**
 * Pre-baked Prompt Templates for Claude
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "commercial_campaign_generator",
        description: "Creates a full 4-asset multi-channel advertising campaign from a single product image.",
        arguments: [
          {
            name: "product_url",
            description: "Direct URL of the product photo",
            required: true
          },
          {
            name: "brand_niche",
            description: "E.g. Luxury Skincare, Streetwear, Minimalist Tech, Organic Food",
            required: true
          }
        ]
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "commercial_campaign_generator") {
    const productUrl = request.params.arguments?.product_url || "";
    const brandNiche = request.params.arguments?.brand_niche || "Luxury Commercial";

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please generate a cohesive 4-asset commercial visual campaign for this ${brandNiche} product: ${productUrl}. 
Execute the stage_product tool for each of these 4 setups:
1. Studio Hero Shot (1:1 Aspect Ratio)
2. Editorial Instagram Post (4:5 Aspect Ratio)
3. Website Hero Banner (16:9 Aspect Ratio)
4. Vertical Story / TikTok Ad (9:16 Aspect Ratio)

Ensure each asset features realistic lighting, contact shadows, and luxury styling suitable for ${brandNiche}.`
          }
        }
      ]
    };
  }
  throw new Error(`Prompt '${request.params.name}' not found.`);
});

/**
 * Handle Tool Invocations
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "generate_image": {
        const prompt = String(args?.prompt || "");
        const ratio = (args?.aspect_ratio as "1:1" | "4:5" | "16:9" | "9:16") || "1:1";
        const steps = Number(args?.steps) || 4;
        const model = args?.model ? String(args.model) : undefined;

        const ratioDims: Record<string, { width: number; height: number }> = {
          "1:1": { width: 1024, height: 1024 },
          "4:5": { width: 832, height: 1024 },
          "16:9": { width: 1024, height: 576 },
          "9:16": { width: 576, height: 1024 }
        };
        const dims = ratioDims[ratio] || { width: 1024, height: 1024 };

        const result = await client.generateImage({
          prompt,
          width: dims.width,
          height: dims.height,
          steps,
          model
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  imageUrl: result.imageUrl,
                  latency: `${result.latencySeconds}s`,
                  model: result.model,
                  dimensions: `${dims.width}x${dims.height}`
                },
                null,
                2
              )
            }
          ]
        };
      }

      case "recreate_from_seed": {
        const seedImage = String(args?.seed_image || "");
        const prompt = String(args?.prompt || "");
        const strength = Number(args?.strength) || 0.75;
        const ratio = (args?.aspect_ratio as "1:1" | "4:5" | "16:9" | "9:16") || "1:1";

        const ratioDims: Record<string, { width: number; height: number }> = {
          "1:1": { width: 1024, height: 1024 },
          "4:5": { width: 832, height: 1024 },
          "16:9": { width: 1024, height: 576 },
          "9:16": { width: 576, height: 1024 }
        };
        const dims = ratioDims[ratio] || { width: 1024, height: 1024 };

        const result = await client.generateImage({
          prompt,
          seedImage,
          strength,
          width: dims.width,
          height: dims.height
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  imageUrl: result.imageUrl,
                  latency: `${result.latencySeconds}s`,
                  strengthApplied: strength,
                  dimensions: `${dims.width}x${dims.height}`
                },
                null,
                2
              )
            }
          ]
        };
      }

      case "remove_background": {
        const imageUrl = String(args?.image_url || "");
        const outputFormat = (args?.output_format as "PNG" | "WEBP") || "PNG";

        const result = await client.removeBackground({
          imageUrl,
          outputFormat
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  transparentImageUrl: result.imageUrl,
                  format: outputFormat,
                  latency: `${result.latencySeconds}s`
                },
                null,
                2
              )
            }
          ]
        };
      }

      case "stage_product": {
        const productUrl = String(args?.product_image_url || "");
        const sceneDesc = String(args?.scene_description || "");
        const preset = args?.preset as any;
        const ratio = args?.aspect_ratio as any;
        const strength = args?.strength ? Number(args.strength) : undefined;

        const result = await client.stageProduct({
          productImageUrl: productUrl,
          sceneDescription: sceneDesc,
          environmentPreset: preset,
          aspectRatio: ratio,
          strength
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  stagedImageUrl: result.imageUrl,
                  presetApplied: preset || "custom",
                  latency: `${result.latencySeconds}s`
                },
                null,
                2
              )
            }
          ]
        };
      }

      case "batch_render_catalog": {
        const items = (args?.items as Array<{ id?: string; product_url: string; scene_prompt: string }>) || [];
        const results = await Promise.allSettled(
          items.map(async (item, idx) => {
            const res = await client.generateImage({
              prompt: item.scene_prompt,
              seedImage: item.product_url,
              strength: 0.70
            });
            return {
              id: item.id || `item_${idx + 1}`,
              outputUrl: res.imageUrl,
              latency: `${res.latencySeconds}s`
            };
          })
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "completed",
                  total: items.length,
                  results: results.map((r, i) => (r.status === "fulfilled" ? r.value : { id: items[i].id, error: (r as any).reason?.message }))
                },
                null,
                2
              )
            }
          ]
        };
      }

      default:
        throw new Error(`Tool '${name}' is not recognized.`);
    }
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `[omnia-media-mcp error] ${err.message || String(err)}`
        }
      ]
    };
  }
});

/**
 * Launch Server over stdio
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[omnia-media-mcp] Server running on stdio transport.");
}

main().catch((error) => {
  console.error("[omnia-media-mcp] Fatal error:", error);
  process.exit(1);
});
