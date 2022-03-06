const express = require("express");
const router = express.Router();

const clients = require("./clients");
const comments = require("./comments");
const messages = require("./messages");
const users = require("./users");
const visits = require("./visits");

router.use("/clients", clients);
router.use("/comments", comments);
router.use("/messages", messages);
router.use("/users", users);
router.use("/visits", visits);

module.exports = router;
