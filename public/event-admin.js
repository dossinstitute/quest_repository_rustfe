// Soroban RPC server setup using Stellar SDK
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

const CONTRACT_ID = "CCOHUQED4CBJ27GZP7QE4SWJ6JATDYJTJLMPFPXH4RKZWYBD6WYDAL5B"; // Your contract ID
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// Connect to Freighter wallet
async function connectFreighter() {
    try {
        const connected = await window.freighterApi.isConnected();
        if (!connected.isConnected) {
            const allowed = await window.freighterApi.setAllowed();
            if (!allowed.isAllowed) {
                throw new Error("Freighter permission not granted.");
            }
        }

        const response = await window.freighterApi.getAddress();
        const publicKey = response.address;
        console.log("Public Key:", publicKey);
        return publicKey;
    } catch (error) {
        console.error("Failed to connect Freighter:", error);
        return null;
    }
}

// Retrieve the source account
async function getSourceAccount(publicKey) {
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
        console.error("Invalid public key format:", publicKey);
        return null;
    }

    try {
        const account = await server.loadAccount(publicKey);
        return account;
    } catch (error) {
        console.error("Error loading account:", error);
        return null;
    }
}

// Call a smart contract function using Stellar SDK
async function callContractFunction(contractId, functionName, args) {
    try {
        const publicKey = await connectFreighter();
        if (!publicKey) return;

        const account = await getSourceAccount(publicKey);
        if (!account) return;

        // Build the transaction
        const tx = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(StellarSdk.Operation.manageData({
                name: functionName,
                value: JSON.stringify(args),
                source: publicKey,
            }))
            .setTimeout(30)
            .build();

        // Sign and submit the transaction
        const result = await signAndSubmitTransaction(tx);

        if (!result || !result.hash) {
            throw new Error("Transaction submission failed, no hash returned.");
        }

        console.log(`${functionName} function called, Transaction Hash:`, result.hash);
        return result;
    } catch (error) {
        console.error(`Error calling ${functionName} function:`, error);
    }
}

// Sign and submit the transaction
async function signAndSubmitTransaction(tx) {
    try {
        const signedXdr = await window.freighterApi.signTransaction(tx.toXDR(), {
            networkPassphrase: NETWORK_PASSPHRASE,
        });
        const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
        return await server.submitTransaction(signedTx);
    } catch (error) {
        console.error("Error signing or submitting transaction:", error);
        return null;
    }
}

// Function to create a new event
async function createEvent(name, description, startDate, endDate) {
    await callContractFunction(CONTRACT_ID, "create_event", [
        StellarSdk.xdr.ScVal.scvSymbol(name),
        StellarSdk.xdr.ScVal.scvSymbol(description),
        StellarSdk.xdr.ScVal.scvU64(startDate),
        StellarSdk.xdr.ScVal.scvU64(endDate)
    ]);
}

// Function to read an event by ID
async function readEvent(eventId) {
    const result = await callContractFunction(CONTRACT_ID, "read_event", [
        StellarSdk.xdr.ScVal.scvU32(eventId)
    ]);
    return result ? parseEvent(result.resultMetaXdr) : null;
}

// Function to update an event
async function updateEvent(eventId, name, description, startDate, endDate, status) {
    await callContractFunction(CONTRACT_ID, "update_event", [
        StellarSdk.xdr.ScVal.scvU32(eventId),
        StellarSdk.xdr.ScVal.scvSymbol(name),
        StellarSdk.xdr.ScVal.scvSymbol(description),
        StellarSdk.xdr.ScVal.scvU64(startDate),
        StellarSdk.xdr.ScVal.scvU64(endDate),
        StellarSdk.xdr.ScVal.scvI32(status === "Completed" ? 1 : 0)
    ]);
}

// Function to delete an event
async function deleteEvent(eventId) {
    await callContractFunction(CONTRACT_ID, "delete_event", [
        StellarSdk.xdr.ScVal.scvU32(eventId)
    ]);
}

// Function to list all events
async function listEvents() {
    const result = await callContractFunction(CONTRACT_ID, "list_events", []);
    return result ? parseEvents(result.resultMetaXdr) : [];
}

// Function to clear form fields
function clearFormFields() {
    document.querySelectorAll('#event-form input').forEach(input => input.value = '');
    document.querySelector('#event-form select').selectedIndex = 0;
}

// Function to populate the event list in the UI
async function populateEventList(events) {
    const eventList = document.getElementById('event-list');

    // Clear existing events
    eventList.innerHTML = '';

    events.forEach(event => {
        const listItem = document.createElement('li');
        listItem.className = 'event-item';
        listItem.innerHTML = ` 
            <div class="event-id">Event ID: <span>${event.event_id}</span></div>
            <div class="event-name">Event Name: <span>${event.name}</span></div>
            <div class="event-description">Description: <span>${event.description}</span></div>
            <div class="event-dates">Start Date: <span>${event.start_date}</span> | End Date: <span>${event.end_date}</span></div>
            <div class="event-status">${event.status}</div>
        `;
        listItem.addEventListener('click', () => handleEventSelection(event, listItem));
        eventList.appendChild(listItem);
    });
}

// Function to handle event selection and populate form fields
function handleEventSelection(event, listItem) {
    document.getElementById('event-id').value = event.event_id;
    document.getElementById('event-name').value = event.name;
    document.getElementById('start-date').value = event.start_date.toISOString().split('T')[0];
    document.getElementById('end-date').value = event.end_date.toISOString().split('T')[0];
    document.getElementById('description').value = event.description;
    document.getElementById('status').value = event.status === 'Completed' ? 1 : 0;

    const eventItems = document.querySelectorAll('#event-list li');
    eventItems.forEach(item => item.classList.remove('selected'));
    listItem.classList.add('selected');
}

// Function to initialize the event list on page load
async function initializeEventList() {
    try {
        const events = await listEvents();
        await populateEventList(events);
    } catch (error) {
        console.error("Failed to fetch or populate events:", error);
    }
}

// Event Listeners for CRUD Operations
document.getElementById('create-event').addEventListener('click', async () => {
    const name = document.getElementById('event-name').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const description = document.getElementById('description').value;
    await createEvent(name, description, new Date(startDate).getTime() / 1000, new Date(endDate).getTime() / 1000);
});

document.getElementById('update-event').addEventListener('click', async () => {
    const eventId = document.getElementById('event-id').value;
    const name = document.getElementById('event-name').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const description = document.getElementById('description').value;
    const status = document.getElementById('status').value;
    await updateEvent(parseInt(eventId), name, description, new Date(startDate).getTime() / 1000, new Date(endDate).getTime() / 1000, status);
});

document.getElementById('delete-event').addEventListener('click', async () => {
    const eventId = document.getElementById('event-id').value;
    await deleteEvent(parseInt(eventId));
});

document.getElementById('new-event').addEventListener('click', clearFormFields);

// Initialize the event list on page load
window.addEventListener('load', initializeEventList);

