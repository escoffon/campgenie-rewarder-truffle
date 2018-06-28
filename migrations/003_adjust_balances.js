var CampGenieTokenTester = artifacts.require("./contracts/mocks/CampGenieTokenTester.sol");
var CGRewarderSample = artifacts.require("./contracts/CGRewarderSample.sol");

module.exports = function(deployer, network, accounts) {
    var tokenizer;
    var rewarder;
    var ownerBalance;

    CGRewarderSample.deployed()
	.then(function(instance) {
		  rewarder = instance;
		  return rewarder.tokenizer.call();
	      })
	.then(function(ta) {
		  tokenizer = CampGenieTokenTester.at(ta);
		  return tokenizer.owner.call();
	      })
	.then(function(owner) {
		  return tokenizer.balanceOf.call(owner);
	      })
	.then(function(balance) {
		  deployer.logger.log("test CampGenieToken owner balance: " + balance + " tokens");
		  ownerBalance = balance;
		  return tokenizer.transfer(rewarder.address, balance);
	      })
	.then(function(result) {
		  deployer.logger.log("Transferred " + ownerBalance + " tokens to the rewarder at " + rewarder.address);
		  return tokenizer.balanceOf.call(rewarder.address);
	      })
	.then(function(rewarderBalance) {
		  deployer.logger.log("New rewarder balance: " + rewarderBalance + ' at ' + rewarder.address);
		  return true;
	      })
	.catch(function(e) {
		   deployer.logger.log("error: " + e);
	       });
};
