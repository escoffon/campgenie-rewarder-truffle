var CampGenieTokenTester = artifacts.require("./contracts/CampGenieTokenTester.sol");
var CGRewarderSample = artifacts.require("./contracts/CGRewarderSample.sol");

function _loadState(accounts) {
    return new Promise(function(resolve, reject) {
			   let state = { };

			   CGRewarderSample.deployed()
			       .then(function(instance) {
					 state.rewarder = { contract: instance };
					 return instance.tokenizer.call();
				     })
			       .then(function(ta) {
					 state.tokenizer = { contract: CampGenieTokenTester.at(ta) };
					 return state.tokenizer.contract.owner.call();
				     })
			       .then(function(o) {
					 state.tokenizer.owner = o;
					 state.tokenizer.not_owner = _.find(accounts, function(v, idx) {
										return v != o;
									    });
					 return state.rewarder.contract.owner.call();
				     })
			       .then(function(o) {
					 state.rewarder.owner = o;
					 state.rewarder.not_owner = _.find(accounts, function(v, idx) {
									       return v != o;
									    });
					 resolve(state);
				     })
			       .catch(function(e) {
					  reject(e);
				      });
		       });
};

module.exports = {
    loadState: _loadState
};
