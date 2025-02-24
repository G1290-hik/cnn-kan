import React, { useState, useEffect, useRef,useCallback } from 'react';
import { loadModelAndLabels, handlePrediction } from './Logic';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import './App.css';

function App() {
  const [model, setModel] = useState(null);
  const [labels, setLabels] = useState(null);
  const [predictions, setPredictions] = useState([]); // Store predictions
  const [loading, setLoading] = useState(true); // Start with loading as true
  const [error, setError] = useState(null); // Error state
  const [modelLoaded, setModelLoaded] = useState(false); // Track if model is loaded
  const [cameraStream, setCameraStream] = useState(null); // State to hold the camera stream
  const videoRef = useRef(null); // Reference to the video element

  // Load the TensorFlow.js model and labels on component mount
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setLoading(true);
        const { model, labels } = await loadModelAndLabels();
        setModel(model);
        setLabels(labels);
        setModelLoaded(true); // Only update UI once model is ready
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    initializeModel();
    return () => {
      if (model) model.dispose(); // Dispose of the model when unmounting
    };
  }, []); // Empty dependency array ensures this runs only once

  // Function to request camera access
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Unable to access the camera: ' + err.message);
    }
  };

  // Function to stop the camera feed
  const stopCamera = () => {
    if (cameraStream) {
      const tracks = cameraStream.getTracks();
      tracks.forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Function to capture frames from the video and perform predictions
  const performLivePrediction = useCallback(async () => {
    if (!modelLoaded || !videoRef.current) return;
  
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
  
      // Set canvas dimensions to match video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
  
      // Draw the current frame onto the canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  
      // Convert canvas image to an Image object
      const img = new Image();
      img.src = canvas.toDataURL('image/jpeg');
      await img.decode(); // Ensure the image is fully loaded
  
      console.log('Image loaded successfully:', img);
  
      // Perform prediction on the captured frame
      const prediction = await handlePrediction(model, img, labels);
  
      // Update predictions state
      setPredictions((prev) => {
        const updatedPredictions = [...prev, prediction];
        if (updatedPredictions.length > 10) {
          return updatedPredictions.slice(-10);
        }
        return updatedPredictions;
      });
    } catch (err) {
      console.error("Error during live prediction:", err.message);
      setError(err.message);
    }
  }, [modelLoaded, cameraStream, model, labels]);

  // Periodically capture frames and perform predictions
  useEffect(() => {
    let intervalId;
    if (modelLoaded && cameraStream) {
      intervalId = setInterval(performLivePrediction, 1000); // Capture every second
    }

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [modelLoaded, cameraStream]);

  return (
    <div className="app-container">
      {/* Customized AppBar */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#270640', // Dark purple background
          color: '#FFFFFF', // White text color
          boxShadow: 'none', // Remove shadow for blending
        }}
      >
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Live Camera Classification App
          </Typography>
        </Toolbar>
      </AppBar>

      <div style={{ marginTop: '80px' }}> {/* Add margin to account for the app bar */}
        {loading && <p className="loading-text">Loading model...</p>}
        {error && <p className="error-text">{error}</p>}

        {modelLoaded && (
          <>
            <div className="camera-container">
              <video ref={videoRef} autoPlay playsInline className="camera-feed"></video>
              <Button
                variant="contained"
                onClick={cameraStream ? stopCamera : startCamera}
                style={{ marginTop: '10px' }}
              >
                {cameraStream ? 'Stop Camera' : 'Start Camera'}
              </Button>
            </div>

            <div className="predictions-container">
              <h3>Predictions:</h3>
              {predictions.map((prediction, index) => (
                <p key={index} className="prediction-text">
                  Prediction {index + 1}: {prediction}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;