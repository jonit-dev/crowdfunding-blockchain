// SPDX-License-Identifier: MIT
 
pragma solidity ^0.8.9;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(uint minimum) public {
        address newCampaign = address(new Campaign(minimum, msg.sender));
        deployedCampaigns.push(newCampaign);
    }

    function getDeployedCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }

}

contract Campaign {

    struct Request {
        string description;
        uint value;
        address recipient;
        bool complete;
        uint approvalCount;
        mapping(address => bool) approvals;
    }

    Request[] public requests;
    address public manager;
    uint public minimumContribution;
    mapping(address => bool) public approvers;
    uint approversCount;
    uint public numRequests;

    constructor(uint minimum, address managerAddress) {  
        manager = managerAddress;
        minimumContribution = minimum;
    }

    function contribute() public payable {
        require(msg.value >= minimumContribution);

        approvers[msg.sender] = true;
        approversCount++;
    }

    function createRequest(string memory description, uint value, address recipient) public restrictedToManager   {

        Request storage newRequest = requests.push();
        numRequests++;

        newRequest.description = description;
        newRequest.value = value;
        newRequest.recipient = recipient;
        newRequest.complete = false;
        newRequest.approvalCount = 0;
                
    }

    function finalizeRequest(uint requestIndex) public restrictedToManager {

        // get request information
        Request storage request = requests[requestIndex];

        require(request.approvalCount > (approversCount / 2));
        require(!request.complete);

        payable(request.recipient).transfer(request.value);
        request.complete = true;
    }

    function approveRequest(uint requestIndex) public {

        // get request information
        Request storage request = requests[requestIndex];

        // make sure that this person already donated to this campaigns
        require(approvers[msg.sender]);
               
        // and make sure we didn't approved this before.
        require(!request.approvals[msg.sender]);

        request.approvals[msg.sender] = true;
        request.approvalCount++;

    }

    modifier restrictedToManager() {
        require(msg.sender == manager);
        _;
    }

    function getTotalContributionsWei() public view returns (uint) {
        return address(this).balance;
    }


}
