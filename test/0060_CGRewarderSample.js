var CGRewarderSample = artifacts.require("./contracts/CGRewarderSample.sol");

var _ = require('lodash');
var testutils = require('./utils/testutils.js');
var ru = require('./utils/rewarderutils.js');

let _versionNumber = 10000;

testutils.injectAsserts(assert);

contract('CGRewarderSample (deployed)', function(accounts) {
  it("deployed correctly", function() {
	 var initialSupply;
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.getVersionNumber.call();
		   })
	     .then(function(vn) {
		       assert.equal(vn.toNumber(), _versionNumber);
		       return state.tokenizer.contract.initialSupply.call();
		   })
	     .then(function(s) {
		       initialSupply = s.toNumber();
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.contract.address);
		   })
	     .then(function(b) {
		       assert.equal(b.toNumber(), initialSupply, 'rewarder initial tokens not the same as tokenizer supply');
		       return true;
		   });
     });

  it("rewards contributions", function() {
	 var disbursed;
	 var initial_to_balance;
	 var final_to_balance;
	 var initial_r_balance;
	 var final_r_balance;
	 var num_contributions;
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.not_owner);
		   })
	     .then(function(b) {
		       initial_to_balance = b.toNumber();
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.contract.address);
		   })
	     .then(function(b) {
		       initial_r_balance = b.toNumber();
		       return state.rewarder.contract.getRewardedContributions.call();
		   })
	     .then(function(n) {
		       num_contributions = n.toNumber();
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 100, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: state.rewarder.not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.not_owner);
		   })
	     .then(function(b) {
		       final_to_balance = b.toNumber();
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.contract.address);
		   })
	     .then(function(b) {
		       final_r_balance = b.toNumber();

		       var to_delta = final_to_balance - initial_to_balance;
		       var r_delta = final_r_balance - initial_r_balance;
		       assert.equal(to_delta, disbursed, 'disbursement not transferred correctly to author');
		       assert.equal(r_delta, -disbursed, 'disbursement not transferred correctly from reward contract');
		       return state.rewarder.contract.getRewardedContributions.call();
		   })
	     .then(function(n) {
		       assert.equal(num_contributions+1, n.toNumber(), 'contribution count did not bump up by 1');
		       return true;
		   });
     });

  it("rewards contributions correctly", function() {
	 var disbursed;
	 var num_contributions;
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 100, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: state.rewarder.not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       assert.equal(400, disbursed, 'disbursement not as expected');
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 60, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: state.rewarder.not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       assert.equal(240, disbursed, 'disbursement not as expected');
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 20, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: state.rewarder.not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       assert.equal(80, disbursed, 'disbursement not as expected');
		       return state.rewarder.contract.getRewardedContributions.call();
		   })
	     .then(function(n) {
		       num_contributions = n.toNumber();
		       return state.rewarder.contract.setEarlyContributionsLimit(num_contributions-2, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 100, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: state.rewarder.not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       assert.equal(200, disbursed, 'disbursement not as expected');
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 60, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: state.rewarder.not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       assert.equal(120, disbursed, 'disbursement not as expected');
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 20, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: state.rewarder.not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       assert.equal(40, disbursed, 'disbursement not as expected');
		       return state.rewarder.contract.getRewardedContributions.call();
		   })
	     .then(function(n) {
		       return true;
		   });
     });

  it("rewards actions", function() {
	 var disbursed;
	 var initial_to_balance;
	 var final_to_balance;
	 var initial_s_balance;
	 var final_s_balance;
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.not_owner);
		   })
	     .then(function(b) {
		       initial_to_balance = b.toNumber();
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.contract.address);
		   })
	     .then(function(b) {
		       initial_s_balance = b.toNumber();
		       return state.rewarder.contract.rewardAction(state.rewarder.not_owner, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: state.rewarder.not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.not_owner);
		   })
	     .then(function(b) {
		       final_to_balance = b.toNumber();
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.contract.address);
		   })
	     .then(function(b) {
		       final_s_balance = b.toNumber();

		       var to_delta = final_to_balance - initial_to_balance;
		       var s_delta = final_s_balance - initial_s_balance;
		       assert.equal(to_delta, disbursed, 'disbursement not transferred correctly to author');
		       assert.equal(s_delta, -disbursed, 'disbursement not transferred correctly from reward contract');
		       return true;
		   });
     });

  it("rewards actions correctly", function() {
	 var disbursed;
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.rewardAction(state.rewarder.not_owner, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: state.rewarder.not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       assert.equal(500, disbursed, 'disbursement not as expected');
		       return true;
		   });
     });

  it("checks contribution parameters", function() {
	 var not_owner;
	 let min_raters;
	 let min_rating;
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 40, 600, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'contribution reward with high rating should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "contribution reward with high rating should have raised VM exception");
		       return state.rewarder.contract.getRequiredRaters.call({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       min_raters = r.toNumber();
		       return state.rewarder.contract.setRequiredRaters(100, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 2, 80, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'contribution reward with low review count should have failed');
		       return true;
		   },
		  function(e) {
		       assert.didRevertTransaction(e, "contribution reward with low review count should have raised VM exception");
		       return state.rewarder.contract.setRequiredRaters(min_raters, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.getRequiredRating.call({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       min_rating = r.toNumber();
		       return state.rewarder.contract.setRequiredRating(80, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 2, 40, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'contribution reward with low rating should have failed');
		       return true;
		   },
		  function(e) {
		      assert.didRevertTransaction(e, "contribution reward with low rating should have raised VM exception");
		       return state.rewarder.contract.setRequiredRating(min_rating, { from: state.rewarder.owner });
		  })
	     .then(function(r) {
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 2, 140, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'contribution reward with high rating should have failed');
		       return true;
		   },
		  function(e) {
		      assert.didRevertTransaction(e, "contribution reward with high rating should have raised VM exception");
		       return true;
		  });
     });

  it("only owner can pause and restart", function() {
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.pause({ from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'pause from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "pause from non owner should have raised VM exception");
		       return state.rewarder.contract.pause({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Pause' }, 'missing Pause event');
		       return state.rewarder.contract.unpause({ from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'unpause from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "unpause from non owner should have raised VM exception");
		       return state.rewarder.contract.unpause({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Unpause' }, 'missing Unpause event');
		       return true;
		   });
     });

  it("does not reward when paused", function() {
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.pause({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 50, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'contribution reward when paused should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "contribution reward when paused should have raised VM exception");
		       return state.rewarder.contract.rewardAction(state.rewarder.not_owner, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'action reward when paused should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "action reward when paused should have raised VM exception");
		       return state.rewarder.contract.unpause({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 50, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse' }, 'missing Disburse event');
		       return state.rewarder.contract.rewardAction(state.rewarder.not_owner, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse' }, 'missing Disburse event');
		       return true;
		   });
     });

  it("only owner can issue rewards", function() {
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.rewardContribution(state.rewarder.not_owner, 20, 100, { from: state.rewarder.not_owner });
		   })
	     .then(function(rv) {
		       assert(false, 'contribution reward from not owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "contribution reward from not owner should have raised VM exception");
		       return state.rewarder.contract.rewardAction(state.rewarder.not_owner, { from: state.rewarder.not_owner });
		   })
	     .then(function(rv) {
		       assert(false, 'action reward from not owner should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "action reward from not owner should have raised VM exception");
		       return true;
		   });
     });

  it("only owner can change control parameters", function() {
	 let min_raters;
	 let min_rating;
	 let early_con;
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.getRequiredRaters.call({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       min_raters = r.toNumber();
		       return state.rewarder.contract.getRequiredRaters.call({ from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert.equal(min_raters, r.toNumber(), 'minimum raters should be the same');
		       return state.rewarder.contract.setRequiredRaters(100, { from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'setRequiredRaters from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "setRequiredRaters from non owner should have raised VM exception");
		       return state.rewarder.contract.setRequiredRaters(100, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.getRequiredRaters.call({ from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert.equal(100, r.toNumber(), 'minimum raters should have changed');
		       return state.rewarder.contract.getRequiredRating.call({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       min_rating = r.toNumber();
		       return state.rewarder.contract.getRequiredRating.call({ from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert.equal(min_rating, r.toNumber(), 'minimum rating should be the same');
		       return state.rewarder.contract.setRequiredRating(80, { from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'setRequiredRating from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "setRequiredRating from non owner should have raised VM exception");
		       return state.rewarder.contract.setRequiredRating(80, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.getRequiredRating.call({ from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert.equal(80, r.toNumber(), 'minimum rating should have changed');
		       return state.rewarder.contract.getEarlyContributions.call({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       early_con = r.toNumber();
		       return state.rewarder.contract.getEarlyContributions.call({ from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert.equal(early_con, r.toNumber(), 'early contributions should be the same');
		       return state.rewarder.contract.setEarlyContributionsLimit(10, { from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'setEarlyContributionsLimit from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "setEarlyContributionsLimit from non owner should have raised VM exception");
		       return state.rewarder.contract.setEarlyContributionsLimit(10, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.setRequiredRaters(min_raters, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.getRequiredRaters.call({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.equal(min_raters, r.toNumber(), 'should have reset required raters');
		       return state.rewarder.contract.setRequiredRating(min_rating, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.getRequiredRating.call({ from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert.equal(min_rating, r.toNumber(), 'should have reset minimum rating');
		       return state.rewarder.contract.setEarlyContributionsLimit(early_con, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return state.rewarder.contract.getEarlyContributions.call({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.equal(early_con, r.toNumber(), 'should have reset early contributions');
		       return true;
		   });
     });

  it("rejects bad control parameters", function() {
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.setRequiredRaters(0, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'setting min review count to 0 should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "setting min review count to 0 should have raised VM exception");
		       return state.rewarder.contract.setRequiredRating(0, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'setting min rating to 0 should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "setting min rating to 0 should have raised VM exception");
		       return state.rewarder.contract.setRequiredRating(180, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'setting min rating to 180 should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "setting min rating to 180 should have raised VM exception");
		       return true;
		   });
     });

  it("allows anyone to estimate rewards", function() {
	 let reward = null;
	 let num_contributions = null;
	 let state = null;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.getRewardedContributions.call();
		   })
	     .then(function(n) {
		       num_contributions = n.toNumber();
		       return state.rewarder.contract.estimateContributionReward.call(20, 100, { from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       reward = r.toNumber();
		       return state.rewarder.contract.getRewardedContributions.call();
		   })
	     .then(function(n) {
		       assert.equal(num_contributions, n.toNumber(), 'contribution count should not change on estimates');
		       return state.rewarder.contract.estimateContributionReward.call(20, 100, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.equal(reward, r.toNumber(), 'estimated contribution reward should not change');
		       return state.rewarder.contract.estimateActionReward.call({ from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       reward = r;
		       return state.rewarder.contract.estimateActionReward.call({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.equal(reward, r.toNumber(), 'estimated action reward should not change');
		       return true;
		   });
     });

  it("upgrades correctly", function() {
	 let fromBalance;
	 let state = null;
	 let toContract;
	 let transferred;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.contract.address);
		   })
	     .then(function(b) {
		       fromBalance = b.toNumber();
		       return CGRewarderSample.new(state.tokenizer.contract.address);
		   })
	     .then(function(i) {
		       toContract = i;
		       return state.tokenizer.contract.balanceOf.call(toContract.address);
		   })
	     .then(function(b) {
		       assert.equal(b.toNumber(), 0, 'upgrade contract did not start with 0 tokens');
		       return state.rewarder.contract.upgrade(toContract.address, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Upgrade', args: { _to: toContract.address } },
					  'missing or incorrect Upgrade event');
		       var elist = testutils.filterEvents(r, { event: 'Upgrade' });
		       transferred = elist[0].args.amount.toNumber();
		       return state.tokenizer.contract.balanceOf.call(state.rewarder.contract.address);
		   })
	     .then(function(b) {
		       assert.equal(b.toNumber(), 0, 'original contract did not end with 0 tokens');
		       return state.tokenizer.contract.balanceOf.call(toContract.address);
		   })
	     .then(function(b) {
		       assert.equal(b.toNumber(), fromBalance, 'upgrade contract did not end with all the tokens');
		       return true;		       
		   });
     });

  it("upgrades if owner", function() {
	 let state = null;
	 let toContract;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return CGRewarderSample.new(state.tokenizer.contract.address);
		   })
	     .then(function(i) {
		       toContract = i;
		       return state.rewarder.contract.upgrade(toContract.address, { from: state.rewarder.not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'upgrade from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "upgrade from non owner should have raised VM exception");
		       return true;		       
		   });
     });

  it("upgrades if not paused", function() {
	 let state = null;
	 let toContract;

	 return ru.loadState(accounts)
	     .then(function(s) {
		       state = s;
		       return state.rewarder.contract.pause({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Pause' }, 'missing Pause event');
		       return CGRewarderSample.new(state.tokenizer.contract.address);
		   })
	     .then(function(i) {
		       toContract = i;
		       return state.rewarder.contract.upgrade(toContract.address, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert(false, 'upgrade while paused should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "upgrade while paused should have raised VM exception");
		       return state.rewarder.contract.unpause({ from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Unpause' }, 'missing Unpause event');
		       return state.rewarder.contract.upgrade(toContract.address, { from: state.rewarder.owner });
		   })
	     .then(function(r) {
		       return true;
		   });
     });
});
