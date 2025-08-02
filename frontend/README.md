# AlgoAssistant Frontend

A modern React application for algorithm learning and practice management, featuring comprehensive dashboard analytics, LeetCode integration, and multi-platform sync capabilities.

## 🚀 Features

- **Dashboard Analytics**: Real-time statistics, progress tracking, and performance visualization
- **Problem Management**: Create, edit, and organize algorithm problems with multiple languages
- **Record Tracking**: Track submission history with execution results and performance metrics
- **Multi-Platform Sync**: Integration with LeetCode, GitHub, Notion, and Google Gemini
- **Internationalization**: Support for English and Chinese languages
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Live sync status and notifications
- **Modern UI**: Built with Ant Design 5.x and custom theming
- **State Management**: Context API with optimized performance
- **Error Handling**: Comprehensive error boundaries and recovery

## 🛠 Technology Stack

- **Framework**: React 18 with modern hooks and context API
- **UI Library**: Ant Design 5.x with custom theming
- **Routing**: React Router v6 with protected routes
- **State Management**: Context API with custom hooks
- **HTTP Client**: Axios with request/response interceptors
- **Charts**: Ant Design Charts for data visualization
- **Code Editor**: Monaco Editor for syntax highlighting
- **Internationalization**: react-i18next for multi-language support
- **Build Tool**: Create React App with custom webpack configuration

## 📦 Installation

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd AlgoAssitant/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```env
   REACT_APP_API_BASE_URL=http://localhost:8000
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
   REACT_APP_ENV=development
   ```

4. **Start development server**

   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## 🏗 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Common components (ErrorBoundary, PrivateRoute, etc.)
│   ├── dashboard/       # Dashboard-specific components
│   ├── auth/           # Authentication components
│   └── ...
├── contexts/           # React Context providers
│   ├── AuthContext.js  # Authentication state management
│   ├── ConfigContext.js # Configuration management
│   ├── ErrorContext.js # Global error handling
│   └── GitSyncContext.js # Git synchronization
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Authentication hook
│   ├── useDebounce.js  # Debounce utility hook
│   ├── useLoadingState.js # Loading state management
│   └── ...
├── pages/              # Route components
│   ├── Dashboard.js    # Main dashboard
│   ├── Records.js      # Submission records
│   ├── Settings.js     # User settings
│   └── ...
├── services/           # API service layer
│   ├── api.js          # Base API configuration
│   ├── authService.js  # Authentication services
│   ├── recordsService.js # Records management
│   └── ...
├── utils/              # Utility functions
│   ├── constants.js    # Application constants
│   ├── helpers.js      # Helper functions
│   └── ...
├── styles/             # Global styles and themes
├── i18n/              # Internationalization files
└── App.js             # Main application component
```

## 📋 Available Scripts

### Development

```bash
npm start          # Start development server
npm run dev        # Alias for npm start
npm test           # Run test suite
```

### Production

```bash
npm run build      # Create production build
npm run prebuild   # Run linting before build
```

### Code Quality

```bash
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues automatically
npm run format     # Format code with Prettier
```

### Analysis

```bash
npm run analyze    # Analyze bundle size with webpack-bundle-analyzer
```

## Internationalization

The app supports both English and Chinese languages. Users can switch languages using the language switcher in the header.

### Translation Files

- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/zh.json` - Chinese translations

### Adding New Translations

1. Add new keys to both translation files
2. Use the `useTranslation` hook in components
3. Access translations with `t('key.path')`

## Environment Configuration

Create a `.env` file to configure environment variables:

```env
REACT_APP_API_URL=your_api_url_here
```

## Docker Deployment

### Build and Run with Docker

```bash
# Build the frontend image
docker build -t algo-assistant-frontend .

# Run the container
docker run -p 3000:80 algo-assistant-frontend
```

### Using Docker Compose (Recommended)

From the root directory:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

## Development Guide

### Adding New Pages

1. Create new page component in `src/pages/`
2. Add route configuration in `src/App.js`
3. Add navigation menu item in `src/components/layout/Layout.js`

### Adding New Components

1. Create new component in `src/components/`
2. Create corresponding CSS file if needed
3. Import and use in other components

### API Integration

1. Create new service file in `src/services/`
2. Use the axios instance from `api.js`
3. Call service methods in components

## Code Standards

- Use functional components and Hooks
- Follow ESLint rules
- Use meaningful component and variable names
- Add necessary comments in English
- Support internationalization for all user-facing text

## Deployment

### Build

```bash
npm run build
```

### Deploy to Server

Deploy the contents of the `build` directory to your web server.

### Docker Deployment

Use the provided Dockerfile for containerized deployment.

## Contributing

1. Fork the project
2. Create a feature branch
3. Follow existing code style and patterns
4. Add tests for new functionality
5. Ensure internationalization support
6. Submit a Pull Request

## License

MIT License
