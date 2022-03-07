const express = require('express');
const { type } = require('os');
const app = express()
app.use(express.json());

const port = process.env.PORT || 3028;

const Web3 = require('web3');
const env = require('./env');
const infraUrl = env.globalAccess.rpcUrl;

const ContractAbi = env.contract.ablcAbi.abi;
const ContractAddress = env.globalAccess.ablcContract;

const ContractAbiForBUSD = env.contract.busdAbi.abi;
const ContractAddressForBUSD = env.globalAccess.busdContract;


const web3 = new Web3(infraUrl);


const init0 = async(to_address, token_amount, private_key) => {
    const myContractForBUSD = new web3.eth.Contract(
        JSON.parse(ContractAbiForBUSD),
        ContractAddressForBUSD
    );

    const tx = myContractForBUSD.methods.transfer(to_address, token_amount.toString());
    const data = tx.encodeABI();
    try {
        const accountInstance = await web3.eth.accounts.signTransaction({
                to: myContractForBUSD.options.address,
                data,
                value: "0x0",
                gas: 50000,
            },
            private_key
        );

        const receipt = await web3.eth.sendSignedTransaction(accountInstance.rawTransaction);

        return [true, receipt.transactionHash];


    } catch (error) {
        return [false, JSON.stringify(error)];
    }
}

const init1 = async(to_address, token_amount, private_key) => {


    const myContract = new web3.eth.Contract(
        JSON.parse(ContractAbi),
        ContractAddress
    );

    const tx = myContract.methods.transfer(to_address, token_amount.toString());
    try {

        const gas = 500000;
        const data = tx.encodeABI();

        const signedTx = await web3.eth.accounts.signTransaction({
                to: myContract.options.address,
                data,
                gas: gas,
                value: "0x0",
            },
            private_key
        );

        console.log('Started');
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(`Transaction Hash :  ${receipt.transactionHash}`);
        console.log('End');
        return [true, receipt.transactionHash];

    } catch (error) {
        console.log(error);
        return [false, JSON.stringify(error)];
    }
}

const transInfo = async(Hash) => {
    try {
   
       const hash = await web3.eth.getTransactionReceipt(Hash)
        return [true, hash]

    } catch (error) {
        return [false, error]
    }

}

app.post('/client/transHash', async(req, res) => {
    let transHash = req.body.transHash;
    const info = await transInfo(transHash);
    var results = info[0] ? success('Registeration Done', info) : failed('Transaction Reverted', info)

    res.send(results)
});

app.get('/', async(req, res) => {
    res.send({
        status: 'working'
    });
})

app.post('/payment', async(req, res) => {

    // console.log('Called');
    const to_address = req.body.to_address;
    var token_amount = req.body.token_amount;
    var private_key = req.body.private_key;
    var wallet_type = req.body.wallet_type;
    if (to_address == '' || to_address == undefined) {
        res.send(failed('Enter a Valid Address'));
        return;
    }

    if (token_amount == '' || token_amount == undefined || isNaN(token_amount)) {
        res.send(failed('Enter a Valid Amount'));
        return;
    }

    if (private_key == '' || private_key == undefined) {
        res.send(failed('Enter a Valid Private Key'));
        return;
    }
    token_amount = Number.isInteger(token_amount) || isFloat(token_amount) ? token_amount.toString() : token_amount;


    if (wallet_type == 1) {
        //...send BUSD.....//
        const res1 = await init0(to_address, token_amount, private_key);
        var results = res1[0] ? success('Transaction success', res1) : failed('Transaction failed', res1)
        res.send(results);
    } else {
        //...send ABLC.....//
        const res1 = await init1(to_address, token_amount, private_key);
        var results = res1[0] ? success('Transaction success', res1) : failed('Transaction failed', res1)
        res.send(results);
    }
    // res.send('Hello');
})

function isFloat(n) {
    return Number(n) == n && n % 1 !== 0;
}

function success(msg, data) {
    return {
        status_code: 1,
        status_text: 'success',
        message: msg,
        data: data
    }
}

function failed(msg, data) {
    return {
        status_code: 0,
        status_text: 'failed',
        message: msg,
        data: data
    }
}

app.listen(port, () => {
    console.log(`Example app listening at ${port}`)
})