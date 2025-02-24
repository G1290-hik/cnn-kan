import * as tf from '@tensorflow/tfjs';

export const loadModelAndLabels = async () => {
  try {
    console.log('Starting model load...');
    const modelUrl = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';
    console.log('Loading model from:', modelUrl);
    const model = await tf.loadLayersModel(modelUrl);
    console.log('Model loaded successfully');

    // Fetch labels from a local JSON file (Ensure it exists)
    console.log('Fetching labels from names.json...');
    const response = await fetch('/names.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch labels: ${response.statusText}`);
    }
    const labels = await response.json();
    console.log('Labels loaded successfully:', labels);
    return { model, labels };
  } catch (error) {
    console.error("Error loading model or labels:", error);
    throw error;
  }
};

export const handlePrediction = async (model, img, labels) => {
  try {
    console.log('Starting prediction...');
    console.log('Image:', img);

    if (!img || !img.src) {
      console.error('Invalid image object:', img);
      return "Prediction failed. Please try again.";
    }

    if (!Array.isArray(labels) || labels.length === 0) {
      console.error('Invalid or empty labels:', labels);
      return "Prediction failed. Please try again.";
    }

    // Preprocess the image
    const tensor = tf.tidy(() => {
      console.log('Preprocessing image...');
      const processedTensor = tf.browser
        .fromPixels(img)
        .resizeBilinear([224, 224]) // Resize to match model input size
        .toFloat()
        .div(tf.scalar(255)) // Normalize pixel values
        .expandDims(); // Add batch dimension
      console.log('Processed tensor shape:', processedTensor.shape);
      return processedTensor;
    });

    // Perform prediction
    console.log('Running model prediction...');
    const predictionsTensor = model.predict(tensor);
    console.log('Prediction tensor shape:', predictionsTensor.shape);

    const predictionsData = await predictionsTensor.data(); // Convert tensor to array
    console.log('Prediction data:', predictionsData);

    // Find the top prediction index
    const topIndex = predictionsData.indexOf(Math.max(...predictionsData));
    console.log('Top prediction index:', topIndex);

    // Get the corresponding label
    const label = labels[topIndex]?.replace(/'/g, '').split(',')[0] || `Class ${topIndex}`;
    console.log('Predicted label:', label);

    // Clean up tensors
    tf.dispose([tensor, predictionsTensor]);

    // Return the prediction result
    return `This appears to be a ${label}`;
  } catch (error) {
    console.error("Error making prediction:", error);
    return "Prediction failed. Please try again.";
  }
};