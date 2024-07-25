function getOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
    };
}

function randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

// Member Site
const index = {
    betContext: {
        amount: 0,
        choiceId: 0,
        choiceName: "",
        position: { top: 0, left: 0 },
        gameName: "",
        gameRoundId: 0,
        odds: 0,
    },
    elements: {
        bettingBoardFly: document.getElementById("betting-board-fly"),
        sgIframe: document.getElementById("sg-iframe"),
        btnFlyBet: document.getElementById("btnFlyBet"),
        txtBetValue: document.getElementById("txtBetValue"),
        choiceName: document.getElementById("chocie-name"),
        gameName: document.getElementById("game-name"),
        gameRoundId: document.getElementById("game-round-id"),
        playerBalance: document.getElementById("player-balance"),
        bettingBoardLeft: document.getElementById("betting-board-left"),
        bettingBoardContent: document.getElementById("betting-board"),
        oddsValue: document.getElementById("odds-value"),
    },
    onLoad: async () => {
        await index.doSSO();
    },
    doSSO: async () => {
        const playerId = randomIntFromInterval(1000, 99999);
        const appType = 2;
        const playerBalance = 10000;
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

        const gameLobbySimulatorUrl = "https://l1-glbs1.lumigame.com";
        const ssoResult = (await axios.post(`${gameLobbySimulatorUrl}/signin/sso`, request)).data;
        console.log(ssoResult);
        if (ssoResult.redirectUrl) {
            index.elements.sgIframe.src = ssoResult.redirectUrl;

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
    showBettingBoard: (betContext) => {
        index.hideBettingBoard();
        const gameFrameOffset = getOffset(index.elements.sgIframe);
        const betBoardElement = index.elements.bettingBoardFly;
        betBoardElement.style.top = gameFrameOffset.top + betContext.position.top + "px";
        betBoardElement.style.left = gameFrameOffset.left + betContext.position.left + "px";
        betBoardElement.style.display = "block";

        index.elements.txtBetValue.value = betContext.amount;
        index.elements.choiceName.innerHTML = betContext.choiceName;
        index.elements.gameName.innerHTML = betContext.gameName;
        index.elements.gameRoundId.innerHTML = betContext.gameRoundId;
        index.elements.oddsValue.innerText = betContext.odds;
        index.setElementsText("payout-value", formatNumber(betContext.amount * betContext.odds));

        index.elements.bettingBoardLeft.innerHTML = "";
        index.elements.bettingBoardLeft.appendChild(index.elements.bettingBoardContent.cloneNode(true));
        index.betContext = betContext;
    },
    hideBettingBoard: () => {
        index.elements.bettingBoardFly.style.display = "none";
        index.elements.bettingBoardLeft.innerHTML = "";
    },
    changeOddsType: (element) => {
        iframeCommunicator.postMessageToIframe({
            from: "ms-parent",
            action: "changeOddsType",
            data: element.value,
        });
    },
    changeTheme: (element) => {
        iframeCommunicator.postMessageToIframe({
            from: "ms-parent",
            action: "changeTheme",
            data: element.value,
        });
    },
    changeLanguage: (element) => {
        iframeCommunicator.postMessageToIframe({
            from: "ms-parent",
            action: "changeLanguage",
            data: element.value,
        });
    },
    changeQuickBet: () => {
        iframeCommunicator.postMessageToIframe({
            from: "ms-parent",
            action: "changeQuickBet",
        });
    },
    placeBet: () => {
        const amount = index.elements.txtBetValue.value;

        iframeCommunicator.postMessageToIframe({
            from: "ms-parent",
            action: "placeBet",
            data: {
                amount,
                choice: index.betContext.choiceId,
            },
        });
    },
    setPlayerBalance: (balance) => {
        index.elements.playerBalance.innerText = balance;
    },
    setElementsText: (elementClass, text) => {
        [...document.getElementsByClassName(elementClass)].forEach((element, index, array) => {
            element.innerText = text;
        });
    },
    setElementsValue: (elementClass, value) => {
        [...document.getElementsByClassName(elementClass)].forEach((element, index, array) => {
            element.value = value;
        });
    },
    changeBetAmount: (e) => {
        console.log(e.value);
        index.setElementsText("payout-value", formatNumber(index.betContext.odds * e.value));
        index.setElementsValue("text-box-bet", e.value);
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
            console.log("parent", message);

            switch (message.name) {
                case "placeBet":
                    index.showBettingBoard(message.data);
                    break;

                case "syncBalance":
                    index.setPlayerBalance(formatNumber(message.data.balance));
                    break;
            }
        }
    },
    postMessageToIframe: (message) => {
        message.from = "ms-parent";
        iframeCommunicator.iframes.gameIframe.contentWindow.postMessage(message, "*");
    },
};

iframeCommunicator.registerEvents();
index.onLoad();
