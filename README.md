# Stagely AI &middot; [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Runware Powered](https://img.shields.io/badge/Inference-Runware_Edge-indigo.svg)](https://runware.ai) [![Status](https://img.shields.io/badge/Status-Interactive_MVP-emerald.svg)](#)

> **Sub-2s automated visual staging platform for e-commerce brands.**  
> Transform flat, white-background product shots into 4K photorealistic lifestyle campaigns with pixel-faithful geometry, contact shadows, and reflections.

---

## 🌟 Overview

E-commerce merchants spend thousands on physical studio photography to create lifestyle imagery for social media, Amazon listings, and Shopify banners. Existing generative image tools often warp logos, deform packaging, and disregard realistic lighting physics.

**Stagely AI** solves this with an edge-optimized conditional diffusion pipeline:
1. **Background Isolation:** Extracts razor-sharp product masks with preserved alpha transparency.
2. **Latent Environment Inpainting:** Synthesizes realistic 3D scenes (marble vanities, Scandinavian wood, botanical gardens) matching the product's perspective and contact plane.
3. **Print-Ready 4K Upscale:** Output assets are super-resolved to 3840&times;2160 UHD.

---

## ⚡ Key Highlights

- **Sub-1.5s Edge Inference:** Powered by Runware's distributed GPU cluster.
- **Brand Geometry Invariance:** Product labels, barcodes, and contours are 100% preserved.
- **Model Context Protocol (MCP) Integration:** Native MCP Server (`mcp-server/`) allowing Claude Desktop, Claude Code, and Cursor to orchestrate product staging, background removal, and asset rendering via standard tool-calling.
- **Zero-Prompt Presets:** Built-in studio presets designed specifically for cosmetics, footwear, beverage, and home goods.
- **Interactive Before/After Studio & Creator Chat:** Live interactive split slider and dedicated chat-style recreation console for instant visual QA.

---

## 🚀 Quick Start (Run Locally)

You can run the interactive studio in under 10 seconds:

### Option 1: Python
```bash
cd startup/app
python server.py
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Direct File Launch
Double click `startup/app/index.html` to open it directly in any browser.

---

## 🏗️ Architecture

```
User Product Shot (JPG/PNG)
            │
            ▼
┌───────────────────────────────┐
│ Runware Background Removal   │  --> Alpha mask & cutout
└──────────────┬────────────────┘
            │
            ▼
┌───────────────────────────────┐
│ Runware Inpainting (Flux/SD) │  --> Depth conditioning & contact shadows
└──────────────┬────────────────┘
            │
            ▼
┌───────────────────────────────┐
│ Runware 4x RealESRGAN         │  --> 4K UHD Commercial Asset
└───────────────────────────────┘
```

For the complete technical specification, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 📂 Repository Structure

```
stagely-ai/
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI automated pipeline
├── app/
│   ├── index.html            # Interactive Studio & Landing Page MVP
│   └── server.py             # Python local test server
├── docs/
│   └── ARCHITECTURE.md       # Technical architecture & Runware SDK specs
├── .env.example              # Environment variables template
├── .gitignore                # Production gitignore
├── package.json              # Node.js project manifest & scripts
├── README.md                 # Project overview and documentation
├── server.js                 # Express.js backend & Runware inference gateway proxy
├── vercel.json               # 1-click Vercel cloud deployment config
└── LICENSE                   # MIT License
```

---

## 💻 Running the Project

### Option 1: Node.js / Express (Full Stack)
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Option 2: Python (Quick Demo)
```bash
python app/server.py
```

### Option 3: Static Launch
Double click `app/index.html` to open directly in any browser.

---

## 🔌 API & Integration

Stagely provides a headless REST endpoint for batch staging workflows:

```bash
curl -X POST http://localhost:3000/api/stage \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/product.png",
    "preset": "marble",
    "prompt": "Luxury white Italian marble vanity, morning sunlight, 8k"
  }'
```

---

## 📄 License

MIT &copy; 2026 Stagely AI Team.
