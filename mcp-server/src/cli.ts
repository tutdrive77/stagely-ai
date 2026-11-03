#!/usr/bin/env node
import { OmniaClient } from "./client.js";

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
======================================================
  Omnia Media CLI - High-Speed Visual Diffusion Tools
======================================================

Usage:
  omnia-cli generate "<prompt>" [--ratio 1:1|4:5|16:9|9:16] [--steps 4]
  omnia-cli recreate "<seed_image_url>" "<prompt>" [--strength 0.75]
  omnia-cli remove-bg "<image_url>"
  omnia-cli stage "<product_url>" "<scene_prompt>" [--preset marble|nordic|botanical|cyber]

Environment:
  RUNWARE_API_KEY : Your Runware API key (e.g. from startup program)

Examples:
  omnia-cli generate "A luxury frosted glass bottle on polished marble, morning sunlight, 8k" --ratio 1:1
  omnia-cli remove-bg "https://example.com/raw-product.jpg"
`);
}

async function run() {
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  const client = new OmniaClient();

  if (!client.hasKey()) {
    console.error("Error: RUNWARE_API_KEY environment variable is missing.");
    console.error("Please export RUNWARE_API_KEY='your_key' or add it to your environment.");
    process.exit(1);
  }

  try {
    switch (command) {
      case "generate": {
        const prompt = args[1];
        if (!prompt) {
          console.error("Error: Missing prompt text.");
          process.exit(1);
        }
        console.log(`[Omnia CLI] Generating image: "${prompt}"...`);
        const res = await client.generateImage({ prompt });
        console.log(`✓ Success in ${res.latencySeconds}s!`);
        console.log(`URL: ${res.imageUrl}`);
        break;
      }

      case "recreate": {
        const seed = args[1];
        const prompt = args[2];
        if (!seed || !prompt) {
          console.error("Error: Usage: omnia-cli recreate <seed_image_url> <prompt>");
          process.exit(1);
        }
        console.log(`[Omnia CLI] Recreating from seed: ${seed}`);
        const res = await client.generateImage({
          prompt,
          seedImage: seed,
          strength: 0.75
        });
        console.log(`✓ Recreated in ${res.latencySeconds}s!`);
        console.log(`URL: ${res.imageUrl}`);
        break;
      }

      case "remove-bg": {
        const url = args[1];
        if (!url) {
          console.error("Error: Usage: omnia-cli remove-bg <image_url>");
          process.exit(1);
        }
        console.log(`[Omnia CLI] Extracting subject with Alpha Matting: ${url}`);
        const res = await client.removeBackground({ imageUrl: url });
        console.log(`✓ Alpha matting complete in ${res.latencySeconds}s!`);
        console.log(`Transparent PNG: ${res.imageUrl}`);
        break;
      }

      case "stage": {
        const prod = args[1];
        const scene = args[2];
        if (!prod || !scene) {
          console.error("Error: Usage: omnia-cli stage <product_url> <scene_prompt>");
          process.exit(1);
        }
        console.log(`[Omnia CLI] Staging product into scene...`);
        const res = await client.stageProduct({
          productImageUrl: prod,
          sceneDescription: scene
        });
        console.log(`✓ Staging complete in ${res.latencySeconds}s!`);
        console.log(`Staged Asset URL: ${res.imageUrl}`);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`[Omnia CLI Error] ${err.message || err}`);
    process.exit(1);
  }
}

run();
