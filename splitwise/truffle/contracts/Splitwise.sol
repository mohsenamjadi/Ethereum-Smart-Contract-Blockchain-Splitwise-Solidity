// Please paste your contract's solidity code here
// Note that writing a contract here WILL NOT deploy it and allow you to access it from your client
// You should write and develop your contract in Remix and then, before submitting, copy and paste it here


pragma solidity ^0.5.0;

contract Splitwise{
      mapping(address => mapping (address => int32)) public debts;
      address[] public users;
      
      function lookup(address debtor, address creditor) public view returns (int32 ret){
          ret = debts[debtor][creditor];
      }
      function add_IOU(address creditor, int32 amount) public{
          addDebt(msg.sender, creditor, amount);
      }
      function addDebt(address debtor, address creditor , int32 amount) public{
          debts[debtor][creditor] += amount;
          addToUsers(creditor);
          addToUsers(debtor);
      }
      function addToUsers(address add) private{
          for (uint i = 0; i < users.length; i++){
            if (users[i] == add)
                return;
            }
        users.push(add);
      }
    //   function getDepts(address from) public view returns (mapping (address => uint256) memory) {
    //      mapping(address => uint32) memory ret;
    //      return ret;
    //   }
    
    function getUsers() public view returns (address[] memory ret){
        ret = new address[](users.length);
        for (uint i = 0; i < users.length; i++){
            ret[i] = users[i];
        }
    }
      
}