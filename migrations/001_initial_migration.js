let Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network, accounts) {
    deployer
	.deploy(Migrations)
	.then(function(instance) {
	      });
};
