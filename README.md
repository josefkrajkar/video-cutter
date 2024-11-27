# Video Cutter

A powerful web-based application that enables users to cut and trim videos directly in their browser. This tool leverages modern web technologies to provide a seamless video editing experience without the need for software installation or server-side processing.

## Features

- **Browser-based Video Processing**
  - Cut and trim videos directly in your browser
  - No server uploads required - all processing happens locally
  - Supports MP4 video format

- **Advanced Preview System**
  - Real-time preview of edits
  - Visual timeline navigation

- **User Experience**
  - Simple and intuitive user interface
  - Fully responsive design for all screen sizes
  - Drag and drop file support

## Tech Stack

- [React](https://reactjs.org/) - UI library
- [Remix](https://remix.run/) - Full stack web framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 16 or higher)
- Yarn package manager
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/video-cutter.git
cd video-cutter
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Development

To start the development server:

```bash
yarn dev
```

The application will automatically reload if you make changes to the source files.

## Building for Production

Create a production build:

```bash
yarn build
```

To start the production server:

```bash
yarn start
```

## How It Works

The Video Cutter uses the HTML5 Video API and Web APIs to handle video processing directly in the browser. The cutting process works by:

1. Loading the video file into the browser's memory
2. Creating a virtual timeline for precise cutting
3. Generating a new video file with the selected segments
4. Allowing direct download of the processed video

All processing happens client-side, ensuring privacy and faster processing times as no data needs to be uploaded to a server.

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the existing code style.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
