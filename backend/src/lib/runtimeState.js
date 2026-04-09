/** Shared process state for readiness probes (K8s/docker health). */
let acceptingTraffic = true;

module.exports = {
  setShuttingDown() {
    acceptingTraffic = false;
  },
  isReady() {
    return acceptingTraffic;
  },
};
