let CampGenieTokenTester = artifacts.require("./contracts/mocks/CampGenieTokenTester.sol");
let CGRewarderSample = artifacts.require("./contracts/CGRewarderSample.sol");

let initialBalance = 2000000;
let decimals = 2;

module.exports = function(deployer, network, accounts) {
    let tokenizer;
    deployer
	.then(function() {
		  if ((network == 'development') || (network == 'localgeth'))
		  {
		      return CampGenieTokenTester.new(initialBalance, decimals);
		  }
		  else
		  {
		      // Here we need to resolve with an external CampGenieToken contract

		      return null;
		  }
	      })
	.then(function(ti) {
		  deployer.logger.log("Using CampGenieTokenTester at " + ti.address);
		  tokenizer = ti;
	      })
	.then(function() {
		  return deployer.deploy(CGRewarderSample, tokenizer.address);
	      })
	.then(function() {
		  deployer._rewarder_address = CGRewarderSample.address;
		  deployer.logger.log("Deployed CGRewarderSample at " + CGRewarderSample.address);
	      })
	.catch(function(e) {
		   deployer.logger.log("error: " + e);
	       });
};
