import React, { useState, useEffect } from 'react';
import { loadModelAndLabels, handlePrediction } from './Logic';
import './App.css';

function App() {
  const [model, setModel] = useState(null);
  const [labels, setLabels] = useState(null);
  const [images, setImages] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading as true
  const [error, setError] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false); // New state to prevent jitter
  const [snackbar, setSnackbar] = useState({ show: false, message: '' });

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
      if (model) model.dispose();
    };
  }, []); // Removed `model` from dependencies to avoid unnecessary re-renders

  const handleImageUpload = async (event) => {
    if (!modelLoaded) return; // Prevent interactions before model loads

    const file = event.target.files[0];
    if (!file) {
      setSnackbar({ show: true, message: 'Please select an image to upload' });
      setTimeout(() => setSnackbar({ show: false, message: '' }), 3000);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      setImages((prevImages) => [...prevImages, imageUrl]);

      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        handlePrediction(model, img, setPredictions, labels)
          .catch(err => setError(err.message));
        URL.revokeObjectURL(imageUrl);
      };
      img.onerror = () => {
        setError('Error loading image');
        URL.revokeObjectURL(imageUrl);
      };
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="app-container">
      <h1>Image Classification</h1>

      {loading && <p className="loading-text">Loading model...</p>}
      {error && <p className="error-text">{error}</p>}

      {modelLoaded && (
        <>
          <div className="image-container">
            {images.map((url, index) => (
              <div key={index} className="image-box">
                <div className="image-header">
                  <button 
                    className="remove-button"
                    onClick={() => {
                      setImages(images.filter((_, i) => i !== index));
                      setPredictions(predictions.filter((_, i) => i !== index));
                    }}
                  >
                    ×
                  </button>
                </div>
                <img src={url} alt="uploaded" className="uploaded-image" />
                {predictions[index] && <p className="prediction-text">{predictions[index]}</p>}
              </div>
            ))}
          </div>

          <div className="upload-container">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />
          </div>
        </>
      )}

      {snackbar.show && (
        <div className="snackbar">
          {snackbar.message}
        </div>
      )}
    </div>
  );
}

export default App;
