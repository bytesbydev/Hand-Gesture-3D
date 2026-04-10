# Hand Gesture 3D - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- Webcam access enabled
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser (usually http://localhost:5173)
```

---

## 🎮 How to Use

### 1. **Allow Camera Access**
When the app loads, your browser will request camera permissions. Click "Allow" to enable hand tracking.

### 2. **Select a 3D Object**
Use the dropdown menu in the top-right of the header to choose your preferred 3D object:
- **Cube** - Classic geometric shape
- **Sphere** - Smooth rounded object
- **Torus** - Donut-shaped 3D object
- **Pyramid** - Pointed geometric shape

### 3. **Perform Gestures**

#### Move Object
- **Hold your hand in front of the camera**
- **Move your hand position** → Object follows your hand

#### Scale Object
- **Bring two hands together** → Object shrinks
- **Move two hands apart** → Object grows
- Distance between hands controls the size

#### Grab/Pinch
- **Pinch your thumb and index finger together** → Object changes color (orange when grabbed)
- **Open your hand** → Object returns to normal color

#### Rotate Object
- **Rotate your hand/wrist** → Object rotates in 3D space
- Angle of your hand controls rotation

---

## 📊 Understanding the HUD (Heads-Up Display)

### Top-Left Corner
- **Title**: "GESTURE CONTROL"
- **Status**: "Real-time Hand Tracking"

### Top-Right Corner
#### FPS Counter
- **Green Bar**: 30+ FPS (excellent)
- **Yellow Bar**: 20-30 FPS (good)
- **Red Bar**: <20 FPS (may need optimization)

#### Hand Count
- Shows how many hands are currently detected (0, 1, or 2)

### Bottom-Left Corner
#### Hand Status
- **LEFT**: Shows left hand detection status
  - Bright blue dot = Hand detected
  - Dim dot = No hand detected
  - ✋ OPEN = Hand is open
  - ✊ PINCHING = Pinch gesture detected

- **RIGHT**: Shows right hand detection status
  - Bright pink dot = Hand detected
  - Dim dot = No hand detected
  - ✋ OPEN = Hand is open
  - ✊ PINCHING = Pinch gesture detected

### Bottom-Right Corner
#### Control Guide
- **↔️ Move Object** - Use hand position
- **✌️ Scale (2 Hands)** - Use hand distance
- **✊ Grab/Pinch** - Pinch gesture
- **🔄 Rotate** - Hand rotation angle

---

## 🎯 Tips for Better Hand Tracking

1. **Good Lighting**
   - Use a well-lit environment
   - Avoid shadows on your hands
   - Position light source in front of you

2. **Hand Distance**
   - Keep hands within 1-2 feet of camera
   - Ensure full hand is visible in frame
   - Avoid hand covering the face

3. **Smooth Movements**
   - Move hands slowly and deliberately
   - Avoid rapid jerky motions
   - Maintain clear hand postures

4. **Background**
   - Use a contrasting background
   - Avoid complex patterns behind hands
   - Simple backgrounds work best

5. **Hand Visibility**
   - Keep palms facing camera
   - Don't obstruct fingers
   - Ensure all landmarks are visible

---

## 🔧 Advanced Features

### Gesture Detection
The app can detect 6 different hand gestures:

1. **Pinch Gesture**
   - Thumb and index finger close together
   - Used for grabbing objects

2. **Open Hand**
   - All fingers extended
   - Used for releasing objects

3. **Peace Gesture** (New)
   - Index and middle fingers extended
   - Ring and pinky fingers closed

4. **OK Gesture** (New)
   - Thumb and index form circle
   - Other fingers extended

5. **Thumbs Up Gesture** (New)
   - Thumb pointing upward
   - Other fingers closed

6. **Hand Grab** (New)
   - All fingers curled inward
   - Fist-like gesture

### Hand Confidence
The app calculates hand detection confidence based on landmark visibility. Higher confidence = more stable tracking.

---

## 🎨 Customization

### Changing Colors
Edit `src/App.css` to modify the color scheme:
```css
/* Primary Cyan */
#00ffff

/* Secondary Green */
#00ff88

/* Accent Pink */
#ff0099

/* Dark Background */
#0a0e27
```

### Adjusting Gesture Sensitivity
Edit `src/utils/gestures.js`:
```javascript
const PINCH_THRESHOLD = 0.05; // Lower = more sensitive
const PINCH_HYSTERESIS = 0.02; // Prevents flickering
```

### Modifying 3D Objects
Edit `src/components/Scene3D.jsx` to add new shapes:
```javascript
case 'yourShape':
  return <yourGeometry args={[params]} />;
```

---

## 🐛 Troubleshooting

### "Camera not working"
1. Check camera permissions in browser settings
2. Ensure no other app is using the camera
3. Try refreshing the page
4. Check console for error messages

### "Hand tracking is jittery"
1. Improve lighting conditions
2. Move camera closer to get better hand visibility
3. Reduce hand movement speed
4. Check FPS - if low, close other applications

### "Gestures not being detected"
1. Make sure hand landmarks are visible
2. Keep hands fully in frame
3. Try clearer hand postures
4. Check hand confidence score in console

### "3D object not responding"
1. Ensure hands are clearly visible
2. Try a different object shape
3. Refresh the page
4. Check console for JavaScript errors

---

## 📱 Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Excellent | Best performance |
| Firefox | ✅ Excellent | Good performance |
| Safari | ✅ Good | May need iOS 14.5+ |
| Edge | ✅ Good | Chromium-based |
| Mobile Browsers | ⚠️ Limited | Mobile camera limitations |

---

## 🚀 Performance Tips

1. **Use Latest Browser**
   - Update to latest version for better performance

2. **Close Unnecessary Tabs**
   - Reduces background processes
   - Improves FPS stability

3. **Reduce Page Complexity**
   - Disable browser extensions if needed
   - Close heavy applications running in background

4. **Optimize Camera**
   - Use 640x480 resolution (default)
   - Adequate lighting helps frame rates

---

## 📚 API Reference

### Component Props

#### HandTracker
- `onHandsDetected(hands)` - Callback when hands detected
- `videoWidth` - Camera width (default: 640)
- `videoHeight` - Camera height (default: 480)

#### Scene3D
- `handsData` - Array of detected hands
- `selectedObject` - Current 3D object type

#### HUD
- `handsData` - Array of detected hands
- `isLoading` - Loading state indicator

### Gesture Functions

```javascript
// Check if hand is pinching
isPinched(landmarks, previousState)

// Get hand center position
getHandCenter(landmarks)

// Get hand rotation angle
getHandRotation(landmarks)

// Get distance between two hands
getHandDistance(hand1, hand2)

// Get scale factor from two hands
getTwoHandScale(hand1, hand2, baseDistance)

// Get hand confidence (0-1)
getHandConfidence(hand)
```

---

## 🎓 Learning Resources

- **MediaPipe**: https://mediapipe.dev/solutions/hands
- **Three.js Documentation**: https://threejs.org/docs
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber

---

## 💡 Project Ideas

1. **Object Manipulation Game**
   - Throw, catch, and rotate virtual objects

2. **Gesture-Based Drawing**
   - Draw in 3D space with hand tracking

3. **Virtual Piano**
   - Play notes by touching virtual keys

4. **Gesture Recognition System**
   - Train and recognize custom gestures

5. **AR Furniture Placement**
   - Place virtual furniture in real spaces

6. **Music Generation**
   - Generate music based on hand positions

7. **Fitness Tracking**
   - Track hand movements for exercise routines

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

---

## ⭐ Enjoying the Project?

If you found this project useful, consider giving it a star! Your feedback and suggestions are always appreciated.

---

## 📧 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console error messages
3. Open an issue with detailed information
4. Include browser and OS information

---

**Happy Gesturing! 🖐️**
