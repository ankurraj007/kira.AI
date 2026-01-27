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

### AWS Deployment

The project includes scripts for deploying to AWS ECS Fargate.

**Prerequisites:**
- AWS CLI installed and configured
- Docker Desktop installed and running

**Setup & Deploy:**

1. **One-time Infrastructure Setup:**
   Run this script to create the ECR repository, CloudWatch log group, and ECS cluster.
   ```powershell
   .\aws\setup-aws.ps1 -Region us-east-1
   ```

2. **Deploy Application:**
   Run this script to build, tag, push the image, and update the ECS service.
   ```powershell
   .\aws\deploy.ps1 -Region us-east-1 -Environment prod
   ```

**Important:** Before your first deployment, you must:
1. Update `aws/ecs-task-definition.json` with your actual AWS Account ID and execution roles.
2. Register the task definition:
   ```bash
   aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json
   ```
3. Create the ECS Service manually (or via CLI) linking it to your cluster and task definition.

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
