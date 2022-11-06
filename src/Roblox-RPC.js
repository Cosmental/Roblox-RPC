/*

    Roblox RPC
    By: Cosmental

    About: Ropresence is a Roblox game tracker that works for the client it is installed on. This tracker allows discord to enrich your Roblox presence and display it to everyone
    on Discord! [This resource depends on DiscordRPC and Axios]

*/

// Modules
const DiscordRPC = require('discord-rpc');
const axios = require(`axios`);

const settings = require(`./configuration.json`);

// Constants
const RobloxCookie = settings.ROBLOSECURITY // Our ROBLOSECURITY cookie will allow us to make API calls!
const RobloxUserID = settings.UserId // This is our client's Roblox userId

const clientId = settings.AppClientID // This is the OAuth2-ID of our RPC application on the Discord Developer Portal website
const API_UPDATE_QUERY = 1 // This determines how much time (in seconds) we are allowed to make calls to the roblox API endpoint

const RPC = new DiscordRPC.Client({ transport : "ipc" });

// States
var previousPlaceId

var applicationStartTime
var previousUniverse

// Main

axios.get('https://www.roblox.com/mobileapi/userinfo', { // ROBLOSECURITY Validation
    "headers": {
        "Cookie": `.ROBLOSECURITY=${RobloxCookie}`
    }
}).then(result => {
    let isValidCookie = (typeof(result.data) == 'object'); // Valid cookies should return an object/table as a response header

    if (!isValidCookie) {
        throw new Error("The provided ROBLOSecurity Cookie was invalid! ( Are you sure you entered a valid ROBLOSecurity cookie? )")
    };

    // RPC Login
    DiscordRPC.register(clientId);

    RPC.on('ready', async() => {
        function CheckEndpoint() {
            GetClientGamePresence(response => {
                let presenceData = response.data.userPresences[0];
                let presenceType = presenceData.userPresenceType // 0 = Offline (no action), 1 = Website (no action), 2 = Playing Game (action), 3 = In Studio (action)
        
                // Unwanted Presence handling (User is offline or on the Website)
                if (presenceType < 2) {
                    previousPlaceId = null
                    previousUniverse = null

                    RPC.clearActivity();
                    return;
                };
                
                // Active Presence Handling
                if (previousPlaceId == presenceData.placeId) return; // We dont need to update already existing info!
                previousPlaceId = presenceData.placeId
                
                if (presenceType == 2) {
                    if (previousUniverse != presenceData.universeId) {
                        previousUniverse = presenceData.universeId
                        applicationStartTime = Date.now();
                    };
            
                    GetPlaceInfo(presenceData.placeId, placeInfo => {
                        GetUniverseIconURL(presenceData.universeId, universeURL => {
                            setActivity(presenceType, placeInfo, universeURL);
                        });
                    });
                } else if (presenceType == 3 && settings.StudioPresenceEnabled) {
                    applicationStartTime = Date.now();
            
                    GetPlaceInfo(presenceData.placeId, placeInfo => {
                        GetUniverseIconURL(placeInfo.universeId, universeURL => {
                            setActivity(presenceType, placeInfo, universeURL);
                        });
                    });
                } else {
                    throw new Error(`Unknown Presence type recieved! (got ${presenceType})`);
                };
            });
        
            setTimeout(CheckEndpoint, API_UPDATE_QUERY * 1000);
        };
        
        console.log("RPC Is running!");
        CheckEndpoint();
    });

    RPC.login({ clientId }).catch(err => {
        throw new Error(`Roblox RPC Initialization Issue ${err}`);
    });
});

// Functions

// Sets our current activity using the provided parameters
async function setActivity(presenceType, placeInfo, placeIconURL) {
    if (!RPC) return;
    
    let presenceImage = (
        (presenceType === 2) ? `https://static.wikia.nocookie.net/logopedia/images/1/1e/Roblox_2022_%28Icon%29.png/revision/latest/scale-to-width-down/200?cb=20220831193228` // Roblox Game
            : `https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Roblox_Studio_logo_2021_present.svg/2048px-Roblox_Studio_logo_2021_present.svg.png` // Roblox Studio
            );

    let presenceText = (
        (presenceType === 2) ? "Playing"
            : "Developing"
        );

    RPC.setActivity({
        "details": `${presenceText}: ${placeInfo.name}`,
        "state": `By ${placeInfo.builder}`,
        "startTimestamp": applicationStartTime,

        "largeImageKey": placeIconURL,
        "largeImageText": placeInfo.name,
        "smallImageKey": presenceImage,
        "smallImageText": (presenceType == 2) ? "Roblox" : "Roblox Studio",

        "instance": false,
        "buttons": [
            {
                label: `Get Roblox RPC`,
                url: `https://github.com/Cosmental/Roblox-RPC`
            },

            {
                label: `Game Link`,
                url: placeInfo.url
            },
        ]
    });
};

// Returns information about our client's in game presence!
function GetClientGamePresence(callback) {
    axios.post(`https://presence.roblox.com/v1/presence/users`, // Here we preferrably use axios in order to "spoof" our RobloSecurity token
        {"userIds":[RobloxUserID]},        
        {
            "headers": {
                "Cookie": `.ROBLOSECURITY=${RobloxCookie}`
            }
        }
    )

    .then(callback)    
    .catch(function(err){
        throw new Error(`Presence request failed: \"${err}\"`)
    });
};

// Returns visual informaiton related to the provided universeId
function GetUniverseIconURL(universeId, callback) {
    axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`)
        .then(response => callback(response.data.data[0].imageUrl))    
        .catch(function(err){
            throw new Error(`Game Universe Icon request failed: \"${err.response.status}\"`);
        });
};

function GetPlaceInfo(placeId, callback) {
    axios.get(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`, {
        "headers": {
            "Cookie": `.ROBLOSECURITY=${RobloxCookie}` // For some reason this endpoint requires roblox cookies?
        }
    })
        .then(response => callback(response.data[0]))
        .catch(function(err){
            throw new Error(`Failed to retrieve Place Info: \"${err}\"`);
        });
};