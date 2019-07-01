const createDebug = require('debug');
const driver = require('bigchaindb-driver');
const bip39 = require('bip39');
const moment = require('moment');

const debug = createDebug('*');

const conn = new driver.Connection(process.env.BIGCHAINDB_API_PATH, {
    app_id: process.env.BIGCHAINDB_APP_ID,
    app_key: process.env.BIGCHAINDB_APP_KEY
});

async function main() {
    // const alice = new driver.Ed25519Keypair();
    // const bob = new driver.Ed25519Keypair();
    const alice = new driver.Ed25519Keypair(bip39.mnemonicToSeed('alice').slice(0, 32));
    const bob = new driver.Ed25519Keypair(bip39.mnemonicToSeed('bob').slice(0, 32));

    debug('Alice: ', alice.publicKey)
    debug('Bob: ', bob.publicKey)

    // Define the asset to store, in this example
    // we store a bicycle with its serial number and manufacturer
    const assetdata = {
        bicycle: {
            serial_number: moment().valueOf(),
            manufacturer: 'Bicycle Inc.',
        }
    }

    // Metadata contains information about the transaction itself
    // (can be `null` if not needed)
    // E.g. the bicycle is fabricated on earth
    const metadata = { 'planet': 'earth' }

    // Construct a transaction payload
    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        assetdata,
        metadata,

        // A transaction needs an output
        [driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(alice.publicKey))
        ],
        alice.publicKey
    )

    // Sign the transaction with private keys of Alice to fulfill it
    const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, alice.privateKey)

    // Send the transaction off to BigchainDB
    debug('posting create transaction...');
    const retrievedTx = await conn.postTransactionCommit(txCreateAliceSimpleSigned);
    // With the postTransactionCommit if the response is correct, then the transaction
    // is valid and commited to a block
    debug('Transaction', retrievedTx.id, 'successfully posted.');

    // Transfer bicycle to Bob
    const txTransferBob = driver.Transaction.makeTransferTransaction(
        // signedTx to transfer and output index
        [{ tx: txCreateAliceSimpleSigned, output_index: 0 }],
        [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey))],
        // metadata
        { price: '100 euro' }
    );

    // Sign with alice's private key
    let txTransferBobSigned = driver.Transaction.signTransaction(txTransferBob, alice.privateKey)
    debug('Posting signed transaction...', txTransferBobSigned.id)

    // Post with commit so transaction is validated and included in a block
    const tx = await conn.postTransactionCommit(txTransferBobSigned);
    debug('Response from BDB server:', tx.id)
    debug('Is Bob the owner?', tx['outputs'][0]['public_keys'][0] == bob.publicKey)
    debug('Was Alice the previous owner?', tx['inputs'][0]['owners_before'][0] == alice.publicKey)

    // Search for asset based on the serial number of the bicycle
    const assets = await conn.searchAssets('Bicycle Inc.');
    debug('Found assets with serial number Bicycle Inc.:', assets.length, assets[0]);

    // output検索
    const unspentOutputs = await conn.listOutputs(bob.publicKey, false);
    debug('unspentOutputs found.', unspentOutputs.length);
    const spentOutputs = await conn.listOutputs(bob.publicKey, true);
    debug('spentOutputs found.', spentOutputs.length);

    const bobsTransaction = await conn.getTransaction(unspentOutputs[0].transaction_id);
    debug('bobsTransaction found.', bobsTransaction);
}

main().then(() => {
    debug('success!')
});
