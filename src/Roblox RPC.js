/*

    Roblox RPC
    By: Cosmental

    About: Ropresence is a Roblox game tracker that works for the client it is installed on. This tracker allows discord to enrich your Roblox presence and display it to everyone
    on Discord! [This resource depends on DiscordRPC and Axios]

*/

// Modules
const XMLHttpRequest = require('xhr2'); // DO NOT REMOVE! Axios depends on XMLHttpRequest
const DiscordRPC = require('discord-rpc');
const axios = require(`axios`);

// Constants
const clientId = "1035903512313348136" // This is the OAuth2-ID of our RPC application on the Discord Developer Portal website

const RobloxCookie = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_C4CC2C18112C63913E686D1E0AE57146F08EA41C3916A0F7C5FF1C5471C522D0EA7CB9E5D53EB12CD041310068E2C213745687A01BB465015F9FDED5CCB5D16577BC5FDD0998CBFC7E4D4221F30617AD294A45A46E02392DFB75B714972F1118892B664C9BD87E48F4D10D75DBCE275B82042210AA0E047B21D61CBA04DE5CA9287EAFE404529802156AE19838A3C03A620A125FA367042F74CBAF93D1AB4B69A9F823A00F514B9E392A8CC8086730DCFD23F4EE193B258CDFB08078CA288CE29E805B0EBECC537DF51AD02EE03A7687188ED350EDBDFDCA95F3ACF9B02E7DB7C88C3D5FF4320B48FE74FC9992490F70E0B802DBC6FE100A7CCF840963AB5E10645CEE2B3C7BF48EB43126E38C62B6818519FC365B46B78AC69358E8A2FCDA3A50407A6DA76C3C1741D6B0FB47357D1E0D1FABDA05234A0D695F73BE24C3217C1741BF5311DA0585E27D9E864C6537634FE644F27315AFA021E5A85C0A39523083E5ADDBD172D631D78A54D1CBF4D30C89ADA3EF" // Our ROBLOSECURITY cookie will allow us to make API calls!
const RobloxUserID = 876817222 // This is our client's Roblox userId

const API_UPDATE_QUERY = 1 // This determines how much time (in seconds) we are allowed to make calls to the roblox API endpoint
const RPC = new DiscordRPC.Client({ transport : "ipc" });

// States
var previousPlaceId

var applicationStartTime
var previousUniverse

// Main

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
            } else if (presenceType == 3) {
                applicationStartTime = Date.now();
        
                GetPlaceInfo(presenceData.placeId, placeInfo => {
                    GetUniverseIconURL(placeInfo.universeId, universeURL => {
                        setActivity(presenceType, placeInfo, universeURL);
                    });
                });
            } else {
                console.error(`Unknown Presence type recieved! (got ${presenceType})`);
            };
        });
    
        setTimeout(CheckEndpoint, API_UPDATE_QUERY * 1000);
    };
    
    CheckEndpoint();
});

RPC.login({ clientId }).catch(err => console.error(err));

// Functions

// Sets our current activity using the provided parameters
async function setActivity(presenceType, placeInfo, placeIconURL) {
    if (!RPC) return;

    let presenceImage = (presenceType == 2) ? "https://static.wikia.nocookie.net/logopedia/images/1/1e/Roblox_2022_%28Icon%29.png/revision/latest/scale-to-width-down/200?cb=20220831193228" : "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Roblox_Studio_logo_2021_present.svg/2048px-Roblox_Studio_logo_2021_present.svg.png"

    RPC.setActivity({
        "details": `Playing ${placeInfo.name}`,
        "state": `By ${placeInfo.builder}`,
        "startTimestamp": applicationStartTime,

        "largeImageKey": placeIconURL,
        "largeImageText": placeInfo.name,
        "smallImageKey": presenceImage,
        "smallImageText": `Roblox`,

        "instance": false,
        "buttons": [
            {
                label: `Get Roblox RPC`,
                url: `https://github.com/Cosmental`
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
        console.error(`Presence request failed: \"${err}\"`)
    });
};

// Returns visual informaiton related to the provided universeId
function GetUniverseIconURL(universeId, callback) {
    axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`)
        .then(response => callback(response.data.data[0].imageUrl))    
        .catch(function(err){
            console.error(`Game Universe Icon request failed: \"${err.response.status}\"`)
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
            console.error(`Failed to retrieve Place Info: \"${err}\"`)
        });
};