const util = require('./util.js');
const RicoToken = artifacts.require("./RicoToken.sol");

contract('RicoToken', accounts => {
    const owner = accounts[0];
    const admin = accounts[1];
    const ICOAcc = accounts[2];
    const user1 = accounts[3];
    const user2 = accounts[4];
    const ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;
    let token;

    before(async () => {
        token = await RicoToken.new(admin, { from: owner });
    });

    describe('Initial State', () => {
        it('should have a name', async () => {
            const name = await token.name();
            assert.equal(name, 'Rico Token');
        });

        it('should have a symbol', async () => {
            const symbol = await token.symbol();
            assert.equal(symbol, 'RICO');
        });

        it('should have 18 decimals', async () => {
            const decimals = await token.decimals();
            assert(decimals.eq(18));
        });

        it('should have an initial supply', async () => {
            const INITIAL_SUPPLY = await token.INITIAL_SUPPLY();
            assert.equal(INITIAL_SUPPLY, (21000000 * (10 ** 18)));
        });

        it('should have an ICO allowance', async () => {
            const ICO_ALLOWANCE = await token.ICO_ALLOWANCE();
            assert.equal(ICO_ALLOWANCE, (11550000 * (10 ** 18)));
        });

        it('should have an admin allowance', async () => {
            const INITIAL_SUPPLY = await token.INITIAL_SUPPLY();
            const ICO_ALLOWANCE = await token.ICO_ALLOWANCE();
            const ADMIN_ALLOWANCE = await token.ADMIN_ALLOWANCE();
            assert.equal(ADMIN_ALLOWANCE, (INITIAL_SUPPLY - ICO_ALLOWANCE));
        });

        it("should have ICOAddr initialized to the 0 address", async () => {
            const result = await token.ICOAddr();
            assert.equal(result, ZERO_ADDRESS);
        });

        it("should have transferEnabled initialized to false", async () => {
            const result = await token.transferEnabled();
            assert.equal(result, false);
        });
    });

    describe('constructor', () => {
        it('should assign totalSupply_ to equal INITIAL_SUPPLY', async () => {
            const totalSupply = (await token.totalSupply()).toNumber();
            const INITIAL_SUPPLY = (await token.INITIAL_SUPPLY()).toNumber();

            assert.equal(totalSupply, INITIAL_SUPPLY);
        });

        it('should assign the balance of msg.sender to equal totalSupply_', async () => {
            const totalSupply = (await token.totalSupply()).toNumber();
            const ownerBalance = (await token.balanceOf(owner)).toNumber();

            assert.equal(ownerBalance, totalSupply);
        });

        it.skip('should emit the Transfer event with the parameters address(0), msg.sender, and totalSupply_', async () => {
            const totalSupply = await token.totalSupply();
            const instance = await RicoToken.deployed();
            const tx = await instance.create();

            assert.equal(logs.length, 1);
            assert.equal(tx.logs[0].event, 'Transfer');
            assert.equal(tx.logs[0].args.from.valueOf(), ZERO_ADDRESS);
            assert.equal(tx.logs[0].args.to.valueOf(), owner);
            assert.equal(tx.logs[0].args.value, totalSupply);
        });

        it('should assign the state variable adminAddr to equal the parameter _admin', async () => {
            const adminAddr = await token.adminAddr();

            assert.equal(adminAddr, admin);
        });

        it.skip('should invoke approve with the parameters adminAddr and ADMIN_ALLOWANCE', async () => {
            const adminAddr = await token.adminAddr();
            const ADMIN_ALLOWANCE = await token.ADMIN_ALLOWANCE();

            assert.isTrue(token.approve.calledOnce);
            assert.equal(token.approve.args, adminAddr, ADMIN_ALLOWANCE);
        });

        it.skip('should emit the Approval event with the parameters owner, adminAddr, and ADMIN_ALLOWANCE', async () => {
            const adminAddr = await token.adminAddr();
            const ADMIN_ALLOWANCE = await token.ADMIN_ALLOWANCE();
            const instance = await RicoToken.deployed();
            const tx = await instance.create();

            assert.equal(tx.logs.length, 1);
            assert.equal(tx.logs[0].event, 'Approval');
            assert.equal(tx.logs[0].args.from.valueOf(), owner);
            assert.equal(tx.logs[0].args.to.valueOf(), adminAddr);
            assert.equal(tx.logs[0].args.value, ADMIN_ALLOWANCE);
        });
    });

    describe('setICO', () => {
        let ICO_ALLOWANCE;

        beforeEach(async () => {
            token = await RicoToken.new(admin, { from: owner });
        });

        before(async () => {
            ICO_ALLOWANCE = (await token.ICO_ALLOWANCE()).toNumber();
        });

        it('should revert if modifier onlyOwner is not fulfilled', async () => {
            const setICO = token.setICO(ICOAcc, ICO_ALLOWANCE, { from: user1 });

            await util.assertRevert(setICO);
        });

        it('should revert if transferEnabled is true', async () => {
            await token.enableTransfer({ from: owner });
            const transferEnabled = await token.transferEnabled();
            const setICO = token.setICO(ICOAcc, ICO_ALLOWANCE, { from: owner });

            assert.equal(transferEnabled, true);
            await util.assertRevert(setICO);
        });

        it('should revert if _amountForSale is greater than ICO_ALLOWANCE', async () => {
            const _amountForSale = ICO_ALLOWANCE * 2;
            const setICO = token.setICO(ICOAcc, _amountForSale, { from: owner });

            assert.isAbove(_amountForSale, ICO_ALLOWANCE);
            await util.assertRevert(setICO);
        });

        it('should assign amount to equal ICO_ALLOWANCE if _amountForSale is 0', async () => {
            const _amountForSale = 0;
            const setICO = await token.setICO(ICOAcc, _amountForSale, { from: owner });
            const amount = setICO.logs[0].args.value;

            assert.equal(amount, ICO_ALLOWANCE);
        });

        it('should emit the Approval event with the parameters owner, ICOAddr, and amount', async () => {
            const setICO = await token.setICO(ICOAcc, ICO_ALLOWANCE, { from: owner });
            const logs = setICO.logs;

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Approval');
            assert.equal(logs[0].args.owner, owner);
            assert.equal(logs[0].args.spender, ICOAcc);
            assert.equal(logs[0].args.value, ICO_ALLOWANCE);
        });

        it('should assign ICOAddr to equal _ICOAddr', async () => {
            const setICO = await token.setICO(ICOAcc, ICO_ALLOWANCE, { from: owner });
            const ICOAddr = await token.ICOAddr();

            assert.equal(ICOAddr, ICOAcc);
        });

        it('should revert if modifier onlyWhenICOAddrNotSet is not fulfilled', async () => {
            const ICOAddr = await token.ICOAddr();
            assert.equal(ICOAddr, ZERO_ADDRESS);
            const setICO = await token.setICO(ICOAcc, ICO_ALLOWANCE, { from: owner });
            assert.isOk(setICO);

            const ICOAddr2 = await token.ICOAddr();
            assert.equal(ICOAddr2, ICOAcc);
            const setICO2 = token.setICO(ICOAcc, ICO_ALLOWANCE, { from: owner });
            await util.assertRevert(setICO2);
        });
    });

    describe('enableTransfer', () => {
        it('should revert if modifier onlyOwner is not fulfilled', async () => {
            const transferEnabled = await token.transferEnabled();
            const enableTransfer = token.enableTransfer({ from: user1 });

            assert.equal(transferEnabled, false);
            await util.assertRevert(enableTransfer);
        });

        it('should assign transferEnabled to equal true', async () => {
            const enableTransfer = await token.enableTransfer({ from: owner });
            const transferEnabled = await token.transferEnabled();

            assert.equal(transferEnabled, true);
        });

        it('should end the ICO by approving ICOAddr with balance 0', async () => {
            const enableTransfer = token.enableTransfer({ from: owner });
            const transferEnabled = await token.transferEnabled();
            const ICOBalance = await token.balanceOf(ICOAcc);

            assert.equal(transferEnabled, true);
            assert.equal(ICOBalance, 0);
        });

        it('should emit the Approval event with the parameters owner, ICOAddr, and 0', async () => {
            const enableTransfer = await token.enableTransfer({ from: owner });
            const ICOAddr = await token.ICOAddr();
            const logs = enableTransfer.logs;

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Approval');
            assert.equal(logs[0].args.owner, owner);
            assert.equal(logs[0].args.spender, ICOAddr);
            assert.equal(logs[0].args.value, 0);
        });
    });

    describe('transfer', () => {
        beforeEach(async () => {
            token = await RicoToken.new(admin, { from: owner });
        });

        it('should revert if modifier onlyWhenTransferEnabled is not fulfilled', async () => {
            const transferEnabled = await token.transferEnabled();
            const transfer = token.transfer(user2, 100, { from: owner });

            assert.equal(transferEnabled, false);
            await util.assertRevert(transfer);
        });

        it('should revert if modifier validDestination is not fulfilled', async () => {
            const ICO_ALLOWANCE = await token.ICO_ALLOWANCE();
            await token.setICO(ICOAcc, ICO_ALLOWANCE, { from: owner });
            await token.enableTransfer({ from: owner });
            const transferEnabled = await token.transferEnabled();

            assert.equal(transferEnabled, true);
            await util.assertRevert(token.transfer(ZERO_ADDRESS, 100, { from: user1 }));
            await util.assertRevert(token.transfer(token.address, 100, { from: user1 }));
            await util.assertRevert(token.transfer(owner, 100, { from: user1 }));
            await util.assertRevert(token.transfer(admin, 100, { from: user1 }));
            await util.assertRevert(token.transfer(ICOAcc, 100, { from: user1 }));
        });

        it('should allow transfers after transferEnabled', async () => {
            await token.enableTransfer({ from: owner });
            const transferEnabled = await token.transferEnabled();
            const ownerBalance = await token.balanceOf(owner);
            await token.transfer(user2, 100, { from: owner });
            const user2Balance = await token.balanceOf(user2);

            assert.equal(transferEnabled, true);
            assert.equal(ownerBalance, ownerBalance - 100);
            assert.equal(user2Balance, 100);
        });
    });

    describe('transferFrom', () => {
        beforeEach(async () => {
            token = await RicoToken.new(admin, { from: owner });
        });

        it('should revert if modifier onlyWhenTransferEnabled is not fulfilled', async () => {
            const transferEnabled = await token.transferEnabled();
            const transferFrom = token.transferFrom(owner, user2, 100, { from: user2 });

            assert.equal(transferEnabled, false);
            await util.assertRevert(transferFrom);
        });

        it('should revert if modifier validDestination is not fulfilled', async () => {
            const ICO_ALLOWANCE = await token.ICO_ALLOWANCE();
            await token.setICO(ICOAcc, ICO_ALLOWANCE, { from: owner });
            await token.enableTransfer({ from: owner });
            const transferEnabled = await token.transferEnabled();

            assert.equal(transferEnabled, true);
            await util.assertRevert(token.transferFrom(owner, ZERO_ADDRESS, 100, { from: user1 }));
            await util.assertRevert(token.transferFrom(owner, token.address, 100, { from: user1 }));
            await util.assertRevert(token.transferFrom(owner, owner, 100, { from: user1 }));
            await util.assertRevert(token.transferFrom(owner, admin, 100, { from: user1 }));
            await util.assertRevert(token.transferFrom(owner, ICOAcc, 100, { from: user1 }));
        });

        it('should allow admin, and ICOAddr to transfer before transferEnabled', async () => {
            const transferEnabled = await token.transferEnabled();
            await token.transferFrom(owner, user2, 100, { from: admin });
            const adminAllowance = await token.allowance(owner, admin);
            const ADMIN_ALLOWANCE = await token.ADMIN_ALLOWANCE();
            const user2Balance = await token.balanceOf(user2);

            assert.equal(transferEnabled, false);
            assert.equal(adminAllowance, ADMIN_ALLOWANCE - 100);
            assert.equal(user2Balance, 100);

            const ICO_ALLOWANCE = await token.ICO_ALLOWANCE();
            await token.setICO(ICOAcc, ICO_ALLOWANCE, { from: owner });
            await token.transferFrom(owner, user2, 100, { from: ICOAcc });
            const ICOAllowance = await token.allowance(owner, ICOAcc);
            const user2Balance2 = await token.balanceOf(user2);

            assert.equal(ICOAllowance, ICO_ALLOWANCE - 100);
            assert.equal(user2Balance2, 200);
        });

        it('should allow users to transferFrom after transferEnabled', async () => {
            await token.enableTransfer({ from: owner });
            await token.approve(user2, 100, { from: owner });
            const transferEnabled = await token.transferEnabled();
            await token.transferFrom(owner, user2, 100, { from: user2 });
            const user2Allowance = await token.allowance(owner, user2);
            const user2Balance = await token.balanceOf(user2);

            assert.equal(transferEnabled, true);
            assert.equal(user2Allowance, 0);
            assert.equal(user2Balance, 100);
        });
    });

    describe('burn', () => {
        beforeEach(async () => {
            token = await RicoToken.new(admin, { from: owner });
        });

        it('should revert if not transferEnabled or msg.sender is not owner', async () => {
            const transferEnabled = await token.transferEnabled();
            const burn = token.burn(100, { from: user1 });

            assert.equal(transferEnabled, false);
            await util.assertRevert(burn)
        });

        it('should allow users to burn _value amount and totalSupply_ after transferEnabled', async () => {
            await token.enableTransfer({ from: owner });
            const transferEnabled = await token.transferEnabled();
            const totalSupply = await token.totalSupply();
            await token.transfer(user1, 100, { from: owner });
            await token.burn(100, { from: user1 });
            const user1Balance = await token.balanceOf(user1);
            const totalSupply2 = await token.totalSupply();

            assert.equal(transferEnabled, true);
            assert.equal(user1Balance, 0);
            assert.equal(totalSupply2, totalSupply - 100);
        });

        it('should revert if burn _value amount is greater than the balance of msg.sender', async () => {
            const totalSupply = await token.totalSupply();
            const ownerBalance = await token.balanceOf(owner);
            const burn = token.burn(ownerBalance * 2, { from: owner });

            assert.equal(totalSupply, totalSupply);
            assert.equal(ownerBalance, ownerBalance);
            await util.assertRevert(burn);
        });

        it('should emit the Burn event with the parameters burner, and value', async () => {
            const burn = await token.burn(100, { from: owner });
            const logs = burn.logs;

            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, 'Burn');
            assert.equal(logs[0].args.burner, owner);
            assert.equal(logs[0].args.value, 100);
        });

        it('should emit the Transfer event with the parameters from, to, and value', async () => {
            const burn = await token.burn(100, { from: owner });
            const logs = burn.logs;

            assert.equal(logs.length, 2);
            assert.equal(logs[1].event, 'Transfer');
            assert.equal(logs[1].args.from, owner);
            assert.equal(logs[1].args.to, ZERO_ADDRESS);
            assert.equal(logs[1].args.value, 100);
        });
    });
});