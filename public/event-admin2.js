
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// Replace with your actual Soroban contract ID
const CONTRACT_ID = "CCOHUQED4CBJ27GZP7QE4SWJ6JATDYJTJLMPFPXH4RKZWYBD6WYDAL5B";

// Function to connect to Freighter wallet and get public key
async function connectFreighter() {
    console.log("connectFreighter called with arguments:", arguments);
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

// Function to get the source account details from the Stellar network
async function getSourceAccount(publicKey) {
    console.log("getSourceAccount called with arguments:", arguments);
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

// Function to sign and submit a transaction
async function signAndSubmitTransaction(transaction) {
    console.log("signAndSubmitTransaction called with arguments:", arguments);
    try {
        const signedXdr = await window.freighterApi.signTransaction(transaction.toXDR(), {
            networkPassphrase: NETWORK_PASSPHRASE,
        });
        const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
        return await server.submitTransaction(signedTx);
    } catch (error) {
        console.error("Error signing or submitting transaction:", error);
        return null;
    }
}

// Function to create a new event using manageData operations
async function createEvent(name, description, startDate, endDate) {
    console.log("createEvent called with arguments:", arguments);

    const publicKey = await connectFreighter();
    if (!publicKey) return;

    const account = await getSourceAccount(publicKey);
    if (!account) return;

    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(StellarSdk.Operation.manageData({
            name: 'event_name',
            value: name
        }))
        .addOperation(StellarSdk.Operation.manageData({
            name: 'event_description',
            value: description
        }))
        .addOperation(StellarSdk.Operation.manageData({
            name: 'start_date',
            value: startDate.toString() // Convert to string for compatibility
        }))
        .addOperation(StellarSdk.Operation.manageData({
            name: 'end_date',
            value: endDate.toString() // Convert to string for compatibility
        }))
        .addOperation(StellarSdk.Operation.payment({
            destination: CONTRACT_ID, // Use the smart contract ID directly
            asset: StellarSdk.Asset.native(),
            amount: '100', // Adjust based on your contract requirements
        }))
        .setTimeout(30)
        .build();

    const result = await signAndSubmitTransaction(transaction);
    if (result) {
        console.log(`Event created: ${result.hash}`);
    }
    return result;
}

// Function to read an event by ID
async function readEvent(eventId) {
    console.log("readEvent called with arguments:", arguments);
    // Implement the logic to retrieve and parse event data
    // This is a placeholder - implement your contract's read_event method
}

// Function to update an event
async function updateEvent(eventId, name, description, startDate, endDate, status) {
    console.log("updateEvent called with arguments:", arguments);

    const publicKey = await connectFreighter();
    if (!publicKey) return;

    const account = await getSourceAccount(publicKey);
    if (!account) return;

    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(StellarSdk.Operation.manageData({
            name: `event_${eventId}_name`,
            value: name
        }))
        .addOperation(StellarSdk.Operation.manageData({
            name: `event_${eventId}_description`,
            value: description
        }))
        .addOperation(StellarSdk.Operation.manageData({
            name: `event_${eventId}_start_date`,
            value: startDate.toString() // Convert to string for compatibility
        }))
        .addOperation(StellarSdk.Operation.manageData({
            name: `event_${eventId}_end_date`,
            value: endDate.toString() // Convert to string for compatibility
        }))
        .addOperation(StellarSdk.Operation.manageData({
            name: `event_${eventId}_status`,
            value: status === "Completed" ? "1" : "0" // Use string "1" or "0"
        }))
        .addOperation(StellarSdk.Operation.payment({
            destination: CONTRACT_ID, // Use the smart contract ID directly
            asset: StellarSdk.Asset.native(),
            amount: '50', // Adjust based on your contract requirements
        }))
        .setTimeout(30)
        .build();

    const result = await signAndSubmitTransaction(transaction);
    if (result) {
        console.log(`Event updated: ${result.hash}`);
    }
    return result;
}

// Function to delete an event
async function deleteEvent(eventId) {
    console.log("deleteEvent called with arguments:", arguments);

    const publicKey = await connectFreighter();
    if (!publicKey) return;

    const account = await getSourceAccount(publicKey);
    if (!account) return;

    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(StellarSdk.Operation.manageData({
            name: `event_${eventId}_delete`,
            value: null // Removing the data key deletes the event
        }))
        .addOperation(StellarSdk.Operation.payment({
            destination: CONTRACT_ID, // Use the smart contract ID directly
            asset: StellarSdk.Asset.native(),
            amount: '10', // Adjust based on your contract requirements
        }))
        .setTimeout(30)
        .build();

    const result = await signAndSubmitTransaction(transaction);
    if (result) {
        console.log(`Event deleted: ${result.hash}`);
    }
    return result;
}

// Function to list all events
async function listEvents() {
    console.log("listEvents called with arguments:", arguments);
    
    // Placeholder logic - replace with actual logic to fetch events from the smart contract
    // Example: const events = await callSorobanContractFunction('list_events', []);
    const events = []; // Replace with actual event retrieval logic

    return events;
}

// Helper function to clear form fields
function clearFormFields() {
    console.log("clearFormFields called with arguments:", arguments);
    document.querySelectorAll('#event-form input').forEach(input => input.value = '');
    document.querySelector('#event-form select').selectedIndex = 0;
}

// Helper function to populate the event list
async function populateEventList(events) {
    console.log("populateEventList called with arguments:", arguments);
    const eventList = document.getElementById('event-list');

    eventList.innerHTML = '';

    if (!Array.isArray(events) || events.length === 0) {
        console.log("No events to display.");
        return;
    }

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

// Helper function to handle event selection and populate form fields
function handleEventSelection(event, listItem) {
    console.log("handleEventSelection called with arguments:", arguments);
    document.getElementById('event-id').value = event.event_id;
    document.getElementById('event-name').value = event.name;
    document.getElementById('start-date').value = new Date(event.start_date * 1000).toISOString().split('T')[0];
    document.getElementById('end-date').value = new Date(event.end_date * 1000).toISOString().split('T')[0];
    document.getElementById('description').value = event.description;
    document.getElementById('status').value = event.status === 'Completed' ? 1 : 0;

    const eventItems = document.querySelectorAll('#event-list li');
    eventItems.forEach(item => item.classList.remove('selected'));
    listItem.classList.add('selected');
}

// Function to initialize the event list on page load
async function initializeEventList() {
    console.log("initializeEventList called with arguments:", arguments);
    try {
        const events = await listEvents();
        await populateEventList(events);
    } catch (error) {
        console.error("Failed to fetch or populate events:", error);
    }
}

// Event Listeners for CRUD Operations
document.getElementById('create-event').addEventListener('click', async () => {
    console.log("Create Event button clicked");
    const name = document.getElementById('event-name').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const description = document.getElementById('description').value;
    await createEvent(name, description, new Date(startDate).getTime() / 1000, new Date(endDate).getTime() / 1000);
});

document.getElementById('update-event').addEventListener('click', async () => {
    console.log("Update Event button clicked");
    const eventId = document.getElementById('event-id').value;
    const name = document.getElementById('event-name').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const description = document.getElementById('description').value;
    const status = document.getElementById('status').value;
    await updateEvent(parseInt(eventId), name, description, new Date(startDate).getTime() / 1000, new Date(endDate).getTime() / 1000, status);
});

document.getElementById('delete-event').addEventListener('click', async () => {
    console.log("Delete Event button clicked");
    const eventId = document.getElementById('event-id').value;
    await deleteEvent(parseInt(eventId));
});

document.getElementById('new-event').addEventListener('click', clearFormFields);

// Initialize the event list on page load
window.addEventListener('load', initializeEventList);

