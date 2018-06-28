# CampGenie rewarder sample Truffle box

This [Truffle box](https://truffleframework.com/docs/advanced/truffle-boxes)
contains an example of a rewarder contract implementation and Truffle support for development,
testing, and deployment.

## Setup

View the [Truffle documentation](https://truffleframework.com/docs) for instructions on installing
and configuring [Truffle](https://truffleframework.com), which you will use to unpack the Truffle
box.

To unpack the box:

    truffle unbox here_we_need_the_url

The unpacked box will install [npm](https://www.npmjs.com) packages, including a local version of Truffle
used by the various scripts.

## The box contents

### Contracts

The `contracts` directory contains a sample rewarder contract implementation (CGRewarderSample.sol),
the Truffle migrations contract, and contracts used by the test harness.

## Migrations

The `migrations` directory contains three migration files:

- `001_initial_migration.js` sets up the migrations support by deploying a +Migrations+ contract.
- `002_deploy_contracts.js` deploys the sample rewarder contract, using a test version of the CampGenie
  token contract.
- `003_adjust_balances.js` sets up the correct balances by transferring all the tokens in the token
  contract to the rewarder contract's address.

There is also a sample upgrade migration file `upgrade_contract.js-sample` whose is described later.

## Tests

The `test` directory contains sample JavaScript test scripts.

The Truffle sandboxing feature works fine, but it has its quirks, and that causes some tests to fail if
run in the same session, so we also provide a test wrapper that executes each test file separately:
instead of running `truffle test`, use the wrapper `scripts/test.sh`.

Finally, there is a script (`scripts/ganache.sh`) that you can use to start a ganache client configured
for testing. You can start it so that it keeps its database across runs, which is nice for testing the
application UI. Run `scripts/ganache.sh -h` for information about the available options.

## Upgrading a contract

## Support for contract upgrades

This file contains suggestions on how to support some types of contract upgrades using Truffle
migrations.

### Background

The Truffle migration framework runs migration files sequentially, but it seems that it does not
quite wait for one to complete before the next one is started. This can cause race conditions
under some circumstances. For example, say we have three migrations:

1. Deploy the Migrations contract.

2. Deploy contract C, which gets loaded at address A1.

3. Perform some operations with C(A1).

We then make changes to C and create a new migration to deploy the new version C2. We run the
migration, and things seem to work fine: the address of C is now A2, and when we use the
truffle-contract API a call to `C.deployed()` returns C(A2), not C(A1). So far so good.

But, if we were to run the four migrations at the same time, we may end up with C(A1) instead of
C(A2). It's not quite clear why that is, but it seems that the contract data (build/contracts/C.json)
is saved at the end of each migration by writing out the current contract state. Unfortunately,
each migration creates its own deployer, and therefore its own contract object; therefore,
migration 3 has contract object C(3) and migration 4 (the upgrade) has contract object C(4).
C(3) and C(4) have a different address, C(3) for the old version of C, and C(4) for the new version.
If migration 3 takes longer to terminate than 4 (perhaps because it has more transactions to wait for),
then it might happen that the C.json file is written for C(4) first, and then for C(3), which
overrides the new address.

This is the theory, and inspection of the truffle-migrate code and strategically placed `console.log`
statements hint that this is what might be happening. It also appears that I can't properly serialize
migrations from within the migration code (since, for example, the deployers change with each
migration, and therefore we cannot store global state there).

### Hack

So instead, we added a hack to manage contract addresses.
These hacks are in the migration utility functions in `migrations/utils.js`.

- `saveAddress` saves a contract object's address in a separate JSON file `build/contract_addresses.json`.
  This file stores the `networks` property of the various contracts.

- `loadAddressData` loads the contents of `build/contract_addresses.json` into a JSON object.

Migrations call `saveAddress` after deploying a contract, like this:

```
let C = artifact.require('./contracts/C.sol');
const mu = require('./utils');

module.exports = function(deployer, network, accounts) {
  deployer.deploy(C)
    .then(function() {
      return C.deployed();
    })
    .then(function(i) {
      mu.saveAddress(C, i.address);
    });
});
```

The `scripts/migrations.sh` script includes a postprocessing step that loads the contents
of `build/contract_addresses.json` and updates the various files in `build/contracts` with
the registered addresses.

### Sample migration

Take a look at `upgrade_contract.js-sample` for a working migration that upgrades the rewarder
contract. This migration was tested and works as expected. Here is what we did to test the process:

1. Clear the `build` directory and compile.

2. Migrate; only migrations 1-3 are defined. At the end of the migration, we have the token
   and rewarder contracts.

3. Run a few iterations of the rewards back end, to disburse some tokens.
   Say that, at the end, we have the rewarder at address R(A1) with N(A1)  tokens left.

4. Edit the contract code for R; for example, add functions or modify code.

5. Compile. (Don't clear `builds` here!)

6. Add an upgrade migration, say `004_upgrade_rewarder.js`; see the sample file.

7. Migrate. This deploys the new version of R ar address R(A2), and also transfers N(A1) tokens
   to the A2 address. At the end of the migration, Truffle has effectively forgotten A1, and
   is using A2 for R. If you look at the contract state in the admin pages, you'll see that the
   address has changed, and it has N(A1) tokens available. (The contract at address A1 is still in
   the blockchain of course, but is no longer in use and its token allocation is 0.)

8. Run the rewards as before.

