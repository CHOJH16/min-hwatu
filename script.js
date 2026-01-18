/* script.js */

// 1. 새로운 이미지 출처 (안정적인 PNG 파일)
// GitHub의 Raw 파일 주소는 가끔 트래픽 제한이 걸릴 수 있습니다.
// 이번에는 choijae님의 React-Hanafuda 저장소(한국형) 이미지를 사용합니다.
const IMG_BASE_URL = "https://raw.githubusercontent.com/choijae/react-hanafuda/master/public/images/cards/";

const monthConfig = [
    { m: 1, types: ['광', '띠', '피', '피'], score: [20, 5, 0, 0] },
    { m: 2, types: ['열', '띠', '피', '피'], score: [10, 5, 0, 0] },
    { m: 3, types: ['광', '띠', '피', '피'], score: [20, 5, 0, 0] },
    { m: 4, types: ['열', '띠', '피', '피'], score: [10, 5, 0, 0] },
    { m: 5, types: ['열', '띠', '피', '피'], score: [10, 5, 0, 0] },
    { m: 6, types: ['열', '띠', '피', '피'], score: [10, 5, 0, 0] },
    { m: 7, types: ['열', '띠', '피', '피'], score: [10, 5, 0, 0] },
    { m: 8, types: ['광', '열', '피', '피'], score: [20, 10, 0, 0] },
    { m: 9, types: ['열', '띠', '피', '피'], score: [10, 5, 0, 0] },
    { m: 10, types: ['열', '띠', '피', '피'], score: [10, 5, 0, 0] },
    { m: 11, types: ['광', '피', '피', '피'], score: [20, 0, 0, 0] }, // 똥 (한국식 11월)
    { m: 12, types: ['광', '열', '띠', '피'], score: [20, 10, 5, 0] }  // 비 (한국식 12월)
];

let deck = [];
let playerHand = [];
let comHand = [];
let field = [];
let playerCaptured = [];
let comCaptured = [];
let turn = 'player';

function createDeck() {
    deck = [];
    for (let i = 0; i < 12; i++) {
        let month = i + 1;
        let config = monthConfig[i];
        
        // 이미지 파일 인덱스 계산
        // 대부분의 화투 이미지 소스는 일본식 순서(11월 비, 12월 똥)를 따름
        // 한국식(11월 똥, 12월 비)에 맞게 이미지를 가져올 때 교체(Swap)함
        let baseImgIdx = i * 4;
        if (month === 11) baseImgIdx = 44; // 11월엔 12월(똥) 이미지 사용
        if (month === 12) baseImgIdx = 40; // 12월엔 11월(비) 이미지 사용

        for (let j = 0; j < 4; j++) {
            deck.push({
                id: Math.random(),
                month: month,
                type: config.types[j],
                score: config.score[j],
                // 새 주소는 PNG 파일을 사용 (0.png ~ 47.png)
                imgSrc: `${IMG_BASE_URL}${baseImgIdx + j}.png`
            });
        }
    }
}

function shuffle() { deck.sort(() => Math.random() - 0.5); }

function deal() {
    playerHand = deck.slice(0, 10);
    comHand = deck.slice(10, 20);
    field = deck.slice(20, 28);
    deck = deck.slice(28);
}

// [중요] 카드를 화면에 만드는 함수 (이미지 태그 사용 + 에러 처리)
function createCardElement(card) {
    let div = document.createElement('div');
    div.className = 'card';

    // 1. 이미지 태그 생성
    let img = document.createElement('img');
    img.src = card.imgSrc;
    
    // 2. 이미지가 로딩되지 않았을 때(에러 발생 시) 텍스트를 보여줌
    img.onerror = function() {
        this.style.display = 'none'; // 깨진 이미지 숨김
        let text = document.createElement('div');
        text.className = 'alt-text';
        text.innerHTML = `${card.month}월<br>${card.type}`;
        div.appendChild(text);
        div.style.backgroundColor = '#f0f0f0'; // 구분을 위해 회색 배경
    };

    div.appendChild(img);
    return div;
}

function render() {
    const pHandDiv = document.getElementById('player-hand');
    const cHandDiv = document.getElementById('com-hand');
    const fieldDiv = document.getElementById('field-cards');
    const pCapDiv = document.getElementById('player-captured');
    const cCapDiv = document.getElementById('com-captured');

    pHandDiv.innerHTML = ''; cHandDiv.innerHTML = ''; 
    fieldDiv.innerHTML = ''; pCapDiv.innerHTML = ''; cCapDiv.innerHTML = '';

    // 내 패 (정렬)
    playerHand.sort((a,b) => a.month - b.month);
    playerHand.forEach((card, idx) => {
        let el = createCardElement(card);
        el.onclick = () => playerPlay(idx);
        pHandDiv.appendChild(el);
    });

    // 컴퓨터 패 (뒷면)
    comHand.forEach(() => {
        let el = document.createElement('div');
        el.className = 'card card-back';
        cHandDiv.appendChild(el);
    });

    // 바닥 패
    field.forEach(card => fieldDiv.appendChild(createCardElement(card)));

    // 먹은 패
    playerCaptured.sort((a,b) => b.score - a.score);
    playerCaptured.forEach(card => pCapDiv.appendChild(createCardElement(card)));
    
    comCaptured.sort((a,b) => b.score - a.score);
    comCaptured.forEach(card => cCapDiv.appendChild(createCardElement(card)));

    document.getElementById('my-score').innerText = calculateScore(playerCaptured) + '점';
    document.getElementById('com-score').innerText = calculateScore(comCaptured) + '점';
}

function playerPlay(index) {
    if (turn !== 'player') return;
    const card = playerHand.splice(index, 1)[0];
    processTurn(card, playerCaptured);
    render();
    if (playerHand.length === 0 && comHand.length === 0) endGame();
    else {
        turn = 'com';
        setTimeout(computerPlay, 1000);
    }
}

function computerPlay() {
    let cardIndex = -1;
    for(let i=0; i<comHand.length; i++) {
        if (field.some(f => f.month === comHand[i].month)) {
            cardIndex = i; break;
        }
    }
    if (cardIndex === -1) cardIndex = 0;
    const card = comHand.splice(cardIndex, 1)[0];
    processTurn(card, comCaptured);
    render();
    if (playerHand.length === 0 && comHand.length === 0) endGame();
    else {
        turn = 'player';
        showMessage("당신 차례!");
    }
}

function processTurn(card, captureArr) {
    let matched = field.filter(f => f.month === card.month);
    let temp = [];
    if (matched.length > 0) {
        let target = matched[0];
        field = field.filter(f => f.id !== target.id);
        temp.push(card, target);
    } else field.push(card);

    if (deck.length > 0) {
        let flipped = deck.pop();
        let matchedFlip = field.filter(f => f.month === flipped.month);
        if (matchedFlip.length > 0) {
            let target = matchedFlip[0];
            field = field.filter(f => f.id !== target.id);
            temp.push(flipped, target);
        } else {
            let justPlayed = field.find(f => f.id === card.id);
            if (justPlayed && justPlayed.month === flipped.month) {
                field = field.filter(f => f.id !== justPlayed.id);
                temp.push(flipped, justPlayed);
                showMessage("쪽! 💋");
            } else field.push(flipped);
        }
    }
    captureArr.push(...temp);
}

function calculateScore(captured) {
    let score = 0;
    let counts = { 4:0, 10:0, 12:0 };
    captured.forEach(c => {
        score += c.score;
        if ([4,10,12].includes(c.month)) counts[c.month]++;
    });
    if (counts[4] === 4) score += 20;
    if (counts[10] === 4) score += 20;
    if (counts[12] === 4) score += 20;
    return score;
}

function showMessage(msg) {
    const box = document.getElementById('message-box');
    box.innerText = msg;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 1000);
}

function endGame() {
    let my = calculateScore(playerCaptured);
    let com = calculateScore(comCaptured);
    let res = my > com ? "승리! 🎉" : my < com ? "패배.. 😭" : "무승부";
    alert(`게임 끝!\n나: ${my}점 vs 컴: ${com}점\n\n${res}`);
    document.getElementById('restart-btn').parentNode.style.display = 'block';
}

function startGame() {
    document.getElementById('restart-btn').parentNode.style.display = 'none';
    createDeck(); shuffle(); deal();
    playerCaptured = []; comCaptured = []; turn = 'player';
    render(); showMessage("게임 시작!");
}
