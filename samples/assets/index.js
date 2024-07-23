function getOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY
    };
}

const index = {
    onLoad: async () => {
        index.registerEvents();
        await index.doSSO();
    },
    doSSO: async () => {
        const playerId = 28589;
        const appType = 2;
        const playerBalance = 2600;
        const request = {
            playerId: playerId,
            playerName: `username_${playerId}`,
            language: "vi-VN",
            currency: "$US",
            seq: "d,y,lumi",
            siteId: "4100300",
            siteName: "lumi",
            ip: "",
            browserUserAgent: window.navigator.userAgent,
            auth: {
                operatorId: "ONEworks1",
                operatorSecret: "ONEworks1@20luminet&"
            },
            gameId: 0,
            domain: "example.com",
            appType: appType,
            partner: "1W",
            disableJackpotGames: false,
            operatorToken: "ONEworks1Token"
        };

        const redirectLink = document.getElementById("redirect-url");
        const gameIframe = document.getElementById("game-iframe");

        const ssoResult = (await axios.post("https://gamelobby-simulator.lumigame.com/signin/sso", request)).data;
        console.log(ssoResult);
        if (ssoResult.redirectUrl) {
            redirectLink.innerHTML = ssoResult.redirectUrl;
            redirectLink.href = ssoResult.redirectUrl;
            gameIframe.src = ssoResult.redirectUrl;

            await index.assignBalance(playerId, playerBalance, request.currency, request.siteId);
        }
    },
    assignBalance: async (playerId, balance, currency, siteId) => {
        await axios.post(
            `https://owapi-simulator.lumigame.com/SabaClub/SetDefaultBalance?playerId=${encodeURIComponent(
                playerId
            )}&operator=ow&balance=${balance}&systemType=SC1&username=username_${encodeURIComponent(
                playerId
            )}&currency=${currency}&siteId=${siteId}`
        );
    },
    registerEvents: () => {
        window.removeEventListener("message", index.handleSABAGameMessages, false);
        window.addEventListener("message", index.handleSABAGameMessages, false);
    },
    handleSABAGameMessages: (event) => {
        const sgMessage = event.data;
        if (sgMessage.name === "placeBet") {
            // Adjust the iframe height based on its content
            console.log("parent", sgMessage);
            const gameFrameOffset = getOffset(document.getElementById("test-iframe"));
            const betBoardElement = document.getElementById("bet-board");

            betBoardElement.style.top = gameFrameOffset.top + sgMessage.data.position.top + "px";
            betBoardElement.style.left = gameFrameOffset.left + sgMessage.data.position.left + "px";
        }
    }
};

index.onLoad();
