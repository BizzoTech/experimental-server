const process = require("process");

const PouchDB = require("pouchdb");
PouchDB.plugin(require("pouchdb-find"));

const mainDbUrl = "http://main-db:5984/db";
const eventsDbUrl = "http://events-db:5984/events";
const notificationsDbUrl = "http://notifications-db:5984/notifications";
const archiveDbUrl = "http://archive-db:5984/archive";
const sharedDbUrl = "http://shared-db:5984/shared";
const publicDbUrl = "http://public-db:5984/public";
const authDbUrl = "http://auth-db:5984/_users";
const anonymousDbUrl = "http://anonymous-db:5984/anonymous";

const createDB = dbUrl => {
  return new PouchDB(dbUrl, {
    ajax: {
      cache: false,
      timeout: 60000
    },
    auth: {
      username: process.env.COUCHDB_USER,
      password: process.env.COUCHDB_PASSWORD
    }
  });
};

const mainDb = createDB(mainDbUrl);
const eventsDb = createDB(eventsDbUrl);
const notificationsDb = createDB(notificationsDbUrl);
const archiveDb = createDB(archiveDbUrl);
const sharedDb = createDB(sharedDbUrl);
const publicDb = createDB(publicDbUrl);
const authDb = createDB(authDbUrl);
const anonymousDb = createDB(anonymousDbUrl);

module.exports = {
  mainDb,
  eventsDb,
  notificationsDb,
  archiveDb,
  sharedDb,
  publicDb,
  authDb,
  anonymousDb
};
