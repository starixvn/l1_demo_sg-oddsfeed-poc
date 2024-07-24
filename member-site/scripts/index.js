function getOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
    };
}

// Member Site
const index = {
    elements: {
        bettingBoard: document.getElementById("betting-board-fly"),
        sgGameIframe: document.getElementById("sg-game-iframe"),
        btnFlyBet: document.getElementById("btnFlyBet"),
        txtBetValue: document.getElementById("txtBetValue"),
        choiceName: document.getElementById("chocie-name"),
        gameName: document.getElementById("game-name"),
        gameRoundId: document.getElementById("game-round-id"),
    },
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
                operatorSecret: "ONEworks1@20luminet&",
            },
            gameId: 0,
            domain: "example.com",
            appType: appType,
            partner: "1W",
            disableJackpotGames: false,
            operatorToken: "ONEworks1Token",
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
    showBettingBoard: ({ amount, choiceId, choiceName, position, gameName, gameRoundId }) => {
        const gameFrameOffset = getOffset(index.elements.sgGameIframe);
        const betBoardElement = index.elements.bettingBoard;
        betBoardElement.style.top = gameFrameOffset.top + position.top + "px";
        betBoardElement.style.left = gameFrameOffset.left + position.left + "px";
        betBoardElement.style.display = "block";

        index.elements.txtBetValue.value = amount;
        index.elements.choiceName.innerHTML = choiceName;
        index.elements.gameName.innerHTML = gameName;
        index.elements.gameRoundId.innerHTML = gameRoundId;
    },
    hideBettingBoard: () => {
        index.elements.bettingBoard.style.display = "none";
    },
    changeOddsType: (element) => {
        iframeCommunicator.postMessageToIframe({
            name: "changeOddsType",
            value: element.value,
        });
    },
    changeTheme: (element) => {
        iframeCommunicator.postMessageToIframe({
            name: "changeTheme",
            value: element.value,
        });
    },
    changeLanguage: (element) => {
        iframeCommunicator.postMessageToIframe({
            name: "changeLanguage",
            value: element.value,
        });
    },
    changeQuickBet: () => {
        iframeCommunicator.postMessageToIframe({
            name: "changeQuickBet",
        });
    },
    placeBet: () => {
        const amount = index.elements.txtBetValue.value;

        iframeCommunicator.postMessageToIframe({
            from: "parent",
            name: "placeBet",
            bet: {
                amount,
                choice: index.elements.choiceName.innerText,
            },
        });
    },
};

const iframeCommunicator = {
    iframes: {
        gameIframe: document.getElementById("sg-game-iframe"),
    },
    registerEvents: () => {
        window.removeEventListener("message", iframeCommunicator.handleIframeMessages, false);
        window.addEventListener("message", iframeCommunicator.handleIframeMessages, false);
    },
    handleIframeMessages: (event) => {
        const message = event.data;
        if (message.from === "iframe") {
            if (message.name === "placeBet") {
                console.log("parent", message);
                index.showBettingBoard(message.data);
            }
        }
    },
    postMessageToIframe: (message) => {
        message.from = "ms";
        iframeCommunicator.iframes.gameIframe.contentWindow.postMessage(message, "*");
    },
};

iframeCommunicator.registerEvents();
