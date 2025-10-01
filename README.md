# Weather Dashboard - Interactive Map & Timeline Visualization

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)

Interactive weather data visualization dashboard with polygon drawing and timeline controls.

## 🚀 Live Demo
- **Deployed Application**: https://weather-dashboard-submission.vercel.app/

## 📋 Features
- ✅ Interactive timeline slider (single hour & range selection)
- ✅ Map-based polygon drawing with 3-12 point validation
- ✅ Real-time weather data from Open-Meteo API
- ✅ Dynamic color-coded visualization
- ✅ Responsive design with Ant Design components
- ✅ TypeScript implementation with Zustand state management

## 🛠️ Setup and Run Instructions

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager

### Installation
1. Clone the repository:
git clone https://github.com/yourusername/weather-dashboard-app.git
cd weather-dashboard-app

text

2. Install dependencies:
npm install

text

3. Start the development server:
npm run dev

text

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
npm run build
npm start

text

## 📚 Libraries Used

### Core Framework
- **Next.js 14**: React framework with server-side rendering
- **React 18**: Component-based UI library
- **TypeScript**: Type-safe JavaScript development

### State Management & Data Handling
- **Zustand**: Lightweight state management
- **Day.js**: Date manipulation and formatting

### UI Components & Styling
- **Ant Design**: Professional React component library
- **Tailwind CSS**: Utility-first CSS framework

### Mapping & Visualization
- **Leaflet**: Interactive map library
- **React-Leaflet**: React components for Leaflet maps

### API Integration
- **Open-Meteo API**: Historical weather data source
- **Built-in Fetch**: HTTP client for API requests

## 🏗️ Architecture & Design

### State Management
The application uses Zustand for efficient state management with TypeScript interfaces:
- Timeline state (selected time/range)
- Polygon data with associated weather information
- API response caching
- Map view and drawing state

### API Integration
- **Endpoint**: `https://archive-api.open-meteo.com/v1/archive`
- **Data Fields**: temperature_2m for color-coded visualization
- **Caching Strategy**: Intelligent caching to minimize API calls
- **Error Handling**: Comprehensive error management with user feedback

### Component Structure
src/
├── components/
│ ├── Map/ # Leaflet map components
│ ├── Timeline/ # Timeline slider components
│ ├── Sidebar/ # Data source controls
│ └── UI/ # Reusable UI components
├── stores/ # Zustand state management
├── types/ # TypeScript type definitions
├── utils/ # Helper functions and API calls
└── pages/ # Next.js pages

text

## 🎯 Key Implementation Details

### Timeline Control
- Supports both single-hour and time-range selection
- 30-day window (±15 days from current date)
- Hourly resolution with visual feedback
- Smooth interaction with drag and click support

### Polygon Management
- Drawing validation (3-12 points)
- Real-time color updates based on weather data
- Persistent polygon storage during map navigation
- Individual polygon deletion and data association

### Weather Data Processing
- Color rules: Cold (<10°C), Moderate (10-25°C), Warm (≥25°C)
- Dynamic updates when timeline changes
- Centroid-based location queries for polygon weather data
- Smooth color transitions and loading states

## 📱 Screenshots
<img width="1918" height="866" alt="image" src="https://github.com/user-attachments/assets/19a4bbfb-249d-4f7b-b681-2a459c461ae5" />

## 🚀 Deployment
This application is optimized for deployment on Vercel with zero configuration.

## 📄 License
MIT License - see LICENSE file for details
