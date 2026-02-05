# Onslip Restaurant Table Management

A modern web application for managing restaurant floor plans, table layouts, and guest payments. Built with Next.js and integrated with Onslip 360 POS system.

## Features

- **Visual Table Editor**: Drag-and-drop interface for creating and arranging tables on a floor plan
- **Chair Management**: Add, remove, and manage individual seats at tables with position-based placement
- **Payment Processing**: Split bills between chairs or combine multiple tabs for group payments
- **Table States**: Track table status through different states (available, seated, dining, etc.)
- **Order Management**: Add products to individual chairs and manage items per guest
- **Import/Export**: Save and load floor plan configurations as JSON
- **Capacity Control**: Set minimum and maximum guest capacity for each table

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Canvas**: Konva.js for interactive table layout
- **API**: Onslip 360 Node.js API client

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Configuration

Configure your Onslip 360 API credentials in the environment or through the Onslip client configuration.

## Development

The application uses Next.js App Router with server actions for API integration. Key directories:

- `/src/app` - Application pages and routing
- `/src/components` - React components
- `/src/lib` - Server actions and utility functions
- `/src/types` - TypeScript type definitions
