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
    console.log('Labels loaded successfully');

    return { model, labels };
  } catch (error) {
    console.error("Error loading model or labels:", error);
    throw error;
  }
};

export const handlePrediction = async (model, img, setPredictions) => {
  try {
    const tensor = tf.browser
      .fromPixels(img)
      .resizeBilinear([224, 224]) // Resizes image to match model input
      .toFloat()
      .div(tf.scalar(255)) // Normalize pixel values
      .expandDims(); // Add batch dimension

    // Get prediction
    const predictionsTensor = model.predict(tensor);
    const predictionsData = await predictionsTensor.data(); // Convert tensor to array

    // Get top prediction index
    const topIndex = predictionsData.indexOf(Math.max(...predictionsData));

    // Get label if available
    const label = `Class ${topIndex}`; // Fallback if labels aren't available
    setPredictions((prevPredictions) => [...prevPredictions, `This appears to be a ${label}`]);

    // Clean up tensor memory
    tf.dispose([tensor, predictionsTensor]);

  } catch (error) {
    console.error("Error making prediction:", error);
    setPredictions((prevPredictions) => [...prevPredictions, "Prediction failed. Please try again."]);
  }
};
