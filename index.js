const createPreProcessor = require("./createPreProcessor");
const createPostProcessor = require("./createPostProcessor");
const createActionHandler = require("./createActionHandler");
const { runFor } = require("./utils");

const {
  mainDb,
  eventsDb,
  notificationsDb,
  archiveDb,
  sharedDb,
  publicDb,
  authDb,
  anonymousDb
} = require("./config");

module.exports = {
  createPreProcessor,
  createPostProcessor,
  createActionHandler,
  runFor,
  mainDb,
  eventsDb,
  notificationsDb,
  archiveDb,
  sharedDb,
  publicDb,
  authDb,
  anonymousDb
};
