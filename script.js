/* script.js - 최종 수정판 (CDN 적용) */

// 1. 끊김 없는 초고속 CDN 주소 사용
// (jsDelivr를 통해 전송되므로 웬만해선 막히지 않습니다)
const IMG_BASE_URL = "https://cdn.jsdelivr.net/gh/fletchowns/hanafuda-js/img/cards/";

// 민화투 족보 및 점수 설정
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
    { m: 11, types: ['광', '피', '피', '피'], score: [20, 0, 0, 0] }, // 똥
    { m: 12, types: ['광', '열', '띠', '피'], score: [20, 10, 5, 0] }  // 비
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
        
        // 한국 화투(11똥, 12비) <-> 일본 화투(11비, 12똥) 이미지 매칭 보정
        let baseImgIdx = i * 4;
        if (month === 11) baseImgIdx = 44; // 11월엔 44~47번(똥) 이미지
        if (month === 12) baseImgIdx = 40; // 12월엔 40~43번(비) 이미지

        for (let j = 0; j < 4; j++) {
            deck.push({
                id: Math.random(),
                month: month,
                type: config.types[j],
                score: config.score[j],
                // .gif 확장자 사용
                imgSrc: `${IMG_BASE_URL}${baseImgIdx + j}.gif`
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

// [핵심] 카드 생성 시 이미지 에러 처리 강화
function createCardElement(card) {
    let div = document.createElement('div');
    div.className = 'card';
    
    // 카드 기본 스타일 (이미지 로딩 전)
    div.style.position = 'relative';
    div.style.backgroundColor = '#fff';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';

    // 1. 이미지 태그 생성
    let img = document.createElement('img');
    img.src = card.imgSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.position = 'absolute';
    img.style.left = '0';
    img.style.top = '0';
    
    // 2. 텍스트 (안전장치) 미리 생성
    let text = document.createElement('span');
    text.innerHTML = `<small>${card.month}월</small><br><b>${card.type}</b>`;
    text.style.color = '#333';
    text.style.zIndex = '0'; // 이미지 뒤에 숨김
    
    // 3. 이미지가 로드 실패하면 텍스트가 보이게 처리
    img.onerror = function() {
        this.style.display = 'none'; // 깨진 이미지 숨김
        text.style.zIndex = '1';     // 텍스트를 앞으로 가져옴
        div.style.border = '2px solid #ff0000'; // 에러난 카드는 빨간 테두리
    };

    div.appendChild(text);
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

    // 내 패 정렬
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
