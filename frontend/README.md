# AlgoAssistant Frontend

A modern React frontend for the Algorithm Practice Management System with internationalization support.

## Features

- 🎨 Modern UI design based on Ant Design
- 📱 Responsive design supporting mobile devices
- 🔐 Complete user authentication system
- 🌐 Internationalization (English/Chinese)
- 🎯 Modular architecture for easy maintenance and extension
- 🐳 Docker support for easy deployment

## Tech Stack

- **React 18** - Frontend framework
- **React Router 6** - Routing management
- **Ant Design 5** - UI component library
- **Axios** - HTTP client
- **React i18next** - Internationalization
- **CSS3** - Styling and animations

## Project Structure

```
src/
├── components/          # Common components
│   ├── common/         # Shared components
│   └── layout/         # Layout components
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   └── dashboard/      # Dashboard pages
├── services/           # API services
├── i18n/               # Internationalization
│   └── locales/        # Translation files
├── App.js              # Main app component
├── App.css             # App styles
├── index.js            # App entry point
└── index.css           # Global styles
```

## Quick Start

### Install Dependencies

```bash
cd frontend
npm install
```

### Start Development Server

```bash
npm start
```

The app will start at http://localhost:3000

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
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
REACT_APP_API_URL=http://localhost:8000
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