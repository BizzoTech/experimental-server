const sleep = require("sleep");
const process = require("process");

const runFor = async (fn, t, label) => {
  sleep.sleep(3);
  const startedAt = Date.now();
  while (true) {
    try {
      await fn();
    } catch (e) {
      console.log(e);
      sleep.sleep(3);
    } finally {
      const runningFor = Date.now() - startedAt;
      if (runningFor > t) {
        console.log("Restarting " + (label || ""));
        process.exit();
      } else {
        sleep.sleep(1);
      }
    }
  }
};

module.exports = {
  runFor
};
