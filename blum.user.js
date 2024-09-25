// ==UserScript==
// @name         Auto_Blum_2024
// @namespace    http://tampermonkey.net/
// @version      2024-06-17
// @description  Đã sợ thì đừng dùng, đã dùng thì đừng sợ!
// @author       caobang
// @match        https://telegram.blum.codes/*
// @icon         https://cdn.prod.website-files.com/65b6a1a4a0e2af577bccce96/65ba99c1616e21b24009b86c_blum-256.png
// @downloadURL  https://github.com/nguyenvanthe1562000/TELE-AIRDROP/blum.user.js
// @updateURL    https://github.com/nguyenvanthe1562000/TELE-AIRDROP/blum.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }

    const minBombClickCount = 0; //số bomb sẽ bấm vào
    const minFreezeClickCount = 1+getRandomInt(3); //số băng sẽ bấm vào
    const cloverSkipPercentage =1+getRandomInt(10); //tỉ lệ bỏ qua click cỏ ba lá (%)

    
    const minBombClickCount = 0; //số bomb sẽ bấm vào
    const clickDelay = 500; // Độ trễ trước khi click (ms)

    const consoleRed = 'font-weight: bold; color: red;';
    const consoleGreen = 'font-weight: bold; color: green;';
    const consolePrefix = '%c [AutoBot] ';
    const originalConsoleLog = console.log;

    console.log = function () {
        if (arguments[0].includes('[AutoBot]') || arguments[0].includes('github.com')) {
            originalConsoleLog.apply(console, arguments);
        }
    };

    console.error = console.warn = console.info = console.debug = function () { };

    console.clear();
    console.log(`${consolePrefix}Bắt đầu bot...`, consoleGreen);

    let totalPoints = 0;
    let bombClickCount = 0;
    let freezeClickCount = 0;
    let skippedClovers = 0;
    let gameEnded = false;
    let checkGameEndInterval;
    let clickQueue = [];

    const originalPush = Array.prototype.push;
    Array.prototype.push = function(...args) {
        args.forEach(arg => {
            if (arg && arg.item) {
                const clickTime = performance.now() + clickDelay;
                if (arg.item.type === "CLOVER") {
                    arg.shouldSkip = Math.random() < (cloverSkipPercentage / 100);
                    if (arg.shouldSkip) {
                        skippedClovers++;
                        console.log(`${consolePrefix}Bỏ qua cỏ 3 lá (${skippedClovers})`, consoleRed);
                    } else {
                        clickQueue.push({ arg, clickTime });
                    }
                } else if (arg.item.type === "BOMB" && bombClickCount < minBombClickCount) {
                    clickQueue.push({ arg, clickTime, isBomb: true });
                } else if (arg.item.type === "FREEZE" && freezeClickCount < minFreezeClickCount) {
                    clickQueue.push({ arg, clickTime, isFreeze: true });
                }
            }
        });
        return originalPush.apply(this, args);
    };

    function processClickQueue() {
        const now = performance.now();
        while (clickQueue.length > 0 && clickQueue[0].clickTime <= now) {
            const { arg, isBomb, isFreeze } = clickQueue.shift();
            if (isBomb) {
                console.log(`${consolePrefix}Bấm vào bomb`, consoleRed);
                totalPoints = 0;
                bombClickCount++;
            } else if (isFreeze) {
                console.log(`${consolePrefix}Bấm vào đóng băng`, consoleGreen);
                freezeClickCount++;
            } else {
                console.log(`${consolePrefix}Bấm vào cỏ 3 lá (${totalPoints})`, consoleGreen);
                totalPoints++;
            }
            arg.onClick(arg);
            arg.isExplosion = true;
            arg.addedAt = now;
        }
        requestAnimationFrame(processClickQueue);
    }

    processClickQueue();

    function checkGameEnd() {
        const rewardElement = document.querySelector('div.reward .animated-points.visible');
        if (rewardElement && !gameEnded) {
            gameEnded = true;
            const rewardAmount = rewardElement.querySelector('.amount').textContent;
            console.log(`${consolePrefix}Trò chơi kết thúc. Tổng số điểm kiếm được: ${rewardAmount}`, consoleGreen);
            totalPoints = 0;
            bombClickCount = 0;
            freezeClickCount = 0;
            skippedClovers = 0;
            clickQueue = [];

            const playButton = document.querySelector('button.kit-button.is-large.is-primary');
            if (playButton) {
                const playPassesText = playButton.querySelector('.label span').textContent;
                const playPasses = parseInt(playPassesText.match(/\d+/)[0], 10);

                if (playPasses > 0) {
                    setTimeout(() => {
                        playButton.click();
                        console.log(`${consolePrefix}Bắt đầu trò chơi mới...`, consoleGreen);
                        gameEnded = false;
                    }, Math.random() * (5151.2 - 3137.7) + 3137.7);
                } else {
                    console.log(`${consolePrefix}Đã chơi hết game`, consoleRed);
                    clearInterval(checkGameEndInterval);
                }
            } else {
                console.log(`${consolePrefix}Không tìm thấy nút chơi`, consoleRed);
            }
        }
    }

    function startGameEndCheck() {
        if (checkGameEndInterval) {
            clearInterval(checkGameEndInterval);
        }

        checkGameEndInterval = setInterval(checkGameEnd, 1000);

        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    checkGameEnd();
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    startGameEndCheck();

})();
