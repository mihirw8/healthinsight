# Health Report Analysis & Insight Engine

A comprehensive platform for analyzing health reports, providing personalized insights, recommendations, and risk assessments based on biomarker data.

## Features

- **Biomarker Analysis**: Interpret and analyze biomarker values from health reports
- **Trend Detection**: Track changes in health metrics over time
- **Risk Assessment**: Calculate health risks based on biomarker patterns
- **Personalized Recommendations**: Generate actionable health recommendations
- **Interactive Dashboard**: Visualize health data with intuitive charts and graphs
- **Report Upload**: Easy upload and processing of health report documents

## Project Structure

```
├── backend/               # Node.js backend
│   ├── src/               # Source code
│   │   ├── controllers/   # API controllers
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Utility functions
│   ├── prisma/            # Database schema and migrations
│   └── tests/             # Backend tests
├── frontend/              # React frontend
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   └── services/      # API services
│   └── tests/             # Frontend tests
└── tests/                 # Integration tests
    └── integration/       # End-to-end tests
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- PostgreSQL (v12 or higher)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd zaee
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your database credentials

# Run database migrations
npx prisma migrate dev

# Start the backend server
npm start
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The application should now be running at http://localhost:3000

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Integration Tests

```bash
# Install Playwright
npm install -g @playwright/test

# Install browser dependencies
npx playwright install

# Run integration tests
npx playwright test
```

## Usage Guide

1. **Login/Register**: Create an account or log in to access your personalized dashboard
2. **Upload Health Report**: Use the report upload feature to submit your health report documents
3. **View Dashboard**: Explore your biomarker summary, health trends, and risk assessment
4. **Review Recommendations**: Check personalized health recommendations based on your data
5. **Track Progress**: Monitor changes in your health metrics over time

## Medical Disclaimer

This application is designed for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

## License

[MIT License](LICENSE)