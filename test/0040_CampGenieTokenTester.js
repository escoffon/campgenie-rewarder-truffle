var CampGenieTokenTester = artifacts.require("./contracts/CampGenieTokenTester.sol");
var CGRewarderSample = artifacts.require("./contracts/CGRewarderSample.sol");

var testutils = require('./utils/testutils.js');

testutils.injectAsserts(assert);

contract('CampGenieTokenTester', function(accounts) {
  it("deployed correctly", function() {
	 let rew;
	 let cgt;

	 return CGRewarderSample.deployed()
	     .then(function(instance) {
		       rew = instance;
		       return rew.tokenizer.call();
		   })
	     .then(function(ta) {
		       cgt = CampGenieTokenTester.at(ta);
		       return cgt.name.call();
		   })
	     .then(function(n) {
		       assert.equal(n, 'CampGenieTokenTester', "token name is not initialized correctly");
		       return cgt.symbol.call();
		   })
	     .then(function(s) {
		       assert.equal(s, 'CGTT', "token symbol is not initialized correctly");
		       return cgt.decimals.call();
		   })
	     .then(function(d) {
		       assert.equal(d, 2, "decimals is not initialized correctly");
		       return cgt.initialSupply.call();
		   })
	     .then(function(initialSupply) {
		       assert.equal(initialSupply.toNumber(), 200000000, "initial supply is not 2000000.00");
		       return cgt.totalSupply.call();
		   })
	     .then(function(totalSupply) {
		       assert.equal(totalSupply.toNumber(), 200000000, "total supply is not 2000000.00");
		   });
     });

  it("placed 2000000 * 10**2 tokens in the rewarder account", function() {
	 let rew;
	 let cgt;

	 return CGRewarderSample.deployed()
	     .then(function(instance) {
		       rew = instance;
		       return rew.tokenizer.call();
		   })
	     .then(function(ta) {
		       cgt = CampGenieTokenTester.at(ta);
		       return cgt.balanceOf.call(rew.address);
		   })
	     .then(function(balance) {
		       assert.equal(balance.toNumber(), 200000000, "2000000.00 wasn't in the rewarder account");
		   });
     });
});
