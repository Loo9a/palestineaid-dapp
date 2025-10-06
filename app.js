// Include ethers.js in your HTML BEFORE this file:
// <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>

const contractAddress = "0x7B3cE31AE5488b2406f716031A7e05e2d7357f18"; // your deployed contract
const contractABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "donor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "DonationReceived",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Withdraw",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "donate",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllDonations",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "donors",
				"type": "address[]"
			},
			{
				"internalType": "uint256[]",
				"name": "amounts",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "times",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getDonationCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "donor",
				"type": "address"
			}
		],
		"name": "getTotalByDonor",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalDonations",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "totalByDonor",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalDonations",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_to",
				"type": "address"
			}
		],
		"name": "withdrawAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

let provider, signer, contract;

// Quick DOM getter
const $ = id => document.getElementById(id);

// INIT
async function init() {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask not detected. Please install MetaMask!");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  contract = new ethers.Contract(contractAddress, contractABI, provider);

  await loadTotalDonations();
  await loadDonorsList();
  await loadTotalDonors();
}

// Connect Wallet
async function connectWallet() {
  try {
    if (!provider) provider = new ethers.providers.Web3Provider(window.ethereum);

    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    contract = contract.connect(signer);

    await updateUIAfterConnect();
  } catch (err) {
    console.error("connectWallet:", err);
    alert("Failed to connect wallet!");
  }
}

// Update UI after connecting wallet
async function updateUIAfterConnect() {
  if (!signer) return;
  const addr = await signer.getAddress();

  document.querySelectorAll("#connectButton, #connectBtn")
    .forEach(b => b.innerText = `Connected: ${addr.slice(0,6)}...${addr.slice(-4)}`);

  await detectOwner(addr);
  await loadTotalDonations();
  await loadDonorsList();
  await loadTotalDonors();
}

// Check if wallet already connected on page load
async function checkIfWalletConnected() {
  if (!window.ethereum) return;
  const accounts = await provider.listAccounts();
  if (accounts.length > 0) {
    signer = provider.getSigner();
    contract = contract.connect(signer);
    await updateUIAfterConnect();
  }
}

// Logout wallet (simulate)
function logoutWallet() {
  signer = null;
  contract = new ethers.Contract(contractAddress, contractABI, provider); // read-only
  document.querySelectorAll("#connectButton, #connectBtn")
    .forEach(b => b.innerText = "Connect Wallet");
  const adminStatus = $("adminStatus");
  if (adminStatus) adminStatus.innerText = "Not connected";
}

// Donate ETH
async function donate() {
  try {
    const input = $("donationAmount") || $("amount");
    const amount = input?.value;
    if (!amount || Number(amount) <= 0) { alert("Enter valid ETH amount"); return; }

    const statusEl = $("status") || $("statusText");
    statusEl && (statusEl.innerText = "Transaction pending...");

    const tx = await contract.donate({ value: ethers.utils.parseEther(String(amount)) });
    await tx.wait();

    statusEl && (statusEl.innerText = "Donation successful ✅");

    // refresh read-only contract
    contract = new ethers.Contract(contractAddress, contractABI, provider);

    await loadTotalDonations();
    await loadDonorsList();
    await loadTotalDonors();
  } catch (err) {
    console.error("donate:", err);
    const statusEl = $("status") || $("statusText");
    statusEl && (statusEl.innerText = "Transaction failed ❌");
  }
}

// Load total donations
async function loadTotalDonations() {
  try {
    const total = await contract.getTotalDonations();
    const formatted = ethers.utils.formatEther(total);
    const el = $("totalDonations") || $("total");
    if (el) el.innerText = formatted + " ETH";
  } catch (err) {
    console.error("loadTotalDonations:", err);
  }
}

// Load total donors (unique addresses)
async function loadTotalDonors() {
  try {
    const [donors] = await contract.getAllDonations();
    const uniqueDonors = [...new Set(donors.map(a => a.toLowerCase()))];
    const el = $("totalDonors");
    if (el) el.innerText = uniqueDonors.length;
  } catch (err) {
    console.error("loadTotalDonors:", err);
  }
}

// Load donor list
async function loadDonorsList() {
  try {
    const [donors, amounts, times] = await contract.getAllDonations();

    const donorListEl = $("donorList");
    const donationTableEl = $("donationTableBody");

    donorListEl && (donorListEl.innerHTML = "");
    donationTableEl && (donationTableEl.innerHTML = "");

    for (let i = donors.length - 1; i >= 0; i--) {
      const addr = donors[i];
      const amount = ethers.utils.formatEther(amounts[i]);
      const date = new Date(Number(times[i]) * 1000).toLocaleString();

      donationTableEl?.insertAdjacentHTML('beforeend', `<tr>
        <td>${shorten(addr)}</td>
        <td>${amount} ETH</td>
        <td>${date}</td>
      </tr>`);

      donorListEl?.insertAdjacentHTML('beforeend', `<tr><td>${shorten(addr)}</td><td>${amount} ETH</td></tr>`);
    }

    if (donors.length === 0) {
      donorListEl && (donorListEl.innerHTML = `<tr><td colspan="2">No donations yet</td></tr>`);
      donationTableEl && (donationTableEl.innerHTML = `<tr><td colspan="3">No donations yet</td></tr>`);
    }
  } catch (err) {
    console.error("loadDonorsList:", err);
  }
}

// Shorten address for UI
function shorten(addr) {
  return addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : "";
}

// Detect owner (admin)
async function detectOwner(currentAddress) {
  try {
    const ownerAddr = await contract.owner();
    const isOwner = currentAddress?.toLowerCase() === ownerAddr.toLowerCase();
    const adminStatus = $("adminStatus");
    const buttons = document.querySelectorAll(".admin-only");

    buttons.forEach(b => b.style.display = isOwner ? "inline-block" : "none");
    adminStatus && (adminStatus.innerText = isOwner ? "Connected as Owner" : "Not Owner");
  } catch (err) {
    console.error("detectOwner:", err);
  }
}

// Withdraw amount (admin)
async function withdrawAmount() {
  try {
    const amt = $("withdrawAmount").value;
    const status = $("adminStatus");
    if (!amt || Number(amt) <= 0) return alert("Enter valid amount");
    const to = await signer.getAddress();

    const tx = await contract.withdraw(to, ethers.utils.parseEther(amt));
    status.innerText = "Pending withdraw...";
    await tx.wait();
    status.innerText = "Withdraw successful ✅";
  } catch (err) {
    console.error("withdrawAmount:", err);
    $("adminStatus").innerText = "Withdraw failed ❌";
  }
}

// Withdraw all (admin)
async function withdrawAll() {
  try {
    const to = await signer.getAddress();
    const status = $("adminStatus");

    const tx = await contract.withdrawAll(to);
    status.innerText = "Pending withdraw all...";
    await tx.wait();
    status.innerText = "Withdraw all successful ✅";
  } catch (err) {
    console.error("withdrawAll:", err);
    $("adminStatus").innerText = "Withdraw all failed ❌";
  }
}

// Event listeners
window.addEventListener('load', async () => {
  await init();
  await checkIfWalletConnected();

  document.querySelectorAll("#connectButton, #connectBtn").forEach(b => b.addEventListener('click', connectWallet));
  $("logoutBtn")?.addEventListener('click', logoutWallet);
  $("donateBtn")?.addEventListener('click', donate);
  $("withdrawAllBtn")?.addEventListener('click', withdrawAll);
  $("withdrawAmountBtn")?.addEventListener('click', withdrawAmount);
});
