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
    const accountNumberAlice = '000001';
    const accountNumberBob = '000002';
    const alice = new driver.Ed25519Keypair(bip39.mnemonicToSeed(accountNumberAlice).slice(0, 32));
    const bob = new driver.Ed25519Keypair(bip39.mnemonicToSeed(accountNumberBob).slice(0, 32));

    debug('Alice: ', alice.publicKey)
    debug('Bob: ', bob.publicKey)

    await transferTokens(accountNumberAlice, accountNumberBob, 4, 1);
    return;

    // Define the asset to store, in this example
    // we store a bicycle with its serial number and manufacturer
    const initialTokens = 4;
    const token = {
        accountNumber: accountNumberAlice,
        value: '1 euro'
    };
    const metadata = { datetime: new Date().toString() }

    const initialTransaction = driver.Transaction.makeCreateTransaction(
        token,
        metadata,
        [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(alice.publicKey), initialTokens.toString())],
        alice.publicKey
    )
    const initialTransactionSigned = driver.Transaction.signTransaction(initialTransaction, alice.privateKey)

    // Send the transaction off to BigchainDB
    debug('posting create transaction...');
    const retrievedTx = await conn.postTransactionCommit(initialTransactionSigned);
    // With the postTransactionCommit if the response is correct, then the transaction
    // is valid and commited to a block
    debug('Transaction', retrievedTx.id, 'successfully posted.');

    // const txTransferBob = driver.Transaction.makeTransferTransaction(
    //     [{ tx: txCreateAliceSimpleSigned, output_index: 0 }],
    //     [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey))],
    //     // metadata
    //     { price: '100 euro' }
    // );

    // // Sign with alice's private key
    // let txTransferBobSigned = driver.Transaction.signTransaction(txTransferBob, alice.privateKey)
    // debug('Posting signed transaction...', txTransferBobSigned.id)

    // // Post with commit so transaction is validated and included in a block
    // const tx = await conn.postTransactionCommit(txTransferBobSigned);
    // debug('Response from BDB server:', tx.id)
    // debug('Is Bob the owner?', tx['outputs'][0]['public_keys'][0] == bob.publicKey)
    // debug('Was Alice the previous owner?', tx['inputs'][0]['owners_before'][0] == alice.publicKey)

    // // Search for asset based on the serial number of the bicycle
    // const assets = await conn.searchAssets('Bicycle Inc.');
    // debug('Found assets with serial number Bicycle Inc.:', assets.length, assets[0]);

    // // output検索
    // const unspentOutputs = await conn.listOutputs(bob.publicKey, false);
    // debug('unspentOutputs found.', unspentOutputs.length);
    // const spentOutputs = await conn.listOutputs(bob.publicKey, true);
    // debug('spentOutputs found.', spentOutputs.length);

    // const bobsTransaction = await conn.getTransaction(unspentOutputs[0].transaction_id);
    // debug('bobsTransaction found.', bobsTransaction);
}

async function findAccount(accountNumber) {
    // Search outputs of the transactions belonging the token creator
    // False argument to retrieve unspent outputs
    const user = new driver.Ed25519Keypair(bip39.mnemonicToSeed(accountNumber).slice(0, 32));
    const outputs = await conn.listOutputs(user.publicKey, false);
    debug(accountNumber, 'has', outputs.length, 'outputs');
    const transaction = await conn.getTransaction(outputs[0].transaction_id);
    debug(transaction);
    const userOutput = transaction.outputs.find((output) => output.public_keys.indexOf(user.publicKey) >= 0);
    debug('user amount:', userOutput.amount);

    return transaction;
}

async function transferTokens(from, to, originalAmount, amount) {
    const fromUser = new driver.Ed25519Keypair(bip39.mnemonicToSeed(from).slice(0, 32));
    const toUser = new driver.Ed25519Keypair(bip39.mnemonicToSeed(to).slice(0, 32));

    const fromTransaction = await findAccount(from);
    return;

    // Create transfer transaction
    const createTranfer = driver.Transaction.makeTransferTransaction(
        [{
            tx: fromTransaction,
            output_index: 0
        }],
        // Transaction output: Two outputs, because the whole input must be spent
        [
            driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(fromUser.publicKey), (originalAmount - amount).toString()),
            driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(toUser.publicKey), amount.toString())
        ],
        // Metadata (optional)
        {
            transfer_to: 'john',
            originalAmount: originalAmount
        }
    )
    const signedTransfer = driver.Transaction.signTransaction(createTranfer, fromUser.privateKey)
    await conn.postTransactionCommit(signedTransfer)
    debug('transfer commit.');
}

main().then(() => {
    debug('success!')
});
