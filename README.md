# PanaStream

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-orange.svg)](https://aws.amazon.com/)

A modern, cloud-based streaming application built for AWS infrastructure. PanaStream allows you to upload, convert, and stream your media collection using S3 for storage, CloudFront for delivery, and MediaConvert for video processing. Perfect for personal media libraries and small-scale streaming solutions.

**Clone or fork:** This repo is public. Clone with `git clone <repo-url>` or fork on GitHub to contribute.

**Built by [Pixaclara](https://github.com/pixaclara)**

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/xuxogarcia/panastream.git
cd panastream

# Install dependencies
npm run install-all

# Configure environment variables
cd server
cp env.example .env
# Edit .env with your AWS credentials

# Start the application
npm run dev
```

Visit `http://localhost:3000` to access the application!

## 📸 Screenshots

> **Note**: Screenshots coming soon! The application features a modern, Netflix-inspired interface with custom Pixaclara branding.

## ✨ Features

- **🌐 Cloud-based Architecture**: Built for AWS with S3, CloudFront, and MediaConvert
- **📤 Video Upload**: Upload large MOV files and other video formats with drag-and-drop
- **🔄 Automatic Conversion**: Convert videos to MP4 using AWS MediaConvert
- **📺 Streaming**: Stream videos through CloudFront CDN for optimal performance
- **📚 Library Management**: Organize and search your media collection
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🎨 Modern UI**: Clean, Netflix-inspired interface with custom branding
- **🖼️ Thumbnail Generation**: Automatic thumbnail generation for video previews
- **📊 Real-time Progress**: Live conversion progress tracking
- **🔍 Advanced Search**: Search and filter your media library

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │   AWS Services  │
│                 │    │                 │    │                 │
│ • Video Player  │◄──►│ • Media Routes  │◄──►│ • S3 Storage    │
│ • Upload UI     │    │ • Upload Routes │    │ • CloudFront    │
│ • Library UI    │    │ • Convert Jobs  │    │ • MediaConvert  │
│ • Search        │    │ • SQLite DB     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

📊 **[Detailed architecture diagram](docs/ARCHITECTURE.md)** (Mermaid)

## Prerequisites

- Node.js 16+ and npm
- AWS Account with appropriate permissions
- S3 bucket for media storage
- CloudFront distribution
- MediaConvert service access
- IAM role for MediaConvert

## AWS Setup

### 1. S3 Bucket Setup

Create an S3 bucket for storing your media files:

```bash
aws s3 mb s3://your-streaming-bucket
```

### 2. CloudFront Distribution

Create a CloudFront distribution pointing to your S3 bucket:

1. Go to CloudFront console
2. Create distribution
3. Set origin to your S3 bucket
4. Configure caching behaviors for video files
5. Note the CloudFront domain name

### 3. MediaConvert Setup

1. Create an IAM role for MediaConvert with S3 access
2. Note the role ARN
3. Get your MediaConvert endpoint URL

### 4. IAM Permissions

Create an IAM user with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-streaming-bucket",
        "arn:aws:s3:::your-streaming-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "mediaconvert:CreateJob",
        "mediaconvert:GetJob",
        "mediaconvert:CancelJob",
        "mediaconvert:ListJobs"
      ],
      "Resource": "*"
    }
  ]
}
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/xuxogarcia/panastream.git
   cd panastream
   ```

2. **Install dependencies**:
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**:
   ```bash
   cd server
   cp env.example .env
   ```
   
   Edit `.env` with your AWS credentials and configuration:
   ```env
   # AWS Configuration
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1

   # S3 Configuration
   S3_BUCKET_NAME=your-streaming-bucket
   S3_UPLOAD_FOLDER=uploads
   S3_PROCESSED_FOLDER=processed

   # CloudFront Configuration
   CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net

   # MediaConvert Configuration
   MEDIACONVERT_ROLE_ARN=arn:aws:iam::account:role/MediaConvertRole
   MEDIACONVERT_ENDPOINT=https://account.mediaconvert.region.amazonaws.com

   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

4. **Start the development servers**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API server on http://localhost:3001
   - React development server on http://localhost:3000

## Usage

### 1. Upload Media

1. Navigate to the Upload page
2. Drag and drop or select video files (MOV, MP4, AVI, etc.)
3. Fill in media information (title, description, genre, year)
4. Click "Start Conversion" to begin processing

### 2. Browse Library

1. Go to the Library page
2. Use filters to find specific content
3. Search by title or description
4. Sort by various criteria

### 3. Stream Content

1. Click on any media item to start streaming
2. Use the built-in video player controls
3. Videos are served through CloudFront for optimal performance

## API Endpoints

### Media Management
- `GET /api/media` - List all media with pagination and filters
- `GET /api/media/:id` - Get specific media item
- `POST /api/media` - Create new media item
- `PUT /api/media/:id` - Update media item
- `DELETE /api/media/:id` - Delete media item
- `GET /api/media/:id/stream` - Get streaming URL

### Upload Management
- `POST /api/upload/session` - Create upload session
- `POST /api/upload/chunk` - Upload file chunk
- `POST /api/upload/complete` - Complete upload
- `GET /api/upload/progress/:sessionId` - Get upload progress

### Conversion Management
- `POST /api/convert/start` - Start MediaConvert job
- `GET /api/convert/status/:jobId` - Get job status
- `GET /api/convert/jobs` - List all conversion jobs
- `POST /api/convert/cancel/:jobId` - Cancel job

### Library Management
- `GET /api/library/stats` - Get library statistics
- `GET /api/library/genres` - Get available genres
- `GET /api/library/years` - Get available years
- `GET /api/library/recent` - Get recently added media
- `GET /api/library/search` - Search library

## 📁 Project Structure

```
panastream/
├── client/                    # React frontend
│   ├── public/
│   │   ├── img/              # Static images (logos, backgrounds)
│   │   └── index.html
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Header.js     # Navigation header
│   │   │   ├── Footer.js     # Copyright footer
│   │   │   ├── MediaCard.js  # Media item display
│   │   │   └── VideoPlayer.js # Video.js player
│   │   ├── pages/            # Page components
│   │   │   ├── Home.js       # Landing page
│   │   │   ├── Library.js    # Media library
│   │   │   ├── Upload.js     # File upload
│   │   │   ├── Player.js     # Video player
│   │   │   ├── Search.js     # Search interface
│   │   │   └── Conversions.js # Conversion status
│   │   ├── services/         # API services
│   │   │   └── api.js        # API client
│   │   └── App.js            # Main app component
│   └── package.json
├── server/                   # Express backend
│   ├── config/              # Configuration files
│   │   ├── aws.js           # AWS service configuration
│   │   └── database.js      # SQLite database setup
│   ├── routes/              # API routes
│   │   ├── media.js         # Media management
│   │   ├── upload.js        # File upload handling
│   │   └── convert.js       # MediaConvert jobs
│   ├── public/              # Static files
│   │   └── thumbnails/      # Generated thumbnails
│   ├── index.js             # Server entry point
│   ├── env.example          # Environment variables template
│   └── package.json
├── package.json             # Root package.json with scripts
└── README.md
```

## Development

### Backend Development
```bash
cd server
npm run dev
```

### Frontend Development
```bash
cd client
npm start
```

### Building for Production
```bash
npm run build
```

## Deployment

### Backend Deployment

1. **Set up production environment variables**
2. **Deploy to your preferred platform** (AWS EC2, Elastic Beanstalk, etc.)
3. **Set up process manager** (PM2, systemd, etc.)

### Frontend Deployment

1. **Build the React app**:
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to S3 + CloudFront** or your preferred hosting platform

### Database

The application uses SQLite for simplicity. For production, consider migrating to:
- PostgreSQL
- MySQL
- DynamoDB

## Configuration

### Video Conversion Settings

The MediaConvert job is configured to output:
- **Resolution**: 3840x2160 (4K UHD)
- **Codec**: H.264
- **Bitrate**: 25 Mbps
- **Quality**: QVBR Level 9
- **Audio**: AAC, 128 kbps
- **Container**: MP4

You can modify these settings in `server/routes/convert.js`.

### CloudFront Caching

Configure CloudFront caching behaviors for optimal video streaming:
- **Video files**: Long TTL (1 year)
- **API responses**: Short TTL (5 minutes)
- **Static assets**: Medium TTL (1 day)

## Troubleshooting

### Common Issues

1. **Upload fails**: Check S3 permissions and bucket configuration
2. **Conversion fails**: Verify MediaConvert role and endpoint
3. **Streaming issues**: Check CloudFront distribution and S3 bucket policy
4. **Database errors**: Ensure SQLite file permissions are correct

### Logs

- Backend logs: Check server console output
- Frontend logs: Check browser developer console
- AWS logs: Check CloudWatch logs for AWS services

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Add tests** if applicable
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your branch**: `git push origin feature/amazing-feature`
7. **Submit a pull request** with a clear description

### Development Guidelines

- Follow the existing code style
- Add comments for complex logic
- Test your changes locally
- Update documentation if needed

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **React Router** - Client-side routing
- **Styled Components** - CSS-in-JS styling
- **React Query** - Data fetching and caching
- **Video.js** - HTML5 video player
- **React Dropzone** - File upload handling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (development)
- **AWS SDK** - AWS service integration

### AWS Services
- **S3** - Object storage
- **CloudFront** - CDN and streaming
- **MediaConvert** - Video processing
- **IAM** - Access management

### Development Tools
- **Nodemon** - Development server
- **Concurrently** - Run multiple processes
- **FFmpeg** - Thumbnail generation

## 📄 License

MIT License — see [LICENSE](LICENSE). Free for personal and commercial use.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🙏 Acknowledgments

- Built with ❤️ by [Pixaclara](https://github.com/pixaclara)
- Inspired by modern streaming platforms
- Powered by AWS cloud infrastructure

## 🆘 Support

For issues and questions:

1. **Check the troubleshooting section** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information including:
   - Your environment (OS, Node.js version)
   - Steps to reproduce the issue
   - Error messages and logs
   - Expected vs actual behavior

**GitHub Issues**: [https://github.com/xuxogarcia/panastream/issues](https://github.com/xuxogarcia/panastream/issues)

## 🗺️ Roadmap

### Phase 1 - Core Features ✅
- [x] Video upload and conversion
- [x] CloudFront streaming
- [x] Library management
- [x] Thumbnail generation
- [x] Real-time progress tracking

### Phase 2 - Enhanced Features
- [ ] User authentication and authorization
- [ ] Multiple user support
- [ ] Advanced video player features
- [ ] Subtitle support
- [ ] Advanced search and filtering
- [ ] Playlist creation

### Phase 3 - Advanced Features
- [ ] Mobile app (React Native)
- [ ] Watch history and recommendations
- [ ] Social features (sharing, comments)
- [ ] Analytics dashboard
- [ ] API rate limiting
- [ ] Webhook support

### Phase 4 - Enterprise Features
- [ ] Multi-tenant support
- [ ] Advanced security features
- [ ] Custom branding
- [ ] Enterprise SSO integration
- [ ] Advanced monitoring and logging
