require("@tensorflow/tfjs-node");

const faceAPI = require("@vladmandic/face-api");
const canvas = require("canvas");

const { Canvas, Image } = canvas;

faceAPI.env.monkeyPatch({ Canvas, Image });

const matchface = async (image) => {
  const img = await canvas.loadImage(image);

  await faceAPI.nets.ssdMobilenetv1.loadFromDisk("./models");
  await faceAPI.nets.tinyFaceDetector.loadFromDisk("./models");
  await faceAPI.nets.faceLandmark68Net.loadFromDisk("./models");
  await faceAPI.nets.faceRecognitionNet.loadFromDisk("./models");

  const labels = ["ali", "farwa", "hamza"];

  const labeledFaceDescriptors = await Promise.all(
    labels.map(async (label) => {
      const imgUrl = `./recognizedFaces/${label}.jpg`;
      const img = await canvas.loadImage(imgUrl);
      // const img = await faceAPI.fetchImage(imgUrl);

      const faceDescription = await faceAPI
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!faceDescription) {
        throw new Error(`no faces detected for ${label}`);
      }

      const faceDescriptors = [faceDescription.descriptor];
      return new faceAPI.LabeledFaceDescriptors(label, faceDescriptors);
    })
  );

  const faceMatcher = new faceAPI.FaceMatcher(labeledFaceDescriptors);
  // const img = await faceAPI.fetchImage(image);
  const result = await faceAPI
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor()
    .then((res) => {
      if (!res) {
        return {
          success: false,
          message: "No faces detected",
        };
      }
      const resDescriptor = res.descriptor;
      const bestMatch = faceMatcher.findBestMatch(resDescriptor);
      console.log(bestMatch.label);
      if (bestMatch.label === "unknown") {
        return {
          success: false,
          message: "Face not recognized",
        };
      } else {
        return {
          success: true,
          message: "Face found",
          user: bestMatch.label,
        };
      }
    })
    .catch((err) => {
      console.log(err);
    });

  return result;
};

module.exports = {
  matchface,
};
