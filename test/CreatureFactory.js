const truffleAssert = require('truffle-assertions');
const MockProxyRegistry = artifacts.require(
    "../contracts/MockProxyRegistry.sol"
);
const vals = require('../lib/valuesCommon.js');

const Creature = artifacts.require("../contracts/Creature.sol");
const CreatureFactory = artifacts.require("../contracts/CreatureFactory.sol");
const TestForReentrancyAttack = artifacts.require(
    "../contracts/TestForReentrancyAttack.sol"
);
const toBN = web3.utils.toBN;

contract("CreatureFactory", (accounts) => {

    const TOTAL_OPTIONS = 9;

    const owner = accounts[0];
    const userA = accounts[1];
    const userB = accounts[2];
    const proxyForOwner = accounts[8];

    let creature;
    let myFactory;
    let myLootBox;
    let proxy;

    before(async () => {
        proxy = await MockProxyRegistry.new();
        await proxy.setProxy(owner, proxyForOwner);
        creature = await Creature.new(proxy.address);

        myFactory = await CreatureFactory.new(
            proxy.address,
            creature.address,
        );

        await creature.transferOwnership(myFactory.address);

    })

    describe('constructor', () => {
        it('should set proxyRegistryAddress to the supplied value', async () => {
            assert.equal(await myFactory.proxyRegistryAddress(), proxy.address);

        })
    })

    describe('#mint()', () => {
        it('should not allow non-owner or non-operator to mint', async () => {
            await truffleAssert.fails(
                myFactory.mint(vals.CLASS_COMMON, userA, { from: userA }),
                truffleAssert.ErrorType.revert,
                'CreatureFactory#_mint: CANNOT_MINT_MORE'
            );
        });

        it('should allow owner to mint', async () => {
            const quantity = toBN(10);
            await myFactory.mint(
                vals.CLASS_COMMON,
                userA,
                { from: owner }
            );
            // Check that the recipient got the correct quantity
            // Token numbers are one higher than option numbers
            const balanceUserA = await creature.balanceOf(
                userA
            );
            console.log('balanceUserA: ', balanceUserA.toString());
            // assert.isOk(balanceUserA.eq(quantity));
            // Check that balance is correct
            // const balanceOf = await myFactory.balanceOf(owner);
            // console.log('balanceOf: ', balanceOf);

            // assert.isOk(balanceOf.eq(toBN(vals.MINT_INITIAL_SUPPLY).sub(quantity)));
            // Check that total supply is correct
            const premintedRemaining = await creature.balanceOf(
                owner
            );
            console.log('premintedRemaining: ', premintedRemaining.toString());

            // assert.isOk(premintedRemaining.eq(toBN(vals.MINT_INITIAL_SUPPLY).sub(quantity)));
        });

        it('should allow proxy to mint', async () => {
            const quantity = toBN(100);
            //FIXME: move all quantities to top level constants
            const total = toBN(110);
            await myFactory.mint(
                vals.CLASS_COMMON,
                userA,
                { from: proxyForOwner }
            );
            // Check that the recipient got the correct quantity
            const balanceUserA = await creature.balanceOf(
                userA
            );
            assert.isOk(balanceUserA.eq(total));
            // Check that balance is correct
            const balanceOf = await myFactory.balanceOf(owner);
            assert.isOk(balanceOf.eq(toBN(vals.MINT_INITIAL_SUPPLY).sub(total)));
            // Check that total supply is correct
            const premintedRemaining = await creature.balanceOf(
                owner
            );
            assert.isOk(premintedRemaining.eq(toBN(vals.MINT_INITIAL_SUPPLY).sub(total)));
        });
    });

})
