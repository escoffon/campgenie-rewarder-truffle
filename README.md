# CampGenie rewarder sample Truffle box

This [Truffle box](https://truffleframework.com/docs/advanced/truffle-boxes)
contains an example of a rewarder contract implementation and Truffle support for development,
testing, and deployment.

## Setup

### As a Truffle box

The folowing (incomplete) instructions describe how to set up as a Truffle box; since the box is not
registered with Truffle, `truffle unbox` fails to find the distribution. We are leaving the instructions
here for future use when and if the box is registered with Truffle.

View the [Truffle documentation](https://truffleframework.com/docs) for instructions on installing
and configuring [Truffle](https://truffleframework.com), which you will use to unpack the Truffle
box.

To unpack the box:

    truffle unbox *box name*

The unpacked box will install [npm](https://www.npmjs.com) packages, including a local version of Truffle
used by the various scripts.

### Download from Github

The box is available at Github [here](https://github.com/escoffon/campgenie-rewarder-truffle).
You can checkout the repository, download a zip file, or clone it.
Once you have the code locally, make sure you run `npm install`.

## The box contents

### Contracts

The `contracts` directory contains a sample rewarder contract implementation (CGRewarderSample.sol),
the Truffle migrations contract, and contracts used by the test harness.

## Migrations

The `migrations` directory contains three migration files:

- `001_initial_migration.js` sets up the migrations support by deploying a `Migrations` contract.
- `002_deploy_contracts.js` deploys the sample rewarder contract, using a test version of the CampGenie
  token contract.
- `003_adjust_balances.js` sets up the correct balances by transferring all the tokens in the token
  contract to the rewarder contract's address.

There is also a sample upgrade migration file `upgrade_contract.js-sample` whose usage is described later.

## Tests

The `test` directory contains sample JavaScript test scripts.

The Truffle sandboxing feature works fine, but it has its quirks, and that causes some tests to fail if
run in the same session, so we also provide a test wrapper that executes each test file separately:
instead of running `truffle test`, use the wrapper `scripts/test.sh`.

Finally, there is a script (`scripts/ganache.sh`) that you can use to start a ganache client configured
for testing. You can start it so that it keeps its database across runs, which is nice for testing the
application UI. Run `scripts/ganache.sh -h` for information about the available options.

## Upgrading a contract

The general process for upgrading a rewarder contract consists of the following steps:

1. Edit the Solidity code as necessary.

2. Compile (using `scripts/compile.sh`) to generate a new contract.

3. Run a migration to install the new contract code; this migration also needs to call the rewarder
   contract's `upgrade` method to transfer ownership to the new contract.

The `migrations` directory contains a sample migration for upgrading a rewarder contract
in `upgrade_rewarder.js-sample`. To use that migration,
rename it to a valid migration file, for example `004_upgrade.js`, and then run the
`scripts/migrate.sh` script after making edits to the code and recompiling.
The migration gets the currently deployed rewarder contract and delpoys a new version of the rewarder
code that uses the same token contract as the origial. It then calls `upgrade` on the old contract,
passing the new contract address; the base implementation of the `upgrade` method transfers the
current token balance from the old contract to the new contract.

Note that the upgrade migration works even if you don't modify the rewarder code; in that case, all
you are doing is to replace the current contract code with an identical copy at a different address.

### Sample migration

Take a look at `upgrade_rewarder.js-sample` for a working migration that upgrades the rewarder
contract. This migration was tested and works as expected. Here is what we did to test the process:

1. Clear the `build` directory and compile.

2. Migrate; only migrations 1-3 are defined. At the end of the migration, we have the token
   and rewarder contracts.

3. Run a few iterations of the rewards functions, to disburse some tokens.
   Say that, at the end, we have the rewarder at address R(A1) with N(A1) tokens left.

4. Edit the contract code for R; for example, add functions or modify code. (Or don't edit, in which
   case the new contract will be identical to the original.)

5. Compile. (Don't clear `builds` here!)

6. Add an upgrade migration, say `004_upgrade_rewarder.js`; see the sample file.

7. Migrate. This deploys the new version of R ar address R(A2), and also transfers N(A1) tokens
   to the A2 address. At the end of the migration, Truffle has effectively forgotten A1, and
   is using A2 for R. If you look at the contract state in `truffle console`, you'll see that the
   deployed address has changed, and it has N(A1) tokens available.
   (The contract at address A1 is still in
   the blockchain of course, but is no longer in use and its token allocation is 0.)

8. Run the rewards as before.

