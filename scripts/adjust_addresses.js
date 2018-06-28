// Node script that reads the contract address file generated by the migration utility :saveAddress
// and merges its contents into the Truffle contract data in build/contracts

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const mu = require('../migrations/utils');

function _xpath(cname) {
    return path.join(path.dirname(__dirname), 'build', 'contracts', cname + '.json');
};

function _adjust_contract(cname, json_addr) {
    let cdata;
    try {
	cdata = fs.readFileSync(_xpath(cname), 'utf8');
    } catch (x) {
	cdata = null;
    }

    if (_.isEmpty(cdata))
    {
	console.log("-- no truffle data for: " + cname);
    }
    else
    {
	console.log("-- adjust address for: " + cname);

	let json = JSON.parse(cdata);
	if (_.isObject(json.networks))
	{
	    json.networks = _.merge({}, json.networks, json_addr[cname].networks);
	}
	else
	{
	    // no networks? This should not really happen...

	    console.log("   warning: no :networks property in the Truffle data");
	    json.networks = json_addr[cname].networks;
	}

	fs.writeFileSync(_xpath(cname), JSON.stringify(json, null, 2), 'utf8');
    }
};

let json = mu.loadAddressData();
let contracts = _.keys(json);

_.forEach(contracts, function(cname, idx) {
	      _adjust_contract(cname, json);
	  });

process.exit(0);