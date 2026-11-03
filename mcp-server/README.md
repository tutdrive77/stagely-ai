# 🔮 Omnia Media MCP

> **Production-Grade Visual AI & Commercial Merchandising Model Context Protocol (MCP) Server for Claude Desktop, Claude Code, Cursor, and Autonomous Agentic Workflows.**

[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg)](https://www.npmjs.com/package/omnia-media-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.6.1-violet.svg)](https://modelcontextprotocol.io)
[![Inference Engine](https://img.shields.io/badge/Inference-FLUX.1%20Fast%20Edge-orange.svg)](https://runware.ai)

---

## 💡 Overview

**Omnia Media MCP** bridges large language models and agentic coding environments with high-speed, sub-second visual diffusion pipelines. While standard LLMs can reason and write code, they lack native actuators for photorealistic image synthesis, subject extraction, and commercial asset merchandising.

This toolkit provides:
1. **The MCP Server** (`omnia-media-mcp`): Exposes native tool endpoints (`generate_image`, `recreate_from_seed`, `remove_background`, `stage_product`, `batch_render_catalog`) to Claude Desktop, Claude Code, and Cursor.
2. **The Developer CLI** (`omnia-cli`): A standalone terminal utility for automated batch rendering, asset extraction, and continuous testing in CI/CD pipelines.
3. **Multi-Aspect Commercial Templates**: Pre-configured aspect ratios and photorealistic commercial presets (Italian Carrara marble, Scandinavian Nordic oak, lush botanical spa, and cyber studio).

---

## ⚡ Quick Start: Connecting to Claude Desktop

Add this to your `claude_desktop_config.json`:

* **MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "omnia-media": {
      "command": "npx",
      "args": ["-y", "omnia-media-mcp"],
      "env": {
        "RUNWARE_API_KEY": "your_runware_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop, and Claude will automatically discover the visual creation tools!

---

## 🛠️ MCP Tools Overview

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `stage_product` | `product_image_url`, `scene_description`, `preset`, `aspect_ratio`, `strength` | Isolates a product and renders it in a photorealistic commercial staging environment with depth-matched shadows. |
| `recreate_from_seed` | `seed_image`, `prompt`, `strength`, `aspect_ratio` | Takes an existing photo/URL and transforms it with controlled diffusion intensity (0.35 to 0.95). |
| `generate_image` | `prompt`, `aspect_ratio`, `steps`, `model` | Generates 1024×1024 images using FLUX.1 Schnell at sub-2s edge latency. |
| `remove_background` | `image_url`, `output_format` | Performs high-precision alpha matting (BiRefNet) returning a transparent PNG cutout in < 1 second. |
| `batch_render_catalog` | `items: [{ product_url, scene_prompt }]` | Stages multiple products in parallel across custom scenes. |

---

## 💻 Developer CLI Usage

You can also run Omnia directly in your terminal:

```bash
# Generate image from prompt
npx omnia-cli generate "Luxury skincare bottle on black wet volcanic stone, morning sun, 8k"

# Recreate from an existing image seed
npx omnia-cli recreate "https://example.com/item.jpg" "Minimalist Nordic oak countertop with soft shadows"

# High-precision transparent cutout
npx omnia-cli remove-bg "https://example.com/product.jpg"
```

---

## 📐 Architecture & Performance

```text
┌───────────────────────────────┐
│  Claude Desktop / Claude Code │
└───────────────┬───────────────┘
                │  MCP stdio Protocol (JSON-RPC)
┌───────────────▼───────────────┐
│       Omnia Media Server      │
│  - Parameter Validation (Zod) │
│  - Pipeline Preset Engine     │
└───────────────┬───────────────┘
                │  Sub-second Edge Dispatch
┌───────────────▼───────────────┐
│     Runware Inference Node    │
│  - FLUX.1 Schnell Tensor      │
│  - Alpha Matting (BiRefNet)   │
│  - Latent Inpainting          │
└───────────────────────────────┘
```

* **Latency**: Typical end-to-end round trip is **1.4s – 2.4s** for full 1024×1024 renders.
* **Cost Efficiency**: Runs at raw edge compute rates (~$0.0025 per generation).

---

## 🤝 Contributing

Contributions from the open-source community are welcome!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/new-preset`).
3. Commit your changes (`git commit -m 'feat: add desert lighting preset'`).
4. Push to the branch (`git push origin feature/new-preset`).
5. Open a Pull Request.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.
