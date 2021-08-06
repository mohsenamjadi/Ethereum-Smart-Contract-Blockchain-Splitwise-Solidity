const Splitwise = artifacts.require("Splitwise");

contract('Splitwise', (accounts) => {

  it("should add 100 credits from accounts[0] to accounts[1] with add_IOU", function() {
    return Splitwise.deployed().then(function(instance) {
      console.log("acount 1 : ", accounts[1].valueOf() )
      instance.add_IOU(accounts[1], 100);
      return instance.lookup(accounts[0], accounts[1])
    }).then(function(balance) {
      console.log(+balance.valueOf());
      assert.equal(balance.valueOf(), 100, "100 wasn't in the account 1");
    });
  });

  it("should add 50 credits from accounts[1] to accounts[2] with addDebt", function() {
    return Splitwise.deployed().then(function(instance) {
      instance.addDebt(accounts[1], accounts[2], 50);
      return instance.lookup(accounts[1], accounts[2])
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 50, "50 wasn't in the account 2");
    });
  });

});
