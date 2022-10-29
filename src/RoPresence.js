/*

    RoProsence
    By: Cosmental

    About: Ropresence is a Roblox game tracker that works for the client it is installed on. This tracker allows discord to enrich your Roblox presence and display it to everyone
    on Discord! [This resource depends on DiscordRPC and Axios]

*/

// Modules
const XMLHttpRequest = require('xhr2'); // DO NOT REMOVE! Axios depends on XMLHttpRequest
const DiscordRPC = require('discord-rpc');
const axios = require(`axios`);

// Constants
const DDPCookie = "bb8799f02f2e11ec91ddc17f80e36901; __sdcfduid=bb8799f12f2e11ec91ddc17f80e3690169928edd5a1eb8b64bb368f70f621031cff9256125579309fa487e726a276e23; locale=en-US; _ga=GA1.2.1974672028.1634463831; __stripe_mid=60e9361c-d7b9-437e-a718-3ff7777977993072a7; _gcl_au=1.1.1645921179.1660747250; __cfruid=7c8ee08150788c83fcdeff45fec828713bd3706b-1666039719; _gid=GA1.2.564753888.1666789492; OptanonConsent=isIABGlobal=false&datestamp=Fri+Oct+28+2022+20:08:53+GMT-0400+(Eastern+Daylight+Time)&version=6.33.0&hosts=&landingPath=NotLandingPage&groups=C0001:1,C0002:1,C0003:1&AwaitingReconsent=false; __cf_bm=MFNoxqqFwF3u8TU5bpPUKekL157ZpyemlOhuWXoH79M-1667057602-0-Ae8fZ+T41YiDO9faz5GwxKUKkguwXOUYYvDXSILknNI+dcBoxxO6IaKyQ8JubzpzK+aclituzIoOZpo6MALUD+Cm1DzTQ4pKHGvCe4ntukILGdN34to1CItb/GXjgMt6nA=="
const clientId = "1035903512313348136" // This is the OAuth2-ID of our RPC application on the Discord Developer Portal website

const RobloxCookie = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_C4CC2C18112C63913E686D1E0AE57146F08EA41C3916A0F7C5FF1C5471C522D0EA7CB9E5D53EB12CD041310068E2C213745687A01BB465015F9FDED5CCB5D16577BC5FDD0998CBFC7E4D4221F30617AD294A45A46E02392DFB75B714972F1118892B664C9BD87E48F4D10D75DBCE275B82042210AA0E047B21D61CBA04DE5CA9287EAFE404529802156AE19838A3C03A620A125FA367042F74CBAF93D1AB4B69A9F823A00F514B9E392A8CC8086730DCFD23F4EE193B258CDFB08078CA288CE29E805B0EBECC537DF51AD02EE03A7687188ED350EDBDFDCA95F3ACF9B02E7DB7C88C3D5FF4320B48FE74FC9992490F70E0B802DBC6FE100A7CCF840963AB5E10645CEE2B3C7BF48EB43126E38C62B6818519FC365B46B78AC69358E8A2FCDA3A50407A6DA76C3C1741D6B0FB47357D1E0D1FABDA05234A0D695F73BE24C3217C1741BF5311DA0585E27D9E864C6537634FE644F27315AFA021E5A85C0A39523083E5ADDBD172D631D78A54D1CBF4D30C89ADA3EF" // Our ROBLOSECURITY cookie will allow us to make API calls!
const RobloxUserID = 876817222 // This is our client's Roblox userId

const API_UPDATE_QUERY = 5 // This determines how much time (in seconds) we are allowed to make calls to the roblox API endpoint
const RPC = new DiscordRPC.Client({ transport : "ipc" });

// States
var previouslyPlayedPlace

// Main

DiscordRPC.register(clientId);

RPC.on('ready', async() => {
    function CheckEndpoint() {
        GetClientGamePresence(response => {
            let presenceData = response.data.userPresences[0];
    
            if (presenceData.placeId == null) {
                previouslyPlayedPlace = null
                RPC.clearActivity();
                return;
            };
    
            if (previouslyPlayedPlace == presenceData.placeId) return; // We dont need to update already existing info!
            previouslyPlayedPlace = presenceData.placeId
    
            GetPlaceInfo(presenceData.placeId, placeInfo => {
                SetApplicationName(presenceData.lastLocation);

                GetUniverseIconURL(presenceData.universeId, universeURL => {
                    setActivity(placeInfo, universeURL);
                });
            });
        });
    
        setTimeout(CheckEndpoint, API_UPDATE_QUERY * 1000);
    };
    
    CheckEndpoint();
});

RPC.login({ clientId }).catch(err => console.error(err));

// Functions

// Sets our current activity using the provided parameters
async function setActivity(placeInfo, placeIconURL) {
    if (!RPC) return;
    RPC.setActivity({
        "details": `Playing ${placeInfo.name}`,
        "state": `By ${placeInfo.builder}`,
        "startTimestamp": Date.now(),

        "largeImageKey": placeIconURL,
        "largeImageText": placeInfo.name,
        "smallImageKey": `https://static.wikia.nocookie.net/logopedia/images/1/1e/Roblox_2022_%28Icon%29.png/revision/latest/scale-to-width-down/200?cb=20220831193228`,
        "smallImageText": `Roblox`,

        "instance": false,
        "buttons": [
            {
                label: `Check out my GitHub page!`,
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