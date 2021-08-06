// =============================================================================
//                                  Config 
// =============================================================================

// sets up web3.js
if (typeof web3 !== 'undefined')  {
	web3 = new Web3(web3.currentProvider);
} else {
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// Default account is the first one
web3.eth.defaultAccount = web3.eth.accounts[0];
// Constant we use later
var GENESIS = '0x0000000000000000000000000000000000000000000000000000000000000000';

// This is the ABI for your contract (get it from Remix, in the 'Compile' tab)
// ============================================================
var abi = [
	{
		"constant": true,
		"inputs": [],
		"name": "getUsers",
		"outputs": [
			{
				"name": "ret",
				"type": "address[]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "users",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "debts",
		"outputs": [
			{
				"name": "",
				"type": "int32"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "debtor",
				"type": "address"
			},
			{
				"name": "creditor",
				"type": "address"
			}
		],
		"name": "lookup",
		"outputs": [
			{
				"name": "ret",
				"type": "int32"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "creditor",
				"type": "address"
			},
			{
				"name": "amount",
				"type": "int32"
			}
		],
		"name": "add_IOU",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "debtor",
				"type": "address"
			},
			{
				"name": "creditor",
				"type": "address"
			},
			{
				"name": "amount",
				"type": "int32"
			}
		],
		"name": "addDebt",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	}
]; // FIXME: fill this in with your contract's ABI

// ============================================================
abiDecoder.addABI(abi);
// call abiDecoder.decodeMethod to use this - see 'getAllFunctionCalls' for more

// Reads in the ABI
var BlockchainSplitwiseContractSpec = web3.eth.contract(abi);

// This is the address of the contract you want to connect to; copy this from Remix
var contractAddress = '0x5840510B55Aa99854E37e2fF330CbFcadA71D3A6' // FIXME: fill this in with your contract's address/hash

var BlockchainSplitwise = BlockchainSplitwiseContractSpec.at(contractAddress)


// =============================================================================
//                            Functions To Implement 
// =============================================================================

// TODO: Add any helper functions here!

// TODO: Return a list of all users (creditors or debtors) in the system
// You can return either:
//   - a list of everyone who has ever sent or received an IOU
// OR
//   - a list of everyone currently owing or being owed money
function getUsers() {
	return BlockchainSplitwise.getUsers();
}

function lookup(debtor, creditor) {
	return BlockchainSplitwise.lookup(debtor, creditor).c[0];
}

// TODO: Get the total amount owed by the user specified by 'user'
function getTotalOwed(user) {
	var owedAmount = 0;
	var users = getUsers();
	for (var i = 0; i < users.length; i++){
		// console.log(user, users[i], lookup(user, users[i]));
		owedAmount += lookup(user, users[i]);
	}
	return owedAmount;
}

// TODO: Get the last time this user has sent or received an IOU, in seconds since Jan. 1, 1970
// Return null if you can't find any activity for the user.
// HINT: Try looking at the way 'getAllFunctionCalls' is written. You can modify it if you'd like.
function getLastActive(user) {
	var functionCalls = getAllFunctionCalls(contractAddress, 'add_IOU');
	functionCalls = functionCalls
		.filter((functionCall) => functionCall.from === user || functionCall.args[0] === user)
		.sort((a, b) => a.timestamp > b.timestamp);
	if (functionCalls.length > 0) 
		return functionCalls[0].timestamp
	return null
}

// TODO: add an IOU ('I owe you') to the system
// The person you owe money is passed as 'creditor'
// The amount you owe them is passed as 'amount'
function add_IOU(creditor, amount) {

	var path = doBFS(creditor, web3.eth.defaultAccount, getNeighbors)
	var min = 0;
	if (path !== null){
		min = amount;
		for (var i = 0; i < path.length - 1; i++){
			var amount2 = lookup(path[i], path[i + 1])
			if (amount2 < min)
				min = amount2;
		}
		// console.log("minimum", min);
		for(var i = 0; i < path.length - 1; i++){
			BlockchainSplitwise.addDebt(path[i], path[i+1], -min)	
		}
		
	}
	BlockchainSplitwise.add_IOU(creditor, amount - min,{gas:300000});
	// console.log("path", path)
}

function getNeighbors(user) {
	var neighbors = [];
	var users = getUsers();
	for (var i = 0; i < users.length; i++)
		if(lookup(user, users[i]) > 0)
			neighbors.push(users[i]);
	// console.log("user", user, neighbors)
	return neighbors;	
}

// =============================================================================
//                              Provided Functions 
// =============================================================================
// Reading and understanding these should help you implement the above

// This searches the block history for all calls to 'functionName' (string) on the 'addressOfContract' (string) contract
// It returns an array of objects, one for each call, containing the sender ('from') and arguments ('args')
function getAllFunctionCalls(addressOfContract, functionName) {
	var curBlock = web3.eth.blockNumber;
	var function_calls = [];
	while (curBlock !== GENESIS) {
	  var b = web3.eth.getBlock(curBlock, true);
	  var txns = b.transactions;
	  for (var j = 0; j < txns.length; j++) {
	  	var txn = txns[j];
	  	// check that destination of txn is our contract
	  	if (txn.to === addressOfContract) {
	  		var func_call = abiDecoder.decodeMethod(txn.input);
	  		// check that the function getting called in this txn is 'functionName'
	  		if (func_call && func_call.name === functionName) {
	  			var args = func_call.params.map(function (x) {return x.value});
	  			function_calls.push({
	  				from: txn.from,
	  				args: args,
	  				timestamp: b.timestamp
	  			})
	  		}
	  	}
	  }
	  curBlock = b.parentHash;
	}
	return function_calls;
}

// We've provided a breadth-first search implementation for you, if that's useful
// It will find a path from start to end (or return null if none exists)
// You just need to pass in a function ('getNeighbors') that takes a node (string) and returns its neighbors (as an array)
function doBFS(start, end, getNeighbors) {
	var queue = [[start]];
	while (queue.length > 0) {
		var cur = queue.shift();
		var lastNode = cur[cur.length-1]
		if (lastNode === end) {
			return cur;
		} else {
			var neighbors = getNeighbors(lastNode);
			for (var i = 0; i < neighbors.length; i++) {
				queue.push(cur.concat([neighbors[i]]));
			}
		}
	}
	return null;
}
// =============================================================================
//                                      UI 
// =============================================================================

// This code updates the 'My Account' UI with the results of your functions
$("#total_owed").html("$"+getTotalOwed(web3.eth.defaultAccount));
$("#last_active").html(timeConverter(getLastActive(web3.eth.defaultAccount)));
$("#myaccount").change(function() {
	web3.eth.defaultAccount = $(this).val();
	$("#total_owed").html("$"+getTotalOwed(web3.eth.defaultAccount));
	$("#last_active").html(timeConverter(getLastActive(web3.eth.defaultAccount)))
});

// Allows switching between accounts in 'My Account' and the 'fast-copy' in 'Address of person you owe
var opts = web3.eth.accounts.map(function (a) { return '<option value="'+a+'">'+a+'</option>' })
$(".account").html(opts);
$(".wallet_addresses").html(web3.eth.accounts.map(function (a) { return '<li>'+a+'</li>' }))

// This code updates the 'Users' list in the UI with the results of your function
$("#all_users").html(getUsers().map(function (u,i) { return "<li>"+u+"</li>" }));

// This runs the 'add_IOU' function when you click the button
// It passes the values from the two inputs above
$("#addiou").click(function() {
  add_IOU($("#creditor").val(), $("#amount").val());
  window.location.reload(true); // refreshes the page after
});

// This is a log function, provided if you want to display things to the page instead of the JavaScript console
// Pass in a discription of what you're printing, and then the object to print
function log(description, obj) {
	$("#log").html($("#log").html() + description + ": " + JSON.stringify(obj, null, 2) + "\n\n");
}


