# 3D Avatar Creation with Ready Player Me

This application provides a complete solution for creating 3D avatars using Ready Player Me's SDK and API. Users can either upload an image or take a photo with their camera to generate personalized 3D avatars.

## Features

### 🎯 Three Avatar Creation Options

1. **Upload Photo** - Upload an existing selfie or photo
2. **Take Photo** - Use your device's camera to take a fresh selfie
3. **Create Custom** - Design an avatar from scratch using Ready Player Me's avatar creator

### 🔧 Technical Implementation

- **Camera Integration**: Real-time camera access with photo capture
- **Image Processing**: Automatic image validation and optimization
- **3D Avatar Generation**: Uses Ready Player Me's API to convert photos to 3D avatars
- **Interactive 3D Viewer**: Display and interact with generated avatars
- **Error Handling**: Comprehensive error handling and user feedback

## Setup Instructions

### 1. Environment Configuration

Make sure your `.env.local` file contains the following variables:

```env
NEXT_PUBLIC_RPM_SUBDOMAIN=final-z1q6h2.readyplayer.me
NEXT_PUBLIC_RPM_APP_ID=68e695dbc47722eb433b0378
NEXT_PUBLIC_RPM_ORGANIZATION_ID=68e54d188c4c92ec5eac4d0d
RPM_API_KEY=sk_live_Um0D8-GBV9-043sAo0buVioz0xVvRTTw0RfD
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### Upload Photo Option
1. Click "Choose Image" to select a photo from your device
2. The system will validate the image (type and size)
3. The photo is sent to Ready Player Me's API for processing
4. A 3D avatar is generated and displayed

### Take Photo Option
1. Click "Open Camera" to access your device's camera
2. Position your face in the camera view
3. Click the capture button to take a photo
4. The photo is automatically processed to create a 3D avatar

### Create Custom Avatar
1. Click "Start Creating" to open Ready Player Me's avatar creator
2. Customize your avatar with various options
3. Export your avatar when satisfied

## API Integration

The application uses Ready Player Me's API for avatar generation:

- **Endpoint**: `https://api.readyplayer.me/v2/avatars`
- **Method**: POST
- **Authentication**: Bearer token with API key
- **Headers**: Includes App ID for proper identification

## Components

- **AvatarManager**: Main component managing the avatar creation flow
- **CameraCapture**: Handles camera access and photo capture
- **AvatarCreator**: Integrates Ready Player Me's avatar creator
- **Avatar3D**: Displays and interacts with 3D avatars

## Browser Compatibility

- **Camera Access**: Requires HTTPS in production
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: iOS Safari, Android Chrome

## Security Notes

- API keys are stored securely in environment variables
- Camera access requires user permission
- Image processing happens server-side for security

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS in production
- Check browser permissions for camera access
- Try refreshing the page and granting permissions again

### Avatar Generation Fails
- Verify your Ready Player Me credentials in `.env.local`
- Check that the image is a valid photo format
- Ensure the image size is under 10MB

### API Errors
- Check your Ready Player Me account status
- Verify API key permissions
- Check network connectivity
