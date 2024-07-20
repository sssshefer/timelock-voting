![image](https://github.com/user-attachments/assets/1ed462f8-6e45-42bd-9586-553c20a6b183)


# Timelock Voting with Multi-Signature Authentication

This repository contains a Solidity smart contract for a Timelock Voting system with multi-signature authentication. The project demonstrates the use of time-based transaction execution with multi-signature verification to ensure security and consensus among multiple owners.

## Table of Contents

- [Introduction](#introduction)
- [Notes](#notes)
  - [Timelock Mechanism](#timelock-mechanism)
  - [Multi-Signature Authentication](#multi-signature-authentication)
- [Features and Functionality](#features-and-functionality)
- [Implementation](#implementation)
  - [Contract Overview](#contract-overview)
  - [Tests](#tests)
- [Running the Project Locally](#running-the-project-locally)

## Introduction

This project showcases a Timelock Voting contract that allows multiple owners to queue, confirm, and execute transactions after a specified delay. The contract ensures that all transactions are approved by a majority of owners before execution, enhancing security and preventing unauthorized actions. The implementation includes a testing suite written in TypeScript using Hardhat and Ethers.js.

## Notes

### Timelock Mechanism

A timelock mechanism ensures that transactions are executed only after a predetermined delay. This delay period provides a buffer time for owners to review the transaction details

### Multi-Signature Authentication

Multi-signature authentication requires multiple owners to approve a transaction before it can be executed. This increases security by distributing control among several owners, ensuring that no single owner can unilaterally execute transactions. The contract uses a threshold of more than 50% of owners' confirmations for transaction approval.

## Features and Functionality

- **Multi-Signature Authentication**: Ensures transactions are approved by a majority of owners before execution.
- **Timelock Mechanism**: Transactions can only be executed after a specified delay, preventing immediate execution and allowing for review.
- **Transaction Queueing**: Owners can queue transactions with specified execution timestamps.
- **Confirmation and Execution**: Owners can confirm queued transactions, which can then be executed once the required confirmations are met.

## Implementation

### Contract Overview

The `TimelockVoting` contract includes the following key components:

- **Transaction Struct**: Stores transaction details, including queued status, confirmations, and confirmation count.
- **Owner Management**: Manages a list of owners and their confirmation status for transactions.
- **Transaction Queueing**: Allows owners to queue transactions with specific execution timestamps.
- **Confirmation and Execution**: Enables owners to confirm queued transactions and execute them once the required confirmations are met.

### Tests

The project includes a comprehensive test suite written in TypeScript using Hardhat and Ethers.js. The tests cover various scenarios, including adding transactions to the queue, confirming transactions, executing transactions, and handling edge cases

## Running the Project Locally

To run the project locally, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/sssshefer/timelock-voting.git
    ```

2. Navigate to the project directory and install dependencies:
    ```bash
    cd timelock-voting
    npm install
    ```

3. Compile the smart contracts:
    ```bash
    npx hardhat compile
    ```

4. Deploy the contracts to a local Hardhat network:
    ```bash
    npx hardhat node
    npx hardhat run scripts/deploy.ts --network localhost
    ```

5. Run the test suite:
    ```bash
    npx hardhat test
    ```

*Happy coding!*
