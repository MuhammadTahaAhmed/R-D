# Ready Player Me 3D Avatar Integration

This Next.js application integrates Ready Player Me's SDK to create 3D avatars from user profile images, similar to Snapchat's avatar feature.

## Features

- 🎭 **3D Avatar Creation**: Create personalized 3D avatars using Ready Player Me's Avatar Creator
- 📸 **Image Upload**: Upload profile photos to generate avatars
- 🎮 **Interactive 3D Viewer**: View and interact with your 3D avatar using React Three Fiber
- 🎨 **Customization**: Full avatar customization through Ready Player Me's interface
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Get Ready Player Me Credentials

1. Visit [Ready Player Me Studio](https://studio.readyplayer.me/)
2. Sign up for a developer account
3. Create a new app to get your credentials:
   - **Subdomain**: Your unique subdomain (e.g., `myapp`)
   - **App ID**: Your application ID
   - **Organization ID**: Your organization ID
   - **API Key**: For server-side operations (optional)

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Ready Player Me Configuration
NEXT_PUBLIC_RPM_SUBDOMAIN=your-subdomain
NEXT_PUBLIC_RPM_APP_ID=your-app-id
NEXT_PUBLIC_RPM_ORGANIZATION_ID=your-organization-id

# Optional: For server-side API calls
RPM_API_KEY=your-api-key
```

**Important**: Replace the placeholder values with your actual credentials from Ready Player Me Studio.

### 3. Install Dependencies

The required dependencies are already installed:

```bash
npm install @react-three/fiber @react-three/drei three @types/three
```

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## How It Works

### Avatar Creation Flow

1. **Upload Image**: Users can upload a profile photo
2. **Avatar Creator**: The Ready Player Me Avatar Creator opens in an iframe
3. **Customization**: Users can customize their avatar's appearance
4. **Export**: The avatar is exported as a 3D model URL
5. **Display**: The 3D avatar is rendered using React Three Fiber

### Components

- **`AvatarManager`**: Main component that orchestrates the avatar creation flow
- **`AvatarCreator`**: Embeds the Ready Player Me Avatar Creator iframe
- **`Avatar3D`**: Renders the 3D avatar using React Three Fiber
- **`RPM_CONFIG`**: Configuration management for Ready Player Me credentials

### Key Features

- **Error Handling**: Comprehensive error handling for upload and creation failures
- **Loading States**: Visual feedback during avatar creation
- **Responsive Design**: Mobile-friendly interface
- **3D Interaction**: Orbit controls for viewing the avatar from different angles
- **Environment Lighting**: Studio-quality lighting for avatar display

## Customization

### Styling

The application uses Tailwind CSS for styling. You can customize the appearance by modifying the className props in the components.

### Avatar Creator Options

You can customize the Avatar Creator by modifying the URL parameters in `src/config/rpm.js`:

```javascript
get avatarCreatorUrl() {
  return `https://${this.subdomain}.readyplayer.me/avatar?frameApi&ui=minimal&uiHints=0`;
}
```

### 3D Avatar Display

Customize the 3D avatar display in `src/components/Avatar3D.js`:

- Change lighting setup
- Modify camera position
- Add animations
- Customize materials

## Troubleshooting

### Common Issues

1. **"Configuration is incomplete" error**
   - Ensure all environment variables are set correctly
   - Verify your credentials from Ready Player Me Studio

2. **Avatar Creator fails to load**
   - Check your subdomain is correct
   - Ensure your app is properly configured in Ready Player Me Studio

3. **3D avatar doesn't display**
   - Check browser console for WebGL errors
   - Ensure the avatar URL is valid

### Browser Compatibility

- **WebGL Support**: Required for 3D avatar rendering
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile

## API Reference

### Ready Player Me Events

The Avatar Creator sends these events:

- `v1.avatar.exported`: Avatar creation completed successfully
- `v1.avatar.exported.failed`: Avatar creation failed
- `v1.avatar.creator.loaded`: Avatar Creator loaded successfully
- `v1.avatar.creator.loaded.failed`: Avatar Creator failed to load

### Avatar Data Structure

```javascript
{
  url: "https://models.readyplayer.me/...", // 3D model URL
  id: "avatar-id", // Unique avatar identifier
  metadata: { /* Additional avatar data */ }
}
```

## Next Steps

1. **Backend Integration**: Add server-side avatar storage and user management
2. **Advanced Features**: Implement avatar sharing, social features
3. **Performance**: Add avatar caching and optimization
4. **Analytics**: Track avatar creation metrics

## Support

- [Ready Player Me Documentation](https://docs.readyplayer.me/)
- [Ready Player Me Community](https://forum.readyplayer.me/)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
