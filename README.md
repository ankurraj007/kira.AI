# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Environment Setup

Create a `.env` file in the root directory with your API keys:

```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_MURF_API_KEY=your_murf_key
VITE_MURF_VOICE_ID=en-US-natalie
```

## Docker Deployment

This application includes a production-ready Docker setup using multi-stage builds and Nginx.

### Local Development with Docker

1. **Build and Run:**
   ```powershell
   docker-compose up --build
   ```
   The application will be available at http://localhost:3000

2. **Manual Build:**
   ```powershell
   docker build -t kira-ai .
   docker run -p 3000:80 kira-ai
   ```

### Deployment via GitHub Actions & EC2

This app is configured to be deployed to an AWS EC2 instance using GitHub Actions.

**1. EC2 One-Time Setup (via AWS Console):**
Connect to your EC2 instance via the AWS Console and run:
```bash
wget https://raw.githubusercontent.com/your-repo/main/aws/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

**2. GitHub Actions Secrets:**
Add the following secrets to your GitHub repo settings:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `ECR_REPOSITORY`, `EC2_HOST`, `EC2_USERNAME`, `EC2_SSH_KEY`
- API Keys: `VITE_GEMINI_API_KEY`, `VITE_MURF_API_KEY`, `VITE_MURF_VOICE_ID`

**3. Automatic Deployment:**
Pushing to the `main` branch will automatically build and deploy to your EC2 instance.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
