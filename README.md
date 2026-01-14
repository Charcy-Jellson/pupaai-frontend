# Pupa AI Studio - Frontend

A modern, AI-powered creative suite frontend built with Next.js 15, featuring image processing tools, product mockup generation, and AI fashion model studio.

## Features

### Image Tools
- **Crop & Resize**: Intuitive cropping with preset dimensions (HD, FHD, 4K, Square, Story, Banner)
- **Rotate**: Quick rotation (90°, 180°) or custom angle with live preview
- **Compress**: Reduce file size to target KB with quality optimization
- **AI Background Removal**: Remove backgrounds using AI (Gemini or OpenAI)
- **AI Logo Extraction**: Extract logos from images automatically
- **AI Logo/Watermark Removal**: Remove logos and watermarks intelligently

### Product Mockup
- Interactive logo placement with drag & drop
- Multi-color generation with parallel processing
- AI-powered realistic mockup generation with fabric textures

### Model Studio
- AI-generate fashion models with customizable characteristics
- Virtual try-on with clothing selection
- Multiple scene and pose options

### Logo Studio
- AI-powered logo generation
- Multiple style options
- Color palette customization

### File Management
- Custom folder structure
- Gallery integration
- Save and organize processed images

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework with App Router |
| TypeScript | 5.x | Type-safe development |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | - | UI component library (Radix UI based) |
| Framer Motion | 11.x | Animations |
| Clerk | 6.x | Authentication & user management |
| Supabase | 2.x | Database client & storage |
| next-intl | 4.x | Internationalization (EN/ZH) |
| react-image-crop | 11.x | Image cropping UI |
| react-dropzone | 14.x | File upload handling |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database & storage)
- Clerk account (for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pupa-ai-studio.git
cd pupa-ai-studio/pupaai-frontend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the `pupaai-frontend` directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running the Development Server

```bash
npm run dev
# Runs on http://localhost:3000
```

### Building for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
pupaai-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [locale]/           # Internationalized routes
│   │   │   ├── (auth)/         # Authentication pages
│   │   │   ├── (dashboard)/    # Protected dashboard
│   │   │   └── (marketing)/    # Public pages
│   │   └── api/                # Next.js API routes
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout components
│   │   ├── common/             # Shared components
│   │   ├── image-tools/        # Image editing components
│   │   ├── product-mockup/     # Mockup components
│   │   ├── model-studio/       # Model studio components
│   │   └── logo-studio/        # Logo studio components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   ├── types/                  # TypeScript definitions
│   └── i18n/                   # Internationalization
├── public/                     # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set Root Directory: `pupaai-frontend`
3. Add all environment variables from `.env.local`
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Docker container

---

## Documentation

For detailed architecture and development documentation, see:

- [Frontend Architecture](ARCHITECTURE.md) - Directory structure, modules, development guidelines
- [Backend README](../pupaai-backend/README.md) - Backend API documentation
- [Supabase Architecture](../supabase/ARCHITECTURE.md) - Database schema
- [Gemini API Guide](../GEMINI_API_GUIDE.md) - AI integration reference

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Contributing

1. Read the [Architecture Documentation](ARCHITECTURE.md)
2. Follow the coding standards in [Cursor Rules](../.cursor/rules/pupa-ai-fullstack.mdc)
3. Update relevant `ARCHITECTURE.md` files when making changes
4. Submit a pull request

---

## License

MIT License - see [LICENSE](../LICENSE) file.
