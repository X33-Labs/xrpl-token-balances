var xrpl = require("xrpl");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

var publicServer = "wss://s1.ripple.com/"; //RPC server
var issuer = "rXCoYSUnkpygdtfpz3Df8dKQuRZjM9UFi";
var ledgerIndex = "69800000";
var throttle = 5 //Number of seconds to throttle each request
var sortByBalance = true; //true or false
var sort_dir = 'asc' //asc or desc

const csvWriter = createCsvWriter({
  path: "output.csv",
  header: [
    { id: "address", title: "address" },
    { id: "balance", title: "balance" },
  ],
});

var data = [];

const accountLinesRequest = {
  command: "account_lines",
  account: issuer,
  limit: 400,
  ledger_index: ledgerIndex,
};

async function getAccountLines(client, marker) {
  let request = accountLinesRequest;
  if (marker != undefined) {
    request.marker = marker;
  }
  const response = await client.request(request);
  return response.result;
}

function ProcessData(lines) {
  for (let i = 0; i < lines.length; i++) {
    data.push({ address: lines[i].account, balance: lines[i].balance * -1 });
  }
}

async function main() {
    const client = new xrpl.Client(publicServer);
  try {
    console.log(
        "Starting to Process"
      );
    let marker = undefined;
    let totalAccountLines = 0;
    await client.connect();
    let accountTx = await getAccountLines(client, marker);
    totalAccountLines = accountTx.lines.length;
    console.log(
      "Found " + totalAccountLines + " Total Account Lines...Processing"
    );
    marker = accountTx.marker;
    ProcessData(accountTx.lines);
    while (marker != undefined) {
      await new Promise((r) => setTimeout(r, throttle * 1000));
      accountTx = await getAccountLines(client, marker);
      totalAccountLines = totalAccountLines + accountTx.lines.length;
      console.log(
        "Found " + totalAccountLines + " Total Account Lines...Processing"
      );
      ProcessData(accountTx.lines);
      marker = accountTx.marker;
    }

    //Sort if true

    if(sortByBalance == true)
    {
      if(sort_dir == 'asc')
      {
        data.sort((a, b) => parseFloat(a.balance) - parseFloat(b.balance));
      } else {
        data.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
      }
    }

    csvWriter
      .writeRecords(data)
      .then(() => console.log("The CSV file was written successfully"));
  } catch (err) {
    console.log(err);
  } finally {
    await client.disconnect();
  }
}

main();
