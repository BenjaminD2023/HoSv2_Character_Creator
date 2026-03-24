# 🎲 House of Shadows Character Creator (HoSv2) 

[![Next.js](https://img.shields.io/badge/Next.js-16.1.7-black?logo=next.js&style=for-the-badge)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?logo=react&style=for-the-badge)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-black?logo=typescript&style=for-the-badge)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&style=for-the-badge)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploys-blue?logo=vercel&style=for-the-badge)](https://vercel.com/)

Forge heroes for your dark fantasy realm with this advanced character creation tool designed specifically for the House of Shadows RPG system. Features cinematic 3D dice rolling, step-driven character building, and SRD-accurate stat computation.

## ⚔️ Features

- 🎯 **Cinematic 3D Dice Rolling** - Physics-based rolling with @3d-dice/dice-box engine
- 🏗️ **Step-Driven Character Builder** - Guided 7-step workflow from stats to final sheet
- ⚡ **Advantage/Disadvantage Mechanics** - House of Shadows specific roll systems 
- 👤 **Interactive Character Sheets** - Dynamic rendering of stats, skills, and abilities
- 💾 **Character Management** - Save, load and manage multiple character sheets
- 🔢 **SRD-Accurate Formulas** - Built for HoS' custom d20 system (not D&D defaults)
- 🧮 **XP-Tier Skill Progression** - Implementation of House of Shadows' experience system
- 🛡️ **Armor System** - Damage reduction mechanics instead of AC
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.1.7](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with Radix UI Primitives
- **Icons**: [Lucide React](https://lucide.dev/)
- **Dice Engine**: [@3d-dice/dice-box](https://3d-dice.github.io/dice-box) with custom themes
- **Form Handling**: Custom React state management
- **Animation**: CSS animations with `@next/font`
- **Testing**: [Playwright](https://playwright.dev/) for E2E testing
- **Analytics**: [Vercel Speed Insights](https://vercel.com/speed-insights)

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd HoS_Character_Creator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reloading |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality |

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── (routes)/           # Main routes (builder, character management, etc.)
│   ├── layout.tsx          # Root layout with DiceProvider
│   ├── page.tsx            # Homepage with feature highlights
│   └── globals.css         # Global styles
├── components/             # Reusable React components
│   ├── ui/                 # Shadcn-inspired component library
│   ├── DiceCanvas.tsx      # 3D Dice rendering canvas
│   ├── DiceEngineControls  # Dice restart controls
│   ├── CharacterSheet.tsx  # Interactive character sheet display
│   └── ...
├── contexts/               # React context providers
│   └── DiceContext.tsx     # Dice rolling state management
├── lib/                    # Utility functions
└── types/                  # TypeScript type definitions

public/
└── assets/                 # Static assets (dice themes, etc.)
```

## 🎲 Dice Rolling System

The character creator features a sophisticated 3D dice rolling system powered by @3d-dice/dice-box with:

- **Realistic Physics**: Gravity, throw force, and spin for immersive rolling effects
- **Custom Themes**: Smooth and "Dice of Rolling" theme options
- **Advantage/Disadvantage**: House of Shadows-specific mechanics
- **Roll Notifications**: Visual feedback with critical success/failure styling
- **Batch Rolling**: Multiple dice sets in single rolls
- **Restart Capability**: Dice engine reset functionality

### Dice Engine Architecture
The dice system uses a React Context provider pattern that manages DiceBox instance lifecycle, ensuring consistent performance between renders while maintaining physics behavior.

## 🏗️ Development

### Component Architecture
- Uses Radix UI primitives for accessible base components
- Custom styling layer built on Tailwind CSS utility classes
- Context-driven state management for global dice system
- Responsive design following modern web standards

### Testing
- E2E tests using [Playwright](https://playwright.dev/) for dice functionality
- Test files located in the `/e2d` directory
- Automated deployment workflow tested with continuous integration

### Code Organization
- TypeScript for type safety throughout
- Clear separation of concerns in UI vs business logic
- Consistent naming conventions following React community standards
- Well-documented components and hooks for future maintainability

## 🧪 Testing

Run E2E tests with Playwright:
```bash
npx playwright test
```

To open Playwright UI for debugging:
```bash
npx playwright test --ui
```

View test results:
```bash
npx playwright show-report
```

## ☁️ Deployment

Deployed on Vercel with automatic CI/CD from the main branch.

For deployment to your own Vercel account:
1. Sign up at [Vercel](https://vercel.com)
2. Import this Git repository
3. Configure build settings (no custom config needed for Next.js)
4. Deploy!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **House of Shadows RPG**: House of Shadows dark fantasy RPG system
- **Demo**: [Live demo link]
- **Documentation**: [HoS rulebook]

---

✨ *Built with ❤️ for tabletop RPG enthusiasts*

Created for the House of Shadows dark fantasy universe. Not affiliated with official HoS publications.