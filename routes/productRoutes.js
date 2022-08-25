var express = require("express");
var router = express.Router();
var productController = require("../controllers/productController.js");
var apiGuard = require("../middleware/api-guard");
var validator = require("../middleware/validator");
var multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
var upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
    fileFilter,
  },
});

/*
 * GET
 */

/*
 * POST
 */
router.post("/create", apiGuard, upload.single("mainImage"), validator.validate("createProduct"), productController.create);
router.post("/list", apiGuard, validator.validate("list"), productController.list);
router.post("/visited", apiGuard, validator.validate("handleVisit"), productController.handleWebsiteVisit);

/*
 * PATCH
 */
router.patch(
  "/update/:productId",
  upload.single("mainImage"),
  apiGuard,
  productController.update
);

/*
 * DELETE
 */
router.delete("/delete/:productId", apiGuard, productController.delete);

module.exports = router;
