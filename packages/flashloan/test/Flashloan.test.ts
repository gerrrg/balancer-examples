import { expect } from 'chai';
import { Vault } from '@balancer-labs/typechain';
import { ethers } from 'hardhat';

import {
  TokenList,
  setupEnvironment,
  pickTokenAddresses,
} from '@balancer-examples/shared-dependencies';
import { fp } from '@balancer-examples/shared-dependencies/numbers';
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
const tokenAmount = fp(100);

describe('Flashloan Recipient', function () {
  let vault: Vault;
  let tokens: TokenList;
  let tokenAddresses: string[];
  let deployer: SignerWithAddress;
  let trader: SignerWithAddress;
  let liquidityProvider: SignerWithAddress;
  let recipient: Contract;

  async function deployFlashloanRecipient(params: unknown[]): Promise<Contract> {
    const FlashLoanRecipient = await ethers.getContractFactory('FlashLoanRecipient');
    const flashLoanRecipient = await FlashLoanRecipient.deploy(...params);
    const instance: Contract = await flashLoanRecipient.deployed();
    return instance;
  }

  async function sendAllToVault(fromAccount: SignerWithAddress, sym: string) {
      const amount = await tokens[sym].balanceOf(fromAccount.address);
      await tokens[sym].connect(fromAccount).transfer(vault.address, amount);
  }

  beforeEach('Deploy Vault, Tokens, FlashLoanRecipient', async () => {
    ({ vault, tokens, deployer, trader, liquidityProvider} = await setupEnvironment());
    tokenAddresses = pickTokenAddresses(tokens, 2);
    recipient = await deployFlashloanRecipient([vault.address]);
  });

  context('With tokens added to Vault', () => {
    beforeEach('Send tokens to Vault', async () => {
      await sendAllToVault(liquidityProvider, "TKN0");
      await sendAllToVault(liquidityProvider, "TKN1");
    });

    it('Trader takes out Flashloan', async () => {
      const amt0 = await tokens["TKN0"].balanceOf(vault.address);
      const amt1 = await tokens["TKN1"].balanceOf(vault.address);

      await recipient.connect(trader).makeFlashLoan(tokenAddresses, [fp(200), fp(200)], "0x");
    });
  });
});
