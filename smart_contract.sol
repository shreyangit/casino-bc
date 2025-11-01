// SPDX-License-Identifier: GPL-3.0 
pragma solidity >= 0.4.16 < 0.9.0;
/// @title A contract for demonstrate how to write a smart contract 
/// @author Jitendra Kumar
/// @notice For now,this contract just show to set the value of state variable,calculate the sum and get this sum value from the smart contract

contract Test
{ 
    
    // Declaring state variables 
    uint public var1;
    uint public var2;
    uint public sum;
  
    // Defining public function  
    // that sets the value of  
    // the state variable 
    function set(uint x, uint y) public
    { 
        var1 = x;
        var2 = y;
        sum=var1+var2;
    } 
      
    // Defining function to 
    // print the sum of 
    // state variables 
    function get( 
    ) public view returns (uint) { 
        return sum; 
    } 
}