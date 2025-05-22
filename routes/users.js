import express from "express";
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/auth-status", (req, res) => {
  res.json({
    isAuthenticated: !!req.session.isAuthenticated,
    username: req.session.account?.username || null,
    name: req.session.account?.name || null,
  });
});

export default router;
