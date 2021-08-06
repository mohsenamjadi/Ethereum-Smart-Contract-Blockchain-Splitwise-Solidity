const Splitwise = artifacts.require("Splitwise");

module.exports = function(deployer) {
  deployer.deploy(Splitwise);
};
