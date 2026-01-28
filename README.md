# Kira.AI

Kira.AI is a sophisticated AI-powered chat application featuring advanced voice interaction, real-time 3D visualizations, and seamless integration with the Google Gemini API.

## 🚀 Features

- **Gemini Chat**: Intelligent conversational AI powered by Google's Gemini models.
- **Voice Interaction**: Integrated speech recognition and synthesis for hands-free communication.
- **3D Particle Sphere**: Interactive 3D visualization using Three.js that responds to audio input.
- **Responsive UI**: Sleek, modern design built with React and Tailwind CSS.

## 📁 File Structure

```text
kira.AI/
├── .github/              # GitHub Actions workflows for CI/CD
├── aws/                   # AWS deployment configurations
├── public/                # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── ChatContainer.tsx    # Main chat interface
│   │   ├── ChatMessage.tsx      # Individual chat bubbles
│   │   ├── Header.tsx           # Application header
│   │   ├── ParticleSphere.tsx   # Three.js 3D visualization
│   │   └── VoiceButton.tsx      # Integrated voice control
│   ├── hooks/             # Custom React hooks
│   │   ├── useAudioAnalyzer.ts  # Audio processing for 3D visualizer
│   │   ├── useGemini.ts         # Gemini API integration logic
│   │   ├── useSpeechRecognition.ts
│   │   └── useSpeechSynthesis.ts
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   ├── index.css          # Global styles (Tailwind CSS)
│   └── main.tsx           # Entry point
├── Dockerfile             # Docker configuration for deployment
├── docker-compose.yml     # Multi-container orchestration
├── nginx.conf             # Web server configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite build tool setup
```

## 🛠️ Technology Stack

- **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **3D Graphics**: [Three.js](https://threejs.org/), [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/)
- **Deployment**: Docker, AWS, GitHub Actions

## 🚦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ankurraj007/kira.AI.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Ankur Raj**

- GitHub: [@ankurraj007](https://github.com/ankurraj007)
