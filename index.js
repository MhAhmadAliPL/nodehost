const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const matchface = require("./facerecog");
const { FaceMatch } = require("@vladmandic/face-api");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: "/tmp/" }).any());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// receive an image and save it to a file
app.post("/upload", (req, res) => {
  console.log(req.files);
  const imageName = req.files[0].originalname;
  const imagePath = req.files[0].path;
  fs.readFile(imagePath, (err, data) => {
    fs.writeFile(`./uploads/${imageName}`, data, async(err) => {
      if (err) {
        console.log(err);

        const result = JSON.stringify({
          success: false,
          message: err
        });

        res.send(result);
      } else {
        console.log("The file was saved!");
        await matchface.matchface(`./uploads/${imageName}`).then((result) => {
          console.log(result);

          const data = JSON.stringify(result);

          res.json(data);
        }).catch((err) => {
          console.log(err);

          const result = JSON.stringify({
            success: false,
            message: err
          });

          res.send(result);
        });
      }
    });
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("The file was deleted!");
      }
    });
  });
});

app.listen(3000, () => {
  console.log("App running on http://localhost:3000");
});
