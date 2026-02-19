# PC Build Advisor

Smart PC compatibility checker with explainable scoring and upgrade recommendations.

## Features

- **Real-time Compatibility Checking**: Validates component compatibility (socket, form factor, power, dimensions)
- **4-Dimensional Scoring**: Comprehensive scoring across Compatibility, Performance, Value, and Usability
- **Intelligent Upgrade Path Suggestions**: Get recommendations for better components based on your build
- **Shareable Build URLs**: Share your builds with compressed, encoded URLs
- **Manual Component Override Support**: Override automatic compatibility checks when needed
- **Build Presets**: Choose from gaming, creator, budget, and custom presets
- **Export Options**: Export builds in multiple formats (JSON, Text, PCPartPicker, Markdown)
- **Auto-save**: Automatic draft saving to prevent data loss
- **Dark Mode**: Built-in dark/light theme support

## Tech Stack

- **Next.js 16** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Zod** - Schema validation for data integrity
- **Vitest** - Fast unit testing framework
- **Fuse.js** - Fuzzy search for parts
- **Pako** - Compression for shareable URLs

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PCBuilder
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
PCBuilder/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── build/             # Builder page
│   └── results/           # Results display pages
├── components/            # React components
│   ├── builder/           # Builder-specific components
│   ├── modals/            # Modal dialogs
│   ├── results/           # Results display components
│   └── ui/                # Reusable UI components
├── lib/                   # Core logic
│   ├── compatibility/     # Compatibility checking
│   ├── scoring/           # Scoring algorithms
│   ├── recommendations/   # Upgrade suggestions
│   ├── presets/           # Build presets
│   ├── persistence/       # Build saving/loading
│   └── utils/             # Utility functions
├── data/                  # Data files
│   └── seed/              # Component seed data (JSON)
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── public/                # Static assets
```

## Key Features Explained

### Compatibility Checking

The system validates:
- CPU/Motherboard socket matching
- RAM type compatibility (DDR4/DDR5)
- Form factor compatibility (ATX, mATX, ITX)
- GPU length vs case clearance
- CPU cooler height vs case clearance
- Power supply wattage and headroom
- M.2 slot availability

### Scoring System

Builds are scored across four dimensions:

1. **Compatibility** (0-100): Based on detected issues
2. **Performance** (0-100): Based on component tiers and preset
3. **Value** (0-100): Price-to-performance ratio
4. **Usability** (0-100): Noise, efficiency, and user experience factors

### Build Presets

- **Gaming 1080p/1440p/4K**: Optimized for gaming at specific resolutions
- **Creator**: High-performance for content creation
- **Quiet**: Low-noise builds
- **SFF**: Small form factor builds
- **Budget**: Cost-effective builds
- **Custom**: No filtering, full control

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Configure environment variables if needed (see `.env.example`)
4. Deploy

The project includes a `vercel.json` configuration file for optimal deployment settings.

### Other Platforms

The project can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Self-hosted with Node.js

## Testing

Run the test suite:
```bash
npm run test
```

Generate coverage report:
```bash
npm run test -- --coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository.
