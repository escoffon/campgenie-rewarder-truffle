let CampGenieTokenTester = artifacts.require("./mocks/CampGenieTokenTester.sol");
let CGRewarderSample = artifacts.require("./CGRewarderSample.sol");

let initialBalance = 2000000;
let decimals = 2;

module.exports = function(deployer, network, accounts) {
    let tokenizer;
    deployer
	.then(function() {
		  if ((network == 'development') || (network == 'localgeth'))
		  {
		      return deployer.deploy(CampGenieTokenTester, initialBalance, decimals);
		  }
		  else
		  {
		      // Here we need to resolve with an external CampGenieToken contract

		      // return CampGenieTokenTester.at(cg_token_tester_address);
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
	.then(function(i) {
		  deployer._rewarder_address = i.address;
		  deployer.logger.log("Deployed CGRewarderSample at " + CGRewarderSample.address);
	      })
	.catch(function(e) {
		   deployer.logger.log("error: " + e);
	       });
};
