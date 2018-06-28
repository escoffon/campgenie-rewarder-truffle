pragma solidity ^0.4.23;

import 'campgenie-base-contracts/contracts/CGRewarderBase.sol';

/**
 * @title Sample CampGenie token rewards contract.
 * @dev This contract implements the general framework for CampGenie tokens reward contracts.
 */

contract CGRewarderSample is CGRewarderBase {
    uint32 internal minRaters;
    uint32 internal minRating;
    uint32 internal earlyContributions;
    uint128 internal numContributions;
    
    /**
     * Constructor.
     *
     * Associates the contract with a given token contract.
     *
     * @param _tokenizer The token contract to use.
     */

    constructor(address _tokenizer)
        CGRewarderBase(_tokenizer)
        public
    {
        versionNumber = 10000; /* 0.1.0 = 0 + (0 * 10000) + (0 * 10000000) */

        minRaters = 10;
        minRating = 10;
        earlyContributions = 100;
        numContributions = 0;
    }

    /**
     * @notice Estimate the current reward for a contribution.
     * @param _raters How many users have rated the contribution.
     * @param _rating An integer from 0 to 100 to indicate the rating (100 is the highest rating).
     */

    function estimateContributionReward(uint32 _raters, uint32 _rating)
        public view returns (uint256)
    {
        return calculateContributionReward(_raters, _rating);
    }

    /**
     * @notice Disburse tokens as a reward for making a contribution.
     * @dev The disbursement does not happen when the contribution is generated, but rather after a minimum
     *  amount of users have rated it. Also, contributions must have a rating higher than a given threshold
     *  in order to be rewarded.
     * @param _to The address to which tokens should be disbursed.
     * @param _raters How many users have rated the contribution. At least `minRaters` users are required.
     * @param _rating An integer from 0 to 100 to indicate the rating (100 is the highest rating).
     *  A value of at least `minRating` is required.
     */

    function rewardContribution(address _to, uint32 _raters, uint32 _rating)
        onlyOwner whenNotPaused public
    {
        uint256 value = calculateContributionReward(_raters, _rating);
        numContributions += 1;
        
        disburse(_to, value);
    }

    /**
     * @notice Estimate the current reward for another action.
     */

    function estimateActionReward()
        public pure returns (uint256)
    {
        return calculateActionReward();
    }

    /**
     * @notice Disburse tokens as a reward for another action.
     * @dev This reward is immediate: it is disbursed at the time of the action.
     * @param _to The address to which tokens should be disbursed.
     */

    function rewardAction(address _to)
        onlyOwner whenNotPaused public
    {
        uint256 value = calculateActionReward();

        disburse(_to, value);
    }

    /**
     * Get the current count of rewarded contributions.
     * @return The number of rewarded contributions, as a uint128.
     */
    function getRewardedContributions() public view returns (uint128) {
        return numContributions;
    }

    /**
     * Get the minimum number of raters required to disburse funds.
     * @return The minimum number, as a uint32.
     */
    function getRequiredRaters() public view returns (uint32) {
        return minRaters;
    }

    /**
     * Set the minimum number of raters required to disburse funds.
     * @param _value The new minimum number.
     */
    function setRequiredRaters(uint32 _value) onlyOwner public {
        require(_value > 0);
        minRaters = _value;
    }

    /**
     * Get the minimum contribution rating required to disburse funds.
     * @return The minimum contribution rating, as a uint32.
     */
    function getRequiredRating() public view returns (uint32) {
        return minRating;
    }

    /**
     * Set the minimum contribution rating required to disburse funds.
     * @param _value The new minimum rating.
     */
    function setRequiredRating(uint32 _value) onlyOwner public {
        require((_value > 0) && (_value < 100));
        minRating = _value;
    }

    /**
     * Get the early contributions limit.
     * @return The early contributions limit, as a uint32.
     */

    function getEarlyContributions() public view returns (uint32) {
        return earlyContributions;
    }

    /**
     * Set the early contributions limit.
     * @param _early The early contributions limit.
     */

    function setEarlyContributionsLimit(uint32 _early) onlyOwner public {
        require(_early >= 0);
        earlyContributions = _early;
    }

    /**
     * @notice Upgrade to a new version of the contract.
     * @dev Here as a sample; all it does is call the superclass.
     * @param _to The address of the new contract.
     */

    function upgrade(address _to) onlyOwner whenNotPaused public
    {
        super.upgrade(_to);
    }

    /**
     * @dev This is the method that implements the reward algorithm for contributions,
     *  including the checks for minimum raters and rating.
     *  Note that the method does no disbursing, so that it can be used both by queries and reward calls.
     *
     *  The algorithm first assigns a constant value to the reward, and then weighs using the rating.
     *  (It also trigger an exception if not enough raters are present.)
     *  It then gives a premium to the first `earlyContributions` contributions.
     *
     * @param _raters How many users have rated the contribution.
     * @param _rating An integer from 0 to 100 to indicate the rating (100 is the highest rating).
     *
     * @return The reward value uint256.
     */
    
    function calculateContributionReward(uint32 _raters, uint32 _rating)
        internal view returns (uint256)
    {
        require(_raters >= minRaters);
        require((_rating > minRating) && (_rating <= 100));

        uint256 value = 200;

        // OK, now we can adjust with the rating

        uint256 adjustedValue = (_rating * value) / 100;

        // one last thing: early contributions get an extra boost

        if (numContributions < earlyContributions) {
            adjustedValue *= 2;
        }

        return adjustedValue;
    }

    /**
     * @dev This is the method that implements the reward algorithm for another action.
     *  Note that the method does no disbursing, so that it can be used both by queries and reward calls.
     *
     *  The algorithm just assigns a constant reward value.
     *
     * @return The reward value uint256.
     */

    function calculateActionReward()
        internal pure returns (uint256)
    {
        uint256 value = 500;

        return value;
    }
}
