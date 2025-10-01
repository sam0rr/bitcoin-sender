require('dotenv').config();

let express = require('express');
let router = express.Router();

const bitcore = require('bitcore-lib');
const Mnemonic = require('bitcore-mnemonic');
const axios = require('axios');

const apiNetwork = process.env.API_NETWORK;
const publicAddress = process.env.PUBLIC_ADDRESS;
const blockCypherToken = process.env.BLOCKCYPHER_TOKEN;
const privateKey = process.env.PRIVATE_KEY;


router.get('/wallet', function(req, res) {
    const mnemonic = new Mnemonic();
    console.log(`==> SEED PHRASE: ${mnemonic.toString()}`);

    const seed = mnemonic.toSeed();
    const hdRoot = bitcore.HDPrivateKey.fromSeed(seed, bitcore.Networks.testnet);

    // BIP32 (derivation path) + BIP84 (coin type)
    // m / purpose' / coin_type' / account' / change / address_index
    const path = "m/84'/1'/0'/0/0";
    const child = hdRoot.derive(path);

    // private key + WIF
    const privateKey = child.privateKey;
    const wif = privateKey.toWIF();
    console.log(`==> PRIVATE KEY (WIF): ${wif}`);

    // Public key
    const publicKey = privateKey.toPublicKey();
    const sigwitAddress = bitcore.Address.fromPublicKey(
        publicKey, bitcore.Networks.testnet,
        'witnesspubkeyhash' // P2KPKH
    );
    console.log(`==> PUBLIC ADDRESS: ${sigwitAddress.toString()}`);

    res.send("SUCCESS! Check the console for details.")
});

router.get('/', async function(req, res) {
    res.render('index', {
        balance: await getBalance(publicAddress),
        error: req.flash('error'),
        success: req.flash('success'),
        address: publicAddress
    });
});

router.post('/', async function (req, res) {
    let btcAmount = req.body.amount;
    let address = req.body.address;

    if (btcAmount === undefined || btcAmount === "") {
        req.flash('error', "The amount to sent must be given.");
        res.redirect("/");
        return;
    }

    if (isNaN(btcAmount)) {
        req.flash('error', "The amount must be numeric.");
        res.redirect("/");
        return;
    }

    if (address === undefined || address === "") {
        req.flash('error', "The recipient address must be given.");
        res.redirect("/");
        return;
    }

    // TODO: Test if the given BTC address is valid for the given network ...

    sendBitcoin(address, btcAmount);
    req.flash('success', btcAmount + " BTC sent successfully to " + address
        + ". I may take up to few minutes before the transaction is completed.");
    res.redirect("/");
});

async function getBalance(address) {
    const url = `${apiNetwork}/addrs/${address}/balance`;
    const result = await axios.get(url);
    const data = result.data;

    // Values are in satoshis, convert to BTC (SAT)
    const balance = parseFloat(data.final_balance / 100000000);
    return balance.toFixed(8);
}

function sendBitcoin(toAddress, btcAmount) {
    // TODO: Proceed to do the real transfer ...
}

module.exports = router;
